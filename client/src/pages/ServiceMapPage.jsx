import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import Layout from '../components/common/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import DependencyManager from '../components/incidents/DependencyManager';
import { getGraph, getImpactAnalysis, getServiceStatus, getTopologyForIncident } from '../api/mappingApi';
import { getAllIncidents } from '../api/incidentApi';
import { toast } from 'react-toastify';
import { Link, useNavigate } from 'react-router-dom';
import { 
    FaServer, FaInfoCircle, FaLink, FaProjectDiagram, FaExclamationTriangle, 
    FaArrowRight, FaUser, FaClock, FaBug, FaSkullCrossbones, FaBolt, FaPlay, FaLongArrowAltRight,
    FaHistory, FaStop
} from 'react-icons/fa';
import { getIncidentTimeline } from '../api/incidentApi';
import Button from '../components/common/Button';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { USER_ROLES } from '../utils/constants';
import './ServiceMapPage.css';

const ServiceMapPage = () => {
    const { hasRole } = useAuth();
    const { socket } = useSocket();
    const navigate = useNavigate();
    const isAdmin = hasRole(USER_ROLES.ADMIN);
    
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [loading, setLoading] = useState(true);
    const [showManager, setShowManager] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const [demoMode, setDemoMode] = useState(false);
    
    const [selectedNode, setSelectedNode] = useState(null);
    const [nodeDetails, setNodeDetails] = useState(null);
    const [impactedServices, setImpactedServices] = useState([]);
    const [detailsLoading, setDetailsLoading] = useState(false);

    const [incidents, setIncidents] = useState([]);
    const [selectedIncident, setSelectedIncident] = useState(''); // Stores Incident ID
    const [error, setError] = useState(null);

    // Replay State
    const [isReplaying, setIsReplaying] = useState(false);
    const [replayBatch, setReplayBatch] = useState([]);
    const [replayCursor, setReplayCursor] = useState(0);

    const runReplay = async () => {
        if (!selectedIncident) return;
        try {
            setIsReplaying(true);
            setLoading(true);
            const timeline = await getIncidentTimeline(selectedIncident);
            const events = timeline.data || timeline;
            setReplayBatch(events);
            setReplayCursor(0);
            
            // Replay sequence
            for (let i = 0; i < events.length; i++) {
                setReplayCursor(i);
                // Highlight nodes based on event type
                const event = events[i];
                if (event.type === 'STATUS_UPDATED') {
                    toast.info(`Time: ${new Date(event.timestamp).toLocaleTimeString()} - Status: ${event.data.newStatus}`, { autoClose: 1000 });
                }
                await new Promise(r => setTimeout(r, 2000)); // 2s per event
            }
            toast.success("Incident Replay Completed");
        } catch (err) {
            toast.error("Replay failed");
        } finally {
            setIsReplaying(false);
            setLoading(false);
        }
    };

    const fetchIncidents = useCallback(async () => {
        try {
            const response = await getAllIncidents({ status: 'OPEN,ASSIGNED,INVESTIGATING' });
            // The response might be { incidents: [...] } or just [...]
            setIncidents(response.incidents || response.data || []);
        } catch (error) {
            console.error('Error fetching incidents:', error);
        }
    }, []);

    useEffect(() => {
        fetchIncidents();
    }, [fetchIncidents]);

    const fetchGraphData = useCallback(async (isSilent = false) => {
        if (!selectedIncident && !demoMode) {
            setNodes([]);
            setEdges([]);
            return;
        }

        try {
            if (!isSilent) setLoading(true);
            setError(null);
            
            let backendNodes, backendEdges;
            if (demoMode) {
                // If demo mode is active but an incident is selected, 
                // we can either show a random scenario OR simulation for that incident.
                // Request simulation from backend.
                const response = await getTopologyForIncident(selectedIncident || 'latest', true);
                backendNodes = response.nodes;
                backendEdges = response.edges;
            } else if (selectedIncident) {
                const response = await getTopologyForIncident(selectedIncident);
                backendNodes = response.nodes;
                backendEdges = response.edges;
            } else {
                // Global view if no incident is selected but we want a general graph
                const response = await getGraph();
                backendNodes = response.nodes;
                backendEdges = response.edges;
            }

            // Step 3 & 5: Visible Propagation Logic
            const transformedNodes = backendNodes.map((node, index) => {
                const x = (index % 4) * 320; // Increased spacing for labels
                const y = Math.floor(index / 4) * 250;
                const statusColor = node.status_color || 'green';
                const isFailed = statusColor === 'red' || statusColor === 'yellow';

                return {
                    id: node.id,
                    data: {
                        label: (
                            <div className={`node-v3 ${statusColor} ${node.is_root_cause ? 'node-root' : ''}`}>
                                {node.is_root_cause && (
                                    <div className="node-crown"><FaSkullCrossbones /> ROOT CAUSE</div>
                                )}
                                {node.is_first_failure && (
                                    <div className="node-spark"><FaBolt /> FIRST FAIL</div>
                                )}
                                <div className="node-body">
                                    <div className="node-main-icon"><FaServer /></div>
                                    <div className="node-details">
                                        <div className="node-title">{node.label}</div>
                                        <div className="node-sub">{node.type}</div>
                                    </div>
                                </div>
                                <div className={`node-status-bar bar-${statusColor}`}>
                                    {statusColor.toUpperCase()}
                                </div>
                            </div>
                        )
                    },
                    position: { x, y },
                    className: `flow-node-v3`,
                    style: {
                        width: 240,
                        height: 110,
                        zIndex: node.is_root_cause ? 100 : 1,
                        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                    }
                };
            });

            // Step 5 & 6: Clean Arrows and Edge Labels
            const transformedEdges = backendEdges.map(edge => {
                const sourceNode = backendNodes.find(n => n.id === edge.source);
                const isFailurePath = sourceNode && ['red', 'yellow'].includes(sourceNode.status_color);

                return {
                    id: edge.id,
                    source: edge.source,
                    target: edge.target,
                    label: edge.label || '', // Step 6
                    labelStyle: { fill: '#ffffff66', fontSize: 10, fontWeight: 700, fontFamily: 'Orbitron' },
                    labelBgStyle: { fill: '#050508', fillOpacity: 0.8 },
                    type: 'smoothstep', // Step 5
                    animated: isFailurePath, // Step 3
                    style: {
                        stroke: isFailurePath ? '#ff3e3e' : 'rgba(255, 255, 255, 0.15)',
                        strokeWidth: isFailurePath ? 4 : 2, // Step 3: Thick lines
                        filter: isFailurePath ? 'drop-shadow(0 0 8px rgba(255, 62, 62, 0.8))' : 'none'
                    },
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        width: 24,
                        height: 24,
                        color: isFailurePath ? '#ff3e3e' : 'rgba(255, 255, 255, 0.15)',
                    },
                };
            });

            setNodes(transformedNodes);
            setEdges(transformedEdges);
        } catch (error) {
            console.error('Graph Error:', error);
            setError(error.message || 'Failed to resolve topology');
            if (!isSilent) toast.error('Failed to resolve topology');
        } finally {
            if (!isSilent) setLoading(false);
        }
    }, [setNodes, setEdges, demoMode, selectedIncident]);
    
    useEffect(() => {
        if (demoMode) return;
        const interval = setInterval(() => fetchGraphData(true), 15000);
        return () => clearInterval(interval);
    }, [fetchGraphData, demoMode]);

    useEffect(() => {
        if (socket && !demoMode) {
            socket.on('GRAPH_UPDATED', () => fetchGraphData(true));
            return () => socket.off('GRAPH_UPDATED');
        }
    }, [socket, fetchGraphData, demoMode]);

    // Step 4: Click = Blast Radius Analysis
    const onNodeClick = async (_, node) => {
        setSelectedNode(node);
        setDetailsLoading(true);
        try {
            const [impactData, statusData] = await Promise.all([
                getImpactAnalysis(node.id),
                getServiceStatus(node.id)
            ]);
            
            setImpactedServices(impactData);
            setNodeDetails(statusData);
            
            const impactedIds = impactData.map(s => s._id);
            setNodes((nds) =>
                nds.map((n) => ({
                    ...n,
                    style: {
                        ...n.style,
                        border: impactedIds.includes(n.id) ? '4px solid #ff3e3e' : '1px solid rgba(255,255,255,0.1)',
                        boxShadow: impactedIds.includes(n.id) ? '0 0 25px rgba(255, 62, 62, 0.6)' : 'none',
                        opacity: (n.id === node.id || impactedIds.includes(n.id)) ? 1 : 0.15, // Bright target, dim others
                        transform: (n.id === node.id || impactedIds.includes(n.id)) ? 'scale(1.1)' : 'scale(1)'
                    }
                }))
            );

            setEdges((eds) =>
                eds.map((e) => ({
                    ...e,
                    animated: impactedIds.includes(e.target),
                    style: {
                        ...e.style,
                        stroke: impactedIds.includes(e.target) ? '#ff3e3e' : 'rgba(255,255,255,0.05)',
                        strokeWidth: impactedIds.includes(e.target) ? 6 : 1,
                        opacity: impactedIds.includes(e.target) ? 1 : 0.05
                    }
                }))
            );
        } catch (error) { console.error(error); } finally { setDetailsLoading(false); }
    };

    const clearSelection = () => {
        setSelectedNode(null);
        setNodeDetails(null);
        setImpactedServices([]);
        fetchGraphData(true);
    };

    useEffect(() => {
        fetchGraphData();
    }, [fetchGraphData, selectedIncident, demoMode]);

    return (
        <Layout>
            <div className="service-map-page">
                <div className="map-toolbar">
                    <div className="toolbar-left">
                        <h1 className="cyber-title">TOPOLOGY INTELLIGENCE ENGINE</h1>
                        <div className="live-status-chip">
                            <span className="pulse-dot"></span> REAL-TIME MONITORING ACTIVE
                        </div>
                    </div>
                    <div className="toolbar-right">
                        <div className="incident-selector-wrapper">
                            <select 
                                className="cyber-select"
                                value={selectedIncident}
                                onChange={(e) => setSelectedIncident(e.target.value)}
                            >
                                <option value="">SELECT INCIDENT...</option>
                                {incidents.map(inc => (
                                    <option key={inc._id} value={inc._id}>
                                        {inc.incidentNumber}: {inc.title.substring(0, 30)}...
                                    </option>
                                ))}
                            </select>
                        </div>

                        <Button 
                            className={`demo-btn ${demoMode ? 'active' : ''}`}
                            onClick={() => setDemoMode(!demoMode)}
                            icon={demoMode ? <FaStop /> : <FaPlay />}
                            disabled={!selectedIncident && !demoMode}
                        >
                            {demoMode ? 'LIVE PRODUCTION' : 'SIMULATE PROPAGATION'}
                        </Button>

                        <Button 
                            variant={isReplaying ? "primary" : "secondary"}
                            onClick={runReplay}
                            icon={isReplaying ? <FaStop /> : <FaHistory />}
                            disabled={!selectedIncident || isReplaying}
                            className={isReplaying ? 'pulse-border' : ''}
                        >
                            {isReplaying ? `REPLAYING STEP ${replayCursor+1}/${replayBatch.length}` : 'REPLAY INCIDENT'}
                        </Button>

                        <Button variant="secondary" onClick={() => setShowInfo(!showInfo)} icon={<FaInfoCircle />}>HOW-TO</Button>
                        {isAdmin && (
                            <Button 
                                variant={showManager ? "primary" : "secondary"}
                                onClick={() => setShowManager(!showManager)}
                                icon={<FaLink />}
                            >
                                RELATIONS
                            </Button>
                        )}
                    </div>
                </div>

                {showManager && (
                    <div className="topology-manager-overlay">
                        <DependencyManager onUpdate={() => fetchGraphData(true)} />
                    </div>
                )}

                <div className="map-viewport">
                    {loading ? (
                        <div className="loading-overlay"><LoadingSpinner text="Tracing Dependencies..." /></div>
                    ) : error ? (
                        <div className="placeholder-container error-state">
                            <FaExclamationTriangle className="text-danger-color text-5xl mb-4" />
                            <h3>CRITICAL SYSTEM ERROR</h3>
                            <p>{error}</p>
                            <Button onClick={() => fetchGraphData()} className="mt-4">RETRY TRACE</Button>
                        </div>
                    ) : (!selectedIncident && !demoMode) ? (
                        <div className="placeholder-container">
                            <FaProjectDiagram className="placeholder-icon" />
                            <h3>TOPOLOGY ENGINE STANDBY</h3>
                            <p>Select an active incident from the terminal above to initialize intelligence trace.</p>
                        </div>
                    ) : (
                        <div className="w-full h-full relative">
                            <ReactFlow
                                nodes={nodes}
                                edges={edges}
                                onNodesChange={onNodesChange}
                                onEdgesChange={onEdgesChange}
                                onNodeClick={onNodeClick}
                                onPaneClick={clearSelection}
                                fitView
                                className="cyber-flow"
                            >
                                <Background color="#0a0a0f" gap={50} />
                                <Controls />
                            </ReactFlow>

                            {selectedNode && (
                                <div className="intelligence-panel slide-in">
                                    <div className="panel-header">
                                        <div className="flex items-center gap-3">
                                            <FaProjectDiagram className="text-primary-color" />
                                            <h3>{nodeDetails?.service.name || 'ANALYTICS'}</h3>
                                        </div>
                                        <button className="close-btn" onClick={clearSelection}>&times;</button>
                                    </div>

                                    <div className="panel-body">
                                        {detailsLoading ? (
                                            <LoadingSpinner size="sm" />
                                        ) : nodeDetails && (
                                            <>
                                                <div className="quick-stats">
                                                    <div className="stat-card">
                                                        <span className="sc-label uppercase">Health</span>
                                                        <span className={`sc-val status-${nodeDetails.service.status.toLowerCase()}`}>
                                                            {nodeDetails.service.status}
                                                        </span>
                                                    </div>
                                                    <div className="stat-card">
                                                        <span className="sc-label uppercase">Impact</span>
                                                        <span className="sc-val text-white">{impactedServices.length} Nodes</span>
                                                    </div>
                                                </div>

                                                <div className="intel-group">
                                                    <label className="intel-label"><FaBug /> ACTIVE INVESTIGATIONS</label>
                                                    {nodeDetails.activeIncidents.length === 0 ? (
                                                        <div className="empty-intel">No reported incidents.</div>
                                                    ) : nodeDetails.activeIncidents.map(inc => (
                                                        <div key={inc.id} className="mini-inc-card">
                                                            <div className="mini-hdr">
                                                                <span className="num">{inc.incidentNumber}</span>
                                                                <span className={`prio pri-${inc.priority.toLowerCase()}`}>{inc.priority}</span>
                                                            </div>
                                                            <div className="mini-ttl">{inc.title}</div>
                                                            <div className="mini-ftr">
                                                                <span><FaUser /> {inc.assignedTo}</span>
                                                                <span className="timer"><FaClock /> {new Date(inc.slaDeadline).toLocaleTimeString()}</span>
                                                            </div>
                                                            <div className="mini-actions mt-3">
                                                                <Link to={`/incidents/${inc.id}`} className="mini-btn">VIEW ANALYSIS</Link>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="intel-group mt-6">
                                                    <label className="intel-label"><FaExclamationTriangle /> BLAST RADIUS (DOWNSTREAM)</label>
                                                    <div className="blast-container">
                                                        {impactedServices.map(s => (
                                                            <div key={s._id} className="blast-item">
                                                                <FaLongArrowAltRight /> {s.name}
                                                            </div>
                                                        ))}
                                                        {impactedServices.length === 0 && <div className="empty-intel">No downstream propagation.</div>}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="map-footer-labels">
                    <div className="label-set"><span className="dot ok"></span> Healthy</div>
                    <div className="label-set"><span className="dot warn"></span> Degraded</div>
                    <div className="label-set"><span className="dot fail"></span> Outage</div>
                    <div className="label-set ml-6 pl-4 border-l border-white/20">
                        <span className="text-danger-color font-bold">☠ ROOT CAUSE:</span> Start of failure chain
                    </div>
                    <div className="label-set ml-6 pl-4 border-l border-white/20">
                        <span className="text-white opacity-40 italic">Double-click edge to edit link</span>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default ServiceMapPage;
