// src/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from './firebaseAuth';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import './login.css';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false); // 👈 toggle state

  // modal states
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleLogin = async () => {
    let valid = true;

    if (!email) {
      setEmailError('Email is required');
      valid = false;
    } else if (!validateEmail(email)) {
      setEmailError('Invalid email format');
      valid = false;
    } else {
      setEmailError('');
    }

    if (!password) {
      setPasswordError('Password is required');
      valid = false;
    } else {
      setPasswordError('');
    }

    if (valid) {
      setLoading(true);
      try {
        const user = await loginUser(email, password);

        if (!user.emailVerified) {
          setPasswordError('Please verify your email before logging in.');
          setLoading(false);
          return;
        }

        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          localStorage.setItem('userData', JSON.stringify(userData));

          if (userData.role === 'Admin') {
            navigate('/Admin');
          } else {
            navigate('/CaviteInfographic');
          }
        } else {
          setPasswordError('Account setup is incomplete.');
        }
      } catch (error) {
        setPasswordError('Invalid email or password');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setEmailError('Please enter your email first');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setResetMessage(`Password reset link sent to ${email}`);
    } catch (error) {
      setEmailError('Failed to send reset email. Check if the email is valid.');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <div className="login-container">
      <img src="/images/newerbg.png" alt="Vector" className="vector-image" />
      <img src="/images/newestlogo.png" alt="Logo" className="logo-image" />

      <div className="login-card">
        <h1 className="login-title">Welcome</h1>
        <p className="login-bio">Sign in to your account</p>

        {/* Email input */}
        <div className="input-container">
          <input
            type="email"
            placeholder=" "
            className="login-input email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError('');
              setResetMessage('');
            }}
            onKeyDown={handleKeyDown}
          />
          <label className="floating-label">Email</label>
          {emailError && <p className="error-message">{emailError}</p>}
        </div>

        {/* Password input with toggle */}
        <div className="input-container password-container">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder=" "
            className="login-input password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordError('');
            }}
            onKeyDown={handleKeyDown}
          />
          <label className="floating-label">Password</label>

          {/* 👇 toggle button inside input */}
          <button
            type="button"
            className="toggle-password"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? '🙈' : '👁️'}
          </button>

          {passwordError && <p className="error-message">{passwordError}</p>}
        </div>

        <button className="login-forgot" onClick={handleForgotPassword}>
          Forgot password?
        </button>
        {resetMessage && <p className="success-message">{resetMessage}</p>}

        <div className="button-container">
          <button className="login-button" onClick={handleLogin} disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
          <button className="register-button" onClick={() => navigate('/register')}>
            Register
          </button>
        </div>

        <p className="login-terms">
          <button className="terms-button-login" onClick={() => setShowTerms(true)}>
            Terms of Use
          </button>{' '}
          |{' '}
          <button className="privacy-button-login" onClick={() => setShowPrivacy(true)}>
            Privacy Policy
          </button>
        </p>
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
                in Cavite’s historical sites. The data helps us improve content and prioritize
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

export default Login;
