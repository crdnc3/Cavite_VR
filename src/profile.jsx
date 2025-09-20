import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from './firebase';
import {
  signOut,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import './profile.css';

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add('profile');
    document.documentElement.classList.add('profile');

    const storedUser = JSON.parse(localStorage.getItem('userData'));
    if (storedUser) {
      setUsername(storedUser.username || '');
      setEmail(storedUser.email || '');
    }

    return () => {
      document.body.classList.remove('profile');
      document.documentElement.classList.remove('profile');
    };
  }, []);

  const handleEditProfile = async () => {
    setError('');
    setSuccess('');

    if (isEditing) {
      if (!currentPassword) {
        setError('Please enter your current password.');
        return;
      }

      if (newPassword !== confirmNewPassword) {
        setError('New passwords do not match.');
        return;
      }

      try {
        const user = auth.currentUser;
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);

        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setSuccess('Password updated successfully!');
        setIsEditing(false);
      } catch (err) {
        console.error('Error updating password:', err);
        setError(err.message || 'Failed to update password.');
      }

      return;
    }

    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    const storedUser = JSON.parse(localStorage.getItem('userData'));
    if (storedUser) {
      setUsername(storedUser.username || '');
      setEmail(storedUser.email || '');
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setError('');
    setSuccess('');
    setIsEditing(false);
  };

  const handleLogout = () => {
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
    <div className="profile-content">
      <div className="cards-container">
        {/* LEFT PROFILE CARD */}
        <div className="left-profile">
          <div className="profile-square" />
          <div className="profile-details">
            <h3>{username}</h3>
            <h3>{email}</h3>
          </div>
          <div className="profile-buttons">
            <button className="edit-profile" onClick={handleEditProfile}>
              {isEditing ? 'Save Profile' : 'Edit Profile'}
            </button>
            {isEditing && (
              <button className="cancel-edit" onClick={handleCancelEdit}>
                Cancel
              </button>
            )}
            <button className="log-out" onClick={handleLogout}>Log Out</button>
          </div>
        </div>

        {/* RIGHT PROFILE SETTINGS */}
        <div className="website-settings">
          <h2>Your Profile</h2>

          <div className="setting-item">
            <h3>Username</h3>
            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={!isEditing}
              className={isEditing ? 'editable' : ''}
            />
          </div>

          {isEditing && (
            <>
              <div className="setting-item">
                <h3>Current Password</h3>
                <input
                  type="password"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="editable"
                />
              </div>

              <div className="setting-item">
                <h3>New Password</h3>
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="editable"
                />
              </div>

              <div className="setting-item">
                <h3>Confirm New Password</h3>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="editable"
                />
              </div>
            </>
          )}

          {error && <p className="error">{error}</p>}
          {success && <p className="success">{success}</p>}
        </div>
      </div>

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutConfirm && (
        <div className="logout-modal-backdrop">
          <div className="logout-modal">
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to log out?</p>
            <div className="modal-buttons">
              <button className="confirm-btn" onClick={confirmLogout}>Yes, log out</button>
              <button className="cancel-btn" onClick={cancelLogout}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
