const IncidentTemplate = require('../models/IncidentTemplate');
const { logAudit } = require('../middleware/auditLogger');

exports.createTemplate = async (req, res) => {
    try {
        const template = await IncidentTemplate.create({
            ...req.body,
            createdBy: req.user.id
        });

        await logAudit('INCIDENT_TEMPLATE_CREATED', req.user.id, template._id, {
            name: template.name
        });

        res.status(201).json(template);
    } catch (error) {
        res.status(500).json({ message: 'Error creating template', error: error.message });
    }
};

exports.getAllTemplates = async (req, res) => {
    try {
        const templates = await IncidentTemplate.find({ isActive: true })
            .populate('defaultTeam', 'name')
            .populate('defaultAssignee', 'name email');
        res.json(templates);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching templates' });
    }
};

exports.getTemplateById = async (req, res) => {
    try {
        const template = await IncidentTemplate.findById(req.params.id)
            .populate('defaultTeam', 'name')
            .populate('defaultAssignee', 'name email');

        if (!template) return res.status(404).json({ message: 'Template not found' });
        res.json(template);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching template' });
    }
};

exports.updateTemplate = async (req, res) => {
    try {
        const template = await IncidentTemplate.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        if (!template) return res.status(404).json({ message: 'Template not found' });

        await logAudit('INCIDENT_TEMPLATE_UPDATED', req.user.id, template._id, {
            name: template.name
        });

        res.json(template);
    } catch (error) {
        res.status(500).json({ message: 'Error updating template' });
    }
};

exports.deleteTemplate = async (req, res) => {
    try {
        const template = await IncidentTemplate.findByIdAndUpdate(req.params.id, { isActive: false });
        if (!template) return res.status(404).json({ message: 'Template not found' });

        await logAudit('INCIDENT_TEMPLATE_DELETED', req.user.id, template._id, {
            name: template.name
        });

        res.json({ message: 'Template deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting template' });
    }
};
