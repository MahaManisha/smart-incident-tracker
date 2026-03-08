export const calculatePriority = (impactedUsers, businessCriticality) => {
    let score = 0;
    const users = parseInt(impactedUsers) || 1;

    // Impacted Users score
    if (users >= 1000) score += 4;
    else if (users >= 100) score += 3;
    else if (users >= 10) score += 2;
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

    return { priority, score };
};
