import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { createTeam, updateTeam } from '../../api/teamsApi';
import { getAllUsers } from '../../api/userApi';
import { toast } from 'react-toastify';
import './TeamModal.css';

const TeamModal = ({ team, isOpen, onClose, onSuccess }) => {
  const isEditMode = Boolean(team);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    leadId: '',
    memberIds: [],
  });

  const [availableUsers, setAvailableUsers] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Fetch available users
  useEffect(() => {
    fetchUsers();
  }, []);

  // Populate form in edit mode
  useEffect(() => {
    if (team) {
      setFormData({
        name: team.name || '',
        description: team.description || '',
        leadId: team.lead?._id || '',
        memberIds: team.members?.map((m) => m._id) || [],
      });
    }
  }, [team]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const data = await getAllUsers();
      setAvailableUsers(data.users || []);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

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

  const handleMemberToggle = (userId) => {
    setFormData((prev) => {
      const isSelected = prev.memberIds.includes(userId);
      return {
        ...prev,
        memberIds: isSelected
          ? prev.memberIds.filter((id) => id !== userId)
          : [...prev.memberIds, userId],
      };
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Team name is required';
    }

    if (formData.memberIds.length === 0) {
      newErrors.members = 'At least one team member is required';
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

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        lead: formData.leadId || null,
        members: formData.memberIds,
      };

      if (isEditMode) {
        await updateTeam(team._id, payload);
        toast.success('Team updated successfully');
      } else {
        await createTeam(payload);
        toast.success('Team created successfully');
      }

      onSuccess();
      onClose();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || 'Failed to save team'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Team' : 'Create New Team'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={loading}
            disabled={loading || loadingUsers}
          >
            {isEditMode ? 'Update' : 'Create'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="team-modal-form">
        {/* TEAM NAME */}
        <div className="form-group">
          <label className="form-label required">Team Name</label>
          <input
            type="text"
            name="name"
            className={`form-input ${errors.name ? 'error' : ''}`}
            value={formData.name}
            onChange={handleChange}
            disabled={loading}
            placeholder="e.g., Backend Team"
          />
          {errors.name && <span className="form-error">{errors.name}</span>}
        </div>

        {/* DESCRIPTION */}
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            name="description"
            className="form-textarea"
            value={formData.description}
            onChange={handleChange}
            disabled={loading}
            rows="3"
            placeholder="Brief description of the team's purpose"
          />
        </div>

        {/* TEAM LEAD */}
        <div className="form-group">
          <label className="form-label">Team Lead (Optional)</label>
          <select
            name="leadId"
            className="form-select"
            value={formData.leadId}
            onChange={handleChange}
            disabled={loading || loadingUsers}
          >
            <option value="">-- Select Team Lead --</option>
            {availableUsers
              .filter((u) => u.role === 'ADMIN' || u.role === 'RESPONDER')
              .map((user) => (
                <option key={user._id} value={user._id}>
                  {user.name} ({user.role})
                </option>
              ))}
          </select>
        </div>

        {/* TEAM MEMBERS */}
        <div className="form-group">
          <label className="form-label required">Team Members</label>
          {loadingUsers ? (
            <div className="loading-users">Loading users...</div>
          ) : (
            <div className="members-list">
              {availableUsers.length === 0 ? (
                <p className="no-users">No users available</p>
              ) : (
                availableUsers
                  .filter((u) => u.role === 'ADMIN' || u.role === 'RESPONDER')
                  .filter((u) => u._id !== formData.leadId)
                  .map((user) => (
                    <label key={user._id} className="member-checkbox">
                      <input
                        type="checkbox"
                        checked={formData.memberIds.includes(user._id)}
                        onChange={() => handleMemberToggle(user._id)}
                        disabled={loading}
                      />
                      <div className="member-info">
                        <div className="member-avatar">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="member-details">
                          <span className="member-name">{user.name}</span>
                          <span className="member-role">{user.role}</span>
                        </div>
                      </div>
                    </label>
                  ))
              )}
            </div>
          )}
          {errors.members && (
            <span className="form-error">{errors.members}</span>
          )}
        </div>

        <div className="members-count">
          {formData.memberIds.length} member(s) selected
        </div>
      </form>
    </Modal>
  );
};

export default TeamModal;