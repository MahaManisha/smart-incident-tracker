const calculatePriority = (impactedUsers, businessCriticality) => {
    let score = 0;

    // Impacted Users score
    if (impactedUsers >= 1000) score += 4;
    else if (impactedUsers >= 100) score += 3;
    else if (impactedUsers >= 10) score += 2;
    else score += 1;

    // Business Criticality score
    switch (businessCriticality) {
        case 'CRITICAL':
            score += 4;
            break;
        case 'HIGH':
            score += 3;
            break;
        case 'MEDIUM':
            score += 2;
            break;
        case 'LOW':
        default:
            score += 1;
            break;
    }

    // Priority Mapping
    let priority = 'P3';
    if (score >= 7) priority = 'P0';
    else if (score >= 5) priority = 'P1';
    else if (score >= 3) priority = 'P2';

    return { priority, severityScore: score };
};

module.exports = { calculatePriority };
