import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../styles/Navbar.css';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const token = localStorage.getItem('access');

  useEffect(() => {
    // Get user info from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Failed to parse user:', err);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    localStorage.removeItem('user');
    setUser(null);
    setIsOpen(false);
    navigate('/login');
  };

  const handleNavClick = () => {
    setIsOpen(false);
  };

  // Hide navbar on login/register pages
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo" onClick={handleNavClick}>
          <span className="logo-icon"></span>
          <span className="logo-text">ShoutMe</span>
        </Link>

        {/* Hamburger Menu */}
        <button
          className={`hamburger ${isOpen ? 'active' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Navigation Menu */}
        <ul className={`nav-menu ${isOpen ? 'active' : ''}`}>
          <li className="nav-item">
            <Link
              to="/"
              className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
              onClick={handleNavClick}
            >
              Map
            </Link>
          </li>

          {token && (
            <>
              <li className="nav-item">
                <Link
                  to="/friends"
                  className={`nav-link ${location.pathname === '/friends' ? 'active' : ''}`}
                  onClick={handleNavClick}
                >
                  Friends
                </Link>
              </li>

              <li className="nav-item user-section">
                <div className="user-info">
                  {user && (
                    <>
                      <span className="username">👤 {user.username}</span>
                    </>
                  )}
                </div>
              </li>

              <li className="nav-item">
                <button
                  className="nav-link logout-btn"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </li>
            </>
          )}

          {!token && (
            <>
              <li className="nav-item">
                <Link
                  to="/login"
                  className={`nav-link ${location.pathname === '/login' ? 'active' : ''}`}
                  onClick={handleNavClick}
                >
                  Login
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  to="/register"
                  className={`nav-link register-btn ${location.pathname === '/register' ? 'active' : ''}`}
                  onClick={handleNavClick}
                >
                  Register
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}
