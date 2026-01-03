import { useState, useEffect } from 'react';
import Layout from '../components/common/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
import UserModal from '../components/users/UserModal';
import { getAllUsers, deleteUser } from '../api/userApi';
import { formatDateTime, formatRole } from '../utils/formatters';
import { toast } from 'react-toastify';
import './UsersPage.css';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getAllUsers();
      setUsers(data.users || []);
    } catch (error) {
      toast.error(error.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setShowModal(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowModal(true);
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      await deleteUser(userId);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      toast.error(error.message || 'Failed to delete user');
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingUser(null);
  };

  const handleUserSaved = () => {
    setShowModal(false);
    setEditingUser(null);
    fetchUsers();
  };

  return (
    <Layout>
      <div className="users-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Users</h1>
            <p className="page-description">Manage system users and permissions</p>
          </div>
          <Button variant="primary" onClick={handleCreateUser}>
            ➕ Add User
          </Button>
        </div>

        {loading ? (
          <LoadingSpinner text="Loading users..." />
        ) : users.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <p className="empty-state-title">No users found</p>
            <p className="empty-state-description">
              Create your first user to get started
            </p>
            <Button variant="primary" onClick={handleCreateUser}>
              Add User
            </Button>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar-small">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="user-name">{user.name}</span>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className="badge badge-primary">
                        {formatRole(user.role)}
                      </span>
                    </td>
                    <td>{formatDateTime(user.createdAt)}</td>
                    <td>
                      <div className="action-buttons-inline">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleEditUser(user)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDeleteUser(user._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showModal && (
          <UserModal
            user={editingUser}
            isOpen={showModal}
            onClose={handleModalClose}
            onSuccess={handleUserSaved}
          />
        )}
      </div>
    </Layout>
  );
};

export default UsersPage;