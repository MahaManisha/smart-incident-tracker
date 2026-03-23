import React, { useState, useEffect } from 'react';
import Button from '../common/Button';
import { FaArrowRight, FaArrowLeft, FaCheck } from 'react-icons/fa';
import { toast } from 'react-toastify';

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
            priority: [], // CRITICAL, HIGH, MEDIUM, LOW
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
                    team: initialData.scope?.team || [], // Safe default
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

    // Reusable Tag Input Component
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
            <div className="form-group mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
                <div className="flex flex-wrap gap-2 mb-3 min-h-[36px] p-1 border border-gray-200 rounded-md bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                    {items && items.length > 0 ? items.map((item, idx) => (
                        <span key={idx} className="inline-flex items-center px-2 py-1 rounded bg-blue-50 text-blue-700 text-sm border border-blue-100">
                            {item}
                            <button type="button" onClick={() => onRemove(item)} className="ml-2 text-blue-400 hover:text-blue-600 font-bold focus:outline-none">×</button>
                        </span>
                    )) : (
                        <span className="text-gray-400 text-sm italic py-1 px-2 pointer-events-none">Applies to all</span>
                    )}
                </div>
                {options ? (
                    <div className="flex gap-2">
                        <select
                            className="form-select block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 bg-white"
                            onChange={(e) => {
                                if (e.target.value) onAdd(e.target.value);
                                e.target.value = '';
                            }}
                        >
                            <option value="">Select an option to add...</option>
                            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <input
                            type="text"
                            className="form-input block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3"
                            placeholder={placeholder}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        <button type="button" onClick={() => { if (input.trim()) { onAdd(input.trim()); setInput(''); } }} className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm font-medium transition-colors">Add</button>
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

    // --- RENDER SECTIONS ---

    const renderBasicInfo = () => (
        <div className="space-y-8 animate-fadeIn">
            <div>
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-6">Basic Information</h3>

                {/* Policy Name */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Policy Name</label>
                    <input
                        type="text"
                        className="block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all py-2.5 px-3"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Global Standard SLA"
                        autoFocus
                    />
                    <p className="mt-1 text-xs text-gray-500">A clear, unique name for identifying this policy in reports.</p>
                </div>

                {/* Description */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                    <textarea
                        rows="3"
                        className="block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all py-2.5 px-3"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Describe the purpose, scope, and key targets of this policy..."
                    />
                    <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-gray-500">Minimum 20 characters required.</p>
                        <span className={`text-xs font-medium ${formData.description.length >= 20 ? 'text-green-600' : 'text-gray-400'}`}>
                            {formData.description.length} / 20
                        </span>
                    </div>
                </div>

                {/* Grid for Priority and Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Priority */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Policy Priority</label>
                        <div className="relative rounded-md shadow-sm">
                            <input
                                type="number"
                                min="0"
                                className="block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all py-2.5 px-3 pl-3 pr-12"
                                value={formData.policyPriority}
                                onChange={e => setFormData({ ...formData, policyPriority: parseInt(e.target.value) })}
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <span className="text-gray-400 text-sm">Value</span>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Lower number = <strong>Higher Precedence</strong>. <br />
                            Used to resolve conflicts when multiple policies match.
                        </p>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Initial Status</label>
                        <div className="flex items-center h-[42px]">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                                className={`${formData.isActive ? 'bg-green-600' : 'bg-gray-200'
                                    } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                                role="switch"
                                aria-checked={formData.isActive}
                            >
                                <span
                                    aria-hidden="true"
                                    className={`${formData.isActive ? 'translate-x-5' : 'translate-x-0'
                                        } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                                />
                            </button>
                            <span className="ml-3 text-sm font-medium text-gray-900">
                                {formData.isActive ? 'Active (Policy will be enforced)' : 'Inactive (Draft mode)'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderScope = () => (
        <div className="space-y-8 animate-fadeIn">
            <div>
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-6">Scope of Applicability</h3>
                <p className="text-sm text-gray-500 mb-6 bg-blue-50 p-4 rounded-md border border-blue-100">
                    Define the criteria that trigger this SLA. Leave a field empty to apply to <strong>ALL</strong> values for that category.
                </p>

                <div className="space-y-6">
                    <TagInput
                        label="Incident Types"
                        items={formData.scope.incidentType}
                        onAdd={(val) => handleScopeChange('incidentType', val, true)}
                        onRemove={(val) => handleScopeChange('incidentType', val, false)}
                        placeholder="e.g., Security, Infrastructure"
                        options={['Security', 'Infrastructure', 'Application', 'Database', 'Network']}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <TagInput
                            label="Priorities"
                            items={formData.scope.priority}
                            onAdd={(val) => handleScopeChange('priority', val, true)}
                            onRemove={(val) => handleScopeChange('priority', val, false)}
                            options={['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']}
                        />
                        <TagInput
                            label="Services"
                            items={formData.scope.service}
                            onAdd={(val) => handleScopeChange('service', val, true)}
                            onRemove={(val) => handleScopeChange('service', val, false)}
                            placeholder="e.g., Auth Service, Payment Gateway"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <TagInput
                            label="Target Teams"
                            items={formData.scope.team}
                            onAdd={(val) => handleScopeChange('team', val, true)}
                            onRemove={(val) => handleScopeChange('team', val, false)}
                            placeholder="e.g., DevOps, SRE"
                        />
                        <TagInput
                            label="Target Departments"
                            items={formData.scope.department}
                            onAdd={(val) => handleScopeChange('department', val, true)}
                            onRemove={(val) => handleScopeChange('department', val, false)}
                            placeholder="e.g., Engineering, IT Support"
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    const renderTimeTargets = () => (
        <div className="space-y-8 animate-fadeIn">
            <div>
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-6">SLA Time Targets</h3>

                <div className="space-y-6">
                    {formData.targets.map((target, idx) => (
                        <div key={target.priority} className="p-5 border border-gray-200 rounded-lg bg-gray-50">
                            <div className="flex items-center justify-between mb-4">
                                <span className={`font-bold px-3 py-1 rounded text-sm ${target.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                                    target.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                                        target.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-blue-100 text-blue-800'
                                    }`}>
                                    {target.priority} Priority
                                </span>
                                <label className="flex items-center text-sm font-bold text-gray-700 bg-white px-3 py-1.5 border border-gray-200 rounded cursor-pointer hover:bg-gray-50">
                                    <input
                                        type="checkbox"
                                        className="mr-2 rounded text-blue-600 focus:ring-blue-500"
                                        checked={target.businessHours}
                                        onChange={(e) => {
                                            const newTargets = [...formData.targets];
                                            newTargets[idx].businessHours = e.target.checked;
                                            setFormData({ ...formData, targets: newTargets });
                                        }}
                                    />
                                    Pause SLA on Weekends (Business Hours Only)
                                </label>
                            </div>

                            {/* Info tooltip banner if business hours is true */}
                            {target.businessHours && (
                                <div className="mb-4 text-xs font-semibold text-blue-800 bg-blue-50 p-2 rounded border border-blue-100 flex items-center gap-2">
                                    <span className="text-lg">⏸</span> 
                                    SLAs for {target.priority} tickets will freeze at 5:00 PM Friday and resume at 9:00 AM Monday.
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Response Time (min)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        className="block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 bg-white"
                                        value={target.responseTime}
                                        onChange={(e) => {
                                            const newTargets = [...formData.targets];
                                            newTargets[idx].responseTime = parseInt(e.target.value);
                                            setFormData({ ...formData, targets: newTargets });
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Resolution Time (min)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        className="block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 bg-white"
                                        value={target.resolutionTime}
                                        onChange={(e) => {
                                            const newTargets = [...formData.targets];
                                            newTargets[idx].resolutionTime = parseInt(e.target.value);
                                            setFormData({ ...formData, targets: newTargets });
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderEscalations = () => (
        <div className="space-y-8 animate-fadeIn">
            <div>
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-6">Escalation Rules</h3>
                <p className="text-sm text-gray-500 mb-6">Currently, escalation rules are managed via the standard policy engine. Advanced configuration coming soon.</p>

                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex">
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                                Escalations are currently disabled in this simplified wizard. Default system escalations will apply based on priority.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="max-w-[800px] mx-auto pb-24 pt-6">

            {/* Page Title for Context */}
            <div className="text-center mb-10">
                <h1 className="text-2xl font-bold text-gray-900">
                    {initialData ? 'Edit SLA Policy' : 'Create SLA Policy'}
                </h1>
                <p className="text-gray-500 mt-2">
                    {initialData ? 'Modify existing policy rules and targets.' : 'Define a new service level agreement policy.'}
                </p>
            </div>

            {/* Horizontal Stepper */}
            <div className="mb-10 px-4">
                <div className="flex items-center justify-between relative">
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 -z-10 rounded"></div>
                    {STEPS.map((step, index) => {
                        const isCompleted = currentStep > step.id;
                        const isActive = currentStep === step.id;

                        return (
                            <div key={step.id} className="flex flex-col items-center bg-transparent px-2">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-200 z-10 ${isActive ? 'bg-blue-600 border-blue-600 text-white shadow-md scale-110' :
                                        isCompleted ? 'bg-green-500 border-green-500 text-white' :
                                            'bg-white border-gray-300 text-gray-400'
                                        }`}
                                >
                                    {isCompleted ? <FaCheck size={14} /> : <span className="text-sm font-bold">{step.id}</span>}
                                </div>
                                <span className={`mt-2 text-xs font-semibold uppercase tracking-wider ${isActive ? 'text-blue-700' :
                                    isCompleted ? 'text-green-600' : 'text-gray-400'
                                    }`}>
                                    {step.title}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Main Form Container - Centered Card */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden relative min-h-[500px]">
                <div className="p-8 md:p-10">
                    {currentStep === 1 && renderBasicInfo()}
                    {currentStep === 2 && renderScope()}
                    {currentStep === 3 && renderTimeTargets()}
                    {currentStep === 4 && renderEscalations()}
                </div>

                {/* Fixed Footer Logic inside the Card for consistent visual grouping, 
                    or outside if we want it completely sticky. User asked for "Fixed footer inside the form card".
                    But usually sticky footer means sticking to bottom of screen. 
                    "Fixed footer inside the form card" usually means pinned to bottom of card content or just at the bottom block. 
                    I'll put it at the bottom of the card with a top border.
                */}
                <div className="bg-gray-50 border-t border-gray-200 p-6 flex justify-between items-center rounded-b-xl">
                    <button
                        onClick={currentStep === 1 ? onCancel : prevStep}
                        className="px-6 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-white hover:text-gray-900 border border-transparent hover:border-gray-300 transition-all"
                    >
                        {currentStep === 1 ? 'Cancel' : '← Back'}
                    </button>

                    {currentStep < 4 ? (
                        <Button
                            variant="primary"
                            onClick={nextStep}
                            className="px-8 py-2.5 shadow-md flex items-center"
                        >
                            Next <span className="ml-2">→</span>
                        </Button>
                    ) : (
                        <Button
                            variant="primary"
                            onClick={handleSubmit}
                            disabled={loading}
                            className="px-8 py-2.5 shadow-md"
                        >
                            {loading ? 'Creating Policy...' : 'Create Policy'}
                        </Button>
                    )}
                </div>
            </div>

        </div>
    );
};

export default SLAForm;
