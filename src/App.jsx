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
import NavBar from './navbar';
import Review from './review';
import Admin from './Admin';
import Users from './Users';
import Support from './Support';
import Archive from './archive';
import CaviteInfographic from './CaviteInfographic';
import ContentManager from './connman';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

// ✅ Protected Route (strict + role-based)
const ProtectedRoute = ({ user, allowedPaths, role, requiredRole }) => {
  const location = useLocation();
  const currentPath = location.pathname.toLowerCase();

  // ❌ Not logged in → redirect
  if (!user) return <Navigate to="/" replace />;

  // ❌ Wrong role → redirect
  if (requiredRole && role?.toLowerCase() !== requiredRole.toLowerCase()) {
    return <Navigate to="/" replace />;
  }

  // ❌ Logged in but trying to access disallowed path
  if (!allowedPaths.includes(currentPath)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

const AppWrapper = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          // ✅ Fetch role from Firestore (users collection)
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const userData = userSnap.data();
            setRole(userData.role || 'user'); // default to 'user' if role missing
          } else {
            setRole('user');
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
          setRole('user');
        }
      } else {
        setRole(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <div>Loading...</div>;

  // ✅ Define allowed paths
  const userPaths = ['/about', '/faq', '/review', '/caviteinfographic'];
  const adminPaths = ['/admin', '/users', '/support', '/archive', '/content-manager'];

  // ✅ Navbar logic
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
          element={
            <ProtectedRoute
              user={user}
              allowedPaths={userPaths}
              role={role}
              requiredRole="user"
            />
          }
        >
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/review/:id" element={<Review />} />
          <Route
            path="/caviteinfographic"
            element={<CaviteInfographic searchTerm={searchTerm} />}
          />
        </Route>

        {/* Admin Protected Routes */}
        <Route
          element={
            <ProtectedRoute
              user={user}
              allowedPaths={adminPaths}
              role={role}
              requiredRole="admin"
            />
          }
        >
          <Route path="/admin" element={<Admin />} />
          <Route path="/users" element={<Users />} />
          <Route path="/support" element={<Support />} />
          <Route path="/archive" element={<Archive />} />
          <Route path="/content-manager" element={<ContentManager />} />
        </Route>

        {/* Catch-all → LandingPage */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

const App = () => (
  <Router>
    <AppWrapper />
  </Router>
);

export default App;
