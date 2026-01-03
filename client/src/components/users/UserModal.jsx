import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { createUser, updateUser } from '../../api/userApi';
import { validateUserForm } from '../../utils/validators';
import { USER_ROLES } from '../../utils/constants';
import { toast } from 'react-toastify';

const UserModal = ({ user, isOpen, onClose, onSuccess }) => {
  const isEditMode = !!user;
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'REPORTER',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '',
        role: user.role || 'REPORTER',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const { isValid, errors: validationErrors } = validateUserForm(
      formData,
      isEditMode
    );
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    try {
      setLoading(true);
      if (isEditMode) {
        // Don't send password if it's empty in edit mode
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password;
        }
        await updateUser(user._id, updateData);
        toast.success('User updated successfully');
      } else {
        await createUser(formData);
        toast.success('User created successfully');
      }
      onSuccess();
    } catch (error) {
      toast.error(error.message || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit User' : 'Create New User'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={loading}
            disabled={loading}
          >
            {isEditMode ? 'Update' : 'Create'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name" className="form-label required">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            className={`form-input ${errors.name ? 'error' : ''}`}
            placeholder="Enter full name"
            value={formData.name}
            onChange={handleChange}
            disabled={loading}
          />
          {errors.name && <span className="form-error">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="email" className="form-label required">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            className={`form-input ${errors.email ? 'error' : ''}`}
            placeholder="Enter email address"
            value={formData.email}
            onChange={handleChange}
            disabled={loading}
          />
          {errors.email && <span className="form-error">{errors.email}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="password" className="form-label required">
            Password {isEditMode && '(leave blank to keep current)'}
          </label>
          <input
            type="password"
            id="password"
            name="password"
            className={`form-input ${errors.password ? 'error' : ''}`}
            placeholder={
              isEditMode ? 'Enter new password (optional)' : 'Enter password'
            }
            value={formData.password}
            onChange={handleChange}
            disabled={loading}
          />
          {errors.password && (
            <span className="form-error">{errors.password}</span>
          )}
          {!isEditMode && (
            <span className="form-help">
              Password must be at least 8 characters with uppercase, lowercase,
              and number
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="role" className="form-label required">
            Role
          </label>
          <select
            id="role"
            name="role"
            className={`form-select ${errors.role ? 'error' : ''}`}
            value={formData.role}
            onChange={handleChange}
            disabled={loading}
          >
            {Object.values(USER_ROLES).map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          {errors.role && <span className="form-error">{errors.role}</span>}
        </div>
      </form>
    </Modal>
  );
};

export default UserModal;