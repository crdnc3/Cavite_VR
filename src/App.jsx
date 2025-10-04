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

// ✅ SUPER STRICT Protected Route with ROLE checking
const ProtectedRoute = ({ user, allowedPaths, role, requiredRole }) => {
  const location = useLocation();
  const currentPath = location.pathname.toLowerCase();

  // ❌ If not logged in
  if (!user) return <Navigate to="/" replace />;

  // ❌ If wrong role (e.g., user trying to access admin)
  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  // ❌ If logged in but path not allowed for this role
  if (!allowedPaths.includes(currentPath)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

const AppWrapper = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null); // ✅ Start as null (not known yet)
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // 🔐 Example role checking logic
        // Replace with Firestore fetch if you store roles there
        if (currentUser.email === 'admin@email.com') {
          setRole('admin');
        } else {
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

  // ✅ Allowed paths per role
  const userPaths = ['/about', '/faq', '/profile', '/review', '/caviteinfographic'];
  const adminPaths = ['/admin', '/users', '/support', '/archive', '/conman', '/content-manager'];

  // ✅ NavBar visible only for user pages
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
          <Route path="/profile" element={<Profile />} />
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
