import { formatStatus } from '../../utils/formatters';

const StatusBadge = ({ status, type = 'status' }) => {
  // Determine badge class based on type and value
  const getBadgeClass = () => {
    const statusLower = status?.toLowerCase();

    if (type === 'severity') {
      return `badge badge-${statusLower}`;
    } else if (type === 'status') {
      return `badge badge-${statusLower}`;
    } else if (type === 'sla') {
      if (status === 'WITHIN_SLA') return 'badge badge-sla-within';
      if (status === 'APPROACHING_BREACH') return 'badge badge-sla-warning';
      if (status === 'BREACHED') return 'badge badge-sla-breach';
    }

    return 'badge';
  };

  return <span className={getBadgeClass()}>{formatStatus(status)}</span>;
};

export default StatusBadge;