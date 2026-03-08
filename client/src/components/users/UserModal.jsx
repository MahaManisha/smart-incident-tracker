import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { createUser, updateUser } from '../../api/userApi';
import { validateUserForm } from '../../utils/validators';
import { USER_ROLES } from '../../utils/constants';
import { toast } from 'react-toastify';

const UserModal = ({ user, isOpen, onClose, onSuccess }) => {
  const isEditMode = Boolean(user);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'REPORTER',
    phoneNumber: '', // Explicitly initialize
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Populate form in edit mode
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '',
        role: user.role || 'REPORTER',
        // Ensure we strictly get the phone number.
        // Defensive check: if DB has corrupted data (email in phone field), ignore it.
        phoneNumber: (user.phoneNumber && !user.phoneNumber.includes('@'))
          ? String(user.phoneNumber)
          : '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
        // 🔥 Only send fields that are allowed to change
        const updateData = {
          name: formData.name,
          role: formData.role,
          phoneNumber: formData.phoneNumber,
        };

        if (formData.password) {
          updateData.password = formData.password;
        }

        await updateUser(user._id, updateData);
        toast.success('User updated successfully');
      } else {
        await createUser(formData);
        toast.success('User created successfully');
      }

      onSuccess();
      onClose();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || 'Failed to save user'
      );
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
      <form onSubmit={handleSubmit} autoComplete="off">
        {/* NAME */}
        <div className="form-group">
          <label className="form-label required">Name</label>
          <input
            type="text"
            name="name"
            className={`form-input ${errors.name ? 'error' : ''}`}
            value={formData.name}
            onChange={handleChange}
            disabled={loading}
            placeholder="Enter full name"
            autoComplete="off"
          />
          {errors.name && <span className="form-error">{errors.name}</span>}
        </div>

        {/* EMAIL */}
        <div className="form-group">
          <label className="form-label required">Email</label>
          <input
            type="email"
            name="email"
            className="form-input"
            value={formData.email}
            disabled={isEditMode} // 🔒 locked in edit mode
            onChange={!isEditMode ? handleChange : undefined}
            placeholder="Enter email address"
            autoComplete="off"
          />
          {errors.email && <span className="form-error">{errors.email}</span>}
        </div>

        {/* PHONE NUMBER */}
        <div className="form-group">
          <label className="form-label">Phone Number</label>
          <input
            type="tel"
            name="phoneNumber"
            className={`form-input ${errors.phoneNumber ? 'error' : ''}`}
            value={formData.phoneNumber || ''}
            onChange={handleChange}
            disabled={loading}
            placeholder="Enter phone number"
            autoComplete="off"
          />
          {errors.phoneNumber && (
            <span className="form-error">{errors.phoneNumber}</span>
          )}
        </div>

        {/* PASSWORD */}
        <div className="form-group">
          <label className="form-label">
            Password {isEditMode && '(optional)'}
          </label>
          <input
            type="password"
            name="password"
            className={`form-input ${errors.password ? 'error' : ''}`}
            value={formData.password}
            onChange={handleChange}
            disabled={loading}
            placeholder={
              isEditMode
                ? 'Leave blank to keep current password'
                : 'Create password'
            }
            autoComplete="new-password"
          />
          {errors.password && (
            <span className="form-error">{errors.password}</span>
          )}
        </div>

        {/* ROLE */}
        <div className="form-group">
          <label className="form-label required">Role</label>
          <select
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
