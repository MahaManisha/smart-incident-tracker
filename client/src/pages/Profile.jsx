import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axiosInstance from '../api/axiosConfig';
import ChangePasswordModal from '../components/users/ChangePasswordModal';
import EditProfileModal from '../components/users/EditProfileModal';
import {
  FaLock, FaPen, FaUser, FaArrowLeft, FaEnvelope,
  FaPhone, FaBuilding, FaCalendarAlt, FaShieldAlt, FaClock,
  FaIdBadge, FaBell, FaCheckCircle, FaExclamationTriangle,
  FaFingerprint, FaUserCog, FaLayerGroup
} from 'react-icons/fa';
import { FiActivity, FiEdit3, FiKey, FiChevronRight } from 'react-icons/fi';
import { MdOutlineAdminPanelSettings, MdVerified } from 'react-icons/md';
import './Profile.css';

// ── Role config ─────────────────────────────────────────────────
const ROLE_CONFIG = {
  ADMIN:     { color: '#ff007f', glow: 'rgba(255,0,127,0.4)',  gradient: 'linear-gradient(135deg,#ff007f,#c2006a)', icon: <MdOutlineAdminPanelSettings />, label: 'Site Administrator' },
  RESPONDER: { color: '#00d4ff', glow: 'rgba(0,212,255,0.4)', gradient: 'linear-gradient(135deg,#00d4ff,#007acc)', icon: <FaShieldAlt />,                  label: 'Incident Responder' },
  REPORTER:  { color: '#a855f7', glow: 'rgba(168,85,247,0.4)',gradient: 'linear-gradient(135deg,#a855f7,#7c3aed)', icon: <FaUser />,                        label: 'Standard Reporter' },
};

// ── Stat Card ────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, color }) => (
  <div className="prof-stat-card" style={{ '--sc': color }}>
    <div className="prof-stat-icon" style={{ color, background: `${color}22` }}>{icon}</div>
    <div className="prof-stat-body">
      <div className="prof-stat-val">{value}</div>
      <div className="prof-stat-label">{label}</div>
    </div>
  </div>
);

// ── Info Row ─────────────────────────────────────────────────────
const InfoRow = ({ icon, label, value, accent }) => (
  <div className="prof-info-row">
    <div className="prof-info-icon" style={{ color: accent || 'rgba(255,255,255,0.3)' }}>{icon}</div>
    <div className="prof-info-content">
      <span className="prof-info-label">{label}</span>
      <span className="prof-info-value">{value || '—'}</span>
    </div>
    <FiChevronRight className="prof-info-arrow" />
  </div>
);

// ── Main Component ───────────────────────────────────────────────
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
      setLoading(true); setError(null);
      const res = await axiosInstance.get('/auth/me');
      setUser(res.user);
      updateAuthUser(res.user);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile.');
      if (authUser) setUser(authUser);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  if (loading) return (
    <div className="prof-page">
      <div className="prof-loading">
        <div className="prof-loader" />
        <p>Loading Profile…</p>
      </div>
    </div>
  );

  if (error && !user) return (
    <div className="prof-page">
      <div className="prof-error">
        <FaExclamationTriangle /> {error}
      </div>
    </div>
  );

  const role   = user?.role || 'REPORTER';
  const rConf  = ROLE_CONFIG[role] || ROLE_CONFIG.REPORTER;
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : 'N/A';

  return (
    <div className="prof-page">
      {/* ── Decorative Background ── */}
      <div className="prof-bg-grid" />
      <div className="prof-bg-glow" style={{ background: `radial-gradient(ellipse at 60% 0%, ${rConf.glow} 0%, transparent 60%)` }} />

      <div className="prof-container">

        {/* ══ HERO BANNER ════════════════════════════════════════ */}
        <section className="prof-hero">
          {/* Accent top bar */}
          <div className="prof-hero-bar" style={{ background: rConf.gradient }} />

          {/* Left: Avatar + Identity */}
          <div className="prof-hero-left">
            {/* Avatar ring */}
            <div className="prof-av-shell" style={{ '--rc': rConf.color }}>
              <div className="prof-av-ring-outer" />
              <div className="prof-av-ring-inner" />
              <div className="prof-av-circle">
                {user?.profileImage ? (
                  <img src={`/${user.profileImage}`} alt={user.name} className="prof-av-img"
                    onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                ) : null}
                <div className="prof-av-initials" style={{ display: user?.profileImage ? 'none' : 'flex' }}>
                  {initials}
                </div>
              </div>
              {/* Live status badge */}
              <div className="prof-av-status">
                <span className="prof-av-status-dot" />
              </div>
            </div>

            {/* Identity text */}
            <div className="prof-identity">
              <div className="prof-verified">
                <MdVerified style={{ color: rConf.color }} /> Verified Account
              </div>
              <h1 className="prof-name">{user?.name}</h1>
              <p className="prof-email">{user?.email}</p>
              <div className="prof-role-badge" style={{ background: rConf.gradient, boxShadow: `0 0 24px ${rConf.glow}` }}>
                <span className="prof-role-ico">{rConf.icon}</span>
                {role} · {rConf.label}
              </div>
            </div>
          </div>

          {/* Right: Quick actions + signature */}
          <div className="prof-hero-right">
            <div className="prof-signature">
              <span className="prof-sig-label"><FaFingerprint /> User Signature</span>
              <span className="prof-sig-val" style={{ color: rConf.color }}>
                {user?._id?.substring(0, 8).toUpperCase() || '——————'}
              </span>
              <span className="prof-sig-sub">Unique system identifier</span>
            </div>

            <div className="prof-hero-actions">
              <button className="prof-action-btn prof-action-primary"
                style={{ background: rConf.gradient, boxShadow: `0 0 20px ${rConf.glow}` }}
                onClick={() => setIsEditProfileModalOpen(true)}>
                <FiEdit3 /> Edit Profile
              </button>
              <button className="prof-action-btn prof-action-secondary"
                onClick={() => setIsChangePasswordModalOpen(true)}>
                <FiKey /> Change Password
              </button>
              <button className="prof-action-btn prof-action-ghost"
                onClick={() => navigate('/dashboard')}>
                <FaArrowLeft /> Dashboard
              </button>
            </div>
          </div>
        </section>

        {/* ══ STATS BAR ══════════════════════════════════════════ */}
        <div className="prof-stats-bar">
          <StatCard icon={<FaCheckCircle />} label="Account Status"   value="Active"  color="#22c55e" />
          <StatCard icon={<FaClock />}       label="Session"          value="Online"  color="#00d4ff" />
          <StatCard icon={<FaBell />}        label="Email Alerts"     value={user?.notificationPreferences?.emailThreshold?.replace('_AND_ABOVE','+') || 'ALL'} color="#f59e0b" />
          <StatCard icon={<FaLayerGroup />}  label="SMS Alerts"       value={user?.notificationPreferences?.smsThreshold?.replace('_AND_ABOVE','+') || 'P0'} color="#a855f7" />
          <StatCard icon={<FaCalendarAlt />} label="Member Since"     value={memberSince.split(' ')[2] || '2026'} color="#ff007f" />
        </div>

        {/* ══ DETAIL GRID ════════════════════════════════════════ */}
        <div className="prof-grid">

          {/* ── Personal Information ── */}
          <section className="prof-card">
            <div className="prof-card-header">
              <div className="prof-card-icon" style={{ background: `${rConf.color}22`, color: rConf.color }}>
                <FaUser />
              </div>
              <div>
                <div className="prof-card-title">Personal Information</div>
                <div className="prof-card-sub">Your identity & contact details</div>
              </div>
            </div>
            <div className="prof-card-body">
              <InfoRow icon={<FaUser />}      label="Full Name"     value={user?.name}        accent={rConf.color} />
              <InfoRow icon={<FaEnvelope />}  label="Email Address" value={user?.email}        accent="#00d4ff" />
              <InfoRow icon={<FaPhone />}     label="Phone Number"  value={user?.phoneNumber || 'Not provided'} accent="#22c55e" />
              <InfoRow icon={<FaBuilding />}  label="Department"    value={user?.department || 'General Operations'} accent="#f59e0b" />
            </div>
          </section>

          {/* ── Account Governance ── */}
          <section className="prof-card">
            <div className="prof-card-header">
              <div className="prof-card-icon" style={{ background: '#22c55e22', color: '#22c55e' }}>
                <FaShieldAlt />
              </div>
              <div>
                <div className="prof-card-title">Account Governance</div>
                <div className="prof-card-sub">Security & access level</div>
              </div>
            </div>
            <div className="prof-card-body">
              <InfoRow icon={<FaShieldAlt />}     label="Account Status" value="Active & Verified" accent="#22c55e" />
              <InfoRow icon={<FaCalendarAlt />}   label="Member Since"   value={memberSince}        accent="#00d4ff" />
              <InfoRow icon={<FaClock />}         label="Session State"  value="Online Now"         accent="#22c55e" />
              <InfoRow icon={<FaUserCog />}       label="Permissions"    value={rConf.label}        accent={rConf.color} />
            </div>
          </section>

          {/* ── Notification Preferences ── */}
          <section className="prof-card">
            <div className="prof-card-header">
              <div className="prof-card-icon" style={{ background: '#f59e0b22', color: '#f59e0b' }}>
                <FaBell />
              </div>
              <div>
                <div className="prof-card-title">Notification Preferences</div>
                <div className="prof-card-sub">Alert thresholds per channel</div>
              </div>
            </div>
            <div className="prof-card-body">
              {[
                { label: 'Email Alerts',  val: user?.notificationPreferences?.emailThreshold, color: '#ff007f' },
                { label: 'SMS Alerts',    val: user?.notificationPreferences?.smsThreshold,   color: '#00d4ff' },
                { label: 'Push Alerts',   val: user?.notificationPreferences?.pushThreshold,  color: '#a855f7' },
              ].map(({ label, val, color }) => (
                <div className="prof-notif-row" key={label}>
                  <span className="prof-notif-label">{label}</span>
                  <span className="prof-notif-badge" style={{ background: `${color}22`, color, borderColor: `${color}55` }}>
                    {val?.replace('_AND_ABOVE', '+') || '—'}
                  </span>
                </div>
              ))}
              <div className="prof-notif-row">
                <span className="prof-notif-label">Away / DND Mode</span>
                <span className={`prof-notif-badge ${user?.isAway ? 'prof-badge-away' : 'prof-badge-online'}`}>
                  {user?.isAway ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </section>

          {/* ── Security Snapshot ── */}
          <section className="prof-card">
            <div className="prof-card-header">
              <div className="prof-card-icon" style={{ background: '#a855f722', color: '#a855f7' }}>
                <FaFingerprint />
              </div>
              <div>
                <div className="prof-card-title">Security Snapshot</div>
                <div className="prof-card-sub">Identity verification & tokens</div>
              </div>
            </div>
            <div className="prof-card-body">
              <InfoRow icon={<FaIdBadge />}     label="User ID"        value={user?._id?.substring(0,16) + '…'}        accent="#a855f7" />
              <InfoRow icon={<FaFingerprint />} label="Signature"      value={user?._id?.substring(0,8).toUpperCase()}  accent={rConf.color} />
              <InfoRow icon={<FaShieldAlt />}   label="2FA Status"     value="Password Protected"                        accent="#22c55e" />
              <InfoRow icon={<FaLock />}        label="Last Password"  value="Use button to update"                      accent="#f59e0b" />
            </div>
          </section>
        </div>

      </div>

      {/* Modals */}
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
        onSuccess={() => {}}
      />
      <EditProfileModal
        user={user}
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        onSuccess={fetchProfile}
      />
    </div>
  );
};

export default Profile;