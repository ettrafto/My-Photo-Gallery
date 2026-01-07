import { useEffect, useRef, useState } from 'react';
import { geoOrthographic, geoGraticule, geoPath } from 'd3-geo';
import { select } from 'd3-selection';
import { feature } from 'topojson-client';
import './Globe.css';

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
  
  // Auto-spin state
  const [autoSpin, setAutoSpin] = useState(false);
  const autoSpinRef = useRef(false);
  
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
    if (!svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    // Get actual dimensions, ensuring we have valid values
    const width = container.clientWidth || container.offsetWidth || 400;
    const height = container.clientHeight || container.offsetHeight || 400;
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

    // Draw album markers
    if (albums.length > 0) {
      markersGroup
        .selectAll('circle.globe-marker')
        .data(albums)
        .enter()
        .append('circle')
        .attr('class', 'globe-marker')
        .attr('r', 4);
    }
    
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
    
    // Get projected coordinates from D3 first
    const coords = projectionRef.current([lng, lat]);
    
    // If D3 returns null, point is definitely behind
    if (!coords) {
      if (isTestNode) {
        testNodeVisibilityRef.current = false;
        setTestNodeVisible(false);
        console.log('🔵 TEST NODE: D3 projection returned null - HIDDEN');
      }
      return false;
    }
    
    // Convert lat/lng to radians
    const lambda = (lng * Math.PI) / 180;
    const phi = (lat * Math.PI) / 180;
    
    // Get current rotation [lambda, phi, gamma]
    const [rotLambda, rotPhi, rotGamma] = rotationRef.current;
    const rotLambdaRad = (rotLambda * Math.PI) / 180;
    const rotPhiRad = (rotPhi * Math.PI) / 180;
    const rotGammaRad = (rotGamma * Math.PI) / 180;
    
    // Convert point to 3D cartesian coordinates on unit sphere
    // Standard geographic to cartesian: x = cos(lat) * cos(lng), y = cos(lat) * sin(lng), z = sin(lat)
    const x = Math.cos(phi) * Math.cos(lambda);
    const y = Math.cos(phi) * Math.sin(lambda);
    const z = Math.sin(phi);
    
    // D3's geoOrthographic.rotate([lambda, phi, gamma]) rotates the globe
    // The rotation is applied in the order: first around Z (longitude), then around Y (latitude), then around X (gamma)
    // To check visibility, we need to apply the INVERSE rotation to the point
    // This tells us where the point is in the viewer's coordinate system
    
    // Apply INVERSE rotations in REVERSE order (undo X first, then Y, then Z)
    // Step 1: Inverse X rotation (gamma/roll) - rotate around X axis by -gamma
    const x1 = x;
    const y1 = y * Math.cos(-rotGammaRad) - z * Math.sin(-rotGammaRad);
    const z1 = y * Math.sin(-rotGammaRad) + z * Math.cos(-rotGammaRad);
    
    // Step 2: Inverse Y rotation (latitude) - rotate around Y axis by -phi
    const x2 = x1 * Math.cos(-rotPhiRad) + z1 * Math.sin(-rotPhiRad);
    const y2 = y1;
    const z2 = -x1 * Math.sin(-rotPhiRad) + z1 * Math.cos(-rotPhiRad);
    
    // Step 3: Inverse Z rotation (longitude) - rotate around Z axis by -lambda
    const x3 = x2 * Math.cos(-rotLambdaRad) - y2 * Math.sin(-rotLambdaRad);
    const y3 = x2 * Math.sin(-rotLambdaRad) + y2 * Math.cos(-rotLambdaRad);
    const z3 = z2;
    
    // In orthographic projection, viewer looks down +Z axis
    // Point is visible if z3 > 0 (in front of viewer after inverse rotation)
    const isVisible = z3 > 0;
    
    // Update test node visibility state
    if (isTestNode) {
      testNodeVisibilityRef.current = isVisible;
      setTestNodeVisible(isVisible);
      
      const container = containerRef.current;
      const width = container.clientWidth || 400;
      const height = container.clientHeight || 400;
      const centerX = width / 2;
      const centerY = height / 2;
      const dx = coords[0] - centerX;
      const dy = coords[1] - centerY;
      const distFromCenter = Math.sqrt(dx * dx + dy * dy);
      const scale = projectionRef.current.scale();
      
      console.log('🔵 TEST NODE:', {
        position: `lat: ${lat.toFixed(4)}, lng: ${lng.toFixed(4)}`,
        rotation: `[${rotLambda.toFixed(2)}, ${rotPhi.toFixed(2)}, ${rotGamma.toFixed(2)}]`,
        cartesian: `[${x.toFixed(4)}, ${y.toFixed(4)}, ${z.toFixed(4)}]`,
        afterRot: `[${x3.toFixed(4)}, ${y3.toFixed(4)}, ${z3.toFixed(6)}]`,
        z3: z3.toFixed(6),
        d3Projection: `[${coords[0].toFixed(2)}, ${coords[1].toFixed(2)}]`,
        distFromCenter: distFromCenter.toFixed(2),
        globeRadius: scale.toFixed(2),
        isVisible,
        verdict: isVisible ? '✅ VISIBLE' : '❌ HIDDEN'
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

    // Update paths
    if (graticulePathRef.current) {
      graticulePathRef.current.attr('d', pathRef.current);
    }
    if (landGroupRef.current && worldData) {
      landGroupRef.current
        .selectAll('.globe-land-path')
        .attr('d', pathRef.current);
    }
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
    if (spherePathRef.current) {
      spherePathRef.current.attr('d', pathRef.current);
    }
  };

  /**
   * Handle pointer down (start drag)
   */
  const handlePointerDown = (e) => {
    if (autoSpinRef.current) {
      setAutoSpin(false);
      autoSpinRef.current = false;
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
    fetch(`${import.meta.env.BASE_URL}content/map.json`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        setAlbums(data.albums || []);
      })
      .catch(err => {
        console.error('Failed to load album markers:', err);
      });
  }, []);

  // Load world map data
  useEffect(() => {
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
        // Convert TopoJSON to GeoJSON
        // Check if topology has the expected structure
        const countries = topology.objects?.countries || topology.objects?.land;
        if (!countries) {
          throw new Error('Invalid topology structure');
        }
        const world = feature(topology, countries);
        setWorldData(world);
      })
      .catch(err => {
        console.error('Failed to load world map data:', err);
        // Fallback: try alternative URL with different structure
        fetch('https://raw.githubusercontent.com/topojson/world-atlas/master/world/110m.json')
          .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
          })
          .then(topology => {
            const countries = topology.objects?.countries || topology.objects?.land;
            if (!countries) {
              throw new Error('Invalid topology structure in fallback');
            }
            const world = feature(topology, countries);
            setWorldData(world);
          })
          .catch(fallbackErr => {
            console.error('Fallback also failed:', fallbackErr);
          });
      });
  }, []);

  // Initialize globe on mount and when world data loads
  useEffect(() => {
    if (!worldData || albums.length === 0) return; // Wait for world data and albums
    
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
    };
  }, [worldData, albums]);

  // Handle resize
  useEffect(() => {
    if (!containerRef.current || !worldData || albums.length === 0) return;

    const resizeObserver = new ResizeObserver(() => {
      initGlobe();
      render();
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [worldData, albums]);

  // Auto-spin animation
  useEffect(() => {
    if (!autoSpin) return;

    const interval = setInterval(() => {
      if (!autoSpinRef.current) {
        clearInterval(interval);
        return;
      }

      let [lambda, phi, gamma] = rotationRef.current;
      lambda = (lambda + 0.5) % 360; // Slow rotation
      rotationRef.current = [lambda, phi, gamma];
      setRotation([lambda, phi, gamma]);
      render();
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [autoSpin]);

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
    </div>
  );
}
