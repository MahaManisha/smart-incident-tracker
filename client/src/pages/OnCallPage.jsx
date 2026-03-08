import React, { useState, useEffect } from 'react';
import Layout from '../components/common/Layout';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { getOnCallSchedules, createOnCallSchedule, deleteOnCallSchedule, getCurrentOnCall } from '../api/onCallApi';
import { getAllUsers } from '../api/userApi';
import { toast } from 'react-toastify';
import { FaUserClock, FaCalendarPlus, FaTrashAlt, FaHistory } from 'react-icons/fa';
import { formatDateTime } from '../utils/formatters';
import { useAuth } from '../contexts/AuthContext';
import './OnCallPage.css';

const OnCallPage = () => {
    const { user } = useAuth();
    const [schedules, setSchedules] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [newShift, setNewShift] = useState({
        userId: '',
        startTime: '',
        endTime: '',
        shiftType: 'PRIMARY'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [schedData, currentData, userData] = await Promise.all([
                getOnCallSchedules(),
                getCurrentOnCall().catch(() => null),
                getAllUsers({ limit: 100 })
            ]);
            setSchedules(schedData);
            setCurrentUser(currentData);
            setUsers(userData.users || []);
        } catch (error) {
            toast.error('Failed to load on-call data');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createOnCallSchedule(newShift);
            toast.success('Schedule created successfully');
            setShowForm(false);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create schedule');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Deactivate this shift?')) return;
        try {
            await deleteOnCallSchedule(id);
            toast.success('Shift deactivated');
            fetchData();
        } catch (error) {
            toast.error('Failed to delete shift');
        }
    };

    return (
        <Layout>
            <div className="on-call-page">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">On-Call Management</h1>
                        <p className="page-description">Manage responder rotations and shift availability</p>
                    </div>
                    {user?.role === 'ADMIN' && (
                        <Button onClick={() => setShowForm(!showForm)}>
                            {showForm ? 'Cancel' : 'Add Shift'}
                        </Button>
                    )}
                </div>

                {/* Current On-Call Status */}
                <div className="current-oncall-card mb-8">
                    <div className="card-header-dense">
                        <h3 className="card-title-dense"><FaUserClock /> Active On-Call</h3>
                    </div>
                    <div className="card-body-dense flex items-center gap-6">
                        {currentUser ? (
                            <div className="flex-1 flex items-center justify-between">
                                <div className="user-profile-info flex items-center gap-4">
                                    <div className="avatar-placeholder-large">
                                        {currentUser.user.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold">{currentUser.user.name}</h2>
                                        <p className="text-sm text-secondary">{currentUser.user.email} | {currentUser.user.role}</p>
                                    </div>
                                </div>
                                <div className={`shift-badge ${currentUser.shiftType === 'SECONDARY' ? 'secondary' : 'primary'}`}>
                                    {currentUser.shiftType} SHIFT
                                </div>
                            </div>
                        ) : (
                            <p className="text-secondary italic">No engineer currently on-call</p>
                        )}
                    </div>
                </div>

                {showForm && (
                    <div className="card-compact p-6 mb-8 border-neon">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><FaCalendarPlus /> Schedule New Shift</h3>
                        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                            <div className="form-group">
                                <label className="form-label">Responder</label>
                                <select
                                    className="form-select"
                                    value={newShift.userId}
                                    onChange={(e) => setNewShift({ ...newShift, userId: e.target.value })}
                                    required
                                >
                                    <option value="">Select User</option>
                                    {users.filter(u => u.role !== 'REPORTER').map(u => (
                                        <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Shift Type</label>
                                <select
                                    className="form-select"
                                    value={newShift.shiftType}
                                    onChange={(e) => setNewShift({ ...newShift, shiftType: e.target.value })}
                                >
                                    <option value="PRIMARY">Primary (Incident Intake)</option>
                                    <option value="SECONDARY">Secondary (Escalation Path)</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Start Time</label>
                                <input
                                    type="datetime-local"
                                    className="form-input"
                                    value={newShift.startTime}
                                    onChange={(e) => setNewShift({ ...newShift, startTime: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">End Time</label>
                                <input
                                    type="datetime-local"
                                    className="form-input"
                                    value={newShift.endTime}
                                    onChange={(e) => setNewShift({ ...newShift, endTime: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="col-span-2 mt-4">
                                <Button type="submit">Publish Shift</Button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="upcoming-section card-compact p-0">
                    <div className="card-header-dense">
                        <h3 className="card-title-dense"><FaHistory /> Upcoming Rotations</h3>
                    </div>
                    {loading ? <LoadingSpinner /> : (
                        <div className="table-container m-0 border-0">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Engineer</th>
                                        <th>Type</th>
                                        <th>Start Time</th>
                                        <th>End Time</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {schedules.map(sched => (
                                        <tr key={sched._id} className={new Date(sched.startTime) <= new Date() && new Date(sched.endTime) >= new Date() ? 'row-active' : ''}>
                                            <td>
                                                <div className="font-bold">{sched.user.name}</div>
                                                <div className="text-xs text-secondary">{sched.user.email}</div>
                                            </td>
                                            <td>
                                                <span className={`tag shift-tag-${sched.shiftType.toLowerCase()}`}>
                                                    {sched.shiftType}
                                                </span>
                                            </td>
                                            <td>{formatDateTime(sched.startTime)}</td>
                                            <td>{formatDateTime(sched.endTime)}</td>
                                            <td>
                                                {new Date(sched.endTime) < new Date() ? (
                                                    <span className="text-secondary">Past</span>
                                                ) : new Date(sched.startTime) > new Date() ? (
                                                    <span className="text-primary">Upcoming</span>
                                                ) : (
                                                    <span className="text-success font-bold">LIVE</span>
                                                )}
                                            </td>
                                            <td>
                                                {user?.role === 'ADMIN' && (
                                                    <button
                                                        className="btn-icon danger"
                                                        onClick={() => handleDelete(sched._id)}
                                                        title="Deactivate Shift"
                                                    >
                                                        <FaTrashAlt />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default OnCallPage;
