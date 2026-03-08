import React, { useState, useEffect } from 'react';
import Layout from '../components/common/Layout';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { getTemplates, createTemplate, deleteTemplate, updateTemplate } from '../api/templateApi';
import { toast } from 'react-toastify';
import { FaPlus, FaTrash, FaEdit, FaFileAlt } from 'react-icons/fa';
import './IncidentTemplatesPage.css';

const IncidentTemplatesPage = () => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        defaultTitle: '',
        defaultIncidentDescription: '',
        defaultPriority: 'P3',
        defaultBusinessCriticality: 'LOW',
        defaultTags: ''
    });

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const data = await getTemplates();
            setTemplates(data);
        } catch (error) {
            toast.error('Failed to load templates');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = {
                ...formData,
                defaultTags: formData.defaultTags.split(',').map(t => t.trim()).filter(t => t)
            };

            if (editingId) {
                await updateTemplate(editingId, data);
                toast.success('Template updated');
            } else {
                await createTemplate(data);
                toast.success('Template created');
            }

            setShowForm(false);
            setEditingId(null);
            resetForm();
            fetchTemplates();
        } catch (error) {
            toast.error('Failed to save template');
        }
    };

    const handleEdit = (template) => {
        setEditingId(template._id);
        setFormData({
            name: template.name,
            description: template.description || '',
            defaultTitle: template.defaultTitle,
            defaultIncidentDescription: template.defaultIncidentDescription || '',
            defaultPriority: template.defaultPriority,
            defaultBusinessCriticality: template.defaultBusinessCriticality,
            defaultTags: (template.defaultTags || []).join(', ')
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this template?')) return;
        try {
            await deleteTemplate(id);
            toast.success('Template deleted');
            fetchTemplates();
        } catch (error) {
            toast.error('Failed to delete template');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            defaultTitle: '',
            defaultIncidentDescription: '',
            defaultPriority: 'P3',
            defaultBusinessCriticality: 'LOW',
            defaultTags: ''
        });
    };

    return (
        <Layout>
            <div className="templates-page">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Incident Templates</h1>
                        <p className="page-description">Manage templates to speed up incident reporting</p>
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
                        {showForm ? 'Cancel' : 'Create Template'}
                    </Button>
                </div>

                {showForm && (
                    <div className="card-compact p-6 mb-8 border-neon">
                        <h3 className="text-lg font-bold mb-4">{editingId ? 'Edit Template' : 'New Template'}</h3>
                        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                            <div className="form-group col-span-2">
                                <label className="form-label">Template Name</label>
                                <input
                                    className="form-input"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder="e.g. Database Connectivity Issue"
                                />
                            </div>
                            <div className="form-group col-span-2">
                                <label className="form-label">Template Description</label>
                                <input
                                    className="form-input"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Briefly describe when to use this template"
                                />
                            </div>
                            <div className="form-group col-span-2">
                                <label className="form-label">Default Incident Title</label>
                                <input
                                    className="form-input"
                                    value={formData.defaultTitle}
                                    onChange={e => setFormData({ ...formData, defaultTitle: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group col-span-2">
                                <label className="form-label">Default Incident Description</label>
                                <textarea
                                    className="form-textarea"
                                    value={formData.defaultIncidentDescription}
                                    onChange={e => setFormData({ ...formData, defaultIncidentDescription: e.target.value })}
                                    rows="3"
                                ></textarea>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Default Priority</label>
                                <select
                                    className="form-select"
                                    value={formData.defaultPriority}
                                    onChange={e => setFormData({ ...formData, defaultPriority: e.target.value })}
                                >
                                    <option value="P0">P0</option>
                                    <option value="P1">P1</option>
                                    <option value="P2">P2</option>
                                    <option value="P3">P3</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Default Criticality</label>
                                <select
                                    className="form-select"
                                    value={formData.defaultBusinessCriticality}
                                    onChange={e => setFormData({ ...formData, defaultBusinessCriticality: e.target.value })}
                                >
                                    <option value="LOW">LOW</option>
                                    <option value="MEDIUM">MEDIUM</option>
                                    <option value="HIGH">HIGH</option>
                                    <option value="CRITICAL">CRITICAL</option>
                                </select>
                            </div>
                            <div className="form-group col-span-2">
                                <label className="form-label">Default Tags (comma separated)</label>
                                <input
                                    className="form-input"
                                    value={formData.defaultTags}
                                    onChange={e => setFormData({ ...formData, defaultTags: e.target.value })}
                                    placeholder="database, storage, production"
                                />
                            </div>
                            <div className="col-span-2 mt-4">
                                <Button type="submit">{editingId ? 'Update Template' : 'Create Template'}</Button>
                            </div>
                        </form>
                    </div>
                )}

                {loading ? <LoadingSpinner /> : (
                    <div className="templates-grid">
                        {templates.map(template => (
                            <div key={template._id} className="template-card card-compact">
                                <div className="template-card-header">
                                    <div className="template-icon-wrapper">
                                        <FaFileAlt />
                                    </div>
                                    <div className="template-info">
                                        <h3 className="template-name">{template.name}</h3>
                                        <p className="template-desc">{template.description}</p>
                                    </div>
                                </div>
                                <div className="template-defaults">
                                    <div className="default-pill">{template.defaultPriority}</div>
                                    <div className="default-pill">{template.defaultBusinessCriticality}</div>
                                </div>
                                <div className="template-actions">
                                    <button className="btn-icon" onClick={() => handleEdit(template)}><FaEdit /></button>
                                    <button className="btn-icon danger" onClick={() => handleDelete(template._id)}><FaTrash /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default IncidentTemplatesPage;
