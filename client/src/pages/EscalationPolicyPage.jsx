import React, { useState, useEffect } from 'react';
import Layout from '../components/common/Layout';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { getEscalationPolicies, createEscalationPolicy, deleteEscalationPolicy } from '../api/escalationApi';
import { toast } from 'react-toastify';
import './EscalationPolicyPage.css';

const EscalationPolicyPage = () => {
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [newPolicy, setNewPolicy] = useState({
        name: '',
        isDefault: false,
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

    const handleLevelChange = (index, field, value) => {
        const updatedLevels = [...newPolicy.levels];
        updatedLevels[index][field] = field === 'escalateAfterMinutes' ? parseInt(value) : value;
        setNewPolicy({ ...newPolicy, levels: updatedLevels });
    };

    const addLevel = () => {
        const nextLevel = newPolicy.levels.length + 1;
        setNewPolicy({
            ...newPolicy,
            levels: [...newPolicy.levels, { levelNumber: nextLevel, escalateAfterMinutes: 30, escalateToRole: 'ADMIN' }]
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createEscalationPolicy(newPolicy);
            toast.success('Policy created successfully');
            setShowForm(false);
            fetchPolicies();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create policy');
        }
    };

    return (
        <Layout>
            <div className="escalation-page">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Escalation Policies</h1>
                        <p className="page-description">Define how incidents move across support levels</p>
                    </div>
                    <Button onClick={() => setShowForm(!showForm)}>
                        {showForm ? 'Cancel' : 'Create Policy'}
                    </Button>
                </div>

                {showForm && (
                    <div className="policy-form-card card-compact p-6 mb-8">
                        <form onSubmit={handleSubmit}>
                            <div className="form-group mb-4">
                                <label className="form-label">Policy Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={newPolicy.name}
                                    onChange={(e) => setNewPolicy({ ...newPolicy, name: e.target.value })}
                                    placeholder="e.g., Critical Infrastructure Policy"
                                    required
                                />
                            </div>

                            <div className="levels-section border-t pt-4 mt-4">
                                <h3 className="text-md font-bold mb-4">Escalation Levels</h3>
                                {newPolicy.levels.map((level, index) => (
                                    <div key={index} className="level-row flex gap-4 items-end mb-4 bg-tertiary p-3 rounded">
                                        <div className="w-16">
                                            <label className="text-xs">Level</label>
                                            <input type="text" className="form-input" value={level.levelNumber} disabled />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-xs">After (minutes)</label>
                                            <input
                                                type="number"
                                                className="form-input"
                                                value={level.escalateAfterMinutes}
                                                onChange={(e) => handleLevelChange(index, 'escalateAfterMinutes', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-xs">Target Role</label>
                                            <select
                                                className="form-select"
                                                value={level.escalateToRole}
                                                onChange={(e) => handleLevelChange(index, 'escalateToRole', e.target.value)}
                                            >
                                                <option value="RESPONDER">Responder</option>
                                                <option value="ADMIN">Admin</option>
                                            </select>
                                        </div>
                                    </div>
                                ))}
                                <Button type="button" variant="secondary" size="sm" onClick={addLevel}>
                                    + Add Level
                                </Button>
                            </div>

                            <div className="mt-8 flex gap-4">
                                <Button type="submit">Save Policy</Button>
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={newPolicy.isDefault}
                                        onChange={(e) => setNewPolicy({ ...newPolicy, isDefault: e.target.checked })}
                                    />
                                    Set as Default
                                </label>
                            </div>
                        </form>
                    </div>
                )}

                {loading ? <LoadingSpinner /> : (
                    <div className="policies-grid grid gap-6">
                        {policies.map(policy => (
                            <div key={policy._id} className="policy-card card-compact p-4">
                                <div className="flex justify-between items-start mb-4">
                                    <h2 className="text-lg font-bold">
                                        {policy.name} {policy.isDefault && <span className="default-badge">DEFAULT</span>}
                                    </h2>
                                </div>
                                <div className="timeline-preview">
                                    {policy.levels.map((l, i) => (
                                        <div key={i} className="timeline-item">
                                            <span className="level-num">L{l.levelNumber}</span>
                                            <span className="level-details">
                                                Escalate after {l.escalateAfterMinutes}m to {l.escalateToRole}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 pt-4 border-t flex justify-end">
                                    <Button variant="danger" size="sm" onClick={() => deleteEscalationPolicy(policy._id)}>
                                        Delete
                                    </Button>
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
