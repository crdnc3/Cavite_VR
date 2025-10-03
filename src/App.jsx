import React, { useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
  Navigate,
  Outlet,
} from 'react-router-dom';
import Login from './login';
import Register from './register';
import LandingPage from './landingpage';
import About from './about';
import FAQ from './faq';
import Profile from './profile';
import NavBar from './navbar';
import Review from './review';
import Admin from './Admin';
import Users from './Users';
import Support from './Support';
import Archive from './archive';
import CaviteInfographic from './CaviteInfographic';
import Conman from './conman';
import ContentManager from './connman';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

// ✅ Protected Route with role checking
const ProtectedRoute = ({ user, allowedPaths }) => {
  const location = useLocation();
  const currentPath = location.pathname.toLowerCase();

  // ❌ If not logged in → always go to landing
  if (!user) return <Navigate to="/" replace />;

  // ❌ If logged in but path not allowed → also go to landing
  if (!allowedPaths.includes(currentPath)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

const AppWrapper = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  // Simulated role (dapat manggaling sa DB o custom claim sa Firebase)
  const [role, setRole] = useState('user'); // "user" or "admin"

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      // 🔑 Example: dito mo i-fetch yung role mula sa DB
      // setRole(currentUser?.email === 'admin@email.com' ? 'admin' : 'user');

      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div>Loading...</div>;

  // ✅ Allowed paths depende sa role
  const userPaths = ['/about', '/faq', '/profile', '/review', '/caviteinfographic'];
  const adminPaths = ['/admin', '/users', '/support', '/archive', '/conman', '/content-manager'];

  // ✅ NavBar visible only on user pages
  const hideNavBarPaths = ['/', '/login', '/register', ...adminPaths];
  const currentPath = location.pathname.toLowerCase();
  const shouldShowNavBar =
    userPaths.includes(currentPath) && !hideNavBarPaths.includes(currentPath);

  return (
    <>
      {shouldShowNavBar && (
        <NavBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      )}

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* User Protected Routes */}
        <Route
          element={<ProtectedRoute user={user} allowedPaths={userPaths} />}
        >
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/review/:id" element={<Review />} />
          <Route
            path="/caviteinfographic"
            element={<CaviteInfographic searchTerm={searchTerm} />}
          />
        </Route>

        {/* Admin Protected Routes */}
        <Route
          element={<ProtectedRoute user={user} allowedPaths={adminPaths} />}
        >
          <Route path="/admin" element={<Admin />} />
          <Route path="/users" element={<Users />} />
          <Route path="/support" element={<Support />} />
          <Route path="/archive" element={<Archive />} />
          <Route path="/conman" element={<Conman />} />
          <Route path="/content-manager" element={<ContentManager />} />
        </Route>

        {/* ✅ Strict Catch-all → balik LandingPage */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <Router>
      <AppWrapper />
    </Router>
  );
};

export default App;
