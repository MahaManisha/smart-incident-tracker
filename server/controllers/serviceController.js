const Service = require('../models/Service');
const { logAudit } = require('../middleware/auditLogger');

exports.createService = async (req, res) => {
    try {
        const service = await Service.create({
            ...req.body,
            createdBy: req.user.id
        });

        await logAudit('SERVICE_CREATED', req.user.id, service._id, {
            name: service.name
        });

        res.status(201).json(service);
    } catch (error) {
        res.status(500).json({ message: 'Error creating service', error: error.message });
    }
};

const Incident = require('../models/Incident');

exports.getAllServices = async (req, res) => {
    try {
        const services = await Service.find().populate('ownerTeam', 'name');

        // Fetch active incidents for all services
        const activeIncidents = await Incident.find({
            status: { $in: ['OPEN', 'ASSIGNED', 'INVESTIGATING'] },
            serviceId: { $ne: null }
        }).select('serviceId priority');

        // Map incidents to services
        const serviceMap = services.map(service => {
            const serviceObj = service.toObject();
            const serviceIncidents = activeIncidents.filter(inc =>
                inc.serviceId && inc.serviceId.toString() === service._id.toString()
            );

            let status_color = 'green';
            if (serviceIncidents.some(inc => ['P0', 'P1'].includes(inc.priority))) {
                status_color = 'red';
            } else if (serviceIncidents.some(inc => ['P2', 'P3'].includes(inc.priority))) {
                status_color = 'yellow';
            }

            return {
                ...serviceObj,
                status_color
            };
        });

        console.log(`[ServiceController] Sending ${serviceMap.length} services with health status`);
        res.json(serviceMap);
    } catch (error) {
        console.error('Error fetching services:', error);
        res.status(500).json({ message: 'Error fetching services' });
    }
};

exports.updateService = async (req, res) => {
    try {
        const service = await Service.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        if (!service) return res.status(404).json({ message: 'Service not found' });

        await logAudit('SERVICE_UPDATED', req.user.id, service._id, {
            name: service.name,
            status: service.status
        });

        res.json(service);
    } catch (error) {
        res.status(500).json({ message: 'Error updating service' });
    }
};

exports.deleteService = async (req, res) => {
    try {
        const service = await Service.findByIdAndDelete(req.params.id);
        if (!service) return res.status(404).json({ message: 'Service not found' });

        await logAudit('SERVICE_DELETED', req.user.id, service._id, {
            name: service.name
        });

        res.json({ message: 'Service deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting service' });
    }
};
