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
import { getGraph } from '../api/mappingApi';
import { toast } from 'react-toastify';
import './ServiceMapPage.css';

const ServiceMapPage = () => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [loading, setLoading] = useState(true);

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
                                <strong>{node.label}</strong>
                                <div className="node-status-badge">{statusColor.toUpperCase()}</div>
                                <div className="node-criticality">{node.criticality}</div>
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
                        <button className="btn-secondary" onClick={fetchGraphData}>
                            REFRESH LIVE STATUS
                        </button>
                    </div>
                </div>

                <DependencyManager />

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
                            <div className="flex h-full items-center justify-center bg-gray-900 text-secondary-color flex-col gap-4">
                                <FaServer size={40} className="opacity-20" />
                                <p>No infrastructure discovered. Add services in Inventory to view map.</p>
                            </div>
                        ) : (
                            <ReactFlow
                                nodes={nodes}
                                edges={edges}
                                onNodesChange={onNodesChange}
                                onEdgesChange={onEdgesChange}
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
