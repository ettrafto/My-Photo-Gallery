import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import AlbumPage from './components/AlbumPage';
import Home from './pages/Home';
import Albums from './pages/Albums';
import Trips from './pages/Trips';
import TripDetail from './pages/TripDetail';
import Map from './pages/Map';
import About from './pages/About';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-shell">
        <NavBar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/albums" element={<Albums />} />
          <Route path="/trips" element={<Trips />} />
          <Route path="/trips/:slug" element={<TripDetail />} />
          <Route path="/map" element={<Map />} />
          <Route path="/about" element={<About />} />
          <Route path="/album/:slug" element={<AlbumPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
