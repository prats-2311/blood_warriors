import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStatus, useLogout } from '../hooks/useAuth';
import Button, { HeartIcon, BellIcon } from './ui/Button';
import './Navigation.css';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const { user } = useAuthStatus();

  // Get profile from auth context - will need to be fetched separately
  const userProfile = user; // For now, use user data directly
  const { handleLogout, isLoading: logoutLoading } = useLogout();
  const location = useLocation();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const onLogout = async () => {
    await handleLogout('/');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Mock notifications - replace with real data
  useEffect(() => {
    setNotifications([
      {
        id: 1,
        type: 'request',
        title: 'New Blood Request',
        message: 'Emergency request for O+ blood nearby',
        time: '2 min ago',
        unread: true
      },
      {
        id: 2,
        type: 'donation',
        title: 'Donation Confirmed',
        message: 'Your donation has been confirmed for tomorrow',
        time: '1 hour ago',
        unread: true
      },
      {
        id: 3,
        type: 'reminder',
        title: 'Health Checkup',
        message: 'Time for your monthly health checkup',
        time: '2 hours ago',
        unread: false
      }
    ]);
  }, []);

  const unreadCount = notifications.filter(n => n.unread).length;

  if (!user) {
    return (
      <nav className="navbar navbar--public">
        <div className="navbar__container">
          <Link to="/" className="navbar__brand">
            <div className="navbar__logo">
              <HeartIcon />
            </div>
            <span className="navbar__title">Blood Warriors</span>
          </Link>

          <div className="navbar__actions">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="primary" size="sm">
                Join Now
              </Button>
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <>
      <nav className="navbar navbar--authenticated">
        <div className="navbar__container">
          {/* Brand */}
          <Link to="/app/dashboard" className="navbar__brand">
            <div className="navbar__logo">
              <HeartIcon />
            </div>
            <span className="navbar__title">Blood Warriors</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="navbar__nav">
            <Link 
              to="/app/dashboard" 
              className={`navbar__link ${isActive('/app/dashboard') ? 'navbar__link--active' : ''}`}
            >
              <DashboardIcon />
              <span>Dashboard</span>
            </Link>
            
            <Link 
              to="/app/requests" 
              className={`navbar__link ${isActive('/app/requests') ? 'navbar__link--active' : ''}`}
            >
              <RequestIcon />
              <span>Requests</span>
            </Link>
            
            <Link 
              to="/app/donors" 
              className={`navbar__link ${isActive('/app/donors') ? 'navbar__link--active' : ''}`}
            >
              <DonorIcon />
              <span>Donors</span>
            </Link>
            
            <Link 
              to="/app/profile" 
              className={`navbar__link ${isActive('/app/profile') ? 'navbar__link--active' : ''}`}
            >
              <ProfileIcon />
              <span>Profile</span>
            </Link>
          </div>

          {/* Actions */}
          <div className="navbar__actions">
            {/* Emergency SOS Button */}
            <Link to="/app/sos">
              <Button variant="sos" size="sm" icon={<HeartIcon />}>
                SOS
              </Button>
            </Link>

            {/* Notifications */}
            <div className="navbar__notifications">
              <button 
                className="navbar__notification-btn"
                onClick={toggleNotifications}
              >
                <BellIcon />
                {unreadCount > 0 && (
                  <span className="navbar__notification-badge">{unreadCount}</span>
                )}
              </button>

              {showNotifications && (
                <div className="navbar__notification-dropdown">
                  <div className="notification-dropdown__header">
                    <h3>Notifications</h3>
                    <button className="notification-dropdown__close" onClick={toggleNotifications}>
                      ×
                    </button>
                  </div>
                  
                  <div className="notification-dropdown__list">
                    {notifications.length > 0 ? (
                      notifications.map(notification => (
                        <div 
                          key={notification.id} 
                          className={`notification-item ${notification.unread ? 'notification-item--unread' : ''}`}
                        >
                          <div className="notification-item__icon">
                            {notification.type === 'request' && '🩸'}
                            {notification.type === 'donation' && '✅'}
                            {notification.type === 'reminder' && '⏰'}
                          </div>
                          <div className="notification-item__content">
                            <h4 className="notification-item__title">{notification.title}</h4>
                            <p className="notification-item__message">{notification.message}</p>
                            <span className="notification-item__time">{notification.time}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="notification-dropdown__empty">
                        <p>No notifications</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="notification-dropdown__footer">
                    <Link to="/app/notifications" onClick={toggleNotifications}>
                      View All Notifications
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="navbar__user">
              <button className="navbar__user-btn" onClick={toggleMenu}>
                <div className="navbar__avatar">
                  {userProfile?.name?.charAt(0) || user.email.charAt(0)}
                </div>
                <span className="navbar__user-name">
                  {userProfile?.name || user.email.split('@')[0]}
                </span>
                <ChevronDownIcon />
              </button>

              {isMenuOpen && (
                <div className="navbar__user-dropdown">
                  <div className="user-dropdown__header">
                    <div className="user-dropdown__avatar">
                      {userProfile?.name?.charAt(0) || user.email.charAt(0)}
                    </div>
                    <div className="user-dropdown__info">
                      <h4>{userProfile?.name || 'User'}</h4>
                      <p>{user.email}</p>
                      {userProfile?.blood_group && (
                        <span className="user-dropdown__blood-group">
                          {userProfile.blood_group}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="user-dropdown__menu">
                    <Link to="/app/profile" className="user-dropdown__item" onClick={toggleMenu}>
                      <ProfileIcon />
                      <span>My Profile</span>
                    </Link>
                    <Link to="/app/settings" className="user-dropdown__item" onClick={toggleMenu}>
                      <SettingsIcon />
                      <span>Settings</span>
                    </Link>
                    <Link to="/app/help" className="user-dropdown__item" onClick={toggleMenu}>
                      <HelpIcon />
                      <span>Help & Support</span>
                    </Link>
                    <hr className="user-dropdown__divider" />
                    <button
                      className="user-dropdown__item user-dropdown__item--danger"
                      onClick={onLogout}
                      disabled={logoutLoading}
                    >
                      <LogoutIcon />
                      <span>{logoutLoading ? 'Signing Out...' : 'Sign Out'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button className="navbar__mobile-toggle" onClick={toggleMenu}>
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className={`navbar__mobile ${isMenuOpen ? 'navbar__mobile--open' : ''}`}>
          <div className="navbar__mobile-nav">
            <Link 
              to="/app/dashboard" 
              className={`navbar__mobile-link ${isActive('/app/dashboard') ? 'navbar__mobile-link--active' : ''}`}
              onClick={toggleMenu}
            >
              <DashboardIcon />
              <span>Dashboard</span>
            </Link>
            
            <Link 
              to="/app/requests" 
              className={`navbar__mobile-link ${isActive('/app/requests') ? 'navbar__mobile-link--active' : ''}`}
              onClick={toggleMenu}
            >
              <RequestIcon />
              <span>Requests</span>
            </Link>
            
            <Link 
              to="/app/donors" 
              className={`navbar__mobile-link ${isActive('/app/donors') ? 'navbar__mobile-link--active' : ''}`}
              onClick={toggleMenu}
            >
              <DonorIcon />
              <span>Donors</span>
            </Link>
            
            <Link 
              to="/app/profile" 
              className={`navbar__mobile-link ${isActive('/app/profile') ? 'navbar__mobile-link--active' : ''}`}
              onClick={toggleMenu}
            >
              <ProfileIcon />
              <span>Profile</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Overlay */}
      {(isMenuOpen || showNotifications) && (
        <div 
          className="navbar__overlay" 
          onClick={() => {
            setIsMenuOpen(false);
            setShowNotifications(false);
          }}
        />
      )}
    </>
  );
};

// Icon Components
const DashboardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
  </svg>
);

const RequestIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);

const DonorIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 7H16c-.8 0-1.54.37-2 1l-3 4v6h2v7h3v-7h4z"/>
  </svg>
);

const ProfileIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
  </svg>
);

const HelpIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
  </svg>
);

const LogoutIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
  </svg>
);

export default Navigation;