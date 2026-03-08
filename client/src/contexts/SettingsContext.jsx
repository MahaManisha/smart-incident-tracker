import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

const defaultSettings = {
    appearance: {
        theme: 'system', // 'light', 'dark', 'system'
        accentColor: 'blue', // 'blue', 'purple', 'green'
        density: 'comfortable', // 'compact', 'comfortable'
    },
    layout: {
        sidebar: 'expanded', // 'expanded', 'collapsed'
        tableView: 'list', // 'list', 'compact'
    },
    notifications: {
        email: true,
        inApp: true,
    },
    accessibility: {
        fontSize: 'medium', // 'small', 'medium', 'large'
        reduceMotion: false,
    },
    session: {
        timeout: 30, // 15, 30, 60 (minutes)
    },
};

export const SettingsProvider = ({ children }) => {
    // Load settings from localStorage or use default
    const [settings, setSettings] = useState(() => {
        try {
            const savedSettings = localStorage.getItem('appSettings');
            if (!savedSettings) return defaultSettings;

            const parsed = JSON.parse(savedSettings);

            // Deep merge to ensure all keys exist even if localStorage has partial/old data
            return {
                ...defaultSettings,
                ...parsed,
                appearance: { ...defaultSettings.appearance, ...(parsed.appearance || {}) },
                layout: { ...defaultSettings.layout, ...(parsed.layout || {}) },
                notifications: { ...defaultSettings.notifications, ...(parsed.notifications || {}) },
                accessibility: { ...defaultSettings.accessibility, ...(parsed.accessibility || {}) },
                session: { ...defaultSettings.session, ...(parsed.session || {}) },
            };
        } catch (error) {
            console.error('Error loading settings:', error);
            return defaultSettings;
        }
    });

    // Apply settings to DOM (Theme, etc.) directly when they change
    useEffect(() => {
        const root = document.documentElement;

        // Apply Theme
        const applyTheme = (theme) => {
            if (theme === 'system') {
                const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
                    ? 'dark'
                    : 'light';
                root.setAttribute('data-theme', systemTheme);
            } else {
                root.setAttribute('data-theme', theme);
            }
        };
        applyTheme(settings.appearance.theme);

        // Apply Accent Color
        root.style.setProperty('--primary-color', getAccentColorValue(settings.appearance.accentColor));

        // Apply Density
        // Maps to --spacing-base in variables.css
        if (settings.appearance.density === 'compact') {
            root.style.setProperty('--spacing-base', '0.75rem'); // Smaller base spacing
        } else {
            root.style.setProperty('--spacing-base', '1rem'); // Default
        }

        // Apply Font Size
        switch (settings.accessibility.fontSize) {
            case 'small':
                root.style.fontSize = '14px';
                break;
            case 'large':
                root.style.fontSize = '18px';
                break;
            case 'medium':
            default:
                root.style.fontSize = '16px';
                break;
        }

        // Apply Reduced Motion
        if (settings.accessibility.reduceMotion) {
            root.style.setProperty('--transition-speed', '0'); // Multiplier for transition duration
        } else {
            root.style.setProperty('--transition-speed', '1');
        }

        // Persist to localStorage
        localStorage.setItem('appSettings', JSON.stringify(settings));
    }, [settings]);

    // Helper to get color hex codes (mock values, ideally from variables)
    const getAccentColorValue = (color) => {
        switch (color) {
            case 'purple': return '#8b5cf6';
            case 'green': return '#10b981';
            case 'blue':
            default: return '#3b82f6';
        }
    };

    const updateSettings = (section, key, value) => {
        setSettings((prev) => ({
            ...prev,
            [section]: {
                ...prev[section],
                [key]: value,
            },
        }));
    };

    const resetSettings = () => {
        setSettings(defaultSettings);
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
