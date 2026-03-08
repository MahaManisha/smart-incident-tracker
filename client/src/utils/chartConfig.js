import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

// Global default options
ChartJS.defaults.font.family = "'Inter', sans-serif";
ChartJS.defaults.color = '#64748b';
ChartJS.defaults.scale.grid.color = '#f1f5f9';
ChartJS.defaults.plugins.tooltip.backgroundColor = '#1e293b';
ChartJS.defaults.plugins.tooltip.padding = 10;
ChartJS.defaults.plugins.tooltip.cornerRadius = 8;

export default ChartJS;
