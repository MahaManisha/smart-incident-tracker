const IncidentTemplate = require('../models/IncidentTemplate');

const defaultTemplates = [
    {
        name: 'Database Failure',
        description: 'Use for database connectivity or data corruption issues',
        defaultTitle: 'Database Connection Failure',
        defaultIncidentDescription: 'Major database connection issues detected on the primary cluster.',
        defaultPriority: 'P0',
        defaultBusinessCriticality: 'CRITICAL',
        defaultTags: ['database', 'outage']
    },
    {
        name: 'Server Down',
        description: 'Use for physical or virtual server outages',
        defaultTitle: 'Core Server Unreachable',
        defaultIncidentDescription: 'The core production server is not responding to health checks.',
        defaultPriority: 'P0',
        defaultBusinessCriticality: 'CRITICAL',
        defaultTags: ['server', 'outage']
    },
    {
        name: 'Security Incident',
        description: 'Use for suspected breaches or unauthorized access',
        defaultTitle: 'Unauthorized Access Detected',
        defaultIncidentDescription: 'Suspicious activity detected in the authentication logs.',
        defaultPriority: 'P1',
        defaultBusinessCriticality: 'HIGH',
        defaultTags: ['security', 'breach']
    },
    {
        name: 'Network Issue',
        description: 'Use for latency or connectivity problems',
        defaultTitle: 'Network Latency Spike',
        defaultIncidentDescription: 'High latency detected between the web server and the database.',
        defaultPriority: 'P2',
        defaultBusinessCriticality: 'MEDIUM',
        defaultTags: ['network', 'performance']
    },
    {
        name: 'API Failure',
        description: 'Use for external or internal API errors',
        defaultTitle: 'External API Error (500)',
        defaultIncidentDescription: 'System receiving consistent 500 errors from the primary payment gateway.',
        defaultPriority: 'P1',
        defaultBusinessCriticality: 'HIGH',
        defaultTags: ['api', 'integration']
    }
];

const seedTemplates = async () => {
    try {
        for (const template of defaultTemplates) {
            const exists = await IncidentTemplate.findOne({ name: template.name });
            if (!exists) {
                await IncidentTemplate.create(template);
                console.log(`Seeded template: ${template.name}`);
            }
        }
    } catch (error) {
        console.error('Error seeding templates:', error);
    }
};

module.exports = { seedTemplates };
