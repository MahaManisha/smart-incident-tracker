import React, { useState, useEffect } from 'react';
import Layout from '../components/common/Layout';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { getOnCallSchedules, createOnCallSchedule, deleteOnCallSchedule, getCurrentOnCall } from '../api/onCallApi';
import { getAllUsers } from '../api/userApi';
import { toast } from 'react-toastify';
import { FaUserClock, FaCalendarPlus, FaTrashAlt, FaExchangeAlt, FaShieldAlt, FaPhoneAlt } from 'react-icons/fa';
import { formatDateTime } from '../utils/formatters';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './OnCallPage.css';

const localizer = momentLocalizer(moment);

const OnCallPage = () => {
    const { user } = useAuth();
    const [schedules, setSchedules] = useState([]);
    const [currentOnCall, setCurrentOnCall] = useState({ PRIMARY: [], SECONDARY: [], TERTIARY: [] });
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
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
                getCurrentOnCall().catch(() => ({ data: { PRIMARY: [], SECONDARY: [], TERTIARY: [] } })),
                getAllUsers({ limit: 100 })
            ]);
            
            setSchedules(schedData.data || schedData || []);
            
            const curData = currentData.data || currentData || {};
            setCurrentOnCall({
                PRIMARY: curData.PRIMARY || [],
                SECONDARY: curData.SECONDARY || [],
                TERTIARY: curData.TERTIARY || []
            });
            
            setUsers(userData.users || userData.data?.users || userData || []);
        } catch (error) {
            console.error(error);
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

    const handleDelete = async (id, title = 'Deactivate this shift?') => {
        if (!window.confirm(title)) return;
        try {
            await deleteOnCallSchedule(id);
            toast.success('Shift deactivated');
            setSelectedEvent(null);
            fetchData();
        } catch (error) {
            toast.error('Failed to delete shift');
        }
    };

    const handleSelectSlot = ({ start, end }) => {
        // Pre-fill form when clicking an empty calendar slot
        if (user?.role === 'ADMIN' || user?.role === 'RESPONDER') {
            // Convert to YYYY-MM-DDThh:mm format for datetime-local input
            const localStart = new Date(start.getTime() - start.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
            const localEnd = new Date(end.getTime() - end.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
            
            setNewShift({
                userId: user.id || user._id,
                startTime: localStart,
                endTime: localEnd,
                shiftType: 'PRIMARY'
            });
            setShowForm(true);
            setSelectedEvent(null);
        }
    };

    const handleSelectEvent = (event) => {
        setSelectedEvent(event);
        setShowForm(false);
    };
    
    // Process schedules for React Big Calendar
    const calendarEvents = Array.isArray(schedules) ? schedules.map(sched => ({
        id: sched._id,
        title: `${sched.user?.name || 'Unknown'} (${sched.shiftType})`,
        start: new Date(sched.startTime),
        end: new Date(sched.endTime),
        resource: sched
    })) : [];

    const eventStyleGetter = (event) => {
        let backgroundColor = '#3b82f6'; // default primary
        if (event.resource.shiftType === 'SECONDARY') backgroundColor = '#f59e0b';
        if (event.resource.shiftType === 'TERTIARY') backgroundColor = '#8b5cf6';
        if (!event.resource.isActive) backgroundColor = '#94a3b8'; // Deactivated/Past
        
        return {
            style: {
                backgroundColor,
                borderRadius: '6px',
                opacity: 0.9,
                color: 'white',
                border: 'none',
                display: 'block',
                fontSize: '0.85rem',
                padding: '2px 6px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }
        };
    };

    const renderTierCard = (title, type, icon, shifts, colorClass) => {
        const activeUsers = shifts || [];
        
        return (
            <div className={`tier-card card-compact border-${colorClass}`}>
                <div className="tier-header">
                    <h3 className={`text-lg font-bold flex items-center gap-2 text-${colorClass}`}>
                        {icon} {title}
                    </h3>
                </div>
                <div className="tier-body mt-4">
                    {activeUsers.length > 0 ? (
                        <div className="flex flex-col gap-3">
                            {activeUsers.map((shift, idx) => (
                                <div key={idx} className="active-oncall-user flex items-center gap-3">
                                    <div className={`avatar-placeholder-sm bg-${colorClass}-100 text-${colorClass}-700`}>
                                        {shift.user?.name?.charAt(0) || '?'}
                                    </div>
                                    <div>
                                        <div className="font-bold">{shift.user?.name}</div>
                                        <div className="text-xs text-secondary">{shift.user?.email}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-secondary italic text-sm py-2">No active coverage</p>
                    )}
                </div>
            </div>
        );
    };

    return (
        <Layout>
            <div className="on-call-page">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">On-Call Command Center</h1>
                        <p className="page-description">Visual calendar, escalation tiers, and shift overrides</p>
                    </div>
                    {(user?.role === 'ADMIN' || user?.role === 'RESPONDER') && (
                        <Button onClick={() => setShowForm(!showForm)} className="shadow-lg">
                            {showForm ? 'Cancel Form' : <><FaCalendarPlus /> Request/Override Shift</>}
                        </Button>
                    )}
                </div>

                {/* Current On-Call Escalation Paths */}
                <div className="escalation-tiers-grid grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {renderTierCard("Primary L1", "PRIMARY", <FaUserClock />, currentOnCall.PRIMARY, "primary")}
                    {renderTierCard("Secondary L2", "SECONDARY", <FaShieldAlt />, currentOnCall.SECONDARY, "warning")}
                    {renderTierCard("Tertiary L3", "TERTIARY", <FaPhoneAlt />, currentOnCall.TERTIARY, "purple")}
                </div>

                <div className="calendar-and-forms-grid">
                    {/* Only show form when requested or clicking an empty spot */}
                    {showForm && (
                        <div className="card-compact p-6 mb-8 override-form-card">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <FaExchangeAlt /> Override / Create Shift
                            </h3>
                            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                                <div className="form-group col-span-2 md:col-span-1">
                                    <label className="form-label">Engineer</label>
                                    <select
                                        className="form-select"
                                        value={newShift.userId}
                                        onChange={(e) => setNewShift({ ...newShift, userId: e.target.value })}
                                        required
                                        disabled={user?.role !== 'ADMIN' && newShift.userId !== user?.id} // Non-admins can only assign themselves usually, but leaving open if needed
                                    >
                                        <option value="">Select User</option>
                                        {users.filter(u => u.role !== 'REPORTER').map(u => (
                                            <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group col-span-2 md:col-span-1">
                                    <label className="form-label">Fallback Tier (Shift Type)</label>
                                    <select
                                        className="form-select"
                                        value={newShift.shiftType}
                                        onChange={(e) => setNewShift({ ...newShift, shiftType: e.target.value })}
                                    >
                                        <option value="PRIMARY">L1 - Primary Intake</option>
                                        <option value="SECONDARY">L2 - Secondary Escalation</option>
                                        <option value="TERTIARY">L3 - Tertiary Fallback</option>
                                    </select>
                                </div>
                                <div className="form-group col-span-2 md:col-span-1">
                                    <label className="form-label">Start Time</label>
                                    <input
                                        type="datetime-local"
                                        className="form-input"
                                        value={newShift.startTime}
                                        onChange={(e) => setNewShift({ ...newShift, startTime: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group col-span-2 md:col-span-1">
                                    <label className="form-label">End Time</label>
                                    <input
                                        type="datetime-local"
                                        className="form-input"
                                        value={newShift.endTime}
                                        onChange={(e) => setNewShift({ ...newShift, endTime: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="col-span-2 mt-4 flex gap-3">
                                    <Button type="submit" className="w-full">Publish Override Schedule</Button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Shift Details Modal / Card when event clicked */}
                    {selectedEvent && (
                        <div className="card-compact p-6 mb-8 active-event-card border-primary relative">
                            <button 
                                className="absolute top-4 right-4 text-secondary hover:text-primary" 
                                onClick={() => setSelectedEvent(null)}
                            >
                                ✕
                            </button>
                            <h3 className="text-lg font-bold mb-4 border-b pb-2">Shift Details</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                                <div><strong className="block text-secondary">Engineer</strong> {selectedEvent.resource.user?.name}</div>
                                <div><strong className="block text-secondary">Tier</strong> {selectedEvent.resource.shiftType}</div>
                                <div><strong className="block text-secondary">Start</strong> {formatDateTime(selectedEvent.start)}</div>
                                <div><strong className="block text-secondary">End</strong> {formatDateTime(selectedEvent.end)}</div>
                                <div><strong className="block text-secondary">Status</strong> {selectedEvent.resource.isActive ? 'Active Schedule' : 'Deactivated'}</div>
                            </div>
                            
                            {selectedEvent.resource.isActive && (user?.role === 'ADMIN' || selectedEvent.resource.user?._id === user?.id) && (
                                <div className="mt-6 flex gap-3 border-t pt-4">
                                    <Button 
                                        onClick={() => {
                                            const res = selectedEvent.resource;
                                            setNewShift({
                                                userId: user.id || user._id, // Default to self takeover
                                                startTime: new Date(res.startTime).toISOString().slice(0,16),
                                                endTime: new Date(res.endTime).toISOString().slice(0,16),
                                                shiftType: res.shiftType
                                            });
                                            setShowForm(true);
                                            setSelectedEvent(null);
                                        }}
                                    >
                                        <FaExchangeAlt className="mr-2"/> Take over / Swap
                                    </Button>
                                    <Button 
                                        variant="danger" 
                                        onClick={() => handleDelete(selectedEvent.resource._id, 'Remove this shift entirely?')}
                                    >
                                        <FaTrashAlt className="mr-2"/> Deactivate
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Full Interactive Calendar UI */}
                    <div className="calendar-container card-compact p-6">
                        {loading ? <LoadingSpinner /> : (
                            <Calendar
                                localizer={localizer}
                                events={calendarEvents}
                                startAccessor="start"
                                endAccessor="end"
                                style={{ height: 600 }}
                                onSelectSlot={handleSelectSlot}
                                onSelectEvent={handleSelectEvent}
                                selectable
                                popup
                                eventPropGetter={eventStyleGetter}
                                views={['month', 'week', 'day']}
                                defaultView="week"
                                className="oncall-calendar"
                            />
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default OnCallPage;
