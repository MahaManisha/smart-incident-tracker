import React from 'react';
import { FaEdit, FaTrash, FaCheckCircle, FaTimesCircle, FaShieldAlt, FaClock, FaUsers, FaTag, FaServer } from 'react-icons/fa';
import './SLAList.css';

const SLAList = ({ policies, onEdit, onDelete, onToggleStatus }) => {

    const renderScope = (scope) => {
        const items = [];
        if (scope.service && scope.service.length) {
            items.push({ icon: <FaServer />, label: 'Services', value: scope.service.includes('ALL') ? 'All' : `${scope.service.length} Active` });
        }
        if (scope.incidentType && scope.incidentType.length) {
            items.push({ icon: <FaTag />, label: 'Incident Types', value: scope.incidentType.includes('ALL') ? 'All' : `${scope.incidentType.length} Types` });
        }
        if (scope.team && scope.team.length) {
            items.push({ icon: <FaUsers />, label: 'Teams', value: scope.team.join(', ') });
        }

        if (items.length === 0) {
            return <div className="sla-pill">Global Fallback Policy</div>;
        }

        return (
            <div className="sla-scope-group">
                {items.map((item, i) => (
                    <div key={i} className="sla-pill primary" title={item.label}>
                        <span style={{ marginRight: '6px', opacity: 0.7 }}>{item.icon}</span>
                        {item.value}
                    </div>
                ))}
            </div>
        );
    };

    const renderTargets = (targets) => {
        if (!targets || targets.length === 0) return <span className="text-gray-400 text-sm">-</span>;
        
        const order = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
        const sorted = [...targets].sort((a, b) => order[a.priority] - order[b.priority]);

        return (
            <div className="sla-targets-table">
                {sorted.map(t => (
                    <div key={t.priority} className="sla-target-row">
                        <span className={`sla-target-prio ${t.priority}`}>{t.priority}</span>
                        <div className="sla-target-times">
                            <span className="sla-time-label">Resp:</span> {t.responseTime}m
                            <span style={{ margin: '0 8px', opacity: 0.2 }}>|</span>
                            <span className="sla-time-label">Res:</span> {Math.round(t.resolutionTime / 60 * 10) / 10}h
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    if (policies.length === 0) {
        return (
            <div className="sla-list-container">
                <div className="sla-card" style={{ padding: '80px 20px', textAlign: 'center', alignItems: 'center' }}>
                    <div style={{ width: '80px', height: '80px', background: 'var(--slate-50)', color: 'var(--slate-300)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                        <FaShieldAlt size={40} />
                    </div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '12px' }}>No SLA Policies Configured</h3>
                    <p style={{ color: 'var(--slate-500)', maxWidth: '400px' }}>
                        Establish your server response and resolution standards to begin tracking team performance.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="sla-list-container">
            {policies.map(policy => (
                <div key={policy._id} className={`sla-card ${policy.isActive ? 'active' : ''}`}>
                    <div className="sla-card-accent" />
                    
                    <div className="sla-card-header">
                        <div className="sla-info-section">
                            <h3 className="sla-policy-name">
                                {policy.name}
                                <span className={`sla-status-badge ${policy.isActive ? 'active' : ''}`}>
                                    {policy.isActive && <div className="sla-pulse" />}
                                    {policy.isActive ? 'Active' : 'Paused'}
                                </span>
                            </h3>
                            <p className="sla-policy-desc">{policy.description || 'No description provided for this policy.'}</p>
                        </div>

                        <div className="sla-meta-info" style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 'bold', color: 'var(--slate-900)', marginBottom: '4px' }}>
                                Priority Level {policy.policyPriority}
                            </div>
                            <div>Last Updated: {new RegExp(/^\d{4}-\d{2}-\d{2}/).test(policy.updatedAt) ? policy.updatedAt.split('T')[0] : new Date(policy.updatedAt).toLocaleDateString()}</div>
                        </div>
                    </div>

                    <div className="sla-card-body">
                        <div className="sla-scope-section">
                            <div className="sla-grid-label">Applicable Scope</div>
                            {renderScope(policy.scope)}
                        </div>

                        <div className="sla-targets-section">
                            <div className="sla-grid-label">Time Thresholds</div>
                            {renderTargets(policy.targets)}
                        </div>
                    </div>

                    <div className="sla-card-footer">
                        <div className="sla-meta-info">
                            {policy.escalations?.length || 0} Auto-Escalation Steps Configured
                        </div>
                        
                        <div className="sla-actions-group">
                            <button
                                onClick={() => onToggleStatus(policy)}
                                className="sla-action-btn toggle"
                                title={policy.isActive ? "Deactivate" : "Activate"}
                            >
                                {policy.isActive ? <FaTimesCircle size={18} /> : <FaCheckCircle size={18} />}
                            </button>
                            <button
                                onClick={() => onEdit(policy)}
                                className="sla-action-btn edit"
                                title="Edit Policy Settings"
                            >
                                <FaEdit size={18} />
                            </button>
                            <button
                                onClick={() => onDelete(policy._id)}
                                className="sla-action-btn delete"
                                title="Delete Policy"
                            >
                                <FaTrash size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default SLAList;
