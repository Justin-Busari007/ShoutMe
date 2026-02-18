import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import EventDetails from './pages/EventDetails';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Home/Map page */}
        <Route path="/" element={<Home />} />
        
        {/* Auth pages */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        
        {/* Event details page */}
        <Route path="/events/:id" element={<EventDetails />} />
        
        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;