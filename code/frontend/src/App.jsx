import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import Event from './pages/Event';
import Friends from './pages/Friends';
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
        
        {/* Friends page */}
        <Route path="/friends" element={<Friends />} />
        
        {/* Event details page */}
        <Route path="/events/:id" element={<Event />} />
        
        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
