import React, { useState, useEffect } from 'react';
import { getIncidentInsights, predictSlaBreach } from '../../api/incidentApi';
import { FaLightbulb, FaTools, FaNetworkWired, FaCheckCircle, FaExclamationCircle, FaShieldAlt, FaClock } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../common/LoadingSpinner';
import './QuickInsightsPanel.css';

const QuickInsightsPanel = ({ incidentId }) => {
  const [insights, setInsights] = useState(null);
  const [slaRisk, setSlaRisk] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllIntelligence = async () => {
      try {
        setLoading(true);
        const [insightsRes, slaRes] = await Promise.all([
          getIncidentInsights(incidentId),
          predictSlaBreach(incidentId)
        ]);

        if (insightsRes.success) {
          setInsights(insightsRes.data);
        }
        setSlaRisk(slaRes);
      } catch (error) {
        console.error('Error fetching intelligence:', error);
      } finally {
        setLoading(false);
      }
    };

    if (incidentId) {
      fetchAllIntelligence();
    }
  }, [incidentId]);

  if (loading) {
    return (
      <div className="card-compact p-6">
        <LoadingSpinner size="sm" text="Analysing root cause..." />
      </div>
    );
  }

  if (!insights) return null;

  return (
    <div className="quick-insights-panel slide-up">
      <div className="card-compact border-primary shadow-glow">
        <div className="card-header-dense">
          <h3 className="card-title-dense text-primary-color flex items-center gap-2">
            <FaLightbulb className="animate-pulse" /> QUICK INSIGHTS
          </h3>
        </div>
        
        <div className="card-body-dense">
          
          {/* SLA MONITORING */}
          {slaRisk && (
            <div className={`sla-prediction-box risk-${slaRisk.risk.toLowerCase()}`}>
              <div className="flex justify-between items-center mb-2">
                 <span className="flex items-center gap-2 font-bold text-[10px] tracking-widest"><FaShieldAlt /> SLA STATUS</span>
                 <span className="text-[10px] opacity-70">{slaRisk.timeRemainingMin}m remaining</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="prediction-label">RISK: {slaRisk.risk}</div>
                <div className="prediction-msg">{slaRisk.message}</div>
              </div>
              <div className="historical-context mt-2">
                <FaClock className="text-secondary" /> Avg Resolved: {slaRisk.avgResolutionMin}m
              </div>
            </div>
          )}

          {/* 1. LIKELY ROOT CAUSE */}
          <div className="insight-section">
            <label className="insight-label">Likely Root Cause</label>
            <div className="root-cause-box">
              <FaExclamationCircle className="text-secondary-color mt-1 shrink-0" />
              <span className="root-cause-text">{insights.likelyRootCause}</span>
            </div>
          </div>

          {/* 2. IMPACTED SERVICES */}
          <div className="insight-section">
            <label className="insight-label">Impacted Services</label>
            <div className="impact-badge-list">
              {insights.impactedServices.map((service, idx) => (
                <span key={idx} className="impact-badge-item">
                  <FaNetworkWired className="text-xs opacity-50" /> {service}
                </span>
              ))}
            </div>
          </div>

          {/* 3. SUGGESTED ACTIONS */}
          <div className="insight-section">
            <label className="insight-label">Suggested Actions</label>
            <ul className="suggested-actions-list">
              {insights.suggestedActions.map((action, idx) => (
                <li key={idx} className="suggested-action-item">
                  <FaCheckCircle className="action-icon" />
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 4. SIMILAR PAST INCIDENTS */}
          <div className="insight-section pt-2 border-t mt-4">
            <label className="insight-label">Similar Past Incidents</label>
            <div className="similar-incidents-container">
              {insights.similarIncidents.length > 0 ? (
                insights.similarIncidents.map((inc, idx) => (
                  <Link to={`/incidents/${inc.id}`} key={idx} className="similar-incident-card">
                    <div className="similar-inc-header">
                      <span className="similar-inc-number">{inc.number}</span>
                      <span className="similar-inc-date">{new Date(inc.date).toLocaleDateString()}</span>
                    </div>
                    <p className="similar-inc-title">{inc.title}</p>
                  </Link>
                ))
              ) : (
                <p className="text-[10px] text-secondary italic">No similar cases found.</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default QuickInsightsPanel;
