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
            let earliestIncident = null;

            if (serviceIncidents.length > 0) {
                if (serviceIncidents.some(inc => ['P0', 'P1'].includes(inc.priority))) {
                    status_color = 'red';
                } else if (serviceIncidents.some(inc => ['P2', 'P3'].includes(inc.priority))) {
                    status_color = 'yellow';
                }
                // Find earliest reported incident
                earliestIncident = serviceIncidents.reduce((prev, curr) => 
                    (!prev || new Date(curr.reportedAt) < new Date(prev.reportedAt)) ? curr : prev
                , null);
            }

            return {
                id: s._id,
                label: s.name,
                type: s.type || 'Service', // Include type
                status_color,
                criticality: s.criticality,
                earliest_report: earliestIncident ? earliestIncident.reportedAt : null
            };
        });

        const edges = dependencies.map(d => ({
            id: d._id,
            source: d.sourceService,
            target: d.dependentService,
            criticality: d.dependencyType
        }));

        // Calculate Root Cause and First Failure
        const downNodes = nodes.filter(n => n.status_color !== 'green');
        
        let globalFirstFailureNodeId = null;
        if (downNodes.length > 0) {
            const sortedByTime = [...downNodes].filter(n => n.earliest_report).sort((a,b) => 
                new Date(a.earliest_report) - new Date(b.earliest_report)
            );
            if (sortedByTime.length > 0) globalFirstFailureNodeId = sortedByTime[0].id.toString();
        }

        nodes.forEach(n => {
            n.is_first_failure = globalFirstFailureNodeId === n.id.toString();

            if (n.status_color !== 'green') {
                const upstreams = dependencies.filter(d => d.dependentService.toString() === n.id.toString());
                const upstreamDown = upstreams.some(u => 
                    downNodes.some(dn => dn.id.toString() === u.sourceService.toString())
                );
                n.is_root_cause = !upstreamDown;
            } else {
                n.is_root_cause = false;
            }
        });

        res.json({ nodes, edges });
    } catch (error) {
        console.error('Graph Error:', error);
        res.status(500).json({ message: 'Error fetching dependency graph' });
    }
};

exports.getServiceStatusDetails = async (req, res) => {
    try {
        const { serviceId } = req.params;

        const [service, activeIncidents] = await Promise.all([
            Service.findById(serviceId).populate('ownerTeam', 'name'),
            Incident.find({
                serviceId,
                status: { $in: ['OPEN', 'ASSIGNED', 'INVESTIGATING'] }
            }).populate('assignedTo', 'name email role')
              .populate('escalationPolicy', 'name')
        ]);

        if (!service) return res.status(404).json({ message: 'Service not found' });

        res.json({
            service,
            activeIncidents: activeIncidents.map(inc => ({
                id: inc._id,
                incidentNumber: inc.incidentNumber,
                title: inc.title,
                priority: inc.priority,
                status: inc.status,
                assignedTo: inc.assignedTo ? inc.assignedTo.name : 'Unassigned',
                slaDeadline: inc.slaResolutionDeadline,
                escalationPolicyName: inc.escalationPolicy ? inc.escalationPolicy.name : 'None',
                reportedAt: inc.reportedAt
            }))
        });
    } catch (error) {
        console.error('Service status error:', error);
        res.status(500).json({ message: 'Error fetching service status details' });
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

exports.getIncidentTopology = async (req, res) => {
    try {
        const { incidentId } = req.params;
        const simulation = req.query.simulate === 'true';

        // 1. Fetch the incident
        const incident = await Incident.findById(incidentId).populate('serviceId');
        if (!incident && incidentId !== 'demo') {
            return res.status(404).json({ message: 'Incident not found' });
        }

        let rootServiceId = incident?.serviceId?._id;
        let rootServiceName = incident?.serviceId?.name || 'Unknown Service';

        // If it's a demo mode request or root service is missing, we use a fallback or specific demo logic
        if (incidentId === 'demo') {
            // This is just a placeholder for the "Simulation" mode if needed, 
            // but the user wants it to be dynamic based on the incident.
            // Let's assume for simulation we just show a deeper propagation chain.
        }

        // 2. Fetch all services and dependencies
        const [services, dependencies] = await Promise.all([
            Service.find().select('name status criticality type'),
            ServiceDependency.find()
        ]);

        // 🧠 ALWAYS GENERATE: Requirement - Ignore status, generate for all incident states
        console.log(`[TOPOLOGY] Generating intelligence map for ${incident.status} incident: ${incident.incidentNumber}`);

        // 3. Calculate Blast Radius (Downstream Impact)
        const impactedServices = rootServiceId ? await getImpactedServices(rootServiceId) : [];
        const impactedIds = impactedServices.map(s => s._id.toString());

        // 🧠 PROPAGATION CALCULATION
        const severityWeight = { 'CRITICAL': 10, 'HIGH': 5, 'MEDIUM': 2, 'LOW': 1 };
        const weight = severityWeight[incident?.severity] || 1;
        const impactScore = impactedServices.length * weight;

        // Persist IQ metrics for all active/resolved incidents
        if (incident && incidentId !== 'demo') {
            incident.impactScore = impactScore;
            incident.impactedServices = impactedIds;
            // Add to timeline if first time
            if (incident.eventTimeline.length === 0) {
                incident.eventTimeline.push({
                    type: 'TOPOLOGY_INITIALIZED',
                    timestamp: new Date(),
                    data: { impactScore, impactedCount: impactedIds.length }
                });
            }
            await incident.save();
        }

        // 4. Build Nodes
        const nodes = services.map(s => {
            const isRoot = rootServiceId && s._id.toString() === rootServiceId.toString();
            const isDownstream = impactedIds.includes(s._id.toString());
            
            let status_color = 'green';
            if (isRoot) status_color = 'red';
            else if (isDownstream) status_color = simulation ? 'red' : 'yellow';

            return {
                id: s._id.toString(),
                label: s.name,
                type: s.type || 'Service',
                status_color,
                criticality: s.criticality,
                is_root_cause: isRoot,
                is_first_failure: isRoot
            };
        });

        // 5. Build Edges
        const edges = dependencies.map(d => {
            const isPropagationPath = rootServiceId && (
                d.sourceService.toString() === rootServiceId.toString() ||
                impactedIds.includes(d.sourceService.toString())
            );

            return {
                id: d._id.toString(),
                source: d.sourceService.toString(),
                target: d.dependentService.toString(),
                label: d.dependencyType,
                is_failure_path: isPropagationPath
            };
        });

        // 6. Filter to only show relevant subgraph (Optional, but helps focus)
        // For now, let's show everything but highlighted, as per usual topology views
        
        res.json({ nodes, edges, incident_title: incident?.title });
    } catch (error) {
        console.error('Incident Topology Error:', error);
        res.status(500).json({ message: 'Error fetching incident topology' });
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
