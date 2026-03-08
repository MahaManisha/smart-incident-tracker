const ServiceDependency = require('../models/ServiceDependency');
const { logAudit } = require('../middleware/auditLogger');
const { getImpactedServices } = require('../services/serviceImpactService');

const Service = require('../models/Service');
const Incident = require('../models/Incident');

exports.createDependency = async (req, res) => {
    try {
        const { dependentService, sourceService, dependencyType } = req.body;

        // 1. Prevent self-dependency
        if (dependentService === sourceService) {
            return res.status(400).json({ message: 'A service cannot depend on itself' });
        }

        // 2. Prevent duplicate mapping
        const existing = await ServiceDependency.findOne({ dependentService, sourceService });
        if (existing) {
            return res.status(400).json({ message: 'This dependency already exists' });
        }

        // 3. Circular dependency check (Simple 1-level for now, can be expanded)
        const reverse = await ServiceDependency.findOne({
            dependentService: sourceService,
            sourceService: dependentService
        });
        if (reverse) {
            return res.status(400).json({ message: 'Circular dependency detected' });
        }

        const dependency = await ServiceDependency.create({
            ...req.body,
            createdBy: req.user.id
        });

        await logAudit('DEPENDENCY_CREATED', req.user.id, dependency._id, {
            source: sourceService,
            dependent: dependentService
        });

        res.status(201).json(dependency);
    } catch (error) {
        res.status(500).json({ message: 'Error creating dependency', error: error.message });
    }
};

exports.getGraph = async (req, res) => {
    try {
        const [services, dependencies] = await Promise.all([
            Service.find().select('name status criticality'),
            ServiceDependency.find()
        ]);

        // Get active incidents for health status
        const activeIncidents = await Incident.find({
            status: { $in: ['OPEN', 'ASSIGNED', 'INVESTIGATING'] },
            serviceId: { $ne: null }
        }).select('serviceId priority');

        const nodes = services.map(s => {
            const serviceIncidents = activeIncidents.filter(inc =>
                inc.serviceId && inc.serviceId.toString() === s._id.toString()
            );

            let status_color = 'green';
            if (serviceIncidents.some(inc => ['P0', 'P1'].includes(inc.priority))) {
                status_color = 'red';
            } else if (serviceIncidents.some(inc => ['P2', 'P3'].includes(inc.priority))) {
                status_color = 'yellow';
            }

            return {
                id: s._id,
                label: s.name,
                status_color,
                criticality: s.criticality
            };
        });

        const edges = dependencies.map(d => ({
            id: d._id,
            source: d.sourceService,
            target: d.dependentService,
            criticality: d.dependencyType
        }));

        res.json({ nodes, edges });
    } catch (error) {
        console.error('Graph Error:', error);
        res.status(500).json({ message: 'Error fetching dependency graph' });
    }
};

exports.getAllDependencies = async (req, res) => {
    try {
        const dependencies = await ServiceDependency.find()
            .populate('sourceService', 'name status')
            .populate('dependentService', 'name status');
        res.json(dependencies);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching dependencies' });
    }
};

exports.deleteDependency = async (req, res) => {
    try {
        const dependency = await ServiceDependency.findByIdAndDelete(req.params.id);
        if (!dependency) return res.status(404).json({ message: 'Dependency not found' });

        await logAudit('DEPENDENCY_DELETED', req.user.id, dependency._id);

        res.json({ message: 'Dependency deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting dependency' });
    }
};

exports.getImpactAnalysis = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const impacted = await getImpactedServices(serviceId);
        res.json(impacted);
    } catch (error) {
        res.status(500).json({ message: 'Error performing impact analysis' });
    }
};
