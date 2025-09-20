import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { auth } from './firebase';
import { signOut } from 'firebase/auth';
import './navbar.css';

const NavBar = ({ searchTerm, setSearchTerm }) => {
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchTerm.trim() !== '') {
      navigate('/caviteinfographic');
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    try {
      await signOut(auth);
      localStorage.clear();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <>
      {/* Main Navbar */}
      <nav className="modern-navbar">
        {/* Philippine Flag Accent Strip */}
        <div className="flag-accent">
          <div className="flag-blue"></div>
          <div className="flag-red"></div>
        </div>

        <div className="navbar-container">
          {/* Logo/Brand Section */}
          <div className="navbar-brand">
          <div className="navbar-brand">
            <div className="brand-icon">
              <img src="src/assets/images/justlogo.png" alt="Brand Logo" className="logo-img" />
            </div>
          </div>
            <span className="brand-text">CATE:VR</span>
          </div>

          {/* Navigation Links */}
          <div className="navbar-nav">
            <NavLink 
              to="/caviteinfographic" 
              className="nav-item"
              data-color="yellow"
            >
              <span className="nav-text">INFOGRAPHIC</span>
              <div className="nav-indicator"></div>
            </NavLink>
            <NavLink 
              to="/about" 
              className="nav-item"
              data-color="red"
            >
              <span className="nav-text">ABOUT</span>
              <div className="nav-indicator"></div>
            </NavLink>
            <NavLink 
              to="/faq" 
              className="nav-item"
              data-color="blue"
            >
              <span className="nav-text">FAQ</span>
              <div className="nav-indicator"></div>
            </NavLink>
          </div>

          {/* Search and Profile Section */}
          <div className="navbar-actions">
            <div className="cavite-container">
              <svg className="cavite-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="21 21l-4.35-4.35"></path>
              </svg>
              <input
                type="text"
                className="cavite-input"
                placeholder="Search Historical Site..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearch}
              />
            </div>
            
            <button
              className="profile-button"
              onClick={handleLogoutClick}
              title="Profile & Settings"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="modal-backdrop">
          <div className="logout-modal">
            <div className="modal-header">
              <div className="modal-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16,17 21,12 16,7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </div>
              <h3>Sign Out</h3>
            </div>
            <p>Are you sure you want to sign out of your account?</p>
            <div className="modal-actions">
              <button className="cncl-btn" onClick={cancelLogout}>
                Cancel
              </button>
              <button className="sgnout-btn" onClick={confirmLogout}>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NavBar;