const ServiceDependency = require('../models/ServiceDependency');
const Service = require('../models/Service');

/**
 * Find all services that depend (directly or indirectly) on the given service.
 * dependentService depends on sourceService
 * So we follow the 'sourceService' -> 'dependentService' links.
 */
const getImpactedServices = async (serviceId) => {
    const impactedSet = new Set();
    const queue = [serviceId.toString()];
    const visited = new Set();

    while (queue.length > 0) {
        const currentId = queue.shift();
        if (visited.has(currentId)) continue;
        visited.add(currentId);

        // Find all services that depend on this service
        // dependentService depends on sourceService
        const dependencies = await ServiceDependency.find({ sourceService: currentId });

        for (const dep of dependencies) {
            const depId = dep.dependentService.toString();
            if (!impactedSet.has(depId) && depId !== serviceId.toString()) {
                impactedSet.add(depId);
                queue.push(depId);
            }
        }
    }

    // Convert IDs back to actual service objects
    const impactedArray = Array.from(impactedSet);
    return await Service.find({ _id: { $in: impactedArray } });
};

module.exports = {
    getImpactedServices
};
