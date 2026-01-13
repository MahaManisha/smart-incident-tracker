import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axiosInstance from '../api/axiosConfig';
import './Profile.css';

const Profile = () => {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axiosInstance.get('/auth/me');
        setUser(res.data.data);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile. Please try again.');
        if (authUser) {
          setUser(authUser);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [authUser]);

  if (loading) {
    return (
      <div className="profile-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="profile-page">
        <div className="error-container">
          <p className="error-message">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1 className="profile-title">My Profile</h1>
        <p className="profile-subtitle">Manage your account information</p>
      </div>

      <div className="profile-content">
        <div className="profile-main-card">
          <div className="profile-banner">
            <div className="banner-gradient"></div>
          </div>

          <div className="profile-info-section">
            <div className="profile-avatar-section">
              <div className="avatar-large">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="avatar-info">
                <h2 className="user-display-name">{user?.name}</h2>
                <span className="user-role-badge">{user?.role}</span>
              </div>
            </div>

            <div className="profile-details-grid">
              <div className="detail-card">
                <div className="detail-icon">📧</div>
                <div className="detail-content">
                  <label className="detail-label">Email Address</label>
                  <p className="detail-value">{user?.email}</p>
                </div>
              </div>

              <div className="detail-card">
                <div className="detail-icon">👤</div>
                <div className="detail-content">
                  <label className="detail-label">Full Name</label>
                  <p className="detail-value">{user?.name}</p>
                </div>
              </div>

              <div className="detail-card">
                <div className="detail-icon">🛡️</div>
                <div className="detail-content">
                  <label className="detail-label">Role</label>
                  <p className="detail-value role-text">{user?.role}</p>
                </div>
              </div>

              {user?.createdAt && (
                <div className="detail-card">
                  <div className="detail-icon">📅</div>
                  <div className="detail-content">
                    <label className="detail-label">Member Since</label>
                    <p className="detail-value">
                      {new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="profile-sidebar">
          <div className="sidebar-card">
            <h3 className="sidebar-card-title">Account Stats</h3>
            <div className="stats-list">
              <div className="stat-item">
                <span className="stat-label">Account Status</span>
                <span className="stat-value status-active">Active</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Access Level</span>
                <span className="stat-value">{user?.role}</span>
              </div>
            </div>
          </div>

          <div className="sidebar-card">
            <h3 className="sidebar-card-title">Quick Actions</h3>
            <div className="action-buttons">
              <button className="action-btn secondary">
                <span>⚙️</span>
                Edit Profile
              </button>
              <button className="action-btn secondary">
                <span>🔒</span>
                Change Password
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
