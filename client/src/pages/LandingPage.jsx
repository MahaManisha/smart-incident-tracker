import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    FiShield, FiClock, FiBarChart2, FiFileText, FiList,
    FiActivity, FiLock, FiMenu, FiX, FiPieChart, FiAlertCircle,
    FiVolume2, FiVolumeX
} from 'react-icons/fi';
import './LandingPage.css';

const LandingPage = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(false);

    // Audio assets - Sci-Fi style
    const hoverSound = new Audio('https://cdn.pixabay.com/audio/2022/03/15/audio_735c05c066.mp3');
    const clickSound = new Audio('https://cdn.pixabay.com/audio/2022/11/15/audio_138b32115e.mp3');
    
    hoverSound.volume = 0.2;
    clickSound.volume = 0.3;

    const playHover = () => {
        if (soundEnabled) {
            hoverSound.currentTime = 0;
            hoverSound.play().catch(e => console.log("Audio play blocked"));
        }
    };

    const playClick = () => {
        if (soundEnabled) {
            clickSound.currentTime = 0;
            clickSound.play().catch(e => console.log("Audio play blocked"));
        }
    };
    
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
        <div className="landing-layout infinitum-theme">
            {/* Cyber Background decorative elements */}
            <div className="cyber-overlay">
                <div className="cyber-grid"></div>
                <div className="cyber-lines">
                    <div className="line l1"></div>
                    <div className="line l2"></div>
                    <div className="line l3"></div>
                </div>
                <div className="cyber-particles">
                    <div className="particle p1"></div>
                    <div className="particle p2"></div>
                    <div className="particle p3"></div>
                    <div className="particle p4"></div>
                </div>
                <div className="cyber-scanlines"></div>
                <div className="cyber-noise"></div>
            </div>
            
            {/* 1. Navigation Bar */}
            <nav className={"infinitum-nav " + (isScrolled ? "scrolled" : "")}>
                <div className="nav-container-infinitum">
                    <div className="nav-logo-infinitum">
                        <div className="logo-icon-box-cyber">
                            <FiShield className="logo-icon-infinitum" />
                        </div>
                        <span className="logo-text-infinitum">SmartTracker</span>
                    </div>
                    
                    {/* Desktop Menu */}
                    <div className="nav-menu-infinitum hidden-mobile">
                        <button onMouseEnter={playHover} onClick={() => { playClick(); scrollToSection('home'); }} className="nav-link-infinitum">Home</button>
                        <button onMouseEnter={playHover} onClick={() => { playClick(); scrollToSection('features'); }} className="nav-link-infinitum">Features</button>
                        <button onMouseEnter={playHover} onClick={() => { playClick(); scrollToSection('metrics'); }} className="nav-link-infinitum">Metrics</button>
                        <button onMouseEnter={playHover} onClick={() => { playClick(); scrollToSection('contact'); }} className="nav-link-infinitum">Contact</button>
                    </div>
                    
                    <div className="nav-actions-infinitum hidden-mobile">
                        <Link to="/login" onMouseEnter={playHover} onClick={playClick} className="btn-outline-infinitum">Login</Link>
                        <Link to="/register" onMouseEnter={playHover} onClick={playClick} className="btn-primary-infinitum">Get Started</Link>
                    </div>
                    
                    {/* Mobile Menu Toggle */}
                    <button className="mobile-menu-btn-cyber" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                        {isMobileMenuOpen ? <FiX /> : <FiMenu />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="mobile-menu-dropdown-cyber">
                        <button onClick={() => scrollToSection('home')}>Home</button>
                        <button onClick={() => scrollToSection('features')}>Features</button>
                        <button onClick={() => scrollToSection('metrics')}>Metrics</button>
                        <button onClick={() => scrollToSection('contact')}>Contact</button>
                        <div className="mobile-menu-actions">
                            <Link to="/login" className="btn-outline-infinitum full-width">Login</Link>
                            <Link to="/register" className="btn-primary-infinitum full-width">Get Started</Link>
                        </div>
                    </div>
                )}
            </nav>

            {/* 2. Hero Section */}
            <section id="home" className="hero-section-infinitum fade-in-section">
                <div className="hero-container-infinitum">
                    <div className="hero-content-infinitum">

                        <div className="hero-badge-infinitum">
                            <span className="badge-flicker"></span> Enterprise Incident Management Platform
                        </div>
                        <h1 className="hero-title-infinitum glitch" data-text="Resolve Incidents Faster with Intelligent Tracking">
                            Resolve Incidents Faster with Intelligent Tracking
                        </h1>
                        <p className="hero-subtitle-infinitum">
                            SmartTracker helps teams monitor, manage, and resolve incidents efficiently with SLA enforcement, analytics, and full audit transparency.
                        </p>
                        <div className="hero-buttons-infinitum">
                            <Link to="/register" onMouseEnter={playHover} onClick={playClick} className="btn-primary-infinitum large-btn">
                                Start Tracking Now
                            </Link>
                            <button onMouseEnter={playHover} onClick={() => { playClick(); scrollToSection('features'); }} className="btn-outline-infinitum large-btn">
                                View Live Demo
                            </button>
                        </div>
                        <p className="hero-trust-text-cyber">
                            No credit card required • Secure • Enterprise Ready
                        </p>
                    </div>
                    <div className="hero-visual-infinitum">
                        <div className="dashboard-preview-card-cyber">
                            <div className="preview-header-cyber">
                                <div className="preview-title-cyber">SYSTEM STATUS: OPERATIONAL</div>
                                <div className="preview-actions-cyber">
                                    <div className="dot-cyber"></div>
                                    <div className="dot-cyber"></div>
                                    <div className="dot-cyber"></div>
                                </div>
                            </div>
                            <div className="preview-body-cyber">
                                <div className="preview-stats-grid-cyber">
                                    <div className="preview-stat-box-cyber">
                                        <span className="stat-label-cyber">OPEN</span>
                                        <span className="stat-num-cyber text-neon-red">24</span>
                                    </div>
                                    <div className="preview-stat-box-cyber">
                                        <span className="stat-label-cyber">IN PROGRESS</span>
                                        <span className="stat-num-cyber text-neon-yellow">12</span>
                                    </div>
                                    <div className="preview-stat-box-cyber">
                                        <span className="stat-label-cyber">RESOLVED</span>
                                        <span className="stat-num-cyber text-neon-green">148</span>
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
                                    <div className="preview-chart-cyber">
                                        <div className="chart-header-cyber">
                                            <FiPieChart className="chart-icon-cyber"/> ANALYTICS
                                        </div>
                                        <div className="chart-bars-cyber">
                                            <div className="chart-bar-cyber h-60"></div>
                                            <div className="chart-bar-cyber h-80"></div>
                                            <div className="chart-bar-cyber h-40"></div>
                                            <div className="chart-bar-cyber h-90"></div>
                                            <div className="chart-bar-cyber h-50"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. Trusted By Section */}
            <section className="trusted-by-section-cyber fade-in-section">
                <p className="trusted-text-cyber">Strategic Tactical Alliances</p>
                <div className="trusted-logos-cyber">
                    <div className="company-logo-placeholder-cyber">ACME_OS</div>
                    <div className="company-logo-placeholder-cyber">GLOBAL_NET</div>
                    <div className="company-logo-placeholder-cyber">NEXUS_AI</div>
                    <div className="company-logo-placeholder-cyber">CORE_TECH</div>
                </div>
            </section>

            {/* 4. Features Section */}
            <section id="features" className="features-section-infinitum fade-in-section">
                <div className="section-container">
                    <div className="section-header-infinitum">
                        <h2 className="neon-text">Powerful Features for Professional Teams</h2>
                        <p>Everything you need to resolve incidents effectively and maintain high availability.</p>
                    </div>
                    <div className="features-grid-infinitum">
                        <div className="feature-card-infinitum" onMouseEnter={playHover}>
                            <div className="feature-icon-wrapper-cyber">
                                <FiActivity className="text-neon-blue" />
                            </div>
                            <h3>Incident Tracking</h3>
                            <p>Capture, categorize, and prioritize incidents automatically to ensure rapid response times.</p>
                        </div>
                        <div className="feature-card-infinitum" onMouseEnter={playHover}>
                            <div className="feature-icon-wrapper-cyber">
                                <FiClock className="text-neon-red" />
                            </div>
                            <h3>SLA Enforcement</h3>
                            <p>Set custom SLA triggers, track countdowns in real-time, and auto-escalate breached tickets.</p>
                        </div>
                        <div className="feature-card-infinitum" onMouseEnter={playHover}>
                            <div className="feature-icon-wrapper-cyber">
                                <FiLock className="text-neon-purple" />
                            </div>
                            <h3>Role-Based Access</h3>
                            <p>Secure operations with granular permissions across Admins, Responders, and Reporters.</p>
                        </div>
                        <div className="feature-card-infinitum" onMouseEnter={playHover}>
                            <div className="feature-icon-wrapper-cyber">
                                <FiBarChart2 className="text-neon-green" />
                            </div>
                            <h3>Real-Time Analytics</h3>
                            <p>Gain deep visibility into team performance, incident volume, and mean time to resolution (MTTR).</p>
                        </div>
                        <div className="feature-card-infinitum" onMouseEnter={playHover}>
                            <div className="feature-icon-wrapper-cyber">
                                <FiFileText className="text-neon-yellow" />
                            </div>
                            <h3>Document Management</h3>
                            <p>Attach root cause analyses (RCA) and post-mortem documents directly to resolved incidents.</p>
                        </div>
                        <div className="feature-card-infinitum" onMouseEnter={playHover}>
                            <div className="feature-icon-wrapper-cyber">
                                <FiList className="text-neon-slate" />
                            </div>
                            <h3>Audit Logs</h3>
                            <p>Maintain compliance with unalterable, comprehensive trails of every action within the system.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. Metrics Section */}
            <section id="metrics" className="metrics-section-infinitum fade-in-section">
                <div className="section-container">
                    <div className="metrics-grid-infinitum">
                        <div className="metric-box-infinitum">
                            <span className="metric-value-infinitum">10,000+</span>
                            <span className="metric-label-infinitum">Incidents Managed</span>
                        </div>
                        <div className="metric-box-infinitum">
                            <span className="metric-value-infinitum">99.9%</span>
                            <span className="metric-label-infinitum">System Reliability</span>
                        </div>
                        <div className="metric-box-infinitum">
                            <span className="metric-value-infinitum">&lt; 5 min</span>
                            <span className="metric-label-infinitum">Average Response Time</span>
                        </div>
                        <div className="metric-box-infinitum">
                            <span className="metric-value-infinitum">500+</span>
                            <span className="metric-label-infinitum">Active Users</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* 6. Footer */}
            <footer id="contact" className="footer-infinitum fade-in-section">
                <div className="footer-container">
                    <div className="footer-grid-infinitum">
                        <div className="footer-brand-col-cyber">
                            <div className="nav-logo-infinitum neon-text">
                                <FiShield className="logo-icon-infinitum" />
                                <span>SmartTracker</span>
                            </div>
                            <p className="footer-company-desc-cyber">
                                Empowering modern engineering teams to resolve issues faster and build more reliable software.
                            </p>
                        </div>
                        <div className="footer-links-col-cyber">
                            <h4>Product</h4>
                            <a href="#">Incident Tracking</a>
                            <a href="#">SLA Management</a>
                            <a href="#">Analytics</a>
                            <a href="#">Integrations</a>
                        </div>
                        <div className="footer-links-col-cyber">
                            <h4>Features</h4>
                            <a href="#">Role-Based Access</a>
                            <a href="#">Document Management</a>
                            <a href="#">Audit Logs</a>
                        </div>
                        <div className="footer-links-col-cyber">
                            <h4>Security</h4>
                            <a href="#">Compliance</a>
                            <a href="#">Data Privacy</a>
                            <a href="#">Terms of Service</a>
                        </div>
                        <div className="footer-links-col-cyber">
                            <h4>Contact</h4>
                            <a href="#">Support</a>
                            <a href="#">Sales</a>
                            <a href="#">Twitter</a>
                        </div>
                    </div>
                    <div className="footer-bottom-infinitum">
                        <p>&copy; 2026 SmartTracker. All rights reserved.</p>
                    </div>
                </div>
            </footer>
            <button 
                className="sound-toggle-btn" 
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? "Disable Sound" : "Enable Sound"}
            >
                {soundEnabled ? <FiVolume2 /> : <FiVolumeX />}
            </button>
        </div>
    );
};

export default LandingPage;
