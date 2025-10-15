import React, { useState } from 'react';
import './Sidebar.css';
import { useNavigate } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import { FiMapPin } from "react-icons/fi";
import { FiMessageSquare } from "react-icons/fi";

// Icons
import { FiGrid, FiUsers, FiArchive, FiHelpCircle, FiLogOut, FiFileText, FiMail } from 'react-icons/fi';

function Sidebar() {
  const navigate = useNavigate();
  const auth = getAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

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
          C:VR.<span>Admin</span>
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
            <FiMessageSquare className="icon" /> Feedbacks
          </li>
          <li onClick={() => navigate('/content-manager')}>
            <FiMapPin className="icon" /> Infographic Manager
          </li>
          <li onClick={() => setShowContactModal(true)}>
            <FiMail className="icon" /> Contact Developers
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

      {showContactModal && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal contact-modal">
            <h3>Contact Developers</h3>
            <p style={{ marginBottom: '15px', fontSize: '14px' }}>
              Please select the appropriate contact based on your concern:
            </p>
            
            <div className="contact-section">
              <h4>For Website Issues:</h4>
              <p><strong>Alister Realo</strong></p>
              <p>
                <a href="mailto:alsterrealo23@gmail.com">alsterrealo23@gmail.com</a>
              </p>
            </div>

            <div className="contact-section">
              <h4>For VR App Issues:</h4>
              <p><strong>Marvin Atienza</strong></p>
              <p>
                <a href="mailto:marvinhumpreyatienza@gmail.com">marvinhumpreyatienza@gmail.com</a>
              </p>
              <p style={{ marginTop: '10px' }}><strong>Raemil Amarillo</strong></p>
              <p>
                <a href="mailto:raemilvinceamarillo@gmail.com">raemilvinceamarillo@gmail.com</a>
              </p>
            </div>

            <div className="modal-actions">
              <button className="cancel" onClick={() => setShowContactModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;