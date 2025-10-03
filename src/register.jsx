// src/Register.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from './firebaseAuth';
import { db } from './firebase';
import { doc, collection, addDoc, setDoc } from 'firebase/firestore';
import { sendEmailVerification } from 'firebase/auth'; // ✅ Import ito
import './register.css';
import newestlogo from './assets/images/newestlogo.png';
import newerbg from './assets/images/newerbg.png';

const regions = [
  "Ilocos Region (Region I)",
  "Cagayan Valley (Region II)",
  "Central Luzon (Region III)",
  "CALABARZON (Region IV-A)",
  "MIMAROPA (Region IV-B)",
  "Bicol Region (Region V)",
  "Western Visayas (Region VI)",
  "Central Visayas (Region VII)",
  "Eastern Visayas (Region VIII)",
  "Zamboanga Peninsula (Region IX)",
  "Northern Mindanao (Region X)",
  "Davao Region (Region XI)",
  "SOCCSKSARGEN (Region XII)",
  "Caraga (Region XIII)",
  "Bangsamoro Autonomous Region (BARMM)"
];

const regionPlaces = {
  "Ilocos Region (Region I)": ["Laoag City", "Vigan", "San Fernando"],
  "Cagayan Valley (Region II)": ["Tuguegarao", "Ilagan", "Sanchez Mira"],
  "Central Luzon (Region III)": ["Angeles City", "San Fernando", "Tarlac City"],
  "CALABARZON (Region IV-A)": ["Cavite", "Laguna", "Batangas", "Rizal", "Quezon"],
  "MIMAROPA (Region IV-B)": ["Puerto Princesa", "Calapan", "Roxas"],
  "Bicol Region (Region V)": ["Legazpi", "Naga", "Sorsogon"],
  "Western Visayas (Region VI)": ["Iloilo City", "Bacolod", "Guimaras"],
  "Central Visayas (Region VII)": ["Cebu City", "Lapu-Lapu", "Dumaguete"],
  "Eastern Visayas (Region VIII)": ["Tacloban", "Ormoc", "Baybay"],
  "Zamboanga Peninsula (Region IX)": ["Zamboanga City", "Pagadian", "Dipolog"],
  "Northern Mindanao (Region X)": ["Cagayan de Oro", "Iligan", "Gingoog"],
  "Davao Region (Region XI)": ["Davao City", "Tagum", "Panabo"],
  "SOCCSKSARGEN (Region XII)": ["General Santos", "Koronadal", "Kidapawan"],
  "Caraga (Region XIII)": ["Butuan", "Surigao", "Tandag"],
  "Bangsamoro Autonomous Region (BARMM)": ["Cotabato City", "Marawi", "Lamitan"]
};

const Register = () => {
  const navigate = useNavigate();

  // Form fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [region, setRegion] = useState('');
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState('');

  // Errors & feedback
  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [regionError, setRegionError] = useState('');
  const [placeError, setPlaceError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState('');

  // Helpers
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const checkPasswordStrength = (password) => {
    if (password.length < 6) return 'Weak';
    else if (password.length < 10) return 'Medium';
    else return 'Strong';
  };

  // Handlers
  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordStrength(checkPasswordStrength(newPassword));
    setPasswordError('');
  };

  const handleRegionChange = (e) => {
    const selectedRegion = e.target.value;
    setRegion(selectedRegion);
    setRegionError('');
    if (regionPlaces[selectedRegion]) {
      setPlaces(regionPlaces[selectedRegion]);
      setSelectedPlace('');
      setPlaceError('');
    } else {
      setPlaces([]);
      setSelectedPlace('');
    }
  };

  const handleRegister = async () => {
    let valid = true;

    if (!username.trim()) {
      setUsernameError('Username is required');
      valid = false;
    } else setUsernameError('');

    if (!email.trim()) {
      setEmailError('Email is required');
      valid = false;
    } else if (!validateEmail(email.trim())) {
      setEmailError('Invalid email format');
      valid = false;
    } else setEmailError('');

    if (!password) {
      setPasswordError('Password is required');
      valid = false;
    } else setPasswordError('');

    if (!confirmPassword) {
      setConfirmPasswordError('Confirm Password is required');
      valid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      valid = false;
    } else setConfirmPasswordError('');

    if (!region) {
      setRegionError('Please select your region');
      valid = false;
    } else setRegionError('');

    if (!selectedPlace) {
      setPlaceError('Please select your place');
      valid = false;
    } else setPlaceError('');

    if (valid) {
      try {
        const user = await registerUser(email.trim(), password, username.trim());

        // ✅ Send email verification
        if (user && user.email) {
          await sendEmailVerification(user);
        }

        // Log action
        const logsCollectionRef = collection(db, 'users', user.uid, 'logs');
        await addDoc(logsCollectionRef, {
          message: `User ${username.trim()} has created an account`,
          timestamp: new Date(),
        });

        // Save user data
        await setDoc(doc(db, 'users', user.uid), {
          username: username.trim(),
          email: email.trim(),
          region,
          place: selectedPlace,
          createdAt: new Date(),
          emailVerified: user.emailVerified, // will be false until verified
        });

        alert("A verification email has been sent. Please check your inbox (or spam folder) before logging in.");

        navigate('/login');
      } catch (error) {
        console.error('Registration error:', error.message);
        setEmailError(error.message);
      }
    }
  };

  return (
    <div className="register-container">
      <img src={newerbg} alt="Vector" className="vector-image" />
      <img src={newestlogo} alt="Logo" className="logo-image" />

      <div className="register-card">
        <h1 className="register-title">Welcome!</h1>
        <p className="register-bio">Create your account</p>

        {/* Username */}
        <div className="input-container">
          <input
            type="text"
            placeholder=" "
            className="register-input username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setUsernameError('');
            }}
          />
          <label className="floating-label">Username</label>
          {usernameError && <p className="error-message">{usernameError}</p>}
        </div>

        {/* Email */}
        <div className="input-container">
          <input
            type="email"
            placeholder=" "
            className="register-input email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError('');
            }}
          />
          <label className="floating-label">Email</label>
          {emailError && <p className="error-message">{emailError}</p>}
        </div>

        {/* Password */}
        <div className="input-container">
          <input
            type="password"
            placeholder=" "
            className="register-input password"
            value={password}
            onChange={handlePasswordChange}
          />
          <label className="floating-label">Password</label>
          {passwordError && <p className="error-message">{passwordError}</p>}
          {password && (
            <p className={`password-strength ${passwordStrength.toLowerCase()}`}>
              {passwordStrength}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="input-container">
          <input
            type="password"
            placeholder=" "
            className="register-input confirm-password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setConfirmPasswordError('');
            }}
          />
          <label className="floating-label">Confirm Password</label>
          {confirmPasswordError && <p className="error-message">{confirmPasswordError}</p>}
        </div>

        {/* Region */}
        <div className="region-select-container">
          <select
            className="register-input region-select"
            value={region}
            onChange={handleRegionChange}
          >
            <option value="">Select your region</option>
            {regions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          {regionError && <p className="error-message">{regionError}</p>}
        </div>

        {/* Place */}
        <div className="place-select-container">
          <select
            className="register-input place-select"
            value={selectedPlace}
            onChange={(e) => {
              setSelectedPlace(e.target.value);
              setPlaceError('');
            }}
            disabled={!region}
          >
            <option value="">Select your place</option>
            {places.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          {placeError && <p className="error-message">{placeError}</p>}
        </div>

        {/* Buttons */}
        <div className="button-container">
          <button className="register-button" onClick={handleRegister}>
            Register
          </button>
          <button className="login-button" onClick={() => navigate('/login')}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;
