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

// ✅ Protected Route Layout
const ProtectedRoute = ({ user }) => {
  if (!user) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};

const AppWrapper = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div>Loading...</div>;

  // ✅ All lowercase para walang conflict
  const hideNavBarPaths = [
    '/',
    '/login',
    '/register',
    '/admin',
    '/users',
    '/support',
    '/archive',
    '/navbar',
    '/conman',
    '/content-manager',
  ];

  // ✅ Always check lowercase para safe
  const shouldShowNavBar = !hideNavBarPaths.includes(
    location.pathname.toLowerCase()
  );

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

        {/* ✅ Protected Routes */}
        <Route element={<ProtectedRoute user={user} />}>
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/review/:id" element={<Review />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/users" element={<Users />} />
          <Route path="/support" element={<Support />} />
          <Route path="/archive" element={<Archive />} />
          <Route path="/conman" element={<Conman />} />
          <Route path="/content-manager" element={<ContentManager />} />
          <Route
            path="/caviteinfographic"
            element={<CaviteInfographic searchTerm={searchTerm} />}
          />
        </Route>

        {/* ✅ Catch-all route → balik LandingPage */}
        <Route path="*" element={<LandingPage />} />
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
