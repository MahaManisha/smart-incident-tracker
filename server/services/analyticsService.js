const Incident = require('../models/Incident');
const User = require('../models/User');
// const Team = require('../models/Team'); // If needed directly
const { calculateResolutionTime, isSLAMet } = require('./slaService');

/**
 * Get unified dashboard analytics using optimized Aggregation Pipelines
 * Returns single JSON with:
 * - summary: { open, inProgress, resolvedToday, slaBreaches, avgResolutionHours }
 * - trends: [ { date, created, resolved } ]
 * - distribution: { severity: [], status: [], type: [] }
 * - performance: { teams: [] }
 */
const getUnifiedDashboardStats = async () => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // Parallel Aggregations
    const [
      statusCounts,
      severityCounts,
      trendData,
      slaBreachCount,
      avgResTime,
      prevAvgResTime,
      mttaTime,
      prevMttaTime,
      teamPerf
    ] = await Promise.all([
      // 1. Status Counts
      Incident.aggregate([
        { $group: { _id: { $toUpper: "$status" }, count: { $sum: 1 } } }
      ]),

      // 2. Severity Counts (Active only: open/assigned/investigating/reopened)
      Incident.aggregate([
        {
          $match: {
            status: { $nin: ['CLOSED', 'Resolved', 'RESOLVED'] }
          }
        },
        { $group: { _id: { $toUpper: "$severity" }, count: { $sum: 1 } } }
      ]),

      // 3. Trends (Last 30 Days)
      Incident.aggregate([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            created: { $sum: 1 },
            resolved: {
              $sum: {
                $cond: [{ $in: [{ $toUpper: "$status" }, ["RESOLVED", "CLOSED"]] }, 1, 0]
              }
            }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // 4. SLA Breaches (Count)
      Incident.countDocuments({ slaStatus: 'BREACHED' }),

      // 5. Avg Resolution Time (Resolved in last 30 days - MTTR)
      Incident.aggregate([
        {
          $match: {
            status: { $in: ['RESOLVED', 'CLOSED', 'Resolved', 'Closed'] },
            resolvedAt: { $gte: thirtyDaysAgo }
          }
        },
        {
          $project: {
            durationMinutes: {
              $divide: [{ $subtract: ["$resolvedAt", { $ifNull: ["$reportedAt", "$createdAt"] }] }, 60000]
            }
          }
        },
        {
          $group: {
            _id: null,
            avgMinutes: { $avg: "$durationMinutes" }
          }
        }
      ]),
      
      // 5b. Prev Avg Resolution Time (Resolved 30-60 days ago - Prev MTTR)
      Incident.aggregate([
        {
          $match: {
            status: { $in: ['RESOLVED', 'CLOSED', 'Resolved', 'Closed'] },
            resolvedAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
          }
        },
        {
          $project: {
            durationMinutes: {
              $divide: [{ $subtract: ["$resolvedAt", { $ifNull: ["$reportedAt", "$createdAt"] }] }, 60000]
            }
          }
        },
        {
          $group: {
            _id: null,
            avgMinutes: { $avg: "$durationMinutes" }
          }
        }
      ]),

      // 5c. MTTA (Mean Time To Acknowledge in last 30 days)
      Incident.aggregate([
        {
          $match: {
            assignedAt: { $gte: thirtyDaysAgo },
            createdAt: { $ne: null }
          }
        },
        {
          $project: {
            ackDurationMinutes: {
              $divide: [{ $subtract: ["$assignedAt", { $ifNull: ["$reportedAt", "$createdAt"] }] }, 60000]
            }
          }
        },
        {
          $group: {
            _id: null,
            avgMinutes: { $avg: "$ackDurationMinutes" }
          }
        }
      ]),

      // 5d. Prev MTTA (Mean Time To Acknowledge 30-60 days ago)
      Incident.aggregate([
        {
          $match: {
            assignedAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
            createdAt: { $ne: null }
          }
        },
        {
          $project: {
            ackDurationMinutes: {
              $divide: [{ $subtract: ["$assignedAt", { $ifNull: ["$reportedAt", "$createdAt"] }] }, 60000]
            }
          }
        },
        {
          $group: {
            _id: null,
            avgMinutes: { $avg: "$ackDurationMinutes" }
          }
        }
      ]),

      // 6. Team Performance (Refined with membership lookup)
      Incident.aggregate([
        // Ensure assignedTeam OR assignedTo exists
        { $match: { $or: [{ assignedTeam: { $ne: null } }, { assignedTo: { $ne: null } }] } },
        
        // Lookup team where the responder is a member
        {
          $lookup: {
            from: "teams",
            localField: "assignedTo",
            foreignField: "members",
            as: "teamMemberships"
          }
        },
        
        // Determine effective team ID
        {
          $addFields: {
            effectiveTeamId: { 
              $ifNull: ["$assignedTeam", { $arrayElemAt: ["$teamMemberships._id", 0] }]
            }
          }
        },
        
        // Filter out those with NO effective team
        { $match: { effectiveTeamId: { $ne: null } } },

        {
          $group: {
            _id: "$effectiveTeamId",
            totalIncidents: { $sum: 1 },
            resolvedCount: {
              $sum: { $cond: [{ $in: [{ $toUpper: "$status" }, ["RESOLVED", "CLOSED"]] }, 1, 0] }
            },
            slaBreachedCount: {
              $sum: { $cond: [{ $eq: ["$slaStatus", "BREACHED"] }, 1, 0] }
            },
            totalResolutionTime: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $in: [{ $toUpper: "$status" }, ["RESOLVED", "CLOSED"]] },
                      { $ne: ["$resolvedAt", null] }
                    ]
                  },
                  {
                    $divide: [
                      { $subtract: ["$resolvedAt", { $ifNull: ["$reportedAt", "$createdAt"] }] },
                      3600000
                    ]
                  },
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
            slaBreachedCount: 1,
            avgResolutionTimeHours: {
              $cond: [
                { $gt: ["$resolvedCount", 0] },
                { $round: [{ $divide: ["$totalResolutionTime", "$resolvedCount"] }, 1] },
                0
              ]
            },
            slaComplianceRate: {
              $cond: [
                { $gt: ["$totalIncidents", 0] },
                {
                  $multiply: [
                    { $divide: [{ $subtract: ["$totalIncidents", "$slaBreachedCount"] }, "$totalIncidents"] },
                    100
                  ]
                },
                100
              ]
            }
          }
        },
        { $match: { name: { $ne: null } } }
      ])
    ]);

    // Process Results
    const currentMttrHrs = (avgResTime && avgResTime.length > 0) ? (avgResTime[0].avgMinutes / 60) : 0;
    const prevMttrHrs = (prevAvgResTime && prevAvgResTime.length > 0) ? (prevAvgResTime[0].avgMinutes / 60) : 0;
    const mttrTrend = prevMttrHrs > 0 ? ((currentMttrHrs - prevMttrHrs) / prevMttrHrs) * 100 : 0;

    const currentMttaHrs = (mttaTime && mttaTime.length > 0) ? (mttaTime[0].avgMinutes / 60) : 0;
    const prevMttaHrs = (prevMttaTime && prevMttaTime.length > 0) ? (prevMttaTime[0].avgMinutes / 60) : 0;
    const mttaTrend = prevMttaHrs > 0 ? ((currentMttaHrs - prevMttaHrs) / prevMttaHrs) * 100 : 0;

    const stats = {
      open: 0,
      inProgress: 0,
      resolvedToday: 0,
      slaBreaches: slaBreachCount || 0,
      avgResolutionTimeHours: Math.round(currentMttrHrs * 10) / 10,
      mttrTrend: Math.round(mttrTrend),
      mttaHours: Math.round(currentMttaHrs * 10) / 10,
      mttaTrend: Math.round(mttaTrend)
    };

    // Fill Summary (Case Insensitive)
    statusCounts.forEach(s => {
      const status = s._id.toUpperCase();
      if (status === 'OPEN') stats.open += s.count;
      if (['ASSIGNED', 'INVESTIGATING', 'IN_PROGRESS'].includes(status)) stats.inProgress += s.count;
    });

    // Resolved Today specific query
    const resolvedToday = await Incident.countDocuments({
      status: { $in: ['RESOLVED', 'CLOSED'] },
      resolvedAt: { $gte: todayStart }
    });
    stats.resolvedToday = resolvedToday;

    // Format Trends
    // Identify date range to fill gaps if needed? For now just mapping.
    const formattedTrends = trendData.map(t => ({
      date: t._id,
      created: t.created,
      resolved: t.resolved
    }));

    // Get Recent Incidents
    const recentIncidents = await Incident.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('reportedBy', 'name')
      .populate('assignedTo', 'name');

    return {
      summary: stats,
      trends: formattedTrends,
      distribution: {
        severity: severityCounts.map(s => ({ category: s._id, count: s.count })),
        status: statusCounts.map(s => ({ category: s._id, count: s.count }))
      },
      performance: {
        teams: teamPerf
      },
      recentIncidents
    };

  } catch (error) {
    console.error("Aggregation Error:", error);
    throw error;
  }
};

/**
 * Get Incident Trends for a specific timeframe (Standalone)
 */
const getIncidentTrends = async (period = '30d') => {
  let days = 30;
  if (period === '7d') days = 7;
  if (period === '90d') days = 90;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const trends = await Incident.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        created: { $sum: 1 },
        resolved: {
          $sum: {
            $cond: [{ $in: ["$status", ["RESOLVED", "CLOSED"]] }, 1, 0]
          }
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  return trends.map(t => ({
    date: t._id,
    created: t.created,
    resolved: t.resolved
  }));
};

/**
 * Get Multi-Repsonder Performance Metrics
 */
const getResponderPerformance = async () => {
  const perf = await Incident.aggregate([
    { $match: { assignedTo: { $ne: null } } },
    {
      $group: {
        _id: "$assignedTo",
        resolvedCount: {
          $sum: { $cond: [{ $in: ["$status", ["RESOLVED", "CLOSED"]] }, 1, 0] }
        },
        totalResolutionTime: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $in: ["$status", ["RESOLVED", "CLOSED"]] },
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
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "userDetails"
      }
    },
    {
      $project: {
        name: { $arrayElemAt: ["$userDetails.name", 0] },
        resolvedCount: 1,
        avgResolutionTime: {
          $cond: [
            { $gt: ["$resolvedCount", 0] },
            { $round: [{ $divide: ["$totalResolutionTime", "$resolvedCount"] }, 1] },
            0
          ]
        }
      }
    },
    { $sort: { resolvedCount: -1 } }
  ]);
  return perf;
};

/**
 * Get Team Performance (Standalone)
 */
const getTeamPerformance = async () => {
  // This replicates the logic inside getUnifiedDashboardStats but solely for this call
  return await Incident.aggregate([
    { $match: { assignedTeam: { $ne: null } } },
    {
      $group: {
        _id: "$assignedTeam",
        totalIncidents: { $sum: 1 },
        resolvedCount: {
          $sum: { $cond: [{ $in: ["$status", ["RESOLVED", "CLOSED"]] }, 1, 0] }
        },
        slaBreachedCount: {
          $sum: { $cond: [{ $eq: ["$slaStatus", "BREACHED"] }, 1, 0] }
        },
        totalResolutionTime: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $in: ["$status", ["RESOLVED", "CLOSED"]] },
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
        slaBreachedCount: 1,
        avgResolutionTimeHours: {
          $cond: [
            { $gt: ["$resolvedCount", 0] },
            { $round: [{ $divide: ["$totalResolutionTime", "$resolvedCount"] }, 1] },
            0
          ]
        },
        slaComplianceRate: {
          $cond: [
            { $gt: ["$totalIncidents", 0] },
            {
              $multiply: [
                { $divide: [{ $subtract: ["$totalIncidents", "$slaBreachedCount"] }, "$totalIncidents"] },
                100
              ]
            },
            100
          ]
        }
      }
    }
  ]);
};

/**
 * Get Incidents By Category/Type
 */
const getIncidentsByCategory = async () => {
  const data = await Incident.aggregate([
    { $group: { _id: "$type", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  return data.map(i => ({
    category: i._id,
    count: i.count
  }));
};

// Alias to maintain compatibility if controller calls it this way
const calculateDashboardMetrics = getUnifiedDashboardStats;

module.exports = {
  getUnifiedDashboardStats,
  calculateDashboardMetrics,
  getIncidentTrends,
  getResponderPerformance,
  getTeamPerformance,
  getIncidentsByCategory
};