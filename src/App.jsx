import React, { useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
  Navigate,
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

  // ✅ Allowed routes depende kung user o admin
  const allowedRoutes = user
    ? [
        // normal user routes
        '/home',
        '/about',
        '/faq',
        '/profile',
        '/review',
        '/caviteinfographic',
        // admin routes
        '/admin',
        '/users',
        '/support',
        '/archive',
        '/conman',
        '/content-manager',
      ]
    : [
        // public routes
        '/',
        '/login',
        '/register',
      ];

  // ✅ Hide navbar sa ilang path
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
  const shouldShowNavBar = !hideNavBarPaths.includes(
    location.pathname.toLowerCase()
  );

  // ✅ Lockdown: kung wala sa allowedRoutes → redirect
  if (!allowedRoutes.some((p) => location.pathname.toLowerCase().startsWith(p))) {
    return <Navigate to={user ? '/home' : '/'} replace />;
  }

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

        {/* User Routes */}
        <Route path="/home" element={<Home searchTerm={searchTerm} />} />
        <Route path="/about" element={<About />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/review/:id" element={<Review />} />
        <Route
          path="/caviteinfographic"
          element={<CaviteInfographic searchTerm={searchTerm} />}
        />

        {/* Admin Routes */}
        <Route path="/admin" element={<Admin />} />
        <Route path="/users" element={<Users />} />
        <Route path="/support" element={<Support />} />
        <Route path="/archive" element={<Archive />} />
        <Route path="/conman" element={<Conman />} />
        <Route path="/content-manager" element={<ContentManager />} />

        {/* Catch-all */}
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
