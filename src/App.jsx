import { useState, useEffect } from 'react';
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
      await loadSiteConfig();
      setThemeName(getThemeName());
    }
    initConfig();
  }, []);

  return (
    <Router>
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
              <Route path="/about" element={<About />} />
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
