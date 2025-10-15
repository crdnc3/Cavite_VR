import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { auth } from './firebase';
import { signOut } from 'firebase/auth';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './navbar.css';
import justlogo from './assets/images/justlogo.png';

const NavBar = ({ searchTerm, setSearchTerm }) => {
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Handle search (Enter key)
  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchTerm.trim() !== '') {
      navigate('/caviteinfographic');
    }
  };

  // Open logout confirmation modal
  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  // Confirm logout action
  const confirmLogout = async () => {
    try {
      await signOut(auth);
      localStorage.clear();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Cancel logout
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
            <div className="brand-icon">
              <img src={justlogo} alt="Brand Logo" className="logo-img" />
            </div>
            <span className="brand-text">CAVITE:VR</span>
          </div>

          {/* Navigation Links */}
          <div className="navbar-nav">
            <NavLink 
              to="/caviteinfographic" 
              className="nav-item"
              data-color="yellow"
            >
              <span className="nav-text">HOME</span>
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

          {/* Search and Logout Section */}
          <div className="navbar-actions">
            <div className="cavite-container">
              <i className="fas fa-search cavite-icon"></i>
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
              title="Sign Out"
            >
              <i className="fas fa-right-from-bracket"></i>

            </button>
          </div>
        </div>
      </nav>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="modal-backdrop">
          <div className="navbar-logout-modal">
            <div className="navbar-modal-header">
              <div className="navbar-modal-icon">
                <i className="fas fa-sign-out-alt"></i>
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
