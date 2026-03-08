import React, { useState, useEffect } from 'react';
import Layout from '../components/common/Layout';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { getServices, createService, deleteService, updateService } from '../api/mappingApi';
import { getAllTeams } from '../api/teamsApi';
import { toast } from 'react-toastify';
import { FaServer, FaPlus, FaTrash, FaEdit, FaCheckCircle, FaExclamationTriangle, FaTimesCircle } from 'react-icons/fa';
import './ServicesPage.css';

const ServicesPage = () => {
    const [services, setServices] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        ownerTeam: '',
        criticality: 'MEDIUM',
        status: 'OPERATIONAL'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [servicesData, teamsData] = await Promise.all([
                getServices(),
                getAllTeams()
            ]);
            setServices(servicesData);
            setTeams(teamsData.teams || []);
        } catch (error) {
            toast.error('Failed to load services data');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateService(editingId, formData);
                toast.success('Service updated');
            } else {
                await createService(formData);
                toast.success('Service created');
            }
            setShowForm(false);
            setEditingId(null);
            resetForm();
            fetchData();
        } catch (error) {
            toast.error('Failed to save service');
        }
    };

    const handleEdit = (service) => {
        setEditingId(service._id);
        setFormData({
            name: service.name,
            description: service.description || '',
            ownerTeam: service.ownerTeam?._id || '',
            criticality: service.criticality,
            status: service.status
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this service? This may affect dependencies.')) return;
        try {
            await deleteService(id);
            toast.success('Service deleted');
            fetchData();
        } catch (error) {
            toast.error('Failed to delete service');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            ownerTeam: '',
            criticality: 'MEDIUM',
            status: 'OPERATIONAL'
        });
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'OPERATIONAL': return <FaCheckCircle className="text-success" />;
            case 'DEGRADED': return <FaExclamationTriangle className="text-warning" />;
            case 'DOWN': return <FaTimesCircle className="text-danger" />;
            default: return null;
        }
    };

    return (
        <Layout>
            <div className="services-page">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Service Inventory</h1>
                        <p className="page-description">Manage your infrastructure services and status</p>
                    </div>
                    <Button onClick={() => {
                        if (showForm) {
                            setShowForm(false);
                            setEditingId(null);
                            resetForm();
                        } else {
                            setShowForm(true);
                        }
                    }}>
                        {showForm ? 'Cancel' : 'Register Service'}
                    </Button>
                </div>

                {showForm && (
                    <div className="card-compact p-6 mb-8 border-neon">
                        <h3 className="text-lg font-bold mb-4">{editingId ? 'Edit Service' : 'New Service'}</h3>
                        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                            <div className="form-group">
                                <label className="form-label">Service Name</label>
                                <input
                                    className="form-input"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder="e.g. Core API, Database Cluster"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Owner Team</label>
                                <select
                                    className="form-select"
                                    value={formData.ownerTeam}
                                    onChange={e => setFormData({ ...formData, ownerTeam: e.target.value })}
                                >
                                    <option value="">Select Team</option>
                                    {teams.map(team => (
                                        <option key={team._id} value={team._id}>{team.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group col-span-2">
                                <label className="form-label">Description</label>
                                <input
                                    className="form-input"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="What does this service do?"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Criticality</label>
                                <select
                                    className="form-select"
                                    value={formData.criticality}
                                    onChange={e => setFormData({ ...formData, criticality: e.target.value })}
                                >
                                    <option value="LOW">Low</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HIGH">High</option>
                                    <option value="CRITICAL">Critical</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Status</label>
                                <select
                                    className="form-select"
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="OPERATIONAL">Operational</option>
                                    <option value="DEGRADED">Degraded</option>
                                    <option value="DOWN">Down</option>
                                </select>
                            </div>
                            <div className="col-span-2 mt-2">
                                <Button type="submit">{editingId ? 'Update Service' : 'Create Service'}</Button>
                            </div>
                        </form>
                    </div>
                )}

                {loading ? <LoadingSpinner /> : (
                    <div className="services-grid">
                        {services.map(service => (
                            <div key={service._id} className={`service-node-card status-${service.status.toLowerCase()}`}>
                                <div className="service-node-header">
                                    <div className="service-node-icon">
                                        <FaServer />
                                    </div>
                                    <div className="service-node-info">
                                        <h3 className="service-node-name">{service.name}</h3>
                                        <p className="service-node-team">{service.ownerTeam?.name || 'No Owner'}</p>
                                    </div>
                                    <div className="service-node-status">
                                        {getStatusIcon(service.status)}
                                    </div>
                                </div>
                                <div className="service-node-meta">
                                    <span className={`criticality-badge ${service.criticality.toLowerCase()}`}>
                                        {service.criticality}
                                    </span>
                                    <span className="status-text">{service.status}</span>
                                </div>
                                <div className="service-node-actions">
                                    <button className="btn-icon" onClick={() => handleEdit(service)}><FaEdit /></button>
                                    <button className="btn-icon danger" onClick={() => handleDelete(service._id)}><FaTrash /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default ServicesPage;
