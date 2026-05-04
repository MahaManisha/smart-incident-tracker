import React, { useState } from 'react';
import {
    FaPalette,
    FaTable,
    FaBell,
    FaUniversalAccess,
    FaShieldAlt,
    FaCheck
} from 'react-icons/fa';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import './SettingsPage.css';
import { API_BASE_URL } from '../utils/constants';

const SettingsPage = () => {
    const { settings, updateSettings } = useSettings();
    const { logout } = useAuth();
    const [activeTab, setActiveTab] = useState('appearance');

    const tabs = [
        { id: 'appearance', label: 'Appearance', icon: <FaPalette /> },
        { id: 'layout', label: 'Layout & View', icon: <FaTable /> },
        { id: 'notifications', label: 'Notifications', icon: <FaBell /> },
        { id: 'accessibility', label: 'Accessibility', icon: <FaUniversalAccess /> },
        { id: 'security', label: 'Session & Security', icon: <FaShieldAlt /> },
    ];

    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        try {
            setIsLoggingOut(true);
            const token = localStorage.getItem('token');
            // Optimistic UI? No, wait for confirmation
            const response = await fetch(`${API_BASE_URL}/users/logout-all`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                // Clear local session after server invalidates others
                logout();
                window.location.href = '/login';
            } else {
                console.error('Failed to log out all sessions');
                // Even if it fails, maybe we just log out locally? 
                // Let's alert the user but still let them leave if they want
                alert('Server logout failed, but logging you out locally.');
                logout();
                window.location.href = '/login';
            }
        } catch (error) {
            console.error('Logout Error:', error);
            logout(); // Fallback
            window.location.href = '/login';
        } finally {
            setIsLoggingOut(false);
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'appearance':
                return (
                    <div className="animate-fade-in">
                        <div className="settings-section-header">
                            <h2>Appearance</h2>
                            <p>Customize how the application looks on your screen.</p>
                        </div>

                        <div className="settings-group">
                            <h3 className="group-title">Theme</h3>
                            <div className="setting-item">
                                <div className="setting-info">
                                    <span className="setting-label">Interface Theme</span>
                                    <span className="setting-desc">Select your preferred color scheme.</span>
                                </div>
                                <div className="theme-selector">
                                    {['light', 'dark', 'system'].map((theme) => (
                                        <div
                                            key={theme}
                                            className={`theme-option ${settings.appearance.theme === theme ? 'active' : ''}`}
                                            onClick={() => updateSettings('appearance', 'theme', theme)}
                                        >
                                            <div className={`theme-preview ${theme}`}></div>
                                            <span>{theme.charAt(0).toUpperCase() + theme.slice(1)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="settings-group">
                            <h3 className="group-title">Accent Color</h3>
                            <div className="setting-item">
                                <div className="setting-info">
                                    <span className="setting-label">Primary Color</span>
                                    <span className="setting-desc">Choose the main accent color for buttons and links.</span>
                                </div>
                                <div className="color-swatches">
                                    {['blue', 'purple', 'green'].map((color) => (
                                        <div
                                            key={color}
                                            className={`color-swatch swatch-${color} ${settings.appearance.accentColor === color ? 'active' : ''}`}
                                            onClick={() => updateSettings('appearance', 'accentColor', color)}
                                            title={color.charAt(0).toUpperCase() + color.slice(1)}
                                        >
                                            {settings.appearance.accentColor === color && <FaCheck style={{ color: 'white', position: 'absolute', top: '25%', left: '25%', fontSize: '12px' }} />}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="settings-group">
                            <h3 className="group-title">Density</h3>
                            <div className="setting-item">
                                <div className="setting-info">
                                    <span className="setting-label">Interface Density</span>
                                    <span className="setting-desc">Adjust the spacing between elements.</span>
                                </div>
                                <select
                                    className="settings-select"
                                    value={settings.appearance.density}
                                    onChange={(e) => updateSettings('appearance', 'density', e.target.value)}
                                >
                                    <option value="comfortable">Comfortable</option>
                                    <option value="compact">Compact</option>
                                </select>
                            </div>
                        </div>
                    </div>
                );

            case 'layout':
                return (
                    <div className="animate-fade-in">
                        <div className="settings-section-header">
                            <h2>Layout & View</h2>
                            <p>Manage how content is displayed in the application.</p>
                        </div>

                        <div className="settings-group">
                            <div className="setting-item">
                                <div className="setting-info">
                                    <span className="setting-label">Sidebar Preference</span>
                                    <span className="setting-desc">Default sidebar state on page load.</span>
                                </div>
                                <div className="setting-control">
                                    <label className="radio-label">
                                        <input
                                            type="radio"
                                            name="sidebar"
                                            checked={settings.layout.sidebar === 'expanded'}
                                            onChange={() => updateSettings('layout', 'sidebar', 'expanded')}
                                        /> Expanded
                                    </label>
                                    <label className="radio-label" style={{ marginLeft: '1rem' }}>
                                        <input
                                            type="radio"
                                            name="sidebar"
                                            checked={settings.layout.sidebar === 'collapsed'}
                                            onChange={() => updateSettings('layout', 'sidebar', 'collapsed')}
                                        /> Collapsed
                                    </label>
                                </div>
                            </div>

                            <div className="setting-item">
                                <div className="setting-info">
                                    <span className="setting-label">Default Table View</span>
                                    <span className="setting-desc">Preferred list style for incident tables.</span>
                                </div>
                                <select
                                    className="settings-select"
                                    value={settings.layout.tableView}
                                    onChange={(e) => updateSettings('layout', 'tableView', e.target.value)}
                                >
                                    <option value="list">List View</option>
                                    <option value="compact">Compact View</option>
                                </select>
                            </div>
                        </div>
                    </div>
                );

            case 'notifications':
                return (
                    <div className="animate-fade-in">
                        <div className="settings-section-header">
                            <h2>Notifications</h2>
                            <p>Control where and when you receive alerts.</p>
                        </div>

                        <div className="settings-group">
                            <div className="setting-item">
                                <div className="setting-info">
                                    <span className="setting-label">Email Notifications</span>
                                    <span className="setting-desc">Receive critical incident updates via email.</span>
                                </div>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={settings.notifications.email}
                                        onChange={(e) => updateSettings('notifications', 'email', e.target.checked)}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>

                            <div className="setting-item">
                                <div className="setting-info">
                                    <span className="setting-label">In-App Notifications</span>
                                    <span className="setting-desc">Show badges and alerts within the application.</span>
                                </div>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={settings.notifications.inApp}
                                        onChange={(e) => updateSettings('notifications', 'inApp', e.target.checked)}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                    </div>
                );

            case 'accessibility':
                return (
                    <div className="animate-fade-in">
                        <div className="settings-section-header">
                            <h2>Accessibility</h2>
                            <p>Adjust settings to match your visual preferences.</p>
                        </div>

                        <div className="settings-group">
                            <div className="setting-item">
                                <div className="setting-info">
                                    <span className="setting-label">Font Size</span>
                                    <span className="setting-desc">Adjust the base font size of the application.</span>
                                </div>
                                <select
                                    className="settings-select"
                                    value={settings.accessibility.fontSize}
                                    onChange={(e) => updateSettings('accessibility', 'fontSize', e.target.value)}
                                >
                                    <option value="small">Small</option>
                                    <option value="medium">Medium</option>
                                    <option value="large">Large</option>
                                </select>
                            </div>

                            <div className="setting-item">
                                <div className="setting-info">
                                    <span className="setting-label">Reduce Motion</span>
                                    <span className="setting-desc">Disable unnecessary animations and transitions.</span>
                                </div>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={settings.accessibility.reduceMotion}
                                        onChange={(e) => updateSettings('accessibility', 'reduceMotion', e.target.checked)}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                    </div>
                );

            case 'security':
                return (
                    <div className="animate-fade-in">
                        <div className="settings-section-header">
                            <h2>Session & Security</h2>
                            <p>Manage your active sessions and timeout preferences.</p>
                        </div>

                        <div className="settings-group">
                            <div className="setting-item">
                                <div className="setting-info">
                                    <span className="setting-label">Auto-Logout Timeout</span>
                                    <span className="setting-desc">Automatically log out after inactivity.</span>
                                </div>
                                <select
                                    className="settings-select"
                                    value={settings.session.timeout}
                                    onChange={(e) => updateSettings('session', 'timeout', parseInt(e.target.value))}
                                >
                                    <option value={15}>15 Minutes</option>
                                    <option value={30}>30 Minutes</option>
                                    <option value={60}>1 Hour</option>
                                </select>
                            </div>

                            <div className="setting-item">
                                <div className="setting-info">
                                    <span className="setting-label">Sign out everywhere</span>
                                    <span className="setting-desc" style={{ color: 'var(--danger-color)' }}>
                                        Log out from all other devices and sessions.
                                    </span>
                                </div>
                                <button
                                    className="logout-btn"
                                    onClick={handleLogout}
                                    disabled={isLoggingOut}
                                    style={{ opacity: isLoggingOut ? 0.7 : 1, cursor: isLoggingOut ? 'not-allowed' : 'pointer' }}
                                >
                                    {isLoggingOut ? 'Logging out...' : 'Logout from all sessions'}
                                </button>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="settings-page">
            <div className="settings-header">
                <h1>Settings</h1>
                <p>Manage your account preferences and workspace settings.</p>
            </div>

            <div className="settings-container">
                <aside className="settings-sidebar">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            className={`settings-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </aside>

                <main className="settings-content">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default SettingsPage;
