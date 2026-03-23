import React, { useState, useEffect, useCallback } from 'react';
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
import { getGraph, getImpactAnalysis } from '../api/mappingApi';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { FaServer, FaInfoCircle, FaLink, FaProjectDiagram } from 'react-icons/fa';
import './ServiceMapPage.css';

const ServiceMapPage = () => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [loading, setLoading] = useState(true);
    const [showManager, setShowManager] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const [selectedNode, setSelectedNode] = useState(null);
    const [impactedServices, setImpactedServices] = useState([]);
    const [impactLoading, setImpactLoading] = useState(false);

    const fetchGraphData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await getGraph();
            const { nodes: backendNodes, edges: backendEdges } = response;

            // Transform backend nodes to React Flow nodes
            const transformedNodes = backendNodes.map((node, index) => {
                // simple grid layout
                const x = (index % 4) * 280;
                const y = Math.floor(index / 4) * 220;

                const statusColor = node.status_color || 'green';

                return {
                    id: node.id,
                    data: {
                        label: (
                            <div className="custom-node-content">
                                <div className="node-icon-wrapper">
                                    <FaServer />
                                </div>
                                <div className="node-text-wrapper">
                                    <strong className="node-label">{node.label}</strong>
                                    <div className="node-metadata">
                                        <span className={`status-dot ${statusColor}`}></span>
                                        <span className="status-text">{statusColor.toUpperCase()}</span>
                                    </div>
                                    <div className="node-criticality-badge">{node.criticality}</div>
                                </div>
                            </div>
                        )
                    },
                    position: { x, y },
                    className: `node-${statusColor}`,
                    style: {
                        borderRadius: '12px',
                        padding: '12px',
                        width: 200,
                        fontSize: '12px',
                        color: 'var(--text-primary)',
                        transition: 'all 0.5s ease'
                    }
                };
            });

            // Transform backend edges to React Flow edges
            const transformedEdges = backendEdges.map(edge => ({
                id: edge.id,
                source: edge.source,
                target: edge.target,
                label: edge.criticality === 'SOFT' ? 'SOFT' : '',
                animated: ['red', 'yellow'].includes(
                    backendNodes.find(n => n.id === edge.source)?.status_color
                ),
                style: {
                    stroke: edge.criticality === 'HARD' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.15)',
                    strokeWidth: edge.criticality === 'HARD' ? 2 : 1
                },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: edge.criticality === 'HARD' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.15)',
                },
            }));

            setNodes(transformedNodes);
            setEdges(transformedEdges);
        } catch (error) {
            console.error('Fetch Graph Error:', error);
            toast.error('Failed to load dependency graph');
        } finally {
            setLoading(false);
        }
    }, [setNodes, setEdges]);
    
    const onNodeClick = async (_, node) => {
        setSelectedNode(node);
        setImpactLoading(true);
        try {
            const data = await getImpactAnalysis(node.id);
            setImpactedServices(data);
            
            // Highlight impacted nodes
            const impactedIds = data.map(s => s._id);
            setNodes((nds) =>
                nds.map((n) => ({
                    ...n,
                    style: {
                        ...n.style,
                        border: impactedIds.includes(n.id) ? '4px solid #ef4444' : 'none',
                        boxShadow: impactedIds.includes(n.id) ? '0 0 20px #ef4444' : 'none',
                        opacity: (n.id === node.id || impactedIds.includes(n.id)) ? 1 : 0.4
                    }
                }))
            );

            // Highlight edges leading to impacted nodes
            setEdges((eds) =>
                eds.map((e) => ({
                    ...e,
                    animated: impactedIds.includes(e.target),
                    style: {
                        ...e.style,
                        stroke: impactedIds.includes(e.target) ? '#ef4444' : e.style.stroke,
                        opacity: impactedIds.includes(e.target) ? 1 : 0.2
                    }
                }))
            );
        } catch (error) {
            console.error('Impact Error:', error);
        } finally {
            setImpactLoading(false);
        }
    };

    const clearSelection = () => {
        setSelectedNode(null);
        setImpactedServices([]);
        fetchGraphData(); // Reset graph styles
    };

    useEffect(() => {
        fetchGraphData();
    }, [fetchGraphData]);

    return (
        <Layout>
            <div className="service-map-page">
                <div className="page-header mb-8">
                    <div className="flex justify-between items-end w-full">
                        <div>
                            <h1 className="page-title">Infrastructure Dependency Map</h1>
                            <p className="page-description">Visualize real-time service health and failure propagation</p>
                        </div>
                        <div className="flex gap-3">
                            <button 
                                className="btn-secondary flex items-center gap-2"
                                onClick={() => setShowInfo(!showInfo)}
                                title="How it works"
                            >
                                <FaInfoCircle /> INFO
                            </button>
                            <button 
                                className={`btn-${showManager ? 'primary' : 'secondary'} flex items-center gap-2`}
                                onClick={() => setShowManager(!showManager)}
                            >
                                <FaServer /> {showManager ? 'HIDE MANAGER' : 'MANAGE RELATIONSHIPS'}
                            </button>
                            <button className="btn-secondary" onClick={fetchGraphData}>
                                REFRESH LIVE STATUS
                            </button>
                        </div>
                    </div>
                </div>

                {showInfo && (
                    <div className="info-alert-panel">
                        <div className="info-content">
                            <div className="info-header">
                                <FaProjectDiagram className="text-primary-color" />
                                <h3>Understanding the Dependency Map</h3>
                            </div>
                            <div className="info-body">
                                <div className="info-step">
                                    <span className="step-num">1</span>
                                    <p><strong>Register Services:</strong> Go to the <strong>Inventory</strong> page to add your infrastructure components (APIs, DBs, etc).</p>
                                </div>
                                <div className="info-step">
                                    <span className="step-num">2</span>
                                    <p><strong>Map Relationships:</strong> Use the <strong>Manage Relationships</strong> tool above to define how services depend on each other.</p>
                                </div>
                                <div className="info-step">
                                    <span className="step-num">3</span>
                                    <p><strong>Monitor Health:</strong> The map automatically turns 🔴 or 🟡 when incidents are reported for a service, helping you visualize the blast radius of a failure.</p>
                                </div>
                            </div>
                            <button className="info-close" onClick={() => setShowInfo(false)}>&times;</button>
                        </div>
                    </div>
                )}

                {showManager && (
                    <div className="manager-overlay-container">
                        <DependencyManager />
                    </div>
                )}

                <div className="map-container-wrapper mt-10">
                    <div className="section-header">
                        <h4 className="mapped-title">Architectural Topology</h4>
                    </div>

                    <div className="map-container rounded-xl overflow-hidden shadow-2xl">
                        {loading ? (
                            <div className="flex h-full items-center justify-center bg-gray-900">
                                <LoadingSpinner />
                            </div>
                        ) : nodes.length === 0 ? (
                            <div className="flex h-full items-center justify-center bg-gray-900 text-secondary-color flex-col gap-6 text-center p-10">
                                <div className="empty-map-icon-wrapper">
                                    <FaServer size={60} className="text-blue-500 opacity-50" />
                                    <FaLink size={30} className="link-icon-absolute" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">No Infrastructure Mapped</h3>
                                    <p className="text-gray-400 max-w-md">Your dependency map is currently empty. Start by registering your services and then define their connections.</p>
                                </div>
                                <div className="flex gap-4">
                                    <Link to="/services" className="btn-primary flex items-center gap-2">
                                        <FaServer /> GO TO INVENTORY
                                    </Link>
                                    <button className="btn-secondary" onClick={() => setShowManager(true)}>
                                        ADD RELATIONSHIPS
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex h-full relative">
                                <ReactFlow
                                    nodes={nodes}
                                    edges={edges}
                                    onNodesChange={onNodesChange}
                                    onEdgesChange={onEdgesChange}
                                    onNodeClick={onNodeClick}
                                    onPaneClick={clearSelection}
                                    fitView
                                    className="dark-flow"
                                >
                                    <Background color="rgba(255,255,255,0.05)" gap={25} />
                                    <Controls />
                                    <MiniMap
                                        nodeStrokeColor={(n) => {
                                            if (n.className === 'node-red') return '#ef4444';
                                            if (n.className === 'node-yellow') return '#f59e0b';
                                            return '#10b981';
                                        }}
                                        nodeColor="rgba(0,0,0,0.5)"
                                        style={{ background: '#000', border: '1px solid #333' }}
                                        maskColor="rgba(0,0,0,0.2)"
                                    />
                                </ReactFlow>

                                {selectedNode && (
                                    <div className="impact-analysis-panel">
                                        <div className="panel-header">
                                            <h4 className="flex items-center gap-2">
                                                <FaExclamationTriangle className="text-amber-500" />
                                                Impact Analysis
                                            </h4>
                                            <button className="panel-close" onClick={clearSelection}>&times;</button>
                                        </div>
                                        <div className="panel-body">
                                            <div className="source-info">
                                                <label>Analyzing Failure impact for:</label>
                                                <div className="source-node-pill">
                                                    <FaServer /> {selectedNode.data.label.props.children[1].props.children[0].props.children}
                                                </div>
                                            </div>

                                            {impactLoading ? (
                                                <div className="p-4 text-center"><LoadingSpinner /></div>
                                            ) : (
                                                <div className="impact-results">
                                                    <label>Downstream Impacted Services ({impactedServices.length})</label>
                                                    {impactedServices.length === 0 ? (
                                                        <p className="no-impact-text">No downstream dependencies will be affected by a failure of this service.</p>
                                                    ) : (
                                                        <ul className="impact-list">
                                                            {impactedServices.map(s => (
                                                                <li key={s._id} className="impact-item">
                                                                    <FaArrowRight className="text-gray-600" />
                                                                    <span>{s.name}</span>
                                                                    <span className={`mini-badge ${s.criticality.toLowerCase()}`}>{s.criticality}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="panel-footer">
                                            <p className="text-[10px] text-gray-500 italic">This analysis follows all recursive "Depends On" relationships in your infrastructure.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="map-legend">
                    <div className="legend-item">
                        <div className="dot operational"></div>
                        <span>Healthy (No active incidents)</span>
                    </div>
                    <div className="legend-item">
                        <div className="dot degraded"></div>
                        <span>Degraded (P2/P3 Incidents)</span>
                    </div>
                    <div className="legend-item">
                        <div className="dot outage"></div>
                        <span>Critical (P0/P1 Incidents)</span>
                    </div>
                    <div className="legend-item border-l border-gray-700 pl-6 ml-4 italic text-xs text-secondary-color">
                        Downstream arrows indicate service dependencies
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default ServiceMapPage;
