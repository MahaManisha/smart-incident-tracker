import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { updateUserProfile } from '../../api/userApi';
import { toast } from 'react-toastify';
import { FaUser } from 'react-icons/fa';

const EditProfileModal = ({ user, isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        // Avatar file placeholder
        avatar: null
    });

    const [previewUrl, setPreviewUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (user && isOpen) {
            setFormData({
                name: user.name || '',
                avatar: null
            });
            setPreviewUrl(null); // Reset preview
            setError(null);
        }
    }, [user, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({ ...prev, avatar: file }));
            // Create local preview
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Prepare Update Data using FormData
            const payload = new FormData();
            if (formData.name) payload.append('name', formData.name);
            if (formData.avatar) payload.append('profileImage', formData.avatar);

            await updateUserProfile(payload);

            toast.success('Profile updated successfully');
            onSuccess(); // Triggers parent refresh
            onClose();
        } catch (err) {
            console.error('Update profile error:', err);
            setError(err?.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Edit Profile"
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
                        Save Changes
                    </Button>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="edit-profile-form">
                {/* Avatar Section */}
                <div className="form-group avatar-upload-section">
                    <label className="form-label">Profile Picture</label>
                    <div className="avatar-preview-wrapper">
                        <div className="avatar-preview">
                            {previewUrl ? (
                                <img src={previewUrl} alt="Preview" />
                            ) : (
                                <div className="avatar-placeholder">
                                    <FaUser style={{ fontSize: '32px' }} />
                                </div>
                            )}
                        </div>
                        <div className="file-input-wrapper">
                            <label htmlFor="avatar-upload" className="upload-link">
                                Change Photo
                            </label>
                            <input
                                id="avatar-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                hidden
                            />
                            <span className="helper-text">JPG, PNG up to 2MB</span>
                        </div>
                    </div>
                </div>

                {/* Name Field (Editable) */}
                <div className="form-group">
                    <label className="form-label required">Full Name</label>
                    <input
                        type="text"
                        name="name"
                        className="form-input"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="John Doe"
                        disabled={loading}
                    />
                </div>

                {/* Read-Only Fields */}
                <div className="form-row">
                    <div className="form-group half-width">
                        <label className="form-label">Email</label>
                        <input
                            type="text"
                            value={user?.email || ''}
                            className="form-input read-only"
                            readOnly
                            disabled
                        />
                    </div>
                    <div className="form-group half-width">
                        <label className="form-label">Role</label>
                        <div className="role-badge-input">
                            {user?.role}
                        </div>
                    </div>
                </div>

                {error && <div className="form-error-banner">{error}</div>}
            </form>

            <style jsx>{`
        .avatar-upload-section {
          margin-bottom: 24px;
        }
        .avatar-preview-wrapper {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .avatar-preview {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          overflow: hidden;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #e2e8f0;
        }
        .avatar-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .avatar-placeholder {
          font-size: 24px;
          font-weight: 600;
          color: #64748b;
          display: flex; /* Added display flex to center icon */
          align-items: center;
          justify-content: center;
        }
        .file-input-wrapper {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .upload-link {
          color: #4f46e5;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
        }
        .upload-link:hover {
          text-decoration: underline;
        }
        .helper-text {
          font-size: 12px;
          color: #94a3b8;
        }
        .form-row {
          display: flex;
          gap: 16px;
        }
        .half-width {
          flex: 1;
        }
        .read-only {
          background-color: #f8fafc;
          color: #64748b;
          border-color: #e2e8f0;
          cursor: not-allowed;
        }
        .role-badge-input {
          display: inline-flex;
          align-items: center;
          padding: 8px 12px;
          background: #f1f5f9;
          color: #475569;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          border: 1px solid #e2e8f0;
          width: 100%;
          height: 42px; /* Match input height */
        }
        .form-error-banner {
          margin-top: 16px;
          padding: 10px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #ef4444;
          border-radius: 6px;
          font-size: 13px;
        }
      `}</style>
        </Modal>
    );
};

export default EditProfileModal;
