import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
    getAllSLAPolicies,
    createSLAPolicy,
    updateSLAPolicy,
    deleteSLAPolicy,
    toggleSLAActivation
} from '../api/slaApi';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/common/Button';
import Layout from '../components/common/Layout';
import SLAList from '../components/sla/SLAList';
import SLAForm from '../components/sla/SLAForm';
import { FaPlus, FaShieldAlt } from 'react-icons/fa';

const SLAConfigPage = () => {
    const { hasRole } = useAuth();
    const isAdmin = hasRole('ADMIN');

    const [viewMode, setViewMode] = useState('LIST'); // LIST, CREATE, EDIT
    const [slaPolicies, setSlaPolicies] = useState([]);
    const [selectedPolicy, setSelectedPolicy] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadPolicies();
    }, []);

    const loadPolicies = async () => {
        try {
            setLoading(true);
            const data = await getAllSLAPolicies();
            const policies = data.slaRules || data; // Handle both wrapper/no-wrapper responses
            setSlaPolicies(Array.isArray(policies) ? policies : []);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load SLA policies');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setSelectedPolicy(null);
        setViewMode('CREATE');
    };

    const handleEdit = (policy) => {
        setSelectedPolicy(policy);
        setViewMode('EDIT');
    };

    const handleSave = async (formData) => {
        try {
            setLoading(true);
            if (viewMode === 'EDIT' && selectedPolicy) {
                await updateSLAPolicy(selectedPolicy._id, formData);
                toast.success('SLA Policy updated');
            } else {
                await createSLAPolicy(formData);
                toast.success('SLA Policy created');
            }
            setViewMode('LIST');
            loadPolicies();
        } catch (err) {
            console.error('SLA Save Error:', err);
            const msg = err.response?.data?.message || err.message || 'Failed to save SLA policy';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this SLA policy?')) return;
        try {
            await deleteSLAPolicy(id);
            toast.success('SLA Policy deleted');
            loadPolicies();
        } catch (err) {
            toast.error('Failed to delete policy');
        }
    };

    const handleToggleStatus = async (policy) => {
        try {
            await toggleSLAActivation(policy._id, !policy.isActive);
            toast.success(`Policy ${!policy.isActive ? 'activated' : 'deactivated'}`);
            loadPolicies();
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to update status';
            toast.error(msg);
        }
    };

    if (!isAdmin) {
        return (
            <Layout>
                <div className="min-h-[600px] flex items-center justify-center bg-gray-50">
                    <div className="text-center p-8 bg-white rounded-lg shadow-sm max-w-md mx-auto">
                        <FaShieldAlt className="mx-auto text-4xl mb-4 text-gray-400" />
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Access Restricted</h2>
                        <p className="text-gray-500">Only Administrators can manage SLA Policies.</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="sla-config-page min-h-screen bg-transparent">
                {/* Header Section - Only show in LIST mode */}
                {viewMode === 'LIST' && (
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 border-b border-gray-200 pb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center">
                                <FaShieldAlt className="mr-3 text-blue-600" size={24} />
                                SLA Policies
                            </h1>
                            <p className="text-sm text-gray-500 mt-2 max-w-2xl leading-relaxed ml-9">
                                Define response and resolution rules that govern how incidents are handled across the system.
                            </p>
                            <div className="flex items-center gap-3 mt-4 ml-9">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                    Admin Only
                                </span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                    Applied Automatically
                                </span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
                                    Priority-Based Matching
                                </span>
                            </div>
                        </div>
                        <div className="flex-shrink-0 mb-1">
                            <Button
                                variant="primary"
                                onClick={handleCreate}
                                icon={<FaPlus />}
                                className="whitespace-nowrap shadow-sm"
                            >
                                New Policy
                            </Button>
                        </div>
                    </div>
                )}

                {/* Main Content Area */}
                <div className="bg-transparent">
                    {viewMode === 'LIST' ? (
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                            {loading && slaPolicies.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                    <p className="mt-4 text-gray-500 text-sm">Loading policies...</p>
                                </div>
                            ) : (
                                <SLAList
                                    policies={slaPolicies}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    onToggleStatus={handleToggleStatus}
                                />
                            )}
                        </div>
                    ) : (
                        <SLAForm
                            initialData={selectedPolicy}
                            onSave={handleSave}
                            onCancel={() => setViewMode('LIST')}
                            loading={loading}
                        />
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default SLAConfigPage;
