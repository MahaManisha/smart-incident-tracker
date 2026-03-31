import React, { useState, useEffect } from 'react';
import { getServices, getDependencies, createDependency, deleteDependency } from '../../api/mappingApi';
import { toast } from 'react-toastify';
import { FaLink, FaUnlink, FaArrowRight, FaServer } from 'react-icons/fa';
import Button from '../common/Button';

const DependencyManager = ({ onUpdate }) => {
    const [services, setServices] = useState([]);
    const [dependencies, setDependencies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        sourceService: '',
        dependentService: '',
        dependencyType: 'HARD'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [s, d] = await Promise.all([getServices(), getDependencies()]);
            setServices(Array.isArray(s) ? s : []);
            setDependencies(Array.isArray(d) ? d : []);
        } catch (error) {
            console.error('Fetch error:', error);
            toast.error('Failed to load dependency data');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.sourceService === formData.dependentService) {
            return toast.error('A service cannot depend on itself');
        }

        // Duplicate check on frontend for better UX
        const isDuplicate = dependencies.some(
            dep => dep.sourceService?._id === formData.sourceService &&
                dep.dependentService?._id === formData.dependentService
        );
        if (isDuplicate) {
            return toast.error('This dependency mapping already exists');
        }

        try {
            await createDependency(formData);
            toast.success('Dependency mapped successfully');
            fetchData();
            if (onUpdate) onUpdate();
            setFormData({ ...formData, sourceService: '', dependentService: '' });
        } catch (error) {
            toast.error(error.message || 'Failed to create dependency');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to remove this dependency?')) return;
        try {
            await deleteDependency(id);
            toast.success('Dependency removed');
            fetchData();
            if (onUpdate) onUpdate();
        } catch (error) {
            toast.error('Failed to remove dependency');
        }
    };

    if (loading) return (
        <div className="dependency-manager-card skeleton">
            <div className="p-8 text-center text-secondary-color">Loading infrastructure data...</div>
        </div>
    );

    return (
        <div className="dependency-manager-card">
            <div className="dependency-manager-header">
                <FaLink className="text-primary-color" />
                <h3>Infrastructure Relationship Manager</h3>
            </div>

            <div className="dependency-form-container">
                <form onSubmit={handleSubmit} className="dependency-form">
                    <div className="dependency-form-grid">
                        <div className="form-group">
                            <label className="form-label-sm">Dependent Service (Target)</label>
                            <select
                                className="form-select-premium"
                                value={formData.dependentService}
                                onChange={e => setFormData({ ...formData, dependentService: e.target.value })}
                                required
                            >
                                <option value="">Select Target...</option>
                                {services.map(s => (
                                    <option key={s._id} value={s._id}>{s.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="dependency-arrow-icon">
                            <FaArrowRight />
                        </div>

                        <div className="form-group">
                            <label className="form-label-sm">Depends On (Source Service)</label>
                            <select
                                className="form-select-premium"
                                value={formData.sourceService}
                                onChange={e => setFormData({ ...formData, sourceService: e.target.value })}
                                required
                            >
                                <option value="">Select Source...</option>
                                {services.map(s => (
                                    <option key={s._id} value={s._id}>{s.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label-sm">Criticality</label>
                            <select
                                className="form-select-premium"
                                value={formData.dependencyType}
                                onChange={e => setFormData({ ...formData, dependencyType: e.target.value })}
                            >
                                <option value="HARD">HARD (Mission Critical)</option>
                                <option value="SOFT">SOFT (Non-Blocking)</option>
                            </select>
                        </div>

                        <div className="dependency-action">
                            <Button type="submit" variant="primary" className="btn-full">Map Dependency</Button>
                        </div>
                    </div>
                </form>
            </div>

            <div className="mapped-dependencies-section">
                <div className="section-header">
                    <h4 className="mapped-title">Active Infrastructure Mappings</h4>
                    <span className="mapping-count-badge">{dependencies.length} entries</span>
                </div>

                {dependencies.length === 0 ? (
                    <div className="empty-mapping-state">
                        <FaServer className="empty-icon" />
                        <p>No service dependencies defined yet.</p>
                        <span>Start selects services above to define your system architecture.</span>
                    </div>
                ) : (
                    <div className="mapping-table-wrapper">
                        <table className="mapping-table">
                            <thead>
                                <tr>
                                    <th>Dependent Service</th>
                                    <th></th>
                                    <th>Depends On</th>
                                    <th>Criticality</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dependencies.map(dep => (
                                    <tr key={dep._id} className="mapping-row">
                                        <td>
                                            <span className="service-node-name">{dep.dependentService?.name || 'Unknown'}</span>
                                        </td>
                                        <td className="arrow-cell"><FaArrowRight /></td>
                                        <td>
                                            <span className="service-node-name source">{dep.sourceService?.name || 'Unknown'}</span>
                                        </td>
                                        <td>
                                            <span className={`criticality-tag ${dep.dependencyType.toLowerCase()}`}>
                                                {dep.dependencyType}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                className="delete-mapping-btn"
                                                onClick={() => handleDelete(dep._id)}
                                                title="Delete mapping"
                                            >
                                                <FaUnlink />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DependencyManager;
