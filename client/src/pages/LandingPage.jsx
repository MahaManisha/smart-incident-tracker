import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    FiShield, FiClock, FiBarChart2, FiFileText, FiList,
    FiActivity, FiLock, FiMenu, FiX, FiPieChart, FiAlertCircle
} from 'react-icons/fi';
import './LandingPage.css';

const LandingPage = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        
        // Add fade-in classes
        const faders = document.querySelectorAll('.fade-in-section');
        const appearOptions = {
            threshold: 0.15,
            rootMargin: "0px 0px -50px 0px"
        };
        const appearOnScroll = new IntersectionObserver(function(entries, observer) {
            entries.forEach(entry => {
                if (!entry.isIntersecting) {
                    return;
                } else {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, appearOptions);

        faders.forEach(fader => {
            appearOnScroll.observe(fader);
        });

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (id) => {
        setIsMobileMenuOpen(false);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="landing-layout saas-theme">
            {/* 1. Navigation Bar */}
            <nav className={"saas-nav " + (isScrolled ? "scrolled" : "")}>
                <div className="nav-container-saas">
                    <div className="nav-logo-saas">
                        <div className="logo-icon-box">
                            <FiShield className="logo-icon-saas" />
                        </div>
                        <span className="logo-text-saas">SmartTracker</span>
                    </div>
                    
                    {/* Desktop Menu */}
                    <div className="nav-menu-saas hidden-mobile">
                        <button onClick={() => scrollToSection('home')} className="nav-link-saas">Home</button>
                        <button onClick={() => scrollToSection('features')} className="nav-link-saas">Features</button>
                        <button onClick={() => scrollToSection('metrics')} className="nav-link-saas">Metrics</button>
                        <button onClick={() => scrollToSection('contact')} className="nav-link-saas">Contact</button>
                    </div>
                    
                    <div className="nav-actions-saas hidden-mobile">
                        <Link to="/login" className="btn-outline-saas">Login</Link>
                        <Link to="/register" className="btn-primary-saas">Get Started</Link>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                        {isMobileMenuOpen ? <FiX /> : <FiMenu />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="mobile-menu-dropdown">
                        <button onClick={() => scrollToSection('home')}>Home</button>
                        <button onClick={() => scrollToSection('features')}>Features</button>
                        <button onClick={() => scrollToSection('metrics')}>Metrics</button>
                        <button onClick={() => scrollToSection('contact')}>Contact</button>
                        <div className="mobile-menu-actions">
                            <Link to="/login" className="btn-outline-saas full-width">Login</Link>
                            <Link to="/register" className="btn-primary-saas full-width">Get Started</Link>
                        </div>
                    </div>
                )}
            </nav>

            {/* 2. Hero Section */}
            <section id="home" className="hero-section-saas fade-in-section">
                <div className="hero-container-saas">
                    <div className="hero-content-saas">
                        <div className="hero-badge-saas">
                            <span className="badge-pulse"></span> Enterprise Incident Management Platform
                        </div>
                        <h1 className="hero-title-saas">Resolve Incidents Faster with Intelligent Tracking</h1>
                        <p className="hero-subtitle-saas">
                            SmartTracker helps teams monitor, manage, and resolve incidents efficiently with SLA enforcement, analytics, and full audit transparency.
                        </p>
                        <div className="hero-buttons-saas">
                            <Link to="/register" className="btn-primary-saas large-btn">
                                Start Tracking Now
                            </Link>
                            <button onClick={() => scrollToSection('features')} className="btn-outline-saas large-btn">
                                View Live Demo
                            </button>
                        </div>
                        <p className="hero-trust-text">
                            No credit card required • Secure • Enterprise Ready
                        </p>
                    </div>
                    <div className="hero-visual-saas">
                        <div className="dashboard-preview-card">
                            <div className="preview-header">
                                <div className="preview-title">Dashboard Overview</div>
                                <div className="preview-actions">
                                    <div className="dot-gray"></div>
                                    <div className="dot-gray"></div>
                                    <div className="dot-gray"></div>
                                </div>
                            </div>
                            <div className="preview-body">
                                <div className="preview-stats-grid">
                                    <div className="preview-stat-box">
                                        <span className="stat-label">Open</span>
                                        <span className="stat-num text-red">24</span>
                                    </div>
                                    <div className="preview-stat-box">
                                        <span className="stat-label">In Progress</span>
                                        <span className="stat-num text-yellow">12</span>
                                    </div>
                                    <div className="preview-stat-box">
                                        <span className="stat-label">Resolved</span>
                                        <span className="stat-num text-green">148</span>
                                    </div>
                                </div>
                                <div className="preview-main-content">
                                    <div className="preview-list">
                                        <div className="preview-list-item">
                                            <div className="item-icon bg-red-light"><FiAlertCircle className="text-red" /></div>
                                            <div className="item-info">
                                                <div className="item-title">Database Latency Spike</div>
                                                <div className="item-sub">INC-8492 • Critical</div>
                                            </div>
                                            <div className="item-badge badge-red">SLA: 14m left</div>
                                        </div>
                                        <div className="preview-list-item">
                                            <div className="item-icon bg-yellow-light"><FiClock className="text-yellow" /></div>
                                            <div className="item-info">
                                                <div className="item-title">Failed API Requests</div>
                                                <div className="item-sub">INC-8491 • High</div>
                                            </div>
                                            <div className="item-badge badge-yellow">In Progress</div>
                                        </div>
                                    </div>
                                    <div className="preview-chart">
                                        <div className="chart-header">
                                            <FiPieChart className="chart-icon"/> Analytics
                                        </div>
                                        <div className="chart-bars">
                                            <div className="chart-bar h-60"></div>
                                            <div className="chart-bar h-80"></div>
                                            <div className="chart-bar h-40"></div>
                                            <div className="chart-bar h-90"></div>
                                            <div className="chart-bar h-50"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. Trusted By Section */}
            <section className="trusted-by-section fade-in-section">
                <p className="trusted-text">Trusted by Modern Engineering Teams</p>
                <div className="trusted-logos">
                    <div className="company-logo-placeholder">Acme Corp</div>
                    <div className="company-logo-placeholder">GlobalTech</div>
                    <div className="company-logo-placeholder">Nexus Solutions</div>
                    <div className="company-logo-placeholder">Innovate Inc</div>
                </div>
            </section>

            {/* 4. Features Section */}
            <section id="features" className="features-section-saas fade-in-section">
                <div className="section-container">
                    <div className="section-header-saas">
                        <h2>Powerful Features for Professional Teams</h2>
                        <p>Everything you need to resolve incidents effectively and maintain high availability.</p>
                    </div>
                    <div className="features-grid-saas">
                        <div className="feature-card-saas">
                            <div className="feature-icon-wrapper bg-blue-100">
                                <FiActivity className="text-blue-600" />
                            </div>
                            <h3>Incident Tracking</h3>
                            <p>Capture, categorize, and prioritize incidents automatically to ensure rapid response times.</p>
                        </div>
                        <div className="feature-card-saas">
                            <div className="feature-icon-wrapper bg-red-100">
                                <FiClock className="text-red-600" />
                            </div>
                            <h3>SLA Enforcement</h3>
                            <p>Set custom SLA triggers, track countdowns in real-time, and auto-escalate breached tickets.</p>
                        </div>
                        <div className="feature-card-saas">
                            <div className="feature-icon-wrapper bg-purple-100">
                                <FiLock className="text-purple-600" />
                            </div>
                            <h3>Role-Based Access</h3>
                            <p>Secure operations with granular permissions across Admins, Responders, and Reporters.</p>
                        </div>
                        <div className="feature-card-saas">
                            <div className="feature-icon-wrapper bg-green-100">
                                <FiBarChart2 className="text-green-600" />
                            </div>
                            <h3>Real-Time Analytics</h3>
                            <p>Gain deep visibility into team performance, incident volume, and mean time to resolution (MTTR).</p>
                        </div>
                        <div className="feature-card-saas">
                            <div className="feature-icon-wrapper bg-yellow-100">
                                <FiFileText className="text-yellow-600" />
                            </div>
                            <h3>Document Management</h3>
                            <p>Attach root cause analyses (RCA) and post-mortem documents directly to resolved incidents.</p>
                        </div>
                        <div className="feature-card-saas">
                            <div className="feature-icon-wrapper bg-slate-100">
                                <FiList className="text-slate-600" />
                            </div>
                            <h3>Audit Logs</h3>
                            <p>Maintain compliance with unalterable, comprehensive trails of every action within the system.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. Metrics Section */}
            <section id="metrics" className="metrics-section-saas fade-in-section">
                <div className="section-container">
                    <div className="metrics-grid">
                        <div className="metric-box">
                            <span className="metric-value">10,000+</span>
                            <span className="metric-label">Incidents Managed</span>
                        </div>
                        <div className="metric-box">
                            <span className="metric-value">99.9%</span>
                            <span className="metric-label">System Reliability</span>
                        </div>
                        <div className="metric-box">
                            <span className="metric-value">&lt; 5 min</span>
                            <span className="metric-label">Average Response Time</span>
                        </div>
                        <div className="metric-box">
                            <span className="metric-value">500+</span>
                            <span className="metric-label">Active Users</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* 6. Footer */}
            <footer id="contact" className="footer-saas fade-in-section">
                <div className="footer-container">
                    <div className="footer-grid">
                        <div className="footer-brand-col">
                            <div className="nav-logo-saas white-text">
                                <FiShield className="logo-icon-saas" />
                                <span>SmartTracker</span>
                            </div>
                            <p className="footer-company-desc">
                                Empowering modern engineering teams to resolve issues faster and build more reliable software.
                            </p>
                        </div>
                        <div className="footer-links-col">
                            <h4>Product</h4>
                            <a href="#">Incident Tracking</a>
                            <a href="#">SLA Management</a>
                            <a href="#">Analytics</a>
                            <a href="#">Integrations</a>
                        </div>
                        <div className="footer-links-col">
                            <h4>Features</h4>
                            <a href="#">Role-Based Access</a>
                            <a href="#">Document Management</a>
                            <a href="#">Audit Logs</a>
                        </div>
                        <div className="footer-links-col">
                            <h4>Security</h4>
                            <a href="#">Compliance</a>
                            <a href="#">Data Privacy</a>
                            <a href="#">Terms of Service</a>
                        </div>
                        <div className="footer-links-col">
                            <h4>Contact</h4>
                            <a href="#">Support</a>
                            <a href="#">Sales</a>
                            <a href="#">Twitter</a>
                        </div>
                    </div>
                    <div className="footer-bottom-saas">
                        <p>&copy; 2026 SmartTracker. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
