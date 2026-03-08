import React from 'react';
import { Line } from 'react-chartjs-2';
import '../../utils/chartConfig';

const LineChart = ({ data, title, height = 300 }) => {
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                align: 'end',
                labels: {
                    usePointStyle: true,
                    boxWidth: 8
                }
            },
            title: {
                display: !!title,
                text: title,
                font: {
                    size: 16,
                    weight: 'bold'
                },
                padding: {
                    bottom: 20
                },
                color: '#1e293b',
                align: 'start'
            },
            tooltip: {
                mode: 'index',
                intersect: false,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    precision: 0,
                    stepSize: 1
                },
                grid: {
                    borderDash: [5, 5]
                }
            },
            x: {
                grid: {
                    display: false
                }
            }
        },
        elements: {
            line: {
                tension: 0.4 // Smooth curves
            },
            point: {
                radius: 3,
                hoverRadius: 6
            }
        },
        interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
        }
    };

    if (!data || !data.labels || data.labels.length === 0) {
        return (
            <div style={{ height, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                <p>No data available</p>
            </div>
        );
    }

    return (
        <div style={{ height: height, width: '100%', position: 'relative' }}>
            <Line options={options} data={data} />
        </div>
    );
};

export default LineChart;
