import { useState, useEffect } from 'react';
import Layout from '../components/common/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import BarChart from '../components/charts/BarChart';
import DoughnutChart from '../components/charts/DoughnutChart';
import LineChart from '../components/charts/LineChart';
import {
    getDashboardStats,
    getIncidentTrends,
    getIncidentsBySeverity,
    getIncidentsByStatus,
    getTeamPerformance,
    exportReport
} from '../api/analyticsApi';
import { toast } from 'react-toastify';
import { FaDownload, FaChartPie, FaChartBar, FaChartLine, FaCheckCircle, FaExclamationCircle, FaClock } from 'react-icons/fa';
import './AnalyticsPage.css';

const AnalyticsPage = () => {
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [data, setData] = useState({
        summary: {},
        trends: [],
        severity: [],
        status: [],
        teams: []
    });

    useEffect(() => {
        fetchAnalyticsData();
    }, []);

    const fetchAnalyticsData = async () => {
        try {
            setLoading(true);

            // Single API call
            const response = await getDashboardStats();

            // Handle both axios-wrapped return (response) and raw axios response (response.data)
            // The API wrapper often returns the response object directly
            const apiData = response.data || response;

            if (!apiData) {
                throw new Error("No data received from analytics service");
            }

            setData({
                summary: apiData.summary || {},
                trends: apiData.trends || [],
                severity: apiData.distribution?.severity || [],
                status: apiData.distribution?.status || [],
                teams: apiData.performance?.teams || []
            });
        } catch (error) {
            console.error('Error loading analytics:', error);
            const errMsg = error.response?.data?.message || error.message || 'Unknown error';
            const status = error.response?.status ? ` (${error.response.status})` : '';
            toast.error(`Failed to load analytics: ${errMsg}${status}`);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            setExporting(true);
            await exportReport();
            toast.success('Report exported successfully');
        } catch (error) {
            toast.error('Failed to export report');
        } finally {
            setExporting(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="analytics-page-loading">
                    <LoadingSpinner size="lg" text="Crunching numbers..." />
                </div>
            </Layout>
        );
    }

    // --- Prepare Chart Data ---

    // 1. Incident Trends (Line Chart)
    const last30Days = Array.from({ length: 30 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        return d.toISOString().split('T')[0];
    });

    const trendLabels = last30Days.map(dateStr => {
        // Parse '2026-02-02' into local time string like 'Feb 2'
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            const d = new Date(parts[0], parts[1] - 1, parts[2]);
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
        return dateStr;
    });

    const trendCreated = last30Days.map(date => {
        const found = data.trends.find(t => t.date === date);
        return found ? found.created : 0;
    });
    const trendResolved = last30Days.map(date => {
        const found = data.trends.find(t => t.date === date);
        return found ? found.resolved : 0;
    });

    const trendData = {
        labels: trendLabels,
        datasets: [
            {
                label: 'New Incidents',
                data: trendCreated,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4
            },
            {
                label: 'Resolved',
                data: trendResolved,
                borderColor: '#22c55e',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                fill: true,
                tension: 0.4
            }
        ]
    };

    // 2. Status Distribution (Doughnut)
    const statusColorMap = {
        'OPEN': '#3b82f6',
        'IN_PROGRESS': '#f59e0b',
        'ASSIGNED': '#8b5cf6',
        'INVESTIGATING': '#f59e0b',
        'RESOLVED': '#10b981',
        'CLOSED': '#64748b'
    };

    const statusLabels = data.status.length > 0 ? data.status.map(s => s.category) : ['No Data'];
    const statusData = {
        labels: statusLabels,
        datasets: [{
            data: data.status.length > 0 ? data.status.map(s => s.count) : [1],
            backgroundColor: data.status.length > 0
                ? data.status.map(s => statusColorMap[s.category] || '#94a3b8')
                : ['#e2e8f0'],
            borderWidth: 0
        }]
    };

    // 3. Severity Distribution (Doughnut)
    const severityColorMap = {
        'CRITICAL': '#ef4444',
        'HIGH': '#f97316',
        'MEDIUM': '#eab308',
        'LOW': '#3b82f6'
    };

    const severityLabels = data.severity.length > 0 ? data.severity.map(s => s.category) : ['No Data'];
    const severityData = {
        labels: severityLabels,
        datasets: [{
            data: data.severity.length > 0 ? data.severity.map(s => s.count) : [1],
            backgroundColor: data.severity.length > 0
                ? data.severity.map(s => severityColorMap[s.category] || '#94a3b8')
                : ['#e2e8f0'],
            borderWidth: 0
        }]
    };

    // 4. Team Performance (Bar Chart - Resolution Time & SLA)
    const teamLabels = data.teams.length > 0 ? data.teams.map(t => t.name) : ['No Data'];

    const teamResolutionData = {
        labels: teamLabels,
        datasets: [
            {
                label: 'Avg Resolution (Hours)',
                data: data.teams.length > 0 ? data.teams.map(t => t.avgResolutionTimeHours) : [0],
                backgroundColor: '#6366f1',
                borderRadius: 4,
            }
        ]
    };

    const teamSLAData = {
        labels: teamLabels,
        datasets: [
            {
                label: 'SLA Compliance (%)',
                data: data.teams.length > 0 ? data.teams.map(t => t.slaComplianceRate) : [0],
                backgroundColor: data.teams.length > 0 ? data.teams.map(t =>
                    t.slaComplianceRate >= 90 ? '#10b981' :
                        t.slaComplianceRate >= 75 ? '#f59e0b' : '#ef4444'
                ) : ['#e2e8f0'],
                borderRadius: 4,
            }
        ]
    };

    return (
        <Layout>
            <div className="analytics-page">
                <header className="analytics-header">
                    <div className="header-title">
                        <h1><FaChartLine style={{ marginRight: '10px' }} /> Advanced Analytics</h1>
                        <p>Deep dive into operational metrics and team performance</p>
                    </div>
                    <div className="header-actions">
                        <button
                            className="btn btn-primary export-btn"
                            onClick={handleExport}
                            disabled={exporting}
                        >
                            <FaDownload /> {exporting ? 'Exporting...' : 'Export Report'}
                        </button>
                    </div>
                </header>

                <div className="analytics-insights-grid">
                    <div className="insight-card">
                        <div className="insight-icon total">
                            <FaChartLine />
                        </div>
                        <div className="insight-content">
                            <h3>Total Incidents</h3>
                            <p className="insight-value">{
                                // Calculate total from status counts or use a total field if provided
                                // Calculate total from status counts or use a total field if provided
                                (data.summary?.open || 0) +
                                (data.summary?.inProgress || 0) +
                                (data.status.find(s => s.category === 'RESOLVED')?.count || 0) +
                                (data.status.find(s => s.category === 'CLOSED')?.count || 0)
                            }</p>
                            <span className="insight-period">All Time Active</span>
                        </div>
                    </div>

                    <div className="insight-card">
                        <div className="insight-icon resolved">
                            <FaCheckCircle />
                        </div>
                        <div className="insight-content">
                            <h3>Resolved Today</h3>
                            <p className="insight-value">{data.summary?.resolvedToday || 0}</p>
                            <span className="insight-period">Last 24 Hours</span>
                        </div>
                    </div>

                    <div className="insight-card">
                        <div className="insight-icon open">
                            <FaExclamationCircle />
                        </div>
                        <div className="insight-content">
                            <h3>Active Now</h3>
                            <p className="insight-value">
                                {(data.summary?.open || 0) + (data.summary?.inProgress || 0)}
                            </p>
                            <span className="insight-period">Open + In Progress</span>
                        </div>
                    </div>

                    <div className="insight-card">
                        <div className="insight-icon sla">
                            <FaClock />
                        </div>
                        <div className="insight-content">
                            <h3>Avg Resolution</h3>
                            <p className="insight-value">
                                {data.summary?.avgResolutionTimeHours || 0} h
                            </p>
                            <span className="insight-period">Last 30 Days</span>
                        </div>
                    </div>
                </div>

                <div className="analytics-grid">
                    {/* Trends Section - Full Width */}
                    <div className="analytics-card full-width">
                        <div className="card-header">
                            <h3>Incident Volume Trends (30d)</h3>
                        </div>
                        <div className="card-body">
                            <LineChart data={trendData} height={300} />
                        </div>
                    </div>

                    {/* Distribution Row */}
                    <div className="analytics-card">
                        <div className="card-header">
                            <h3><FaChartPie className="card-icon" /> Status Distribution</h3>
                        </div>
                        <div className="card-body doughnut-container">
                            <DoughnutChart data={statusData} />
                        </div>
                    </div>

                    <div className="analytics-card">
                        <div className="card-header">
                            <h3><FaChartPie className="card-icon" /> Severity Distribution</h3>
                        </div>
                        <div className="card-body doughnut-container">
                            <DoughnutChart data={severityData} />
                        </div>
                    </div>

                    {/* Team Performance Row */}
                    <div className="analytics-card">
                        <div className="card-header">
                            <h3><FaChartBar className="card-icon" /> Team SLA Compliance</h3>
                        </div>
                        <div className="card-body">
                            <BarChart data={teamSLAData} horizontal={true} />
                        </div>
                    </div>

                    <div className="analytics-card">
                        <div className="card-header">
                            <h3><FaChartBar className="card-icon" /> Avg Resolution Time</h3>
                        </div>
                        <div className="card-body">
                            <BarChart data={teamResolutionData} />
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default AnalyticsPage;
