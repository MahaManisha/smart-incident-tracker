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
            toast.error(error.response?.data?.message || 'Failed to create policy');
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
                            <Button onClick={() => setShowForm(false)} variant="secondary">Cancel Builder</Button>
                        ) : (
                            <Button onClick={() => setShowForm(true)}><FaPlus className="mr-2"/> Create Rule Array</Button>
                        )}
                    </div>
                </div>

                {showForm && (
                    <div className="policy-form-card card-compact p-8 mb-8 border-t-4 border-blue-500 shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">New Escalation Policy</h2>
                            <Button variant="secondary" size="sm" onClick={applySlaBypassTemplate}>
                                ⚡ Try Example: DBA Weekend Override
                            </Button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="form-group col-span-2 md:col-span-1">
                                    <label className="form-label text-sm font-bold text-gray-700">Policy Name</label>
                                    <input type="text" className="form-input" value={newPolicy.name} onChange={(e) => setNewPolicy({ ...newPolicy, name: e.target.value })} placeholder="e.g., Weekend Core DB Bypass" required />
                                </div>
                                <div className="form-group col-span-2 md:col-span-1">
                                    <label className="form-label text-sm font-bold text-gray-700">Match Logic</label>
                                    <select className="form-select" value={newPolicy.routingLogic} onChange={(e) => setNewPolicy({ ...newPolicy, routingLogic: e.target.value })}>
                                        <option value="ALL">AND (Match ALL conditions)</option>
                                        <option value="ANY">OR (Match ANY condition)</option>
                                        <option value="CUSTOM">Always Execute (No Conditions)</option>
                                    </select>
                                </div>
                            </div>

                            {/* --- VISUAL RULE BUILDER --- */}
                            <div className="rule-builder-section bg-blue-50/50 p-6 rounded-lg border border-blue-100 mb-8 mt-2 shadow-inner">
                                <h3 className="text-md font-bold mb-4 flex items-center gap-2 text-blue-800">
                                    <FaCodeBranch /> IF (Trigger Conditions)
                                </h3>
                                
                                {newPolicy.conditions.length === 0 ? (
                                    <div className="text-center py-4 bg-white rounded border border-dashed border-gray-300 text-gray-500 text-sm">
                                        Runs on every incident automatically unless conditions are added.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {newPolicy.conditions.map((cond, idx) => (
                                            <div key={idx} className="condition-row flex gap-3 items-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm relative">
                                                {idx > 0 && <div className="absolute -top-3 left-6 text-xs font-bold text-blue-600 bg-blue-100 px-2 rounded">{newPolicy.routingLogic}</div>}
                                                
                                                <select className="form-select flex-1 max-w-[150px]" value={cond.field} onChange={(e) => handleConditionChange(idx, 'field', e.target.value)}>
                                                    <option value="priority">Priority</option>
                                                    <option value="service">Service</option>
                                                    <option value="time">Time / Day</option>
                                                    <option value="status">Status</option>
                                                </select>

                                                <select className="form-select flex-1 max-w-[150px]" value={cond.operator} onChange={(e) => handleConditionChange(idx, 'operator', e.target.value)}>
                                                    <option value="EQUALS">Equals</option>
                                                    <option value="NOT_EQUALS">Does Not Equal</option>
                                                    <option value="CONTAINS">Contains</option>
                                                    <option value="IS_WEEKEND">Is Weekend</option>
                                                </select>

                                                <div className="flex-1">
                                                    {renderConditionInput(cond, idx)}
                                                </div>

                                                <button type="button" onClick={() => removeCondition(idx)} className="text-red-400 hover:text-red-600 p-2">
                                                    <FaTrashAlt />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                <Button type="button" variant="secondary" size="sm" onClick={addCondition} className="mt-4 bg-white">
                                    + Add AND Condition
                                </Button>
                            </div>

                            {/* --- THEN LOGIC --- */}
                            <div className="levels-section p-6 rounded-lg border border-gray-200 mb-6 bg-gray-50/30">
                                <h3 className="text-md font-bold mb-4 flex items-center gap-2 text-gray-800">
                                    THEN (Escalation Path)
                                </h3>
                                <p className="text-sm text-gray-500 mb-4">Set escalations to 0 minutes for an immediate SLA Bypass trigger.</p>
                                
                                <div className="space-y-3">
                                    {newPolicy.levels.map((level, index) => (
                                        <div key={index} className="level-row flex gap-4 items-end bg-white p-4 rounded border border-gray-200 shadow-sm relative pl-10">
                                            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gray-100 flex items-center justify-center font-bold text-gray-400 border-r border-gray-200 rounded-l">
                                                {level.levelNumber}
                                            </div>
                                            
                                            <div className="w-32">
                                                <label className="text-xs font-bold text-gray-600 uppercase">Wait Time</label>
                                                <div className="flex items-center">
                                                    <input
                                                        type="number"
                                                        className="form-input w-full text-center pr-1"
                                                        value={level.escalateAfterMinutes}
                                                        onChange={(e) => handleLevelChange(index, 'escalateAfterMinutes', e.target.value)}
                                                        min="0"
                                                        required
                                                    />
                                                    <span className="text-xs text-gray-500 ml-2">min</span>
                                                </div>
                                            </div>
                                            
                                            <div className="flex-1">
                                                <label className="text-xs font-bold text-gray-600 uppercase">Target Role / Group</label>
                                                <select
                                                    className="form-select w-full font-semibold"
                                                    value={level.escalateToRole}
                                                    onChange={(e) => handleLevelChange(index, 'escalateToRole', e.target.value)}
                                                >
                                                    <option value="RESPONDER">L1 Responder Shift</option>
                                                    <option value="ADMIN">Senior Admin (L3)</option>
                                                </select>
                                            </div>

                                            {index > 0 && (
                                                <button type="button" onClick={() => removeLevel(index)} className="text-red-400 hover:text-red-600 p-2 border border-transparent hover:border-red-100 rounded">
                                                    <FaTrashAlt />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <Button type="button" variant="secondary" size="sm" onClick={addLevel} className="mt-4 bg-white">
                                    + Add Next Tier Level
                                </Button>
                            </div>

                            <div className="border-t border-gray-200 pt-6 mt-6 flex justify-between items-center bg-gray-50 -mx-8 -mb-8 p-8 rounded-b-xl">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={newPolicy.isDefault}
                                        onChange={(e) => setNewPolicy({ ...newPolicy, isDefault: e.target.checked })}
                                        className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                    />
                                    <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">
                                        Mark as Global Default Rule
                                    </span>
                                </label>
                                <Button type="submit" size="large" className="px-8 shadow-md">Deploy Ruleset</Button>
                            </div>
                        </form>
                    </div>
                )}

                {loading ? <LoadingSpinner /> : (
                    <div className="policies-grid grid gap-6">
                        {policies.length === 0 && !showForm && (
                            <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
                                <FaCodeBranch className="mx-auto text-4xl text-gray-300 mb-4" />
                                <h3 className="text-xl font-medium text-gray-600">No Escalation Logics Built</h3>
                                <p className="text-gray-400 mt-2">Create complex condition arrays to govern your alert paths.</p>
                            </div>
                        )}
                        {policies.map(policy => (
                            <div key={policy._id} className="policy-card card-compact overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-start">
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                            {policy.name} {policy.isDefault && <span className="text-[10px] font-bold bg-green-100 text-green-800 px-2 py-1 rounded tracking-wider uppercase">Default</span>}
                                        </h2>
                                        {policy.description && <p className="text-sm text-gray-500 mt-1">{policy.description}</p>}
                                    </div>
                                    <Button variant="danger" size="sm" onClick={() => deleteEscalationPolicy(policy._id)} className="opacity-50 hover:opacity-100">
                                        <FaTrashAlt />
                                    </Button>
                                </div>
                                <div className="p-4 bg-white">
                                    {/* Show Conditions */}
                                    {policy.conditions && policy.conditions.length > 0 && (
                                        <div className="mb-4 bg-blue-50/50 p-3 rounded border border-blue-100">
                                            <div className="text-xs font-bold text-blue-800 uppercase tracking-widest mb-2 opacity-70">If Matches {policy.routingLogic}:</div>
                                            <div className="flex flex-wrap gap-2">
                                                {policy.conditions.map((c, i) => (
                                                    <span key={i} className="text-xs bg-white border border-blue-200 text-blue-700 px-2 py-1 rounded shadow-sm">
                                                        <strong>{c.field}</strong> {c.operator.toLowerCase().replace('_',' ')} <strong>{c.value}</strong>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Timeline preview */}
                                    <div className="timeline-preview relative pl-4 mt-2">
                                        <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-gray-200"></div>
                                        {policy.levels.map((l, i) => (
                                            <div key={i} className="relative mb-3 last:mb-0 flex items-center gap-3">
                                                <div className="w-5 h-5 rounded-full bg-white border-2 border-gray-300 z-10 flex items-center justify-center text-[10px] font-bold text-gray-500 shadow-sm">
                                                    {l.levelNumber}
                                                </div>
                                                <div className="bg-gray-50 border border-gray-100 rounded p-2 text-sm flex-1">
                                                    {l.escalateAfterMinutes === 0 ? (
                                                        <span className="font-bold text-red-600">⚡ IMMEDIATE BYPASS to {l.escalateToRole}</span>
                                                    ) : (
                                                        <span>Escalate to <strong className="text-gray-800">{l.escalateToRole}</strong> after {l.escalateAfterMinutes} min</span>
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
