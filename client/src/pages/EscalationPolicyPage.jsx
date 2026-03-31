import React, { useState, useEffect } from 'react';
import Layout from '../components/common/Layout';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { getEscalationPolicies, createEscalationPolicy, deleteEscalationPolicy } from '../api/escalationApi';
import { toast } from 'react-toastify';
import { FaProjectDiagram, FaPlus, FaTrashAlt, FaCodeBranch } from 'react-icons/fa';
import './EscalationPolicyPage.css';

const EscalationPolicyPage = () => {
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    
    // Industrial Upgrade: Expanded State for Visual Builder
    const [newPolicy, setNewPolicy] = useState({
        name: '',
        description: '',
        isDefault: false,
        routingLogic: 'ALL', // "MATCH ALL CONDITIONS" (AND)
        conditions: [],
        levels: [
            { levelNumber: 1, escalateAfterMinutes: 15, escalateToRole: 'RESPONDER' }
        ]
    });

    useEffect(() => {
        fetchPolicies();
    }, []);

    const fetchPolicies = async () => {
        try {
            setLoading(true);
            const data = await getEscalationPolicies();
            setPolicies(data || []);
        } catch (error) {
            toast.error('Failed to load policies');
        } finally {
            setLoading(false);
        }
    };

    // --- Complex Condition Builder Handlers ---
    const addCondition = () => {
        setNewPolicy({
            ...newPolicy,
            conditions: [...newPolicy.conditions, { field: 'priority', operator: 'EQUALS', value: 'CRITICAL' }]
        });
    };

    const removeCondition = (index) => {
        const updated = [...newPolicy.conditions];
        updated.splice(index, 1);
        setNewPolicy({ ...newPolicy, conditions: updated });
    };

    const handleConditionChange = (index, key, val) => {
        const updated = [...newPolicy.conditions];
        updated[index][key] = val;
        // Auto-fix values if operator implies a specific type
        if (key === 'operator' && val === 'IS_WEEKEND') {
            updated[index].value = 'TRUE';
        }
        setNewPolicy({ ...newPolicy, conditions: updated });
    };

    // --- Escalation Level Handlers ---
    const handleLevelChange = (index, field, value) => {
        const updatedLevels = [...newPolicy.levels];
        updatedLevels[index][field] = field === 'escalateAfterMinutes' ? parseInt(value) || 0 : value;
        setNewPolicy({ ...newPolicy, levels: updatedLevels });
    };

    const addLevel = () => {
        const nextLevel = newPolicy.levels.length + 1;
        setNewPolicy({
            ...newPolicy,
            levels: [...newPolicy.levels, { levelNumber: nextLevel, escalateAfterMinutes: 30, escalateToRole: 'ADMIN' }]
        });
    };

    const removeLevel = (index) => {
        const updated = [...newPolicy.levels];
        updated.splice(index, 1);
        // Re-number
        const fixed = updated.map((lvl, idx) => ({ ...lvl, levelNumber: idx + 1 }));
        setNewPolicy({ ...newPolicy, levels: fixed });
    };

    // --- Quick Templates ---
    const applySlaBypassTemplate = () => {
        setNewPolicy({
            name: 'Emergency Database SLA Bypass',
            description: 'Immediate Escalation for weekend Database Crisis',
            isDefault: false,
            routingLogic: 'ALL',
            conditions: [
                { field: 'priority', operator: 'EQUALS', value: 'CRITICAL' },
                { field: 'service', operator: 'EQUALS', value: 'Database' },
                { field: 'time', operator: 'IS_WEEKEND', value: 'TRUE' }
            ],
            levels: [
                { levelNumber: 1, escalateAfterMinutes: 0, escalateToRole: 'ADMIN' } // 0 = Immediate Ignore SLA
            ]
        });
        toast.info("Applied SLA Bypass Template! (0 min escalation)");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createEscalationPolicy(newPolicy);
            toast.success('Policy created successfully');
            setShowForm(false);
            // Reset form
            setNewPolicy({
                name: '', description: '', isDefault: false, routingLogic: 'ALL', conditions: [],
                levels: [{ levelNumber: 1, escalateAfterMinutes: 15, escalateToRole: 'RESPONDER' }]
            });
            fetchPolicies();
        } catch (error) {
            toast.error(error.message || 'Failed to create policy');
        }
    };

    const handleDeletePolicy = async (id) => {
        if (!window.confirm('Are you sure you want to delete this escalation policy?')) return;
        try {
            await deleteEscalationPolicy(id);
            toast.success('Policy deleted successfully');
            fetchPolicies();
        } catch (error) {
            toast.error(error.message || 'Failed to delete policy');
        }
    };

    const renderConditionInput = (condition, index) => {
        if (condition.operator === 'IS_WEEKEND') {
            return (
                <span className="text-sm font-bold text-gray-400 bg-gray-100 px-3 py-2 rounded border border-gray-200 w-full inline-block">
                    [Automatic Match Rule]
                </span>
            );
        }
        if (condition.field === 'priority') {
            return (
                <select className="form-select flex-1" value={condition.value} onChange={(e) => handleConditionChange(index, 'value', e.target.value)}>
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                </select>
            );
        }
        return (
            <input type="text" className="form-input flex-1" value={condition.value} onChange={(e) => handleConditionChange(index, 'value', e.target.value)} placeholder="e.g. Database" />
        );
    };

    return (
        <Layout>
            <div className="escalation-page">
                <div className="page-header">
                    <div>
                        <h1 className="page-title flex items-center gap-2"><FaProjectDiagram /> Visual Policy Builder</h1>
                        <p className="page-description">Design complex IF/THEN routing paradigms and SLA overrides.</p>
                    </div>
                    <div>
                        {showForm ? (
                            <Button onClick={() => setShowForm(false)} variant="secondary" className="cancel-btn">Cancel Builder</Button>
                        ) : (
                            <Button onClick={() => setShowForm(true)} className="create-btn"><FaPlus style={{marginRight: '8px'}}/> Create Rule Array</Button>
                        )}
                    </div>
                </div>

                {showForm && (
                    <div className="policy-form-card premium-shadow">
                        <div className="form-header">
                            <h2 className="form-title">New Escalation Policy</h2>
                            <Button variant="secondary" onClick={applySlaBypassTemplate} className="template-btn">
                                ⚡ Try Example: DBA Override
                            </Button>
                        </div>
                        <form onSubmit={handleSubmit} className="policy-form">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">Policy Name</label>
                                    <input type="text" className="form-input custom-input" value={newPolicy.name} onChange={(e) => setNewPolicy({ ...newPolicy, name: e.target.value })} placeholder="e.g., Weekend Core DB Bypass" required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Match Logic</label>
                                    <select className="form-select custom-input" value={newPolicy.routingLogic} onChange={(e) => setNewPolicy({ ...newPolicy, routingLogic: e.target.value })}>
                                        <option value="ALL">AND (Match ALL conditions)</option>
                                        <option value="ANY">OR (Match ANY condition)</option>
                                        <option value="CUSTOM">Always Execute (No Conditions)</option>
                                    </select>
                                </div>
                            </div>

                            {/* --- VISUAL RULE BUILDER --- */}
                            <div className="rule-builder-section">
                                <h3 className="section-subtitle">
                                    <FaCodeBranch /> IF (Trigger Conditions)
                                </h3>
                                
                                {newPolicy.conditions.length === 0 ? (
                                    <div className="empty-rules-state">
                                        Runs on every incident automatically unless conditions are added.
                                    </div>
                                ) : (
                                    <div className="rules-list">
                                        {newPolicy.conditions.map((cond, idx) => (
                                            <div key={idx} className="rule-row">
                                                {idx > 0 && <div className="logic-badge">{newPolicy.routingLogic}</div>}
                                                
                                                <select className="form-select custom-input flex-1" value={cond.field} onChange={(e) => handleConditionChange(idx, 'field', e.target.value)}>
                                                    <option value="priority">Priority</option>
                                                    <option value="service">Service</option>
                                                    <option value="time">Time / Day</option>
                                                    <option value="status">Status</option>
                                                </select>

                                                <select className="form-select custom-input flex-1" value={cond.operator} onChange={(e) => handleConditionChange(idx, 'operator', e.target.value)}>
                                                    <option value="EQUALS">Equals</option>
                                                    <option value="NOT_EQUALS">Does Not Equal</option>
                                                    <option value="CONTAINS">Contains</option>
                                                    <option value="IS_WEEKEND">Is Weekend</option>
                                                </select>

                                                <div className="flex-2 rule-input-container">
                                                    {renderConditionInput(cond, idx)}
                                                </div>

                                                <button type="button" onClick={() => removeCondition(idx)} className="delete-btn">
                                                    <FaTrashAlt />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                <Button type="button" variant="secondary" onClick={addCondition} className="add-rule-btn">
                                    + Add AND Condition
                                </Button>
                            </div>

                            {/* --- THEN LOGIC --- */}
                            <div className="levels-section">
                                <h3 className="section-subtitle black-text">
                                    THEN (Escalation Path)
                                </h3>
                                <p className="section-hint">Set escalations to 0 minutes for an immediate SLA Bypass trigger.</p>
                                
                                <div className="levels-list">
                                    {newPolicy.levels.map((level, index) => (
                                        <div key={index} className="level-row">
                                            <div className="level-number-badge">
                                                {level.levelNumber}
                                            </div>
                                            
                                            <div className="level-wait-time">
                                                <label className="level-label">Wait Time</label>
                                                <div className="input-with-suffix">
                                                    <input
                                                        type="number"
                                                        className="form-input custom-input time-input"
                                                        value={level.escalateAfterMinutes}
                                                        onChange={(e) => handleLevelChange(index, 'escalateAfterMinutes', e.target.value)}
                                                        min="0"
                                                        required
                                                    />
                                                    <span className="suffix">min</span>
                                                </div>
                                            </div>
                                            
                                            <div className="level-target-role">
                                                <label className="level-label">Target Role / Group</label>
                                                <select
                                                    className="form-select custom-input target-select"
                                                    value={level.escalateToRole}
                                                    onChange={(e) => handleLevelChange(index, 'escalateToRole', e.target.value)}
                                                >
                                                    <option value="RESPONDER">L1 Responder Shift</option>
                                                    <option value="ADMIN">Senior Admin (L3)</option>
                                                </select>
                                            </div>

                                            {index > 0 && (
                                                <button type="button" onClick={() => removeLevel(index)} className="delete-btn">
                                                    <FaTrashAlt />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <Button type="button" variant="secondary" onClick={addLevel} className="add-rule-btn">
                                    + Add Next Tier Level
                                </Button>
                            </div>

                            <div className="form-footer">
                                <label className="default-checkbox-container">
                                    <input
                                        type="checkbox"
                                        checked={newPolicy.isDefault}
                                        onChange={(e) => setNewPolicy({ ...newPolicy, isDefault: e.target.checked })}
                                        className="global-checkbox"
                                    />
                                    <span>
                                        Mark as Global Default Rule
                                    </span>
                                </label>
                                <Button type="submit" className="deploy-btn">Deploy Ruleset</Button>
                            </div>
                        </form>
                    </div>
                )}

                {loading ? <LoadingSpinner /> : (
                    <div className="policies-grid">
                        {policies.length === 0 && !showForm && (
                            <div className="empty-policies">
                                <FaCodeBranch className="empty-icon" />
                                <h3>No Escalation Logics Built</h3>
                                <p>Create complex condition arrays to govern your alert paths.</p>
                            </div>
                        )}
                        {policies.map(policy => (
                            <div key={policy._id} className="premium-policy-card">
                                <div className="policy-card-header">
                                    <div className="policy-info">
                                        <h2>
                                            {policy.name} {policy.isDefault && <span className="default-badge">Global Default</span>}
                                        </h2>
                                        {policy.description && <p>{policy.description}</p>}
                                    </div>
                                    <button type="button" className="card-delete-btn" onClick={() => handleDeletePolicy(policy._id)} title="Delete Policy">
                                        <FaTrashAlt />
                                    </button>
                                </div>
                                <div className="policy-card-body">
                                    {/* Show Conditions */}
                                    {policy.conditions && policy.conditions.length > 0 && (
                                        <div className="conditions-preview">
                                            <div className="conditions-title">If Matches {policy.routingLogic}:</div>
                                            <div className="conditions-tags">
                                                {policy.conditions.map((c, i) => (
                                                    <span key={i} className="condition-tag">
                                                        <strong>{c.field}</strong> {c.operator.toLowerCase().replace('_',' ')} <strong>{c.value}</strong>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Timeline preview */}
                                    <div className="timeline-preview">
                                        <div className="timeline-line"></div>
                                        {policy.levels.map((l, i) => (
                                            <div key={i} className="timeline-item premium-timeline">
                                                <div className="level-num">
                                                    {l.levelNumber}
                                                </div>
                                                <div className="level-details">
                                                    {l.escalateAfterMinutes === 0 ? (
                                                        <span className="immediate-bypass">⚡ IMMEDIATE BYPASS to {l.escalateToRole}</span>
                                                    ) : (
                                                        <span>Escalate to <strong>{l.escalateToRole}</strong> after {l.escalateAfterMinutes} min</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default EscalationPolicyPage;
