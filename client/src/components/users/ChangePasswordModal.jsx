import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { changePassword } from '../../api/userApi';
import { toast } from 'react-toastify';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const ChangePasswordModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Current password validation
    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    // New password validation
    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Check if new password is same as current
    if (formData.currentPassword && formData.newPassword &&
      formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      await changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      toast.success('Password changed successfully');

      // Reset form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (error) {
      const errorMessage = error?.response?.data?.message || 'Failed to change password';
      toast.error(errorMessage);

      // If current password is incorrect, highlight that field
      if (errorMessage.toLowerCase().includes('current password')) {
        setErrors({ currentPassword: errorMessage });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setErrors({});
    setShowPasswords({
      current: false,
      new: false,
      confirm: false,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Change Password"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={loading}
            disabled={loading}
          >
            Change Password
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        {/* CURRENT PASSWORD */}
        <div className="form-group">
          <label className="form-label required">Current Password</label>
          <div className="password-input-wrapper">
            <input
              type={showPasswords.current ? 'text' : 'password'}
              name="currentPassword"
              className={`form-input ${errors.currentPassword ? 'error' : ''}`}
              value={formData.currentPassword}
              onChange={handleChange}
              disabled={loading}
              placeholder="Enter current password"
              autoComplete="current-password"
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => togglePasswordVisibility('current')}
              tabIndex={-1}
            >
              {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {errors.currentPassword && (
            <span className="form-error">{errors.currentPassword}</span>
          )}
        </div>

        {/* NEW PASSWORD */}
        <div className="form-group">
          <label className="form-label required">New Password</label>
          <div className="password-input-wrapper">
            <input
              type={showPasswords.new ? 'text' : 'password'}
              name="newPassword"
              className={`form-input ${errors.newPassword ? 'error' : ''}`}
              value={formData.newPassword}
              onChange={handleChange}
              disabled={loading}
              placeholder="Enter new password (min. 8 characters)"
              autoComplete="new-password"
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => togglePasswordVisibility('new')}
              tabIndex={-1}
            >
              {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {errors.newPassword && (
            <span className="form-error">{errors.newPassword}</span>
          )}
        </div>

        {/* CONFIRM PASSWORD */}
        <div className="form-group">
          <label className="form-label required">Confirm New Password</label>
          <div className="password-input-wrapper">
            <input
              type={showPasswords.confirm ? 'text' : 'password'}
              name="confirmPassword"
              className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={loading}
              placeholder="Confirm new password"
              autoComplete="new-password"
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => togglePasswordVisibility('confirm')}
              tabIndex={-1}
            >
              {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {errors.confirmPassword && (
            <span className="form-error">{errors.confirmPassword}</span>
          )}
        </div>

        <div className="password-requirements">
          <p className="requirements-title">Password Requirements:</p>
          <ul className="requirements-list">
            <li className={formData.newPassword.length >= 8 ? 'valid' : ''}>
              At least 8 characters long
            </li>
            <li className={formData.newPassword && formData.newPassword !== formData.currentPassword ? 'valid' : ''}>
              Different from current password
            </li>
            <li className={formData.newPassword && formData.confirmPassword && formData.newPassword === formData.confirmPassword ? 'valid' : ''}>
              Passwords match
            </li>
          </ul>
        </div>
      </form>
    </Modal>
  );
};

export default ChangePasswordModal;