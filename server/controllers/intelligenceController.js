const IntelligenceService = require('../services/intelligenceService');

/**
 * Predict SLA Breach Risk
 */
exports.predictSlaBreach = async (req, res) => {
    try {
        const { id } = req.params;
        const prediction = await IntelligenceService.predictSLARisk(id);
        res.json(prediction);
    } catch (error) {
        console.error('SLA Prediction Error:', error);
        res.status(500).json({ message: 'Error predicting SLA risk' });
    }
};

/**
 * Get AI Root Cause and Fix Suggestions
 */
exports.getAISuggestions = async (req, res) => {
    try {
        const { id } = req.params;
        const suggestions = await IntelligenceService.getAISuggestions(id);
        res.json(suggestions);
    } catch (error) {
        console.error('AI Suggestions Error:', error);
        res.status(500).json({ message: 'Error getting AI suggestions' });
    }
};

/**
 * Trigger Auto-Clustering
 */
exports.clusterIncidents = async (req, res) => {
    try {
        const clusters = await IntelligenceService.clusterIncidents();
        res.json(clusters);
    } catch (error) {
        console.error('Clustering Error:', error);
        res.status(500).json({ message: 'Error clustering incidents' });
    }
};

/**
 * Get Recommended Responders for Assignment
 */
exports.getRecommendedResponders = async (req, res) => {
    try {
        const { id } = req.params;
        const recommendations = await IntelligenceService.getRecommendedResponders(id);
        res.json(recommendations);
    } catch (error) {
        console.error('Smart Assignment Error:', error);
        res.status(500).json({ message: 'Error fetching recommended responders' });
    }
};

/**
 * Auto-Generate Postmortem Report
 */
exports.generatePostmortem = async (req, res) => {
    try {
        const { id } = req.params;
        const report = await IntelligenceService.generatePostmortem(id);
        res.json(report);
    } catch (error) {
        console.error('Postmortem Error:', error);
        res.status(500).json({ message: error.message || 'Error generating postmortem' });
    }
};
