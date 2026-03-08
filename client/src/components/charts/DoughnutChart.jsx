import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import '../../utils/chartConfig';

const DoughnutChart = ({ data, title, height = 300 }) => {
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
                labels: {
                    usePointStyle: true,
                    boxWidth: 8,
                    padding: 20
                }
            },
            title: {
                display: !!title,
                text: title,
                font: {
                    size: 16,
                    weight: 'bold'
                },
                color: '#1e293b',
                align: 'start'
            },
        },
        cutout: '70%'
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
            <Doughnut options={options} data={data} />
        </div>
    );
};

export default DoughnutChart;
