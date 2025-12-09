import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AlbumGrid from './components/AlbumGrid';
import AlbumPage from './components/AlbumPage';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AlbumGrid />} />
        <Route path="/album/:slug" element={<AlbumPage />} />
      </Routes>
    </Router>
  );
}

export default App;
