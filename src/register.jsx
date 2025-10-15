import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from './firebaseAuth';
import { db } from './firebase';
import { doc, collection, addDoc, setDoc } from 'firebase/firestore';
import { sendEmailVerification } from 'firebase/auth';
import './register.css';
import newestlogo from './assets/images/newestlogo.png';
import newerbg from './assets/images/newerbg.png';

const regions = [
  "National Capital Region (NCR)",
  "Ilocos Region (Region I)",
  "Cagayan Valley (Region II)",
  "Central Luzon (Region III)",
  "CALABARZON (Region IV-A)",
  "MIMAROPA (Region IV-B)",
  "Bicol Region (Region V)",
  "CAR",

  "Western Visayas (Region VI)",
  "Central Visayas (Region VII)",
  "Eastern Visayas (Region VIII)",
  "Negros Island Region (NIR)",

  "Zamboanga Peninsula (Region IX)",
  "Northern Mindanao (Region X)",
  "Davao Region (Region XI)",
  "SOCCSKSARGEN (Region XII)",
  "Caraga (Region XIII)",
  "Bangsamoro Autonomous Region (BARMM)"
];

const regionPlaces = {
  "National Capital Region (NCR)": ["Caloocan", "Las Piñas", "Makati", "Malabon", "Mandaluyong", "Manila", "Marikina", "Muntinlupa", "Navotas", "Parañaque", "Pasay", "Pasig", "Pateros", "Quezon City", "San Juan", "Taguig", "Valenzuela"],
  "Ilocos Region (Region I)": ["Ilocos Norte", "Ilocos Sur", "La Union", "Pangasinan"],
  "Cagayan Valley (Region II)": ["Batanes", "Cagayan", "Isabela", "Nueva Vizcaya", "Quirino"],
  "Central Luzon (Region III)": ["Aurora", "Bataan", "Bulacan", "Nueva Ecija", "Pampanga", "Tarlac", "Zambales"],
  "CALABARZON (Region IV-A)": ["Cavite", "Laguna", "Batangas", "Rizal", "Quezon"],
  "MIMAROPA (Region IV-B)": ["Marinduque", "Occidental Mindoro", "Oriental Mindoro", "Palawan", "Romblon"],
  "Bicol Region (Region V)": ["Albay", "Camarines Norte", "Camarines Sur", "Catanduanes", "Masbate", "Sorsogon"],
  "CAR": ["Abra", "Apayao", "Benguet", "Ifugao", "Kalinga", "Mountain Province"],


  "Western Visayas (Region VI)": ["Aklan", "Antique", "Capiz", "Guimaras", "Iloilo"],
  "Central Visayas (Region VII)": ["Bohol", "Cebu"],
  "Negros Island Region (NIR)": ["Negros occidental", "Negros Oriental", "Siquijor"],
  "Eastern Visayas (Region VIII)": ["Biliran", "Eastern Samar", "Leyte", "Northern Samar", "Samar", "Southern Leyte"],

  
  "Zamboanga Peninsula (Region IX)": ["Zamboanga Del Norte", "Zamboanga Del Sur", "Zamboanga Sibugay", "Zamboanga City", "Isabela City"],
  "Northern Mindanao (Region X)": ["Bukidnon", "Camiguin", "Lanao Del Norte", "Misamis Occidental", "Misamis Oriental"],
  "Davao Region (Region XI)": ["Davao De Oro", "Davao Del Norte", "Davao Del Sur", "Davao Occidental", "Davao Oriental"],
  "SOCCSKSARGEN (Region XII)": ["Cotabato", "Sarangani", "South Cotabato", "Sultan Kudarat"],
  "Caraga (Region XIII)": ["Agusan Del Norte", "Agusan Del Sur", "Dinagat Islands", "Surigao Del Norte", "Surigao Del Sur"],
  "Bangsamoro Autonomous Region (BARMM)": ["Basilan", "Lanao Del Sur", "Maguinadanao", "Sulu", "Tawi-Tawi"]
};

const Register = () => {
  const navigate = useNavigate();

  // Form states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [region, setRegion] = useState('');
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState('');

  // Errors
  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [regionError, setRegionError] = useState('');
  const [placeError, setPlaceError] = useState('');
  const [passwordStrengthMessage, setPasswordStrengthMessage] = useState('');

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // ✅ STRONG PASSWORD CHECK
  const validateStrongPassword = (password) => {
    const lengthCheck = password.length >= 8;
    const upperCheck = /[A-Z]/.test(password);
    const lowerCheck = /[a-z]/.test(password);
    const numberCheck = /\d/.test(password);
    const specialCheck = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!lengthCheck)
      return "Password must be at least 8 characters long.";
    if (!upperCheck)
      return "Password must contain at least one uppercase letter.";
    if (!lowerCheck)
      return "Password must contain at least one lowercase letter.";
    if (!numberCheck)
      return "Password must contain at least one number.";
    if (!specialCheck)
      return "Password must contain at least one special character.";

    return "";
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordError('');
    const strengthMessage = validateStrongPassword(newPassword);
    setPasswordStrengthMessage(strengthMessage);
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

    const passwordValidationMessage = validateStrongPassword(password);
    if (passwordValidationMessage) {
      setPasswordError(passwordValidationMessage);
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
      setPlaceError('Please select your province/city');
      valid = false;
    } else setPlaceError('');

    if (valid) {
      try {
        const user = await registerUser(email.trim(), password, username.trim());

        if (user && user.email) {
          await sendEmailVerification(user);
        }

        const logsCollectionRef = collection(db, 'users', user.uid, 'logs');
        await addDoc(logsCollectionRef, {
          message: `User ${username.trim()} has created an account`,
          timestamp: new Date(),
        });

        await setDoc(doc(db, 'users', user.uid), {
          username: username.trim(),
          email: email.trim(),
          region,
          place: selectedPlace,
          createdAt: new Date(),
          emailVerified: user.emailVerified,
        });

        alert("A verification email has been sent. Please check your inbox or spam folder before logging in.");
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
          {password && !passwordError && passwordStrengthMessage && (
            <p className="unique-password-hint">{passwordStrengthMessage}</p>
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
            <option value="">Select your province/city</option>
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
