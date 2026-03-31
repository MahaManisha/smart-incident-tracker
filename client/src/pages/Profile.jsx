import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axiosInstance from '../api/axiosConfig';
import ChangePasswordModal from '../components/users/ChangePasswordModal';
import EditProfileModal from '../components/users/EditProfileModal';
import { FaLock, FaPen, FaUser, FaArrowLeft } from 'react-icons/fa';
import './Profile.css';

const Profile = () => {
  const { user: authUser, updateUser: updateAuthUser } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axiosInstance.get('/auth/me');
      setUser(res.user);

      // Sync global auth state (Navbar, Sidebar, etc.)
      updateAuthUser(res.user);
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

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChangePasswordClick = () => {
    setIsChangePasswordModalOpen(true);
  };

  const handleEditProfileClick = () => {
    setIsEditProfileModalOpen(true);
  };

  const handleProfileUpdateSuccess = () => {
    fetchProfile(); // Reload data to show updates
  };

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
      <div className="profile-container">
        {/* Page Header */}
        <div className="page-header-row">
          <div className="header-titles">
            <h1 className="page-heading">Profile & Account</h1>
            <p className="page-subheading">Manage your personal information and security settings</p>
          </div>
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
              <FaArrowLeft className="btn-icon" /> Back to Dashboard
            </button>
            <button className="btn btn-secondary" onClick={handleChangePasswordClick}>
              <FaLock className="btn-icon" /> Change Password
            </button>
            <button className="btn btn-primary" onClick={handleEditProfileClick}>
              <FaPen className="btn-icon" /> Edit Profile
            </button>
          </div>
        </div>

        {/* Identity Card - The "Badge" of the user */}
        <section className="profile-section identity-card">
          <div className="identity-left">
            <div className="avatar-container">
              {user?.profileImage ? (
                <img
                  src={`/${user.profileImage}`}
                  alt={user.name}
                  className="avatar-image"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className="avatar-placeholder" style={{ display: user?.profileImage ? 'none' : 'flex' }}>
                <span className="initials">{user?.name?.charAt(0) || 'U'}</span>
              </div>
              <div className="status-indicator active" title="Account Active"></div>
            </div>

            <div className="identity-details">
              <h2 className="user-fullname">{user?.name}</h2>
              <div className="user-badges">
                <span className={`role-badge role-${user?.role?.toLowerCase()}`}>
                  {user?.role}
                </span>
                <span className="user-email-text">{user?.email}</span>
              </div>
            </div>
          </div>

          <div className="identity-right">
            {/* ID or other quick stats could go here */}
            <div className="account-id">
              <span className="label">User ID</span>
              <span className="value">{user?._id?.substring(0, 8) || '---'}</span>
            </div>
          </div>
        </section>

        {/* Information Grid */}
        <div className="profile-grid">
          {/* Left Column: Personal Info */}
          <section className="profile-section info-card">
            <h3 className="card-title">Personal Information</h3>
            <div className="detail-list">
              <div className="detail-row">
                <span className="detail-label"><FaUser className="detail-icon" /> Full Name</span>
                <span className="detail-value">{user?.name}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Email Address</span>
                <span className="detail-value">{user?.email}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Phone</span>
                <span className="detail-value">{user?.phoneNumber || 'Not provided'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Department</span>
                <span className="detail-value">{user?.department || 'General'}</span>
              </div>
            </div>
          </section>

          {/* Right Column: Account Metadata */}
          <section className="profile-section info-card">
            <h3 className="card-title">Account Metadata</h3>
            <div className="detail-list">
              <div className="detail-row">
                <span className="detail-label">Account Status</span>
                <span className="status-pill active">Active</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Member Since</span>
                <span className="detail-value">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'N/A'}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Last Login</span>
                <span className="detail-value text-muted">Just now</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Role Permissions</span>
                <span className="detail-value">
                  {user?.role === 'ADMIN' ? 'Full Access' :
                    user?.role === 'RESPONDER' ? 'Manage Incidents' : 'Report Incidents'}
                </span>
              </div>
            </div>
          </section>
        </div>

      </div>

      {/* Modals */}
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
        onSuccess={() => console.log("Password changed")}
      />

      <EditProfileModal
        user={user}
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        onSuccess={handleProfileUpdateSuccess}
      />
    </div>
  );
};

export default Profile;