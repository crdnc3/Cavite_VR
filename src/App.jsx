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
import Home from './home';
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

  const hideNavBarPaths = [
    '/',
    '/login',
    '/register',
    '/Admin',
    '/Users',
    '/Support',
    '/Archive',
    '/Conman',
    '/content-manager',
  ];

  const shouldShowNavBar = !hideNavBarPaths.includes(location.pathname);

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
          <Route path="/home" element={<Home searchTerm={searchTerm} />} />
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/review/:id" element={<Review />} />
          <Route path="/Admin" element={<Admin />} />
          <Route path="/Users" element={<Users />} />
          <Route path="/Support" element={<Support />} />
          <Route path="/Archive" element={<Archive />} />
          <Route path="/Conman" element={<Conman />} />
          <Route path="/content-manager" element={<ContentManager />} />
          <Route
            path="/CaviteInfographic"
            element={<CaviteInfographic searchTerm={searchTerm} />}
          />
        </Route>
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
