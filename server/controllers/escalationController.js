const EscalationPolicy = require('../models/EscalationPolicy');

/**
 * Create a new escalation policy
 */
exports.createPolicy = async (req, res) => {
    try {
        const { name, description, routingLogic, conditions, levels, isDefault } = req.body;

        // Validate levels
        if (!levels || !Array.isArray(levels) || levels.length === 0) {
            return res.status(400).json({ message: 'At least one escalation level is required' });
        }

        const policy = await EscalationPolicy.create({
            name,
            description,
            routingLogic,
            conditions: conditions || [],
            levels,
            isDefault: isDefault || false,
            createdBy: req.user.id
        });

        res.status(201).json({ message: 'Escalation policy created', policy });
    } catch (error) {
        res.status(500).json({ message: 'Error creating policy', error: error.message });
    }
};

/**
 * Get all policies
 */
exports.getPolicies = async (req, res) => {
    try {
        const policies = await EscalationPolicy.find()
            .populate('createdBy', 'name')
            .populate('levels.escalateToUser', 'name')
            .populate('levels.escalateToTeam', 'name');
        res.json(policies);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching policies' });
    }
};

/**
 * Delete a policy
 */
exports.deletePolicy = async (req, res) => {
    try {
        const policy = await EscalationPolicy.findById(req.params.id);
        if (!policy) return res.status(404).json({ message: 'Policy not found' });

        await policy.deleteOne();
        res.json({ message: 'Policy deleted' });
    } catch (error) {
        console.error("Delete policy error:", error);
        res.status(500).json({ message: 'Error deleting policy', error: error.message });
    }
};
