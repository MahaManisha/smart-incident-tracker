import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { updateUserProfile, getResponders } from '../../api/userApi';
import { toast } from 'react-toastify';
import {
    FaUser, FaCamera, FaPhone, FaEnvelope, FaShieldAlt,
    FaBell, FaSms, FaMobileAlt, FaRoute, FaTimes, FaCheck,
    FaSave, FaUserCog
} from 'react-icons/fa';
import { FiWifi, FiWifiOff, FiAlertTriangle } from 'react-icons/fi';
import { MdOutlineAdminPanelSettings } from 'react-icons/md';

// ── Threshold pill options ──────────────────────────────────────
const THRESHOLD_OPTIONS = [
    { value: 'ALL',          label: 'All' },
    { value: 'P3_AND_ABOVE', label: 'P3+' },
    { value: 'P2_AND_ABOVE', label: 'P2+' },
    { value: 'P1_AND_ABOVE', label: 'P1+' },
    { value: 'P0_ONLY',      label: 'P0' },
    { value: 'NONE',         label: 'Off' },
];

// ── Role config ─────────────────────────────────────────────────
const ROLE_CONFIG = {
    ADMIN:     { color: '#ff007f', glow: 'rgba(255,0,127,0.5)',   icon: <MdOutlineAdminPanelSettings />, gradient: 'linear-gradient(135deg,#ff007f,#ff5bad)' },
    RESPONDER: { color: '#00d4ff', glow: 'rgba(0,212,255,0.5)',   icon: <FaShieldAlt />,                gradient: 'linear-gradient(135deg,#00d4ff,#007acc)' },
    REPORTER:  { color: '#a855f7', glow: 'rgba(168,85,247,0.5)',  icon: <FaUser />,                     gradient: 'linear-gradient(135deg,#a855f7,#7c3aed)' },
};

// ── FloatingInput ───────────────────────────────────────────────
const FloatingInput = ({ id, name, label, icon, value, onChange, type='text', placeholder='', readOnly=false, disabled=false, required=false }) => {
    const [focused, setFocused] = useState(false);
    const hasVal = value && value.length > 0;
    return (
        <div className={`fi-wrap ${focused ? 'fi-focused' : ''} ${readOnly ? 'fi-readonly' : ''}`}>
            <span className="fi-icon">{icon}</span>
            <div className="fi-inner">
                <label htmlFor={id} className={`fi-label ${(focused || hasVal) ? 'fi-label-up' : ''}`}>
                    {label}{required && <span className="fi-req">*</span>}
                </label>
                <input
                    id={id}
                    name={name}
                    type={type}
                    className="fi-input"
                    value={value}
                    onChange={onChange}
                    placeholder={focused ? placeholder : ''}
                    readOnly={readOnly}
                    disabled={disabled || readOnly}
                    onFocus={() => setFocused(true)}
                    onBlur={()  => setFocused(false)}
                    autoComplete="off"
                />
            </div>
            {readOnly && <span className="fi-lock-badge">LOCKED</span>}
        </div>
    );
};

// ── PillSelect ──────────────────────────────────────────────────
const PillSelect = ({ label, icon, color, name, value, onChange, disabled }) => (
    <div className="ps-wrap">
        <div className="ps-header" style={{ '--c': color }}>
            <span className="ps-icon" style={{ color, background: `${color}22` }}>{icon}</span>
            <span className="ps-label">{label}</span>
            <span className="ps-val-badge" style={{ background: `${color}22`, color }}>{value?.replace('_AND_ABOVE', '+') || '—'}</span>
        </div>
        <div className="ps-pills">
            {THRESHOLD_OPTIONS.map(opt => (
                <button
                    key={opt.value}
                    type="button"
                    disabled={disabled}
                    className={`ps-pill ${value === opt.value ? 'ps-pill-active' : ''}`}
                    style={value === opt.value ? { '--c': color } : {}}
                    onClick={() => onChange({ target: { name, value: opt.value } })}
                >
                    {opt.label}
                    {value === opt.value && <FaCheck className="ps-pill-check" />}
                </button>
            ))}
        </div>
    </div>
);

// ── Main Component ──────────────────────────────────────────────
const EditProfileModal = ({ user, isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '', phoneNumber: '', avatar: null, isAway: false, awayRouteTo: '',
        notificationPreferences: { emailThreshold: 'ALL', smsThreshold: 'P0_ONLY', pushThreshold: 'P1_AND_ABOVE' }
    });
    const [responders, setResponders]   = useState([]);
    const [previewUrl, setPreviewUrl]   = useState(null);
    const [loading, setLoading]         = useState(false);
    const [error, setError]             = useState(null);
    const [activeTab, setActiveTab]     = useState('profile');
    const [saved, setSaved]             = useState(false);
    const fileRef = useRef();

    const role   = user?.role || 'RESPONDER';
    const rConf  = ROLE_CONFIG[role] || ROLE_CONFIG.RESPONDER;

    useEffect(() => {
        if (isOpen) {
            getResponders()
                .then(res => setResponders(res.users || res.data?.users || []))
                .catch(() => {});
        }
    }, [isOpen]);

    useEffect(() => {
        if (user && isOpen) {
            setFormData({
                name: user.name || '',
                phoneNumber: user.phoneNumber || '',
                avatar: null,
                isAway: user.isAway || false,
                awayRouteTo: user.awayRouteTo || '',
                notificationPreferences: user.notificationPreferences || {
                    emailThreshold: 'ALL', smsThreshold: 'P0_ONLY', pushThreshold: 'P1_AND_ABOVE'
                }
            });
            setPreviewUrl(user.profileImage ? `/${user.profileImage}` : null);
            setError(null);
            setActiveTab('profile');
            setSaved(false);
        }
    }, [user, isOpen]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name.startsWith('notification_')) {
            const field = name.replace('notification_', '');
            setFormData(p => ({ ...p, notificationPreferences: { ...p.notificationPreferences, [field]: value } }));
        } else {
            setFormData(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
        }
    };

    const handleFile = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(p => ({ ...p, avatar: file }));
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e?.preventDefault();
        setLoading(true); setError(null);
        try {
            const payload = new FormData();
            if (formData.name)        payload.append('name', formData.name);
            if (formData.phoneNumber !== undefined) payload.append('phoneNumber', formData.phoneNumber);
            if (formData.avatar)      payload.append('profileImage', formData.avatar);
            payload.append('isAway', formData.isAway);
            if (formData.isAway && formData.awayRouteTo) payload.append('awayRouteTo', formData.awayRouteTo);
            payload.append('notificationPreferences', JSON.stringify(formData.notificationPreferences));
            await updateUserProfile(payload);
            setSaved(true);
            toast.success('Profile updated successfully');
            setTimeout(() => { onSuccess(); onClose(); }, 900);
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        if (isOpen) { document.addEventListener('keydown', onKey); document.body.style.overflow = 'hidden'; }
        return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = 'unset'; };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const TABS = [
        { id: 'profile',       label: 'Identity',      icon: <FaUserCog /> },
        { id: 'notifications', label: 'Alerts',         icon: <FaBell /> },
        { id: 'routing',       label: 'Availability',   icon: <FaRoute /> },
    ];

    return createPortal(
        <div className="epm-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="epm-shell">

                {/* ── Decorative top accent ── */}
                <div className="epm-top-accent" style={{ '--rc': rConf.color }} />

                {/* ══ LEFT SIDEBAR ══════════════════════════════ */}
                <aside className="epm-sidebar">
                    <div className="epm-sidebar-bg" style={{ '--rc': rConf.color }} />

                    {/* Avatar */}
                    <div className="epm-av-wrap">
                        <div className="epm-av-ring" style={{ '--rc': rConf.color }}>
                            <div className="epm-av-scan" />
                            <div className="epm-av-inner">
                                {previewUrl
                                    ? <img src={previewUrl} alt="avatar" className="epm-av-img" />
                                    : <div className="epm-av-ph"><FaUser /></div>}
                            </div>
                            <button className="epm-av-cam" style={{ background: rConf.gradient, boxShadow: `0 0 16px ${rConf.glow}` }}
                                onClick={() => fileRef.current?.click()} title="Change photo">
                                <FaCamera />
                            </button>
                            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} hidden />
                        </div>
                        <p className="epm-av-hint">JPG / PNG · Max 2 MB</p>
                    </div>

                    {/* Identity card */}
                    <div className="epm-id-card" style={{ '--rc': rConf.color }}>
                        <div className="epm-id-name">{formData.name || user?.name || '—'}</div>
                        <div className="epm-id-email">{user?.email}</div>
                        <div className="epm-role-badge" style={{ background: rConf.gradient, boxShadow: `0 0 20px ${rConf.glow}` }}>
                            <span className="epm-role-ico">{rConf.icon}</span>
                            {role}
                        </div>
                    </div>

                    {/* Status dot */}
                    <div className={`epm-status-row ${formData.isAway ? 'away' : 'online'}`}>
                        <span className="epm-status-dot" />
                        <span className="epm-status-text">{formData.isAway ? 'Away / DND' : 'Online'}</span>
                    </div>

                    {/* Quick stats */}
                    <div className="epm-sidebar-stats">
                        {[
                            { label: 'Email',  val: formData.notificationPreferences.emailThreshold?.replace('_AND_ABOVE','+') },
                            { label: 'SMS',    val: formData.notificationPreferences.smsThreshold?.replace('_AND_ABOVE','+') },
                            { label: 'Push',   val: formData.notificationPreferences.pushThreshold?.replace('_AND_ABOVE','+') },
                        ].map(s => (
                            <div key={s.label} className="epm-stat-chip">
                                <span className="epm-stat-label">{s.label}</span>
                                <span className="epm-stat-val" style={{ color: rConf.color }}>{s.val}</span>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* ══ RIGHT PANEL ═══════════════════════════════ */}
                <div className="epm-panel">

                    {/* Header */}
                    <div className="epm-header">
                        <div className="epm-header-left">
                            <div className="epm-title-badge" style={{ background: `${rConf.color}22`, borderColor: `${rConf.color}55` }}>
                                <FaUserCog style={{ color: rConf.color }} />
                            </div>
                            <div>
                                <div className="epm-title">Edit Profile</div>
                                <div className="epm-subtitle">Manage your identity &amp; preferences</div>
                            </div>
                        </div>
                        <button className="epm-close" onClick={onClose} aria-label="Close"><FaTimes /></button>
                    </div>

                    {/* Tabs */}
                    <div className="epm-tabs" style={{ '--rc': rConf.color }}>
                        {TABS.map(t => (
                            <button key={t.id} type="button"
                                className={`epm-tab ${activeTab === t.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(t.id)}>
                                <span className="epm-tab-ico">{t.icon}</span>
                                {t.label}
                                {activeTab === t.id && <span className="epm-tab-bar" style={{ background: rConf.gradient }} />}
                            </button>
                        ))}
                    </div>

                    {/* Scrollable body */}
                    <div className="epm-body">

                        {/* ── Identity Tab ── */}
                        {activeTab === 'profile' && (
                            <div className="epm-section slide-in">
                                <div className="epm-sec-title">Personal Information</div>
                                <div className="epm-field-grid">
                                    <FloatingInput id="ep-name"  name="name"        label="Full Name"    icon={<FaUser />}     value={formData.name}        onChange={handleChange} required placeholder="John Doe"      disabled={loading} />
                                    <FloatingInput id="ep-phone" name="phoneNumber"  label="Phone Number" icon={<FaPhone />}    value={formData.phoneNumber} onChange={handleChange} placeholder="+1234567890" disabled={loading} />
                                </div>
                                {/* override onChange to inject name */}
                                <div className="epm-field-grid">
                                    <FloatingInput id="ep-email" label="Email Address" icon={<FaEnvelope />} value={user?.email || ''} readOnly />
                                    <div className="fi-wrap fi-readonly">
                                        <span className="fi-icon" style={{ color: rConf.color }}><FaShieldAlt /></span>
                                        <div className="fi-inner">
                                            <label className="fi-label fi-label-up">Role</label>
                                            <div className="fi-role-display" style={{ color: rConf.color }}>
                                                <span>{rConf.icon}</span> {role}
                                            </div>
                                        </div>
                                        <span className="fi-lock-badge">SYSTEM</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Alerts Tab ── */}
                        {activeTab === 'notifications' && (
                            <div className="epm-section slide-in">
                                <div className="epm-sec-title">Alert Thresholds</div>
                                <p className="epm-sec-desc">Choose the minimum severity level to receive alerts on each channel.</p>
                                <div className="epm-notif-stack">
                                    <PillSelect label="Email Alerts"  icon={<FaEnvelope />}   color="#ff007f" name="notification_emailThreshold"  value={formData.notificationPreferences.emailThreshold}  onChange={handleChange} disabled={loading} />
                                    <PillSelect label="SMS Alerts"    icon={<FaSms />}         color="#00d4ff" name="notification_smsThreshold"    value={formData.notificationPreferences.smsThreshold}    onChange={handleChange} disabled={loading} />
                                    <PillSelect label="Push Alerts"   icon={<FaMobileAlt />}   color="#a855f7" name="notification_pushThreshold"   value={formData.notificationPreferences.pushThreshold}   onChange={handleChange} disabled={loading} />
                                </div>
                            </div>
                        )}

                        {/* ── Routing Tab ── */}
                        {activeTab === 'routing' && (
                            <div className="epm-section slide-in">
                                <div className="epm-sec-title">Availability &amp; Routing</div>
                                <p className="epm-sec-desc">When Away mode is active, all incoming tickets are automatically routed to your selected backup agent.</p>

                                {/* Big toggle card */}
                                <div className={`epm-away-hero ${formData.isAway ? 'is-away' : ''}`}>
                                    <div className="epm-away-glow" />
                                    <div className="epm-away-state-icon">
                                        {formData.isAway ? <FiWifiOff /> : <FiWifi />}
                                    </div>
                                    <div className="epm-away-state-text">
                                        <span className="epm-away-title">{formData.isAway ? 'Away / Do Not Disturb' : 'Available & Online'}</span>
                                        <span className="epm-away-sub">{formData.isAway ? 'Ticket routing is active' : 'You will receive all assigned tickets'}</span>
                                    </div>
                                    <label className="epm-big-toggle">
                                        <input type="checkbox" name="isAway" checked={formData.isAway} onChange={handleChange} disabled={loading} />
                                        <span className="epm-bt-track">
                                            <span className="epm-bt-thumb" />
                                            <span className="epm-bt-labels">
                                                <span>ON</span><span>OFF</span>
                                            </span>
                                        </span>
                                    </label>
                                </div>

                                {formData.isAway && (
                                    <div className="epm-route-card slide-in">
                                        <div className="epm-route-label">
                                            <FiAlertTriangle /> Route my tickets to:
                                        </div>
                                        <select name="awayRouteTo" className="epm-route-select"
                                            value={formData.awayRouteTo} onChange={handleChange} disabled={loading}>
                                            <option value="">Select a team member...</option>
                                            {responders.filter(r => r._id !== user?._id).map(r => (
                                                <option key={r._id} value={r._id}>{r.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Error */}
                        {error && (
                            <div className="epm-error slide-in">
                                <FiAlertTriangle /> {error}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="epm-footer">
                        <button type="button" className="epm-btn-cancel" onClick={onClose} disabled={loading}>
                            Discard
                        </button>
                        <button type="button" className="epm-btn-save"
                            style={{ background: rConf.gradient, boxShadow: `0 0 24px ${rConf.glow}` }}
                            onClick={handleSubmit} disabled={loading || saved}>
                            {loading ? (
                                <><span className="epm-spinner" /> Saving…</>
                            ) : saved ? (
                                <><FaCheck /> Saved!</>
                            ) : (
                                <><FaSave /> Save Changes</>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* ══ ALL STYLES ══════════════════════════════════════ */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Rajdhani:wght@600;700&display=swap');

                /* Backdrop */
                .epm-backdrop {
                    position: fixed; inset: 0;
                    background: rgba(0,0,0,0.85);
                    backdrop-filter: blur(14px);
                    display: flex; align-items: center; justify-content: center;
                    z-index: 9999;
                    padding: 20px;
                }

                /* Shell */
                .epm-shell {
                    display: flex;
                    width: 860px;
                    max-width: 100%;
                    max-height: 90vh;
                    border-radius: 20px;
                    overflow: hidden;
                    border: 1px solid rgba(255,255,255,0.08);
                    box-shadow: 0 40px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04);
                    animation: epm-appear 0.4s cubic-bezier(0.16,1,0.3,1);
                    position: relative;
                }
                @keyframes epm-appear {
                    from { opacity:0; transform:scale(0.95) translateY(20px); }
                    to   { opacity:1; transform:scale(1) translateY(0); }
                }
                .epm-top-accent {
                    position: absolute; top:0; left:0; right:0; height:2px;
                    background: linear-gradient(90deg, transparent, var(--rc), #00d4ff, transparent);
                    z-index: 10;
                }

                /* ── Sidebar ── */
                .epm-sidebar {
                    width: 240px;
                    flex-shrink: 0;
                    background: rgba(8,8,20,0.95);
                    border-right: 1px solid rgba(255,255,255,0.06);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 20px;
                    padding: 36px 20px 24px;
                    position: relative;
                    overflow: hidden;
                }
                .epm-sidebar-bg {
                    position: absolute; inset: 0;
                    background: radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--rc) 15%, transparent) 0%, transparent 70%);
                    pointer-events: none;
                }

                /* Avatar */
                .epm-av-wrap {
                    display: flex; flex-direction: column; align-items: center; gap: 8px;
                    position: relative; z-index: 1;
                }
                .epm-av-ring {
                    position: relative;
                    width: 110px; height: 110px;
                }
                .epm-av-ring::before {
                    content: '';
                    position: absolute; inset: -3px;
                    border-radius: 50%;
                    background: conic-gradient(var(--rc), #00d4ff, #a855f7, var(--rc));
                    animation: epm-spin 5s linear infinite;
                }
                @keyframes epm-spin { to { transform: rotate(360deg); } }
                .epm-av-ring::after {
                    content: '';
                    position: absolute; inset: -3px;
                    border-radius: 50%;
                    background: conic-gradient(var(--rc), #00d4ff, #a855f7, var(--rc));
                    filter: blur(6px);
                    opacity: 0.5;
                    animation: epm-spin 5s linear infinite;
                }
                .epm-av-scan {
                    position: absolute; inset: 3px;
                    border-radius: 50%;
                    background: linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 100%);
                    animation: epm-scan 3s ease-in-out infinite;
                    z-index: 2;
                    pointer-events: none;
                }
                @keyframes epm-scan {
                    0%,100% { opacity:0; transform:translateY(-100%); }
                    50%     { opacity:1; transform:translateY(100%); }
                }
                .epm-av-inner {
                    position: absolute; inset: 5px;
                    border-radius: 50%;
                    overflow: hidden;
                    background: #111;
                    border: 3px solid #0a0a1a;
                    z-index: 3;
                    display: flex; align-items: center; justify-content: center;
                }
                .epm-av-img  { width:100%; height:100%; object-fit:cover; }
                .epm-av-ph   { font-size: 2.6rem; color: #333; }
                .epm-av-cam  {
                    position: absolute; bottom: 4px; right: 4px;
                    width: 32px; height: 32px; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    color: #fff; font-size: 0.75rem;
                    border: 2px solid #080814;
                    cursor: pointer; z-index: 4;
                    transition: transform 0.25s, box-shadow 0.25s;
                }
                .epm-av-cam:hover { transform: scale(1.15); }
                .epm-av-hint { font-size: 0.7rem; color: #444; letter-spacing: 0.5px; margin-top: 2px; }

                /* Identity card */
                .epm-id-card {
                    text-align: center;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 14px;
                    padding: 16px 14px;
                    width: 100%;
                    position: relative; z-index: 1;
                    border-top: 1px solid color-mix(in srgb, var(--rc) 30%, transparent);
                }
                .epm-id-name  { font-family:'Rajdhani',sans-serif; font-size:1.05rem; font-weight:700; color:#e8e8e8; margin-bottom:4px; }
                .epm-id-email { font-size:0.7rem; color:#555; margin-bottom:12px; word-break:break-all; }
                .epm-role-badge {
                    display: inline-flex; align-items: center; gap: 6px;
                    padding: 5px 14px; border-radius: 20px;
                    font-family: 'Rajdhani',sans-serif; font-size:0.75rem; font-weight:700;
                    color: #fff; letter-spacing:1.5px; text-transform:uppercase;
                }
                .epm-role-ico { font-size: 0.9rem; }

                /* Status */
                .epm-status-row {
                    display: flex; align-items: center; gap: 8px;
                    background: rgba(255,255,255,0.03);
                    border-radius: 20px; padding: 6px 14px;
                    position: relative; z-index: 1;
                }
                .epm-status-dot {
                    width: 8px; height: 8px; border-radius: 50%;
                    background: #22c55e;
                    box-shadow: 0 0 8px #22c55e;
                    animation: epm-pulse 2s ease-in-out infinite;
                }
                .away .epm-status-dot { background:#ef4444; box-shadow:0 0 8px #ef4444; }
                @keyframes epm-pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
                .epm-status-text { font-size:0.72rem; font-weight:600; color:#888; text-transform:uppercase; letter-spacing:1px; }

                /* Stat chips */
                .epm-sidebar-stats {
                    width: 100%;
                    display: flex; flex-direction: column; gap: 6px;
                    position: relative; z-index: 1;
                    margin-top: auto;
                }
                .epm-stat-chip {
                    display: flex; justify-content: space-between; align-items: center;
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 8px; padding: 6px 12px;
                }
                .epm-stat-label { font-size:0.68rem; color:#555; text-transform:uppercase; letter-spacing:1px; }
                .epm-stat-val   { font-family:'Rajdhani',sans-serif; font-size:0.8rem; font-weight:700; }

                /* ── Right panel ── */
                .epm-panel {
                    flex: 1; display: flex; flex-direction: column;
                    background: rgba(10,10,22,0.97);
                    overflow: hidden;
                }

                /* Header */
                .epm-header {
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 20px 28px;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    background: rgba(255,255,255,0.01);
                    flex-shrink: 0;
                }
                .epm-header-left { display:flex; align-items:center; gap:14px; }
                .epm-title-badge {
                    width:40px; height:40px; border-radius:10px;
                    display:flex; align-items:center; justify-content:center;
                    border:1px solid; font-size:1.1rem;
                }
                .epm-title    { font-family:'Rajdhani',sans-serif; font-size:1.15rem; font-weight:700; color:#e8e8e8; text-transform:uppercase; letter-spacing:1.5px; }
                .epm-subtitle { font-size:0.73rem; color:#555; margin-top:2px; }
                .epm-close {
                    width:34px; height:34px; border-radius:8px;
                    background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.07);
                    color:#666; font-size:0.9rem; cursor:pointer;
                    display:flex; align-items:center; justify-content:center;
                    transition:all 0.2s;
                }
                .epm-close:hover { background:rgba(255,62,62,0.15); border-color:rgba(255,62,62,0.4); color:#ff4444; transform:rotate(90deg); }

                /* Tabs */
                .epm-tabs {
                    display:flex; gap:0;
                    border-bottom:1px solid rgba(255,255,255,0.06);
                    padding: 0 20px;
                    flex-shrink:0;
                }
                .epm-tab {
                    position:relative;
                    display:flex; align-items:center; gap:8px;
                    padding:14px 18px;
                    background:none; border:none;
                    color:#555; cursor:pointer;
                    font-family:'Rajdhani',sans-serif; font-size:0.78rem; font-weight:700;
                    text-transform:uppercase; letter-spacing:1px;
                    transition:color 0.25s;
                }
                .epm-tab:hover { color:#aaa; }
                .epm-tab.active { color:#e8e8e8; }
                .epm-tab-ico { font-size:0.85rem; }
                .epm-tab-bar {
                    position:absolute; bottom:-1px; left:0; right:0; height:2px;
                    border-radius:2px 2px 0 0;
                }

                /* Body */
                .epm-body {
                    flex:1; overflow-y:auto; padding:28px;
                    scrollbar-width:thin; scrollbar-color:rgba(255,255,255,0.1) transparent;
                }
                .epm-body::-webkit-scrollbar { width:4px; }
                .epm-body::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.08); border-radius:4px; }

                /* Section */
                .epm-section { }
                .slide-in { animation: epm-slide 0.3s ease; }
                @keyframes epm-slide {
                    from { opacity:0; transform:translateY(10px); }
                    to   { opacity:1; transform:translateY(0); }
                }
                .epm-sec-title {
                    font-family:'Rajdhani',sans-serif; font-size:0.75rem; font-weight:700;
                    text-transform:uppercase; letter-spacing:2px; color:#666;
                    margin-bottom:18px;
                    display:flex; align-items:center; gap:10px;
                }
                .epm-sec-title::after { content:''; flex:1; height:1px; background:rgba(255,255,255,0.05); }
                .epm-sec-desc { font-size:0.8rem; color:#555; line-height:1.7; margin-bottom:24px; }

                /* Field grid */
                .epm-field-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:14px; }

                /* Floating Input */
                .fi-wrap {
                    display:flex; align-items:stretch;
                    background:rgba(255,255,255,0.025);
                    border:1px solid rgba(255,255,255,0.08);
                    border-radius:12px; overflow:hidden;
                    transition:all 0.25s; position:relative;
                }
                .fi-wrap:hover:not(.fi-readonly) { border-color:rgba(255,255,255,0.15); }
                .fi-focused { border-color:#ff007f !important; background:rgba(255,0,127,0.05) !important; box-shadow:0 0 0 3px rgba(255,0,127,0.1), 0 0 20px rgba(255,0,127,0.1); }
                .fi-readonly { border-style:dashed; opacity:0.6; }
                .fi-icon {
                    display:flex; align-items:center; justify-content:center;
                    width:44px; flex-shrink:0;
                    color:#ff007f; font-size:0.85rem;
                    border-right:1px solid rgba(255,255,255,0.05);
                    background:rgba(255,0,127,0.05);
                }
                .fi-inner { flex:1; padding:10px 14px; min-width:0; position:relative; }
                .fi-label {
                    display:block;
                    font-family:'Rajdhani',sans-serif; font-size:0.78rem; font-weight:700;
                    text-transform:uppercase; letter-spacing:1px; color:#555;
                    transition:all 0.2s; margin-bottom:4px;
                }
                .fi-label-up { color:#ff007f; font-size:0.68rem; }
                .fi-req { color:#ff007f; margin-left:2px; }
                .fi-input {
                    width:100%; background:none; border:none; outline:none;
                    color:#e0e0e0; font-size:0.88rem; font-family:'Inter',sans-serif;
                    padding:0; transition:color 0.2s;
                }
                .fi-input:disabled { color:#555; cursor:not-allowed; }
                .fi-lock-badge {
                    align-self:center; margin-right:10px;
                    font-size:0.6rem; font-weight:700; letter-spacing:1px; color:#444;
                    background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.06);
                    border-radius:4px; padding:2px 6px; white-space:nowrap; flex-shrink:0;
                }
                .fi-role-display {
                    display:flex; align-items:center; gap:7px;
                    font-family:'Rajdhani',sans-serif; font-size:0.9rem; font-weight:700;
                    letter-spacing:1px;
                }

                /* Pill Select */
                .epm-notif-stack { display:flex; flex-direction:column; gap:16px; }
                .ps-wrap {
                    background:rgba(255,255,255,0.02);
                    border:1px solid rgba(255,255,255,0.07);
                    border-radius:14px; padding:16px 18px;
                    transition:border-color 0.25s;
                }
                .ps-wrap:hover { border-color:rgba(255,255,255,0.12); }
                .ps-header {
                    display:flex; align-items:center; gap:10px; margin-bottom:14px;
                }
                .ps-icon {
                    width:32px; height:32px; border-radius:8px;
                    display:flex; align-items:center; justify-content:center;
                    font-size:0.85rem; flex-shrink:0;
                }
                .ps-label { flex:1; font-family:'Rajdhani',sans-serif; font-size:0.85rem; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#bbb; }
                .ps-val-badge { font-size:0.7rem; font-weight:700; letter-spacing:1px; border-radius:5px; padding:2px 8px; }
                .ps-pills { display:flex; gap:8px; flex-wrap:wrap; }
                .ps-pill {
                    display:flex; align-items:center; gap:5px;
                    padding:6px 14px; border-radius:20px;
                    background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08);
                    color:#666; font-size:0.78rem; font-weight:600;
                    cursor:pointer; transition:all 0.2s; font-family:'Inter',sans-serif;
                }
                .ps-pill:hover { border-color:rgba(255,255,255,0.2); color:#aaa; }
                .ps-pill-active {
                    background:color-mix(in srgb, var(--c) 18%, transparent);
                    border-color:color-mix(in srgb, var(--c) 60%, transparent);
                    color:var(--c);
                    box-shadow:0 0 12px color-mix(in srgb, var(--c) 25%, transparent);
                }
                .ps-pill-check { font-size:0.65rem; }

                /* Away hero */
                .epm-away-hero {
                    display:flex; align-items:center; gap:16px;
                    background:rgba(34,197,94,0.05);
                    border:1px solid rgba(34,197,94,0.2);
                    border-radius:16px; padding:22px 24px;
                    position:relative; overflow:hidden;
                    transition:all 0.4s;
                    margin-bottom:16px;
                }
                .epm-away-hero.is-away {
                    background:rgba(239,68,68,0.06);
                    border-color:rgba(239,68,68,0.3);
                }
                .epm-away-glow {
                    position:absolute; top:-40px; right:-40px;
                    width:120px; height:120px; border-radius:50%;
                    background:rgba(34,197,94,0.12);
                    transition:background 0.4s;
                    pointer-events:none;
                }
                .is-away .epm-away-glow { background:rgba(239,68,68,0.15); }
                .epm-away-state-icon { font-size:1.8rem; color:#22c55e; flex-shrink:0; transition:color 0.3s; }
                .is-away .epm-away-state-icon { color:#ef4444; }
                .epm-away-state-text { flex:1; }
                .epm-away-title { display:block; font-family:'Rajdhani',sans-serif; font-size:1rem; font-weight:700; color:#e0e0e0; }
                .epm-away-sub   { font-size:0.75rem; color:#666; margin-top:3px; }

                /* Big toggle */
                .epm-big-toggle { position:relative; display:inline-block; flex-shrink:0; cursor:pointer; }
                .epm-big-toggle input { opacity:0; width:0; height:0; position:absolute; }
                .epm-bt-track {
                    display:block; width:72px; height:36px;
                    background:rgba(255,255,255,0.06);
                    border:1px solid rgba(255,255,255,0.12);
                    border-radius:18px; position:relative;
                    transition:all 0.4s;
                }
                .epm-big-toggle input:checked + .epm-bt-track {
                    background:rgba(239,68,68,0.2);
                    border-color:rgba(239,68,68,0.5);
                    box-shadow:0 0 16px rgba(239,68,68,0.3);
                }
                .epm-bt-thumb {
                    position:absolute; top:3px; left:3px;
                    width:28px; height:28px; border-radius:50%;
                    background:#444; transition:all 0.4s cubic-bezier(0.34,1.56,0.64,1);
                }
                .epm-big-toggle input:checked + .epm-bt-track .epm-bt-thumb {
                    transform:translateX(36px);
                    background:#ef4444;
                    box-shadow:0 0 12px rgba(239,68,68,0.7);
                }
                .epm-bt-labels {
                    position:absolute; top:0; bottom:0; left:0; right:0;
                    display:flex; align-items:center; justify-content:space-between;
                    padding:0 8px 0 34px;
                    font-size:0.55rem; font-weight:800; letter-spacing:1px; color:#666;
                    transition:all 0.3s; user-select:none;
                }
                .epm-big-toggle input:checked + .epm-bt-track .epm-bt-labels { padding:0 34px 0 8px; color:#ef4444; }

                /* Route card */
                .epm-route-card {
                    background:rgba(239,68,68,0.05);
                    border:1px solid rgba(239,68,68,0.2);
                    border-radius:12px; padding:18px;
                }
                .epm-route-label {
                    display:flex; align-items:center; gap:8px;
                    font-family:'Rajdhani',sans-serif; font-size:0.75rem; font-weight:700;
                    text-transform:uppercase; letter-spacing:1px;
                    color:#ef4444; margin-bottom:10px;
                }
                .epm-route-select {
                    width:100%; padding:11px 14px;
                    background:rgba(0,0,0,0.3);
                    border:1px solid rgba(239,68,68,0.3); border-radius:9px;
                    color:#e0e0e0; font-size:0.87rem;
                    cursor:pointer; box-sizing:border-box;
                    transition:all 0.25s;
                }
                .epm-route-select:focus {
                    outline:none; border-color:#ef4444;
                    box-shadow:0 0 0 3px rgba(239,68,68,0.12);
                }
                .epm-route-select option { background:#12121e; color:#e0e0e0; }

                /* Error */
                .epm-error {
                    display:flex; align-items:center; gap:10px;
                    margin-top:16px; padding:14px 16px;
                    background:rgba(239,68,68,0.08);
                    border:1px solid rgba(239,68,68,0.3);
                    border-left:3px solid #ef4444;
                    color:#ff8080; border-radius:10px;
                    font-size:0.83rem; line-height:1.5;
                }

                /* Footer */
                .epm-footer {
                    display:flex; align-items:center; justify-content:flex-end; gap:12px;
                    padding:18px 28px;
                    border-top:1px solid rgba(255,255,255,0.05);
                    background:rgba(255,255,255,0.01);
                    flex-shrink:0;
                }
                .epm-btn-cancel {
                    padding:10px 22px; border-radius:10px;
                    background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08);
                    color:#888; font-family:'Rajdhani',sans-serif; font-size:0.8rem;
                    font-weight:700; text-transform:uppercase; letter-spacing:1px;
                    cursor:pointer; transition:all 0.25s;
                }
                .epm-btn-cancel:hover { background:rgba(255,255,255,0.08); color:#bbb; }
                .epm-btn-save {
                    display:flex; align-items:center; gap:8px;
                    padding:10px 26px; border-radius:10px; border:none;
                    color:#fff; font-family:'Rajdhani',sans-serif; font-size:0.8rem;
                    font-weight:700; text-transform:uppercase; letter-spacing:1px;
                    cursor:pointer; transition:all 0.3s;
                }
                .epm-btn-save:hover:not(:disabled) { filter:brightness(1.15); transform:translateY(-1px); }
                .epm-btn-save:disabled { opacity:0.6; cursor:not-allowed; filter:none; transform:none; }
                .epm-spinner {
                    width:14px; height:14px; border-radius:50%;
                    border:2px solid rgba(255,255,255,0.3);
                    border-top-color:#fff;
                    animation:epm-spin 0.7s linear infinite;
                    display:inline-block;
                }
            `}</style>
        </div>,
        document.body
    );
};

export default EditProfileModal;
