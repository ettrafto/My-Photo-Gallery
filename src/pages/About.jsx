import { useState, useEffect } from 'react';
import { useSEO } from '../hooks/useSEO';
import AboutCameraFocus from '../components/AboutCameraFocus';
import AboutSocialLinks from '../components/AboutSocialLinks';
import { loadSiteConfig, getAboutCameraConfig } from '../lib/siteConfig';
import './Page.css';
import './About.css';

function AccordionSection({ id, label, title, description, children, isOpen, onToggle }) {
  const handleHeaderClick = (e) => {
    // Only toggle if clicking on the header content, not the button
    if (e.target.closest('.accordion-toggle')) {
      return;
    }
    onToggle();
  };

  const handleButtonClick = (e) => {
    e.stopPropagation();
    onToggle();
  };

  return (
    <section className="page-block accordion-section">
      <div className="accordion-header" onClick={handleHeaderClick}>
        <div className="accordion-header-content">
          <p className="page-label">{label}</p>
          <h2 className="page-subtitle">{title}</h2>
          <p className="accordion-description">{description}</p>
        </div>
        <button 
          className={`accordion-toggle ${isOpen ? 'open' : ''}`}
          aria-expanded={isOpen}
          aria-controls={`accordion-content-${id}`}
          onClick={handleButtonClick}
          type="button"
        >
          <span className="accordion-arrow">{isOpen ? '▲' : '▼'}</span>
        </button>
      </div>
      {isOpen && (
        <div 
          id={`accordion-content-${id}`}
          className="accordion-content"
        >
          {children}
        </div>
      )}
    </section>
  );
}

export default function About() {
  useSEO({ 
    pageTitle: "About",
    description: "Learn about the photographer, the site, and how this photo archive was built."
  });

  const [openSections, setOpenSections] = useState({});
  const [cameraConfig, setCameraConfig] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadConfig() {
      try {
        await loadSiteConfig();
        const config = getAboutCameraConfig();
        setCameraConfig(config);
      } catch (err) {
        console.error('Failed to load about config:', err);
        setError(err.message);
        // Continue rendering even if config fails to load
      }
    }
    loadConfig();
  }, []);

  const toggleSection = (id) => {
    setOpenSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <main className="page-shell">
      {cameraConfig && (
        <AboutCameraFocus
          imageSrc={cameraConfig.imageSrc}
          title={cameraConfig.title}
          subtitle={cameraConfig.subtitle}
          body={cameraConfig.body}
        />
      )}

      <AboutSocialLinks />

      <section className="about-section-header">
        <p className="page-label">how I built this</p>
      </section>

      <AccordionSection
        id="tech-stack"
        label="tech stack"
        title="Core Technologies"
        description="Modern web technologies powering the frontend and build pipeline for optimal performance and developer experience."
        isOpen={openSections['tech-stack']}
        onToggle={() => toggleSection('tech-stack')}
      >
        <ul className="tech-list">
          <li><strong>React 19</strong> - Modern UI framework with latest features and hooks</li>
          <li><strong>Vite 7</strong> - Lightning-fast build tool with HMR and optimized production builds</li>
          <li><strong>React Router 7</strong> - Client-side routing with nested routes</li>
          <li><strong>Framer Motion</strong> - Smooth animations and transitions</li>
          <li><strong>Leaflet</strong> - Interactive map visualization with custom markers</li>
          <li><strong>D3.js & D3-geo</strong> - Data visualization and geographic projections for globe view</li>
          <li><strong>Sharp</strong> - High-performance image processing (resize, format conversion, optimization)</li>
          <li><strong>exifr</strong> - Comprehensive EXIF metadata extraction library</li>
          <li><strong>WebP</strong> - Modern image format with automatic conversion</li>
          <li><strong>HEIC Convert</strong> - Support for Apple HEIC/HEIF format processing</li>
          <li><strong>PostCSS & Tailwind CSS 4</strong> - Utility-first styling with custom design system</li>
        </ul>
      </AccordionSection>

      <AccordionSection
        id="image-processing"
        label="image processing"
        title="Optimization Pipeline"
        description="Automated image processing workflow that generates multiple sizes, converts formats, and preserves metadata while optimizing for web delivery."
        isOpen={openSections['image-processing']}
        onToggle={() => toggleSection('image-processing')}
      >
        <ul className="tech-list">
          <li><strong>Multi-size Generation</strong> - Automatically creates small (800px), large (1800px), and blur placeholder (40px) variants</li>
          <li><strong>WebP Conversion</strong> - Converts all images to WebP format with quality optimization (75-80% quality, 4 effort level)</li>
          <li><strong>Responsive Images</strong> - Implements srcset and sizes attributes for optimal bandwidth usage</li>
          <li><strong>HEIC/HEIF Support</strong> - Native processing of Apple HEIC files with fallback conversion</li>
          <li><strong>EXIF Orientation</strong> - Automatic rotation based on camera orientation data</li>
          <li><strong>Smart Resizing</strong> - Maintains aspect ratio with intelligent cropping (fit: inside, without enlargement)</li>
          <li><strong>Incremental Processing</strong> - Only processes new or changed images for fast rebuilds</li>
          <li><strong>Preserved Metadata</strong> - Scripts respect your custom configuration and never overwrite manual edits</li>
        </ul>
      </AccordionSection>

      <AccordionSection
        id="performance"
        label="performance"
        title="Optimization Features"
        description="Comprehensive performance optimizations including lazy loading, code splitting, minification, and layout shift prevention for fast page loads."
        isOpen={openSections['performance']}
        onToggle={() => toggleSection('performance')}
      >
        <ul className="tech-list">
          <li><strong>Lazy Loading</strong> - Images load on-demand as they enter viewport using Intersection Observer</li>
          <li><strong>Eager Loading Strategy</strong> - Critical above-fold images (hero, first 2 showcase) load immediately with high priority</li>
          <li><strong>Code Splitting</strong> - Vendor code split into separate chunks (React, Framer Motion, Leaflet, D3) for optimal caching</li>
          <li><strong>Tree Shaking</strong> - Unused code eliminated in production builds</li>
          <li><strong>Minification</strong> - JavaScript and CSS minified using esbuild for fastest builds</li>
          <li><strong>Async Image Decoding</strong> - Prevents main thread blocking during image decode</li>
          <li><strong>Layout Shift Prevention</strong> - Width/height attributes and aspect ratios prevent CLS</li>
          <li><strong>Low-Quality Mode</strong> - Adaptive image selection for slow connections</li>
          <li><strong>Static Site Generation</strong> - Pre-rendered HTML for instant page loads</li>
        </ul>
      </AccordionSection>

      <AccordionSection
        id="features"
        label="features"
        title="Site Capabilities"
        description="Rich feature set including EXIF extraction, interactive maps, trip visualization, lightbox gallery, and comprehensive album management."
        isOpen={openSections['features']}
        onToggle={() => toggleSection('features')}
      >
        <ul className="tech-list">
          <li><strong>EXIF Metadata Extraction</strong> - Camera make/model, lens, aperture, shutter speed, ISO, focal length, date taken, GPS coordinates, copyright, artist</li>
          <li><strong>Album Organization</strong> - Folder-based structure with automatic JSON generation and metadata preservation</li>
          <li><strong>Trip System</strong> - Group albums into journeys with interactive maps, timelines, and route visualization</li>
          <li><strong>Interactive Maps</strong> - Leaflet-based maps showing trip routes, photo locations, and album markers with custom styling</li>
          <li><strong>Globe Visualization</strong> - D3-powered 3D globe showing photo locations worldwide with TopoJSON geographic data</li>
          <li><strong>Lightbox Gallery</strong> - Full-screen image viewer with EXIF overlay, keyboard navigation (arrows, ESC, 'I' for info)</li>
          <li><strong>Showcase Section</strong> - Curated featured images with side-entry animations and EXIF metadata display</li>
          <li><strong>Hero Section</strong> - Configurable hero images with floating diagonal cluster layout and animated grid background</li>
          <li><strong>Tag Filtering</strong> - Organize and filter albums by automatically-generated and manual tags</li>
          <li><strong>GPS Integration</strong> - Automatic extraction and display of geolocation data with fallback to manual coordinates</li>
          <li><strong>Favorites System</strong> - Mark albums as favorites for featured display</li>
          <li><strong>Theme System</strong> - Multiple visual themes (mono, paper) with consistent design language</li>
          <li><strong>Keyboard Navigation</strong> - Full keyboard support for lightbox, navigation, and interactions</li>
          <li><strong>Responsive Design</strong> - Mobile-first design with breakpoints optimized for all screen sizes</li>
          <li><strong>Accessibility</strong> - Semantic HTML, ARIA labels, keyboard navigation, and reduced motion support</li>
        </ul>
      </AccordionSection>

      <AccordionSection
        id="build-pipeline"
        label="build pipeline"
        title="Processing Scripts"
        description="Node.js-based command-line tools for importing photos, processing images, extracting metadata, and generating JSON manifests with data preservation."
        isOpen={openSections['build-pipeline']}
        onToggle={() => toggleSection('build-pipeline')}
      >
        <ul className="tech-list">
          <li><strong>import:photos</strong> - Unified photo import pipeline that processes originals, generates WebP variants, extracts EXIF, and builds JSON manifests</li>
          <li><strong>process:hero</strong> - Processes hero section images with metadata preservation</li>
          <li><strong>process:showcase</strong> - Generates showcase images with location data and EXIF extraction</li>
          <li><strong>process:about</strong> - Handles about page images with custom metadata support</li>
          <li><strong>process:trip</strong> - Builds trip definitions from JSON with route and highlight data</li>
          <li><strong>new-album</strong> - Interactive CLI tool for creating new album structures</li>
          <li><strong>init-locations</strong> - Initializes album location configuration with GPS placeholders</li>
          <li><strong>Data Preservation</strong> - All scripts preserve existing configuration data, only updating image paths and dimensions when needed</li>
        </ul>
      </AccordionSection>

      <AccordionSection
        id="architecture"
        label="architecture"
        title="System Design"
        description="Static site architecture with JSON-driven content, component-based React structure, and intelligent build optimization for production deployment."
        isOpen={openSections['architecture']}
        onToggle={() => toggleSection('architecture')}
      >
        <ul className="tech-list">
          <li><strong>Static Site Generation</strong> - No backend, no database, fully static HTML/CSS/JS</li>
          <li><strong>JSON-Driven Content</strong> - All content (albums, trips, site config) stored as JSON files</li>
          <li><strong>Component-Based Architecture</strong> - Reusable React components with prop validation</li>
          <li><strong>Custom Hooks</strong> - Low-quality mode detection, SEO management, site config loading</li>
          <li><strong>Type Safety</strong> - PropTypes for runtime validation, JSDoc type definitions</li>
          <li><strong>Progressive Enhancement</strong> - Core functionality works without JavaScript, enhanced with React</li>
          <li><strong>Config Preservation</strong> - Processing scripts treat user config as source of truth, never overwriting custom data</li>
          <li><strong>Incremental Builds</strong> - Smart detection of changed images for fast rebuilds</li>
          <li><strong>Production Optimized</strong> - Optimized bundle sizes, chunking strategies, and asset organization</li>
        </ul>
      </AccordionSection>
    </main>
  );
}

