import React, { useState, useEffect } from 'react';
import { FaCheck, FaInfoCircle, FaClock, FaCalendarTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import './SLAForm.css';

const STEPS = [
    { id: 1, title: 'Basic Info' },
    { id: 2, title: 'Scope' },
    { id: 3, title: 'Time Targets' },
    { id: 4, title: 'Escalations' }
];

const DEFAULT_TARGETS = [
    { priority: 'CRITICAL', responseTime: 15, resolutionTime: 240, businessHours: false },
    { priority: 'HIGH', responseTime: 60, resolutionTime: 480, businessHours: false },
    { priority: 'MEDIUM', responseTime: 240, resolutionTime: 1440, businessHours: true },
    { priority: 'LOW', responseTime: 480, resolutionTime: 2880, businessHours: true },
];

const SLAForm = ({ initialData, onSave, onCancel, loading }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        isActive: true,
        policyPriority: 10,
        scope: {
            service: [],
            incidentType: [],
            priority: [],
            department: [],
            team: [],
            timezone: 'UTC'
        },
        targets: DEFAULT_TARGETS,
        escalations: [],
        breachRules: {
            autoActions: [],
            allowOverride: true
        }
    });

    useEffect(() => {
        if (initialData) {
            const derivedTargets = DEFAULT_TARGETS.map(def => {
                const existing = initialData.targets?.find(t => t.priority === def.priority);
                return existing ? { ...existing } : def;
            });

            setFormData({
                ...initialData,
                policyPriority: initialData.policyPriority || 10,
                scope: {
                    service: initialData.scope?.service || [],
                    incidentType: initialData.scope?.incidentType || [],
                    priority: initialData.scope?.priority || [],
                    department: initialData.scope?.department || [],
                    team: initialData.scope?.team || [],
                    timezone: initialData.scope?.timezone || 'UTC'
                },
                targets: derivedTargets,
                escalations: initialData.escalations || [],
                breachRules: initialData.breachRules || { autoActions: [], allowOverride: true }
            });
        }
    }, [initialData]);

    const handleScopeChange = (field, value, isAdd) => {
        setFormData(prev => {
            const currentList = prev.scope[field] || [];
            let newList;
            if (isAdd) {
                if (value && !currentList.includes(value)) newList = [...currentList, value];
                else newList = currentList;
            } else {
                newList = currentList.filter(item => item !== value);
            }
            return { ...prev, scope: { ...prev.scope, [field]: newList } };
        });
    };

    const TagInput = ({ label, items = [], onAdd, onRemove, placeholder, options }) => {
        const [input, setInput] = useState('');

        const handleKeyDown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (input.trim()) {
                    onAdd(input.trim());
                    setInput('');
                }
            }
        };

        return (
            <div className="sla-form-group">
                <label className="sla-form-label">{label}</label>
                <div className="sla-tags-container">
                    {items && items.length > 0 ? items.map((item, idx) => (
                        <span key={idx} className="sla-tag">
                            {item}
                            <button type="button" onClick={() => onRemove(item)} className="sla-tag-remove">×</button>
                        </span>
                    )) : (
                        <span className="sla-tag-empty">Applies to everything</span>
                    )}
                </div>
                {options ? (
                    <select
                        className="sla-input"
                        onChange={(e) => {
                            if (e.target.value) onAdd(e.target.value);
                            e.target.value = '';
                        }}
                        defaultValue=""
                    >
                        <option value="" disabled hidden>Select {label.toLowerCase()}...</option>
                        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                ) : (
                    <div className="sla-input-with-button">
                        <input
                            type="text"
                            className="sla-input"
                            placeholder={placeholder}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        <button 
                            type="button" 
                            onClick={() => { if (input.trim()) { onAdd(input.trim()); setInput(''); } }} 
                            className="sla-add-btn"
                        >
                            Add
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const validateStep = (step) => {
        if (step === 1) {
            if (!formData.name) { toast.error('Policy Name is required'); return false; }
            if (!formData.description || formData.description.length < 20) { toast.error('Description must be at least 20 chars'); return false; }
            if (formData.policyPriority < 0) { toast.error('Priority must be positive'); return false; }
        }
        return true;
    };

    const nextStep = () => {
        if (validateStep(currentStep)) setCurrentStep(prev => Math.min(prev + 1, 4));
    };

    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    const renderBasicInfo = () => (
        <div className="sla-form-section">
            <div className="sla-section-title">
                <h3>Basic Information</h3>
                <p>Provide a clear name and structural details for this policy.</p>
            </div>

            <div className="sla-form-group">
                <label className="sla-form-label">Policy Name</label>
                <input
                    type="text"
                    className="sla-input"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Application Core Services SLA"
                    autoFocus
                />
                <div className="sla-helper-text">
                    <FaInfoCircle /> A unique name for reports and dashboard metrics.
                </div>
            </div>

            <div className="sla-form-group">
                <label className="sla-form-label">Detailed Description</label>
                <textarea
                    rows="3"
                    className="sla-input"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the purpose, specific goals, and why this policy applies..."
                    style={{ resize: 'vertical' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                    <div className="sla-helper-text">Minimum 20 characters required.</div>
                    <span className={`sla-char-count ${formData.description.length >= 20 ? 'valid' : ''}`}>
                        {formData.description.length} / 20
                    </span>
                </div>
            </div>

            <div className="sla-grid-2">
                <div className="sla-boxed-field">
                    <label className="sla-form-label">Evaluation Priority (Level)</label>
                    <input
                        type="number"
                        min="0"
                        className="sla-input"
                        value={formData.policyPriority}
                        onChange={e => setFormData({ ...formData, policyPriority: parseInt(e.target.value) })}
                        style={{ textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}
                    />
                    <div className="sla-helper-text" style={{ marginTop: '12px', color: 'var(--primary-color)' }}>
                        <strong>Lower value = Higher Precedence.</strong> <br/>
                        Overrules conflicting policies.
                    </div>
                </div>

                <div className="sla-boxed-field">
                    <div className="sla-toggle-container">
                        <label className="sla-form-label" style={{ marginBottom: '16px' }}>Execution Status</label>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                            className={`sla-toggle ${formData.isActive ? 'active' : ''}`}
                            role="switch"
                            aria-checked={formData.isActive}
                        >
                            <span className="sla-toggle-circle" />
                        </button>
                        <div className={`sla-toggle-label ${formData.isActive ? 'active' : ''}`}>
                            {formData.isActive ? 'Active & Enforced' : 'Paused (Draft Mode)'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderScope = () => (
        <div className="sla-form-section">
            <div className="sla-section-title">
                <h3>Scope of Applicability</h3>
                <div className="sla-info-banner">
                    <FaInfoCircle size={20} />
                    <span>Provide criteria to filter. Leave a category empty to apply to ALL matching conditions.</span>
                </div>
            </div>

            <div className="sla-grid-2">
                <div style={{ gridColumn: '1 / -1' }}>
                    <TagInput
                        label="Eligible Incident Types"
                        items={formData.scope.incidentType}
                        onAdd={(val) => handleScopeChange('incidentType', val, true)}
                        onRemove={(val) => handleScopeChange('incidentType', val, false)}
                        options={['Security', 'Infrastructure', 'Application', 'Database', 'Network']}
                    />
                </div>
                
                <TagInput
                    label="Governed Priorities"
                    items={formData.scope.priority}
                    onAdd={(val) => handleScopeChange('priority', val, true)}
                    onRemove={(val) => handleScopeChange('priority', val, false)}
                    options={['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']}
                />
                <TagInput
                    label="Affected Services"
                    items={formData.scope.service}
                    onAdd={(val) => handleScopeChange('service', val, true)}
                    onRemove={(val) => handleScopeChange('service', val, false)}
                    placeholder="e.g., Auth API"
                />
                
                <TagInput
                    label="Assigned Teams"
                    items={formData.scope.team}
                    onAdd={(val) => handleScopeChange('team', val, true)}
                    onRemove={(val) => handleScopeChange('team', val, false)}
                    placeholder="e.g., DevOps"
                />
                <TagInput
                    label="Relevant Departments"
                    items={formData.scope.department}
                    onAdd={(val) => handleScopeChange('department', val, true)}
                    onRemove={(val) => handleScopeChange('department', val, false)}
                    placeholder="e.g., Engineering"
                />
            </div>
        </div>
    );

    const renderTimeTargets = () => (
        <div className="sla-form-section">
            <div className="sla-section-title">
                <h3>Time Limits & Milestones</h3>
                <p>Specify precisely how quickly your team must act when disaster strikes.</p>
            </div>

            <div>
                {formData.targets.map((target, idx) => (
                    <div key={target.priority} className={`sla-target-card ${target.priority}`}>
                        <div className="sla-target-header">
                            <span className={`sla-badge ${target.priority}`}>
                                {target.priority} Priority
                            </span>
                            
                            <label className="sla-checkbox-wrapper">
                                <input
                                    type="checkbox"
                                    checked={target.businessHours}
                                    onChange={(e) => {
                                        const newTargets = [...formData.targets];
                                        newTargets[idx].businessHours = e.target.checked;
                                        setFormData({ ...formData, targets: newTargets });
                                    }}
                                />
                                <FaCalendarTimes /> Wait for Business Hours
                            </label>
                        </div>

                        {target.businessHours && (
                            <div className="sla-info-banner">
                                <FaClock /> The timer for {target.priority} tickets pauses on weekends.
                            </div>
                        )}

                        <div className="sla-grid-2">
                            <div>
                                <label className="sla-form-label">Max Response Delay (min)</label>
                                <div className="sla-input-wrapper">
                                    <input
                                        type="number"
                                        min="1"
                                        className="sla-input"
                                        style={{ fontWeight: 'bold' }}
                                        value={target.responseTime}
                                        onChange={(e) => {
                                            const newTargets = [...formData.targets];
                                            newTargets[idx].responseTime = parseInt(e.target.value);
                                            setFormData({ ...formData, targets: newTargets });
                                        }}
                                    />
                                    <span className="sla-input-suffix">MIN</span>
                                </div>
                            </div>
                            <div>
                                <label className="sla-form-label">Resolution Deadline (min)</label>
                                <div className="sla-input-wrapper">
                                    <input
                                        type="number"
                                        min="1"
                                        className="sla-input"
                                        style={{ fontWeight: 'bold' }}
                                        value={target.resolutionTime}
                                        onChange={(e) => {
                                            const newTargets = [...formData.targets];
                                            newTargets[idx].resolutionTime = parseInt(e.target.value);
                                            setFormData({ ...formData, targets: newTargets });
                                        }}
                                    />
                                    <span className="sla-input-suffix">MIN</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderEscalations = () => (
        <div className="sla-form-section">
            <div className="sla-boxed-field" style={{ textAlign: 'center', padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '80px', height: '80px', background: 'var(--blue-50)', color: 'var(--primary-color)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                    <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '16px', color: 'var(--slate-900)' }}>Auto-Escalation Framework</h3>
                <p style={{ color: 'var(--slate-500)', maxWidth: '500px', lineHeight: '1.6' }}>
                    Custom escalation matrices directly inside SLAs are currently being upgraded. The global multi-tier escalation policies will automatically handle routing based on incidence priority.
                </p>
                <div style={{ marginTop: '32px', padding: '8px 24px', background: 'var(--slate-200)', color: 'var(--slate-700)', borderRadius: '99px', fontWeight: 'bold', fontSize: '0.875rem' }}>
                    Smart Tiers Active
                </div>
            </div>
        </div>
    );

    return (
        <div className="sla-form-wrapper scale-in">
            <div className="sla-form-header">
                <h1>{initialData ? 'Update SLA Blueprint' : 'Architect SLA Blueprint'}</h1>
                <p>{initialData ? 'Refine the thresholds and conditions for this policy.' : 'Design intelligent service rules that will automatically hold your responders accountable.'}</p>
            </div>

            <div className="sla-stepper-container">
                <div className="sla-stepper">
                    <div className="sla-stepper-line-bg"></div>
                    <div 
                        className="sla-stepper-line-active"
                        style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
                    ></div>

                    {STEPS.map((step) => {
                        const isCompleted = currentStep > step.id;
                        const isActive = currentStep === step.id;

                        return (
                            <div key={step.id} className={`sla-step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                                <div className="sla-step-circle">
                                    {isCompleted ? <FaCheck /> : step.id}
                                </div>
                                <div className="sla-step-title">{step.title}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="sla-form-card mt-12" style={{ marginTop: '64px' }}>
                <div className="sla-form-body">
                    {currentStep === 1 && renderBasicInfo()}
                    {currentStep === 2 && renderScope()}
                    {currentStep === 3 && renderTimeTargets()}
                    {currentStep === 4 && renderEscalations()}
                </div>

                <div className="sla-form-footer">
                    <button
                        type="button"
                        onClick={currentStep === 1 ? onCancel : prevStep}
                        className="sla-btn-back"
                    >
                        <span className="sla-btn-back-sub">{currentStep === 1 ? 'Discard Action' : 'Return to previous'}</span>
                        <span className="sla-btn-back-main">
                            {currentStep !== 1 && '← '}
                            {currentStep === 1 ? 'Cancel Setup' : 'Go Back'}
                        </span>
                    </button>

                    {currentStep < 4 ? (
                        <button type="button" onClick={nextStep} className="sla-btn-next">
                            Continue Setup →
                        </button>
                    ) : (
                        <button 
                            type="button" 
                            onClick={handleSubmit} 
                            disabled={loading} 
                            className={`sla-btn-submit ${loading ? 'loading' : ''}`}
                        >
                            {loading ? (
                                <span className="sla-btn-text">Publishing Blueprint...</span>
                            ) : (
                                <>
                                    <FaCheck style={{ marginRight: '8px' }} />
                                    <span className="sla-btn-text">Finalize & Deploy Policy</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SLAForm;
