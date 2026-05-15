import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Shield, Settings } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="nav-brand">
          <Shield size={24} />
          <span>Telegram Vault</span>
        </Link>
        <div className="nav-links">
          {user ? (
            <>
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
              <Link to="/admin-setup" className="nav-link" title="Telegram Setup">
                <Settings size={16} />
                Setup
              </Link>
              <button
                onClick={logout}
                className="btn btn-danger-outline"
              >
                <LogOut size={16} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="btn btn-primary">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
