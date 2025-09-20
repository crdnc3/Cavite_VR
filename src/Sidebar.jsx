import React, { useState } from 'react';
import './Sidebar.css';
import { useNavigate } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import { FiMapPin } from "react-icons/fi";


// Icons
import { FiGrid, FiUsers, FiArchive, FiHelpCircle, FiLogOut, FiFileText } from 'react-icons/fi';

function Sidebar() {
  const navigate = useNavigate();
  const auth = getAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const confirmLogout = async () => {
    try {
      await signOut(auth);
      navigate('/'); // Redirect to login or homepage
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <>
      <div className="sidebar">
        <div className="logo">
          C:VR.<span>Nexus</span>
        </div>
        <ul className="menu">
          <li onClick={() => navigate('/Admin')}>
            <FiGrid className="icon" /> Dashboard
          </li>
          <li onClick={() => navigate('/Users')}>
            <FiUsers className="icon" /> User Management
          </li>
          <li onClick={() => navigate('/Archive')}>
            <FiArchive className="icon" /> Archive
          </li>
          <li onClick={() => navigate('/Support')}>
            <FiHelpCircle className="icon" /> Support
          </li>
          <li onClick={() => navigate('/content-manager')}>
          <FiMapPin className="icon" /> Infographic Manager
          </li>
          <li onClick={() => setShowLogoutModal(true)}>
            <FiLogOut className="icon" /> Log Out
          </li>
        </ul>
      </div>

      {showLogoutModal && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal">
            <p>Are you sure you want to log out?</p>
            <div className="modal-actions">
              <button className="confirm" onClick={confirmLogout}>Yes, Log Out</button>
              <button className="cancel" onClick={() => setShowLogoutModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;
