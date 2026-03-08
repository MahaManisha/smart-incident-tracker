import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/common/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
import TeamModal from '../components/teams/TeamModal';
import { getAllTeams, deleteTeam } from '../api/teamsApi';
import { useAuth } from '../contexts/AuthContext';
import { formatDateTime } from '../utils/formatters';
import { toast } from 'react-toastify';
import { USER_ROLES } from '../utils/constants';
import './TeamsPage.css';

const TeamsPage = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const navigate = useNavigate();

  const { user } = useAuth();
  const isAdmin = user?.role === USER_ROLES.ADMIN;
  const isReporter = user?.role === USER_ROLES.REPORTER;

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const data = await getAllTeams();
      setTeams(data.teams || []);
    } catch (error) {
      toast.error(error.message || 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = () => {
    if (!isAdmin) {
      toast.error('Only administrators can create teams');
      return;
    }
    setEditingTeam(null);
    setShowModal(true);
  };

  const handleEditTeam = (team) => {
    if (!isAdmin) {
      toast.error('Only administrators can edit teams');
      return;
    }
    setEditingTeam(team);
    setShowModal(true);
  };

  const handleDeleteTeam = async (teamId) => {
    if (!isAdmin) {
      toast.error('Only administrators can delete teams');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this team?')) {
      return;
    }

    try {
      await deleteTeam(teamId);

      // Optimistically update UI
      setTeams((prevTeams) =>
        prevTeams.filter((team) => team._id !== teamId)
      );

      toast.success('Team deleted successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to delete team');
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingTeam(null);
  };

  const handleTeamSaved = () => {
    setShowModal(false);
    setEditingTeam(null);
    fetchTeams();
  };

  return (
    <Layout>
      <div className="teams-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Teams</h1>
            <p className="page-description">
              Manage teams and team members
            </p>
          </div>
          {isAdmin && (
            <Button variant="primary" onClick={handleCreateTeam}>
              ➕ Create Team
            </Button>
          )}
        </div>

        {loading ? (
          <LoadingSpinner text="Loading teams..." />
        ) : teams.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <p className="empty-state-title">No teams found</p>
            <p className="empty-state-description">
              {isAdmin
                ? 'Create your first team to get started'
                : 'No teams have been created yet'}
            </p>
            {isAdmin && (
              <Button variant="primary" onClick={handleCreateTeam}>
                Create Team
              </Button>
            )}
          </div>
        ) : (
          <div className="teams-grid">
            {teams.map((team) => (
              <div key={team._id} className="team-card">
                <div className="team-card-header">
                  <div className="team-icon">
                    {team.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="team-info">
                    <h3 className="team-name">{team.name}</h3>
                    <p className="team-description">
                      {team.description || 'No description'}
                    </p>
                  </div>
                </div>

                <div className="team-card-body">
                  <div className="team-stats">
                    <div className="team-stat">
                      <span className="team-stat-value">
                        {team.members?.length || 0}
                      </span>
                      <span className="team-stat-label">Members</span>
                    </div>
                    <div className="team-stat">
                      <span className="team-stat-value">
                        {team.lead ? (typeof team.lead === 'object' ? team.lead.name.split(' ')[0] : '1') : '-'}
                      </span>
                      <span className="team-stat-label">Lead</span>
                    </div>
                  </div>

                  {team.members && team.members.length > 0 && (
                    <div className="team-members-preview">
                      <div className="members-avatars">
                        {team.members.slice(0, 5).map((member, idx) => (
                          <div
                            key={member._id || idx}
                            className={`member-avatar-small ${team.lead && (member._id === team.lead._id || member._id === team.lead) ? 'is-lead' : ''
                              }`}
                            title={`${member.name} ${team.lead && (member._id === team.lead._id || member._id === team.lead) ? '(Lead)' : ''
                              }`}
                            style={{
                              backgroundColor: `hsl(${(idx * 137) % 360}, 70%, 50%)`, // Unique color per user roughly
                              marginLeft: idx === 0 ? 0 : '-10px'
                            }}
                          >
                            {member.name ? member.name.charAt(0).toUpperCase() : '?'}
                          </div>
                        ))}
                        {team.members.length > 5 && (
                          <div className="member-avatar-small more">
                            +{team.members.length - 5}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="team-meta">
                    <span className="team-created">
                      Created {formatDateTime(team.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="team-card-footer">
                  {!isReporter && (
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => navigate(`/teams/${team._id}/chat`)}
                    >
                      💬 Chat
                    </button>
                  )}

                  {isAdmin && (
                    <>
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => handleEditTeam(team)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDeleteTeam(team._id)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <TeamModal
            team={editingTeam}
            isOpen={showModal}
            onClose={handleModalClose}
            onSuccess={handleTeamSaved}
          />
        )}
      </div>
    </Layout>
  );
};

export default TeamsPage;