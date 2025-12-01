import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

const Navigation = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { getCartItemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;
  const cartCount = getCartItemCount();

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        <Link to="/" style={styles.logo}>
          <span style={styles.logoIcon}>🌮</span>
          Ricos Tacos
        </Link>

        <div style={styles.menu}>
          <Link
            to="/menu"
            style={{
              ...styles.menuItem,
              ...(isActive('/menu') && styles.menuItemActive)
            }}
          >
            Menu
          </Link>
          <Link
            to="/location"
            style={{
              ...styles.menuItem,
              ...(isActive('/location') && styles.menuItemActive)
            }}
          >
            Location
          </Link>

          {/* Role-based navigation */}
          {isAuthenticated && user?.role === 'ADMIN' && (
            <Link
              to="/admin"
              style={{
                ...styles.menuItem,
                ...(isActive('/admin') && styles.menuItemActive)
              }}
            >
              Admin
            </Link>
          )}
          {isAuthenticated && (user?.role === 'KITCHEN' || user?.role === 'ADMIN') && (
            <Link
              to="/kitchen"
              style={{
                ...styles.menuItem,
                ...(isActive('/kitchen') && styles.menuItemActive)
              }}
            >
              Kitchen
            </Link>
          )}
          {isAuthenticated && !user?.role && (
            <Link
              to="/dashboard"
              style={{
                ...styles.menuItem,
                ...(isActive('/dashboard') && styles.menuItemActive)
              }}
            >
              Dashboard
            </Link>
          )}
        </div>

        <div style={styles.userSection}>
          {cartCount > 0 && (
            <Link to="/cart" style={styles.cartButton}>
              🛒 Cart ({cartCount})
            </Link>
          )}

          {isAuthenticated ? (
            <>
              <div style={styles.userInfo}>
                <img
                  src={user?.picture || 'https://via.placeholder.com/40'}
                  alt="Profile"
                  style={styles.avatar}
                />
                <span style={styles.userName}>{user?.name}</span>
              </div>
              <button onClick={handleLogout} style={styles.logoutButton}>
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" style={styles.loginButton}>
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(0,0,0,0.05)',
    boxShadow: 'var(--shadow-sm)',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    transition: 'all 0.3s ease'
  },
  container: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '1rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  logo: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.5rem',
    fontWeight: '700',
    color: 'var(--color-primary)',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    letterSpacing: '-0.02em'
  },
  logoIcon: {
    fontSize: '1.75rem'
  },
  menu: {
    display: 'flex',
    gap: '2rem'
  },
  menuItem: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.95rem',
    fontWeight: '500',
    color: 'var(--color-text-main)',
    textDecoration: 'none',
    padding: '0.5rem 1rem',
    borderRadius: 'var(--radius-full)',
    transition: 'all 0.2s ease'
  },
  menuItemActive: {
    color: 'var(--color-primary)',
    background: 'rgba(230, 81, 0, 0.08)',
    fontWeight: '600'
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid var(--color-primary)'
  },
  userName: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: 'var(--color-secondary)'
  },
  logoutButton: {
    padding: '0.5rem 1.25rem',
    fontSize: '0.9rem',
    fontWeight: '600',
    color: 'var(--color-text-muted)',
    background: 'transparent',
    border: '1px solid rgba(0,0,0,0.1)',
    borderRadius: 'var(--radius-full)',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  cartButton: {
    padding: '0.6rem 1.25rem',
    fontSize: '0.9rem',
    fontWeight: '600',
    color: 'white',
    background: 'var(--color-secondary)',
    textDecoration: 'none',
    borderRadius: 'var(--radius-full)',
    transition: 'all 0.2s',
    boxShadow: 'var(--shadow-sm)'
  },
  loginButton: {
    padding: '0.6rem 1.5rem',
    fontSize: '0.9rem',
    fontWeight: '600',
    color: 'white',
    background: 'var(--color-primary)',
    textDecoration: 'none',
    borderRadius: 'var(--radius-full)',
    transition: 'all 0.2s',
    boxShadow: 'var(--shadow-md)'
  }
};

export default Navigation;
