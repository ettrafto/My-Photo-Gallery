import { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { loadSiteConfig, getThemeName } from './lib/siteConfig';
import { useSEO } from './hooks/useSEO';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import AlbumPage from './components/AlbumPage';
import Home from './pages/Home';
import Albums from './pages/Albums';
import Trips from './pages/Trips';
import TripDetail from './pages/TripDetail';
import Map from './pages/Map';
import About from './pages/About';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

// Default SEO wrapper component
function SEOWrapper({ children }) {
  // Load config and apply default SEO
  useSEO();
  return children;
}

function App() {
  const [themeName, setThemeName] = useState('mono'); // Fallback

  // Load config and theme on mount
  useEffect(() => {
    async function initConfig() {
      try {
        await loadSiteConfig();
        setThemeName(getThemeName());
      } catch (err) {
        console.error('Failed to load site config:', err);
        // Continue with fallback theme
      }
    }
    initConfig();
  }, []);

  // Get base URL for Router basename
  // Vite sets BASE_URL to '/' by default in production
  // For React Router: only set basename if we have a non-root base path
  // For root deployments (BASE_URL === '/'), basename should be undefined
  const baseUrl = useMemo(() => {
    const envBase = import.meta.env.BASE_URL;
    // If BASE_URL is undefined, null, empty, or '/', don't set basename (root deployment)
    if (!envBase || envBase === '' || envBase === '/') {
      return undefined; // Root deployment - no basename needed
    }
    // For subdirectory deployments, remove trailing slash
    return envBase.endsWith('/') ? envBase.slice(0, -1) : envBase;
  }, []);

  return (
    <Router basename={baseUrl}>
      <SEOWrapper>
        <div className={`app-shell theme-${themeName}`}>
          <NavBar />
          <main className="app-main">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/albums" element={<Albums />} />
              <Route path="/trips" element={<Trips />} />
              <Route path="/trips/:slug" element={<TripDetail />} />
              <Route path="/map" element={<Map />} />
              <Route path="/about" element={
                <ErrorBoundary>
                  <About />
                </ErrorBoundary>
              } />
              <Route path="/album/:slug" element={<AlbumPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </SEOWrapper>
    </Router>
  );
}

export default App;
