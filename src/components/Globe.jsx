import { useEffect, useRef, useState } from 'react';
import { geoOrthographic, geoGraticule, geoPath, geoRotation } from 'd3-geo';
import { select } from 'd3-selection';
import { feature } from 'topojson-client';
import './Globe.css';

// Debug: Verify D3 imports
console.log('🌍 Globe: D3 imports check', {
  geoOrthographic: typeof geoOrthographic,
  geoGraticule: typeof geoGraticule,
  geoPath: typeof geoPath,
  geoRotation: typeof geoRotation,
  select: typeof select,
  feature: typeof feature
});

/**
 * Globe component - D3 globe with drag-to-rotate interaction
 * Uses d3.geoOrthographic() projection and d3.geoGraticule() for latitude/longitude lines
 * No zoom - only rotation via drag
 */
export default function Globe() {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const projectionRef = useRef(null);
  const pathRef = useRef(null);
  const graticuleRef = useRef(null);
  const sphereRef = useRef(null);
  const graticulePathRef = useRef(null);
  const spherePathRef = useRef(null);
  const landGroupRef = useRef(null);
  const markersGroupRef = useRef(null);
  
  // World map data
  const [worldData, setWorldData] = useState(null);
  
  // Album markers data
  const [albums, setAlbums] = useState([]);
  
  // Rotation state: [lambda (longitude), phi (latitude), gamma (roll)]
  const rotationRef = useRef([0, 0, 0]);
  const [rotation, setRotation] = useState([0, 0, 0]);
  
  // Drag state
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef(null);
  const rotationStartRef = useRef(null);
  const animationFrameRef = useRef(null);
  
  // Auto-spin state - start with auto-spin enabled
  const [autoSpin, setAutoSpin] = useState(true);
  const autoSpinRef = useRef(true);
  
  // Righting animation state
  const isRightingRef = useRef(false);
  const rightingAnimationRef = useRef(null);
  
  // Debug overlay state
  const [showDebug, setShowDebug] = useState(false);

  // Sensitivity for rotation (degrees per pixel)
  const DEG_PER_PIXEL = 0.25;
  
  // Clamp phi (latitude) to avoid flipping
  const PHI_MIN = -80;
  const PHI_MAX = 80;

  /**
   * Initialize D3 projection and path generators
   */
  const initGlobe = () => {
    if (!svgRef.current || !containerRef.current) {
      console.warn('🌍 Globe: Cannot initialize - missing refs');
      return;
    }

    const container = containerRef.current;
    // Get actual dimensions, ensuring we have valid values
    const width = container.clientWidth || container.offsetWidth || 400;
    const height = container.clientHeight || container.offsetHeight || 400;
    
    if (width === 0 || height === 0) {
      console.warn('🌍 Globe: Container has zero dimensions', { width, height });
      return;
    }
    
    const size = Math.min(width, height);
    const scale = size * 0.702; // 20% larger than 0.585 (0.585 * 1.2 = 0.702)
    // Ensure center is exactly in the middle
    const centerX = width / 2;
    const centerY = height / 2;

    // Create projection
    const projection = geoOrthographic()
      .scale(scale)
      .translate([centerX, centerY])
      .rotate(rotationRef.current);

    // Create path generator
    const path = geoPath().projection(projection);

    // Create graticule generator
    const graticule = geoGraticule();

    // Store refs
    projectionRef.current = projection;
    pathRef.current = path;
    graticuleRef.current = graticule;

    // Setup SVG with viewBox for proper scaling and centering
    const svg = select(svgRef.current);
    svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .style('overflow', 'visible');

    // Clear existing paths
    svg.selectAll('*').remove();

    // Create groups (order matters for layering)
    const graticuleGroup = svg.append('g').attr('class', 'globe-graticule');
    const landGroup = svg.append('g').attr('class', 'globe-land');
    const markersGroup = svg.append('g').attr('class', 'globe-markers');
    const sphereGroup = svg.append('g').attr('class', 'globe-sphere');

    // Draw graticule
    const graticulePath = graticuleGroup
      .append('path')
      .datum(graticule())
      .attr('d', path)
      .attr('class', 'globe-graticule-path');

    // Draw land masses if data is available
    if (worldData) {
      landGroup
        .selectAll('path')
        .data(worldData.features)
        .enter()
        .append('path')
        .attr('d', path)
        .attr('class', 'globe-land-path');
    }

    // Draw album markers (even if empty array - allows for later updates)
    markersGroup
      .selectAll('circle.globe-marker')
      .data(albums || [])
      .enter()
      .append('circle')
      .attr('class', 'globe-marker')
      .attr('r', 4);
    
    // Test node removed - commented out for now
    // markersGroup
    //   .append('circle')
    //   .attr('class', 'globe-marker-test')
    //   .attr('r', 6)
    //   .datum({ lat: 40.7128, lng: -74.0060 }); // New York City

    // Draw sphere outline
    const spherePath = sphereGroup
      .append('path')
      .datum({ type: 'Sphere' })
      .attr('d', path)
      .attr('class', 'globe-sphere-path');

    graticulePathRef.current = graticulePath;
    spherePathRef.current = spherePath;
    landGroupRef.current = landGroup;
    markersGroupRef.current = markersGroup;
  };

  // State for test node visibility (for debug panel)
  const [testNodeVisible, setTestNodeVisible] = useState(false);
  const testNodeVisibilityRef = useRef(false);

  /**
   * Check if a point is visible on the front hemisphere of the globe
   * Uses spherical math to determine if point is on front hemisphere
   * @param {number} lat - Latitude in degrees
   * @param {number} lng - Longitude in degrees
   * @param {boolean} isTestNode - Whether this is the test node (for logging)
   * @returns {boolean} - True if point is visible
   */
  const isPointVisible = (lat, lng, isTestNode = false) => {
    if (!projectionRef.current || !containerRef.current) return false;

    // Rotate the point into view-space (center at 0,0) using d3's rotation utility.
    // Visible hemisphere is where the angular distance from the center is < 90deg.
    const [rotLng, rotLat] = geoRotation(rotationRef.current)([lng, lat]);
    const lambda = (rotLng * Math.PI) / 180;
    const phi = (rotLat * Math.PI) / 180;
    const cosc = Math.cos(phi) * Math.cos(lambda); // >0 means front hemisphere
    const hemisphereVisible = cosc > 0;

    // Project to 2D and ensure we're inside the drawn circle to avoid edge bleed.
    const coords = projectionRef.current([lng, lat]);
    const [centerX, centerY] = projectionRef.current.translate();
    const scale = projectionRef.current.scale();
    const dx = coords ? coords[0] - centerX : Infinity;
    const dy = coords ? coords[1] - centerY : Infinity;
    const distFromCenter = Math.sqrt(dx * dx + dy * dy);
    const withinRadius = coords ? distFromCenter <= scale + 6 : false; // small buffer for marker radius

    const isVisible = hemisphereVisible && withinRadius;

    if (isTestNode) {
      testNodeVisibilityRef.current = isVisible;
      setTestNodeVisible(isVisible);
      console.log('🔵 TEST NODE:', {
        position: `lat: ${lat.toFixed(4)}, lng: ${lng.toFixed(4)}`,
        rotation: `[${rotationRef.current.map(v => v.toFixed(2)).join(', ')}]`,
        rotated: `[${rotLat.toFixed(4)}, ${rotLng.toFixed(4)}]`,
        cosc: cosc.toFixed(6),
        hemisphereVisible,
        d3Projection: coords ? `[${coords[0].toFixed(2)}, ${coords[1].toFixed(2)}]` : 'null',
        distFromCenter: distFromCenter.toFixed(2),
        globeRadius: scale.toFixed(2),
        withinRadius,
        isVisible,
        verdict: isVisible ? '✅ VISIBLE' : '❌ HIDDEN'
      });
    }

    // If we ever detect a disagreement between hemisphere check and radius check, log it.
    if (hemisphereVisible && !withinRadius) {
      console.debug('Globe visibility mismatch: hemisphere says visible but outside radius', {
        lat,
        lng,
        rotLng,
        rotLat,
        distFromCenter,
        scale
      });
    } else if (!hemisphereVisible && withinRadius) {
      console.debug('Globe visibility mismatch: hemisphere says hidden but inside radius', {
        lat,
        lng,
        rotLng,
        rotLat,
        distFromCenter,
        scale
      });
    }

    return isVisible;
  };

  /**
   * Helper function to hide a marker completely using all available methods
   */
  const hideMarker = (marker) => {
    marker.attr('transform', 'translate(-9999,-9999)')
      .style('opacity', 0)
      .style('visibility', 'hidden')
      .style('display', 'none')
      .style('pointer-events', 'none');
  };

  /**
   * Render/update the globe paths
   */
  const render = () => {
    if (!projectionRef.current || !pathRef.current) return;

    // Update projection rotation
    projectionRef.current.rotate(rotationRef.current);

    // Update graticule path - explicitly call path generator with graticule data
    if (graticulePathRef.current && graticuleRef.current) {
      const graticuleData = graticuleRef.current();
      graticulePathRef.current.attr('d', pathRef.current(graticuleData));
    }
    
    // Update land paths - explicitly update each path with its feature data
    if (landGroupRef.current && worldData) {
      landGroupRef.current
        .selectAll('.globe-land-path')
        .each(function(d) {
          select(this).attr('d', pathRef.current(d));
        });
    }
    
    // Update markers
    if (markersGroupRef.current) {
      // Update all markers (both regular and test)
      markersGroupRef.current
        .selectAll('circle')
        .each(function(d) {
          const marker = select(this);
          const isTest = marker.classed('globe-marker-test');
          
          // Primary check: Use our custom visibility calculation
          // This accurately determines if point is on front hemisphere
          const isVisible = isPointVisible(d.lat, d.lng, isTest);
          if (!isVisible) {
            hideMarker(marker);
            return;
          }
          
          // Secondary check: Get projected coordinates
          // If projection fails, definitely hide (though this should match our check)
          const coords = projectionRef.current([d.lng, d.lat]);
          if (!coords) {
            hideMarker(marker);
            return;
          }
          
          // All checks passed - show marker
          marker.attr('transform', `translate(${coords[0]},${coords[1]})`)
            .style('opacity', 1)
            .style('visibility', 'visible')
            .style('display', 'block')
            .style('pointer-events', 'auto');
        });
    }
    
    // Update sphere outline - explicitly call path generator with sphere datum
    if (spherePathRef.current) {
      spherePathRef.current.attr('d', pathRef.current({ type: 'Sphere' }));
    }
  };

  /**
   * Handle pointer down (start drag)
   */
  const handlePointerDown = (e) => {
    // Stop auto-spin and righting animation when user starts interacting
    if (autoSpinRef.current) {
      setAutoSpin(false);
      autoSpinRef.current = false;
    }
    
    if (isRightingRef.current) {
      isRightingRef.current = false;
      if (rightingAnimationRef.current) {
        cancelAnimationFrame(rightingAnimationRef.current);
        rightingAnimationRef.current = null;
      }
    }

    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
    };
    rotationStartRef.current = [...rotationRef.current];

    // Capture pointer for smooth dragging
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.style.cursor = 'grabbing';
  };

  /**
   * Handle pointer move (during drag)
   */
  const handlePointerMove = (e) => {
    if (!isDraggingRef.current || !dragStartRef.current || !rotationStartRef.current) return;

    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    // Convert pixel movement to rotation degrees
    const dLambda = dx * DEG_PER_PIXEL;
    const dPhi = -dy * DEG_PER_PIXEL; // Negative for intuitive up/down

    // Update rotation
    let [lambda, phi, gamma] = rotationStartRef.current;
    lambda = (lambda + dLambda) % 360;
    phi = Math.max(PHI_MIN, Math.min(PHI_MAX, phi + dPhi));

    rotationRef.current = [lambda, phi, gamma];
    setRotation([lambda, phi, gamma]);

    // Render using requestAnimationFrame for smooth updates
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(render);
  };

  /**
   * Handle pointer up (end drag)
   */
  const handlePointerUp = (e) => {
    if (!isDraggingRef.current) return;

    isDraggingRef.current = false;
    dragStartRef.current = null;
    rotationStartRef.current = null;

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    e.currentTarget.style.cursor = 'grab';

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Start righting animation - smoothly move phi (latitude) back to 0
    if (!isRightingRef.current) {
      isRightingRef.current = true;
      const startPhi = rotationRef.current[1];
      const startTime = performance.now();
      const duration = 800; // 800ms animation duration

      const animateRighting = (currentTime) => {
        if (!isRightingRef.current) {
          rightingAnimationRef.current = null;
          return;
        }

        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Use ease-out cubic for smooth deceleration
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        
        const [lambda, phi, gamma] = rotationRef.current;
        const newPhi = startPhi * (1 - easeOutCubic); // Interpolate phi from current to 0
        
        rotationRef.current = [lambda, newPhi, gamma];
        setRotation([lambda, newPhi, gamma]);
        render();

        if (progress < 1) {
          rightingAnimationRef.current = requestAnimationFrame(animateRighting);
        } else {
          // Righting complete - resume auto-spin
          // Ensure phi is exactly 0
          const [finalLambda, , finalGamma] = rotationRef.current;
          rotationRef.current = [finalLambda, 0, finalGamma];
          setRotation([finalLambda, 0, finalGamma]);
          render();
          
          isRightingRef.current = false;
          rightingAnimationRef.current = null;
          
          // Force re-enable auto-spin - update both state and ref
          autoSpinRef.current = true;
          setAutoSpin(true);
        }
      };

      rightingAnimationRef.current = requestAnimationFrame(animateRighting);
    }
  };

  /**
   * Reset rotation to [0, 0, 0]
   */
  const handleReset = () => {
    rotationRef.current = [0, 0, 0];
    setRotation([0, 0, 0]);
    render();
  };

  /**
   * Toggle auto-spin
   */
  const handleToggleAutoSpin = () => {
    const newValue = !autoSpin;
    setAutoSpin(newValue);
    autoSpinRef.current = newValue;
  };

  // Load album markers data
  useEffect(() => {
    console.log('🌍 Globe: Loading album markers...');
    fetch(`${import.meta.env.BASE_URL}content/map.json`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        const albumsData = data.albums || [];
        console.log(`🌍 Globe: Loaded ${albumsData.length} album marker(s)`, albumsData);
        setAlbums(albumsData);
      })
      .catch(err => {
        console.error('🌍 Globe: Failed to load album markers:', err);
        // Continue with empty array - globe should still render without markers
        setAlbums([]);
      });
  }, []);

  // Load world map data
  useEffect(() => {
    console.log('🌍 Globe: Loading world map data...');
    // Fetch world-110m TopoJSON (lightweight, efficient)
    // Using a reliable CDN source
    fetch('https://unpkg.com/world-atlas@1.1.4/world/110m.json')
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then(topology => {
        console.log('🌍 Globe: World topology loaded, converting to GeoJSON...');
        // Convert TopoJSON to GeoJSON
        // Check if topology has the expected structure
        const countries = topology.objects?.countries || topology.objects?.land;
        if (!countries) {
          throw new Error('Invalid topology structure');
        }
        const world = feature(topology, countries);
        console.log(`🌍 Globe: World data converted, ${world.features.length} features`);
        setWorldData(world);
      })
      .catch(err => {
        console.error('🌍 Globe: Failed to load world map data:', err);
        console.log('🌍 Globe: Trying fallback URL...');
        // Fallback: try alternative URL with different structure
        fetch('https://raw.githubusercontent.com/topojson/world-atlas/master/world/110m.json')
          .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
          })
          .then(topology => {
            console.log('🌍 Globe: Fallback topology loaded');
            const countries = topology.objects?.countries || topology.objects?.land;
            if (!countries) {
              throw new Error('Invalid topology structure in fallback');
            }
            const world = feature(topology, countries);
            console.log(`🌍 Globe: Fallback world data converted, ${world.features.length} features`);
            setWorldData(world);
          })
          .catch(fallbackErr => {
            console.error('🌍 Globe: Fallback also failed:', fallbackErr);
          });
      });
  }, []);

  // Initialize globe on mount and when world data loads
  useEffect(() => {
    console.log('🌍 Globe: Init effect triggered', { 
      hasWorldData: !!worldData, 
      albumsCount: albums.length,
      hasContainer: !!containerRef.current,
      hasSvg: !!svgRef.current
    });
    
    // Wait for world data to load - this is required
    if (!worldData) {
      console.log('🌍 Globe: Waiting for world data...');
      return;
    }
    
    // Check if container has dimensions
    if (!containerRef.current || !svgRef.current) {
      console.log('🌍 Globe: Waiting for DOM refs...');
      return;
    }
    
    const container = containerRef.current;
    const width = container.clientWidth || container.offsetWidth || 0;
    const height = container.clientHeight || container.offsetHeight || 0;
    
    if (width === 0 || height === 0) {
      console.warn('🌍 Globe: Container has no dimensions', { width, height });
      // Retry after a short delay
      const timeoutId = setTimeout(() => {
        if (containerRef.current && svgRef.current && worldData) {
          console.log('🌍 Globe: Retrying initialization after delay...');
          initGlobe();
          render();
        }
      }, 100);
      return () => clearTimeout(timeoutId);
    }
    
    console.log('🌍 Globe: Initializing globe...', { width, height, albumsCount: albums.length });
    initGlobe();
    render();

    // Setup pointer event handlers
    const svg = svgRef.current;
    if (svg) {
      svg.addEventListener('pointerdown', handlePointerDown);
      svg.addEventListener('pointermove', handlePointerMove);
      svg.addEventListener('pointerup', handlePointerUp);
      svg.style.cursor = 'grab';
    }

    return () => {
      if (svg) {
        svg.removeEventListener('pointerdown', handlePointerDown);
        svg.removeEventListener('pointermove', handlePointerMove);
        svg.removeEventListener('pointerup', handlePointerUp);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (rightingAnimationRef.current) {
        cancelAnimationFrame(rightingAnimationRef.current);
        rightingAnimationRef.current = null;
      }
      isRightingRef.current = false;
    };
  }, [worldData, albums]);

  // Handle resize
  useEffect(() => {
    if (!containerRef.current || !worldData) {
      console.log('🌍 Globe: ResizeObserver waiting for worldData');
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      initGlobe();
      render();
    });

    resizeObserver.observe(containerRef.current);
    console.log('🌍 Globe: ResizeObserver set up');

    return () => {
      resizeObserver.disconnect();
    };
  }, [worldData]); // Removed albums dependency - resize should work without markers

  // Auto-spin animation
  useEffect(() => {
    if (!autoSpin || !worldData) return;

    const interval = setInterval(() => {
      // Skip if auto-spin is disabled or world data not loaded
      if (!autoSpinRef.current || !worldData) {
        return;
      }
      
      // Skip if righting animation is active (but keep interval running)
      if (isRightingRef.current) {
        return;
      }

      let [lambda, phi, gamma] = rotationRef.current;
      lambda = (lambda + 0.5) % 360; // Slow rotation
      rotationRef.current = [lambda, phi, gamma];
      setRotation([lambda, phi, gamma]);
      render();
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [autoSpin, worldData]);

  // Format rotation for display
  const formatRotation = (rot) => {
    return rot.map((val) => Math.round(val * 10) / 10).join(', ');
  };

  return (
    <div className="globe" ref={containerRef}>
      <div className="globe-wrapper">
        <svg ref={svgRef} className="globe-svg" />
        
        {/* Debug overlay - commented out */}
        {/* {showDebug && (
          <div className="globe-debug">
            <div className="globe-debug-info">
              <div className="globe-debug-label">Rotation:</div>
              <div className="globe-debug-value">[{formatRotation(rotation)}]</div>
            </div>
            <div className="globe-debug-info">
              <div className="globe-debug-label">Test Node (NYC):</div>
              <div className="globe-debug-value" style={{ 
                color: testNodeVisible ? '#4ade80' : '#f87171',
                fontWeight: 'bold'
              }}>
                {testNodeVisible ? '✅ VISIBLE' : '❌ HIDDEN'}
              </div>
            </div>
            <div className="globe-debug-controls">
              <button 
                className="globe-debug-button" 
                onClick={handleReset}
                type="button"
              >
                Reset
              </button>
              <button 
                className="globe-debug-button" 
                onClick={handleToggleAutoSpin}
                type="button"
              >
                {autoSpin ? 'Stop Spin' : 'Auto Spin'}
              </button>
            </div>
          </div>
        )}
        
        <button
          className="globe-debug-toggle"
          onClick={() => setShowDebug(!showDebug)}
          type="button"
          aria-label="Toggle debug overlay"
        >
          {showDebug ? 'Hide' : 'Debug'}
        </button> */}
      </div>
      <div className="globe-spin-label">
        <span className="globe-spin-arrow">←</span>
        <span className="globe-spin-text">spin me</span>
        <span className="globe-spin-arrow">→</span>
      </div>
    </div>
  );
}
