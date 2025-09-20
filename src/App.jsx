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

const ProtectedRoute = ({ children }) => {
  const user = auth.currentUser;
  return user ? children : <Navigate to="/" replace />;
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
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home searchTerm={searchTerm} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/about"
          element={
            <ProtectedRoute>
              <About />
            </ProtectedRoute>
          }
        />
        <Route
          path="/faq"
          element={
            <ProtectedRoute>
              <FAQ />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/review/:id"
          element={
            <ProtectedRoute>
              <Review />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Admin"
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Users"
          element={
            <ProtectedRoute>
              <Users />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Support"
          element={
            <ProtectedRoute>
              <Support />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Archive"
          element={
            <ProtectedRoute>
              <Archive />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Conman"
          element={
            <ProtectedRoute>
              <Conman />
            </ProtectedRoute>
          }
        />
        <Route
          path="/content-manager"
          element={
            <ProtectedRoute>
              <ContentManager />
            </ProtectedRoute>
          }
        />
        <Route
          path="/CaviteInfographic"
          element={
            <ProtectedRoute>
              <CaviteInfographic searchTerm={searchTerm} />
            </ProtectedRoute>
          }
        />
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
