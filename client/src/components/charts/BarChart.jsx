import React from 'react';
import { Bar } from 'react-chartjs-2';
import '../../utils/chartConfig'; // Ensure registration

const BarChart = ({ data, title, height = 300, horizontal = false }) => {
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: horizontal ? 'y' : 'x',
        plugins: {
            legend: {
                position: 'top',
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
        },
        scales: {
            y: {
                beginAtZero: true,
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
            bar: {
                borderRadius: 4,
                maxBarThickness: 50
            }
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
            <Bar options={options} data={data} />
        </div>
    );
};

export default BarChart;
