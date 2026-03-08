import React from 'react';
import { FaEdit, FaTrash, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const SLAList = ({ policies, onEdit, onDelete, onToggleStatus }) => {

    const formatScope = (scope) => {
        const parts = [];
        if (scope.service && scope.service.length)
            parts.push(<span key="svc" className="block text-gray-900">Services: <span className="font-medium">{scope.service.includes('ALL') ? 'All' : scope.service.length}</span></span>);
        if (scope.incidentType && scope.incidentType.length)
            parts.push(<span key="type" className="block text-gray-500 mt-0.5">Types: <span className="font-medium text-gray-700">{scope.incidentType.includes('ALL') ? 'All' : scope.incidentType.length}</span></span>);
        if (scope.priority && scope.priority.length)
            parts.push(<span key="prio" className="block text-gray-500 mt-0.5">Priorities: <span className="font-medium text-gray-700">{scope.priority.join(', ')}</span></span>);

        return parts.length > 0 ? (
            <div className="text-xs leading-relaxed">{parts}</div>
        ) : (
            <span className="text-xs text-gray-400 italic">Global Default Scope</span>
        );
    };

    const formatTargets = (targets) => {
        if (!targets || targets.length === 0) return <span className="text-gray-400 text-sm">-</span>;

        // Sort by priority (Critical first)
        const order = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
        const sorted = [...targets].sort((a, b) => order[a.priority] - order[b.priority]);
        const topTargets = sorted.slice(0, 2); // Show top 2 only to save space, maybe? Or show all condensed.

        return (
            <div className="flex flex-col gap-1.5">
                {sorted.map(t => (
                    <div key={t.priority} className="flex items-center text-xs">
                        <span className={`w-16 font-semibold ${t.priority === 'CRITICAL' ? 'text-red-700' :
                            t.priority === 'HIGH' ? 'text-orange-700' : 'text-gray-600'
                            }`}>{t.priority}</span>
                        <span className="text-gray-500 tracking-tight">
                            {t.responseTime}m / {Math.round(t.resolutionTime / 60 * 10) / 10}h
                        </span>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="w-full overflow-hidden">
            <table className="w-full table-fixed divide-y divide-gray-200">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                    <tr>
                        <th scope="col" className="px-6 py-4 text-left w-1/4">Policy Name</th>
                        <th scope="col" className="px-6 py-4 text-left w-1/5">Scope</th>
                        <th scope="col" className="px-6 py-4 text-left w-1/4">Targets (Resp / Res)</th>
                        <th scope="col" className="px-6 py-4 text-center w-24">Rules</th>
                        <th scope="col" className="px-6 py-4 text-center w-24">Status</th>
                        <th scope="col" className="px-6 py-4 text-left w-32">Last Updated</th>
                        <th scope="col" className="px-6 py-4 text-right w-28">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                    {policies.map(policy => (
                        <tr key={policy._id} className="group hover:bg-gray-50 transition-colors duration-150 ease-in-out">
                            <td className="px-6 py-5 align-top">
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-gray-900 line-clamp-1" title={policy.name}>
                                        {policy.name}
                                    </span>
                                    {policy.description && (
                                        <span className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed" title={policy.description}>
                                            {policy.description}
                                        </span>
                                    )}
                                    <div className="mt-2">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                            Priority {policy.policyPriority}
                                        </span>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-5 align-top">
                                {formatScope(policy.scope)}
                            </td>
                            <td className="px-6 py-5 align-top">
                                {formatTargets(policy.targets)}
                            </td>
                            <td className="px-6 py-5 align-top text-center">
                                {policy.escalations && policy.escalations.length > 0 ? (
                                    <span className="inline-flex items-center justify-center h-6 px-2 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                        {policy.escalations.length}
                                    </span>
                                ) : (
                                    <span className="text-gray-300">-</span>
                                )}
                            </td>
                            <td className="px-6 py-5 align-top text-center">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${policy.isActive
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-600'
                                    }`}>
                                    {policy.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </td>
                            <td className="px-6 py-5 align-top text-sm text-gray-500 whitespace-nowrap">
                                {new Date(policy.updatedAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-5 align-top text-right">
                                <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => onToggleStatus(policy)}
                                        className={`p-1.5 rounded-md transition-colors ${policy.isActive
                                            ? 'text-green-600 hover:bg-green-50'
                                            : 'text-gray-400 hover:bg-gray-100'
                                            }`}
                                        title={policy.isActive ? "Deactivate" : "Activate"}
                                    >
                                        {policy.isActive ? <FaCheckCircle size={15} /> : <FaTimesCircle size={15} />}
                                    </button>
                                    <button
                                        onClick={() => onEdit(policy)}
                                        className="p-1.5 text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                                        title="Edit Policy"
                                    >
                                        <FaEdit size={15} />
                                    </button>
                                    <button
                                        onClick={() => onDelete(policy._id)}
                                        className="p-1.5 text-red-600 rounded-md hover:bg-red-50 transition-colors"
                                        title="Delete Policy"
                                    >
                                        <FaTrash size={15} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}

                </tbody>
            </table>
        </div>
    );
};

export default SLAList;
