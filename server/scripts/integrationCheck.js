const mongoose = require('mongoose');
const Incident = require('../models/Incident');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const Team = require('../models/Team'); // Ensure model is loaded

async function integrationCheck() {
    try {
        console.log('1. Connecting to DB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected');

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        console.log('2. Running Aggregations...');

        // 1. Status Counts (Checking $toUpper)
        console.log('--- Status Counts ---');
        const statusCounts = await Incident.aggregate([
            { $group: { _id: { $toUpper: "$status" }, count: { $sum: 1 } } }
        ]);
        console.log('Result:', JSON.stringify(statusCounts));

        // 2. Severity (Checking $match + $toUpper)
        console.log('--- Severity Counts ---');
        const severityCounts = await Incident.aggregate([
            {
                $match: {
                    status: { $nin: ['CLOSED', 'Resolved', 'RESOLVED'] }
                }
            },
            { $group: { _id: { $toUpper: "$severity" }, count: { $sum: 1 } } }
        ]);
        console.log('Result:', JSON.stringify(severityCounts));

        // 6. Team Performance (Complex)
        console.log('--- Team Performance ---');
        const teamPerf = await Incident.aggregate([
            { $match: { assignedTeam: { $ne: null } } },
            {
                $group: {
                    _id: "$assignedTeam",
                    totalIncidents: { $sum: 1 },
                    resolvedCount: {
                        $sum: { $cond: [{ $in: [{ $toUpper: "$status" }, ["RESOLVED", "CLOSED"]] }, 1, 0] }
                    },
                    totalResolutionTime: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $in: [{ $toUpper: "$status" }, ["RESOLVED", "CLOSED"]] },
                                        { $ne: ["$resolvedAt", null] },
                                        { $ne: ["$createdAt", null] }
                                    ]
                                },
                                { $divide: [{ $subtract: ["$resolvedAt", "$createdAt"] }, 3600000] }, // Hours
                                0
                            ]
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: "teams",
                    localField: "_id",
                    foreignField: "_id",
                    as: "teamDetails"
                }
            },
            {
                $project: {
                    name: { $arrayElemAt: ["$teamDetails.name", 0] },
                    totalIncidents: 1,
                    resolvedCount: 1,
                    avgResolutionTimeHours: {
                        $cond: [
                            { $gt: ["$resolvedCount", 0] },
                            { $round: [{ $divide: ["$totalResolutionTime", "$resolvedCount"] }, 1] },
                            0
                        ]
                    }
                }
            }
        ]);
        console.log('Result:', JSON.stringify(teamPerf, null, 2));

        console.log('✅ All Aggregations Passed without Error');

    } catch (error) {
        console.error('❌ Aggregation Failed:', error);
    } finally {
        if (mongoose.connection) await mongoose.disconnect();
    }
}

integrationCheck();
