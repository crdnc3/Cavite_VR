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
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  // Errors
  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [regionError, setRegionError] = useState('');
  const [placeError, setPlaceError] = useState('');
  const [termsError, setTermsError] = useState('');
  const [passwordStrengthMessage, setPasswordStrengthMessage] = useState('');

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

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

    if (!agreeTerms || !agreePrivacy) {
      setTermsError('You must agree to Terms of Use and Privacy Policy');
      valid = false;
    } else setTermsError('');

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

        {/* Terms & Privacy Checkbox */}
        <div className="terms-privacy-container">
          <input
            type="checkbox"
            id="terms-privacy-checkbox"
            checked={agreeTerms && agreePrivacy}
            onChange={(e) => {
              setAgreeTerms(e.target.checked);
              setAgreePrivacy(e.target.checked);
              setTermsError('');
            }}
          />
          <label htmlFor="terms-privacy-checkbox">
            I agree to the{' '}
            <button
              type="button"
              className="register-terms-link"
              onClick={() => setShowTerms(true)}
            >
              Terms of Use
            </button>
            {' '}and{' '}
            <button
              type="button"
              className="register-privacy-link"
              onClick={() => setShowPrivacy(true)}
            >
              Privacy Policy
            </button>
          </label>
        </div>
        {termsError && <p className="error-message">{termsError}</p>}

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

      {/* Terms of Use Modal */}
      {showTerms && (
        <div className="terms-modal-login">
          <div className="terms-modal-content-login">
            <span className="close-modal-login" onClick={() => setShowTerms(false)}>
              &times;
            </span>
            <h2>Terms of Use</h2>
            <p>
              Welcome to the Cavite VR Website. By accessing and using our platform, you agree to
              the following terms and conditions:
            </p>
            <ul>
              <li>
                <b>Educational Purpose:</b> All content, including images, descriptions, and
                historical data, is provided solely for educational, informational, and personal
                use. Commercial use, redistribution, or republication without prior written
                consent is strictly prohibited.
              </li>
              <li>
                <b>Intellectual Property:</b> Historical site information, photographs, and
                descriptions remain the intellectual property of their respective owners,
                contributors, or institutions. You may not copy, modify, or distribute content
                without authorization.
              </li>
              <li>
                <b>Accuracy of Information:</b> The details provided on the Cavite VR website
                (such as operating hours, entrance fees, directions, and historical background)
                are based on verified sources and, in many cases, actual site visits and research.
                While we make every effort to ensure accuracy, some information may change over
                time due to updates made by the respective historical sites. We recommend checking
                with the official site or local authorities for the most current details before
                planning a visit.
              </li>
              <li>
                <b>Third-Party Links:</b> The website may include external links such as Google
                Maps for navigation. We are not responsible for the availability, accuracy, or
                content of external services.
              </li>
              <li>
                <b>Limitation of Liability:</b> Use of this website is at your own risk. We are
                not liable for damages, losses, or inconveniences arising from reliance on the
                provided content or third-party services.
              </li>
            </ul>
            <p>
              By continuing to use the Cavite VR Website, you acknowledge and agree to these
              Terms of Use. If you do not agree, please discontinue use of the platform.
            </p>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacy && (
        <div className="privacy-modal-login">
          <div className="privacy-modal-content-login">
            <span className="close-modal-login" onClick={() => setShowPrivacy(false)}>
              &times;
            </span>
            <h2>Privacy Policy</h2>
            <p>
              Your privacy is important to us. This Privacy Policy explains how we collect,
              use, and protect your information when you use the Cavite VR Website.
            </p>
            <ul>
              <li>
                <b>Information We Collect:</b> We only collect your <b>email</b>, <b>region</b>,
                and <b>city</b>. This information is important for our data analytics, allowing us
                to understand how many people from different regions and cities are interested
                in Cavite's historical sites. The data helps us improve content and prioritize
                features based on user interest.
              </li>
              <li>
                <b>Use of Information:</b> The information collected will be used solely for
                improving website functionality, providing relevant content, and enhancing
                your user experience. We may also use aggregated and anonymized data to
                understand how many users from each region or city are interested in the
                historical sites of Cavite. This helps us improve educational content and
                tailor features based on user interest. We do not sell or share your
                information with third parties.
              </li>
              <li>
                <b>Data Security:</b> Reasonable technical and organizational measures are in
                place to protect your personal information from unauthorized access, alteration,
                or disclosure.
              </li>
              <li>
                <b>User Control:</b> You have the right to request access, correction, or deletion
                of your personal information by contacting our support team.
              </li>
              <li>
                <b>Third-Party Services:</b> Some features may rely on third-party tools (such as
                Google Maps). These providers may have their own privacy policies, for which we
                are not responsible.
              </li>
              <li>
                <b>Updates:</b> This Privacy Policy may be updated periodically. Continued use of
                the website after changes are made constitutes acceptance of the revised policy.
              </li>
            </ul>
            <p>
              By using the Cavite VR Website, you consent to the collection and use of your
              information in accordance with this Privacy Policy.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;