import React, { useState, useEffect } from 'react';
import { getTemplates } from '../../api/templateApi';
import { FaLayerGroup } from 'react-icons/fa';

const TemplateSelector = ({ onSelect }) => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const data = await getTemplates();
                setTemplates(data);
            } catch (error) {
                console.error('Failed to load templates');
            } finally {
                setLoading(false);
            }
        };
        fetchTemplates();
    }, []);

    const handleChange = (e) => {
        const templateId = e.target.value;
        if (!templateId) return;

        const template = templates.find(t => t._id === templateId);
        if (template) {
            onSelect(template);
        }
    };

    if (loading) return null;

    return (
        <div className="template-selector-container mb-6">
            <label className="form-label flex items-center gap-2">
                <FaLayerGroup className="text-primary-color" /> Select Template
            </label>
            <select
                className="form-select border-primary"
                onChange={handleChange}
                defaultValue=""
            >
                <option value="" disabled>Choose a template to auto-fill fields...</option>
                {templates.map(t => (
                    <option key={t._id} value={t._id}>{t.name}</option>
                ))}
            </select>
            <p className="text-xs text-secondary mt-1">
                Templates auto-fill common fields but can still be modified before submission.
            </p>
        </div>
    );
};

export default TemplateSelector;
