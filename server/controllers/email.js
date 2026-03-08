const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Email templates
const emailTemplates = {
  slaBreachAlert: (incident) => ({
    subject: `🚨 URGENT: SLA BREACH - Incident ${incident.incidentNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 5px;">
        <h2 style="color: #721c24;">⚠️ SLA BREACH ALERT</h2>
        <p><strong>Incident Number:</strong> ${incident.incidentNumber}</p>
        <p><strong>Title:</strong> ${incident.title}</p>
        <p><strong>Severity:</strong> ${incident.severity}</p>
        <p><strong>Status:</strong> ${incident.status}</p>
        <p><strong>SLA Deadline:</strong> ${new Date(incident.slaDeadline).toLocaleString()}</p>
        <p><strong>Breached At:</strong> ${new Date(incident.slaBreachedAt).toLocaleString()}</p>
        <hr>
        <p style="color: #721c24;"><strong>Immediate action required!</strong></p>
        <p>Please prioritize this incident immediately.</p>
      </div>
    `
  }),

  slaWarning: (incident, timeRemaining) => ({
    subject: `⚠️ SLA Warning - Incident ${incident.incidentNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #fff3cd; border: 1px solid #ffeeba; border-radius: 5px;">
        <h2 style="color: #856404;">⏰ SLA Warning - Action Needed</h2>
        <p><strong>Incident Number:</strong> ${incident.incidentNumber}</p>
        <p><strong>Title:</strong> ${incident.title}</p>
        <p><strong>Severity:</strong> ${incident.severity}</p>
        <p><strong>Time Remaining:</strong> ${timeRemaining}</p>
        <p><strong>SLA Deadline:</strong> ${new Date(incident.slaDeadline).toLocaleString()}</p>
        <hr>
        <p style="color: #856404;">This incident is approaching its SLA deadline. Please take action soon.</p>
      </div>
    `
  }),

  incidentAssigned: (incident, responder) => ({
    subject: `📋 Incident Assigned - ${incident.incidentNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 5px;">
        <h2 style="color: #0c5460;">New Incident Assigned to You</h2>
        <p>Hello ${responder.name},</p>
        <p>A new incident has been assigned to you:</p>
        <p><strong>Incident Number:</strong> ${incident.incidentNumber}</p>
        <p><strong>Title:</strong> ${incident.title}</p>
        <p><strong>Severity:</strong> ${incident.severity}</p>
        <p><strong>SLA Deadline:</strong> ${new Date(incident.slaDeadline).toLocaleString()}</p>
        <p><strong>Description:</strong> ${incident.description}</p>
        <hr>
        <p>Please acknowledge and begin working on this incident.</p>
      </div>
    `
  }),

  incidentResolved: (incident, reporter) => ({
    subject: `✅ Incident Resolved - ${incident.incidentNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px;">
        <h2 style="color: #155724;">Your Incident Has Been Resolved</h2>
        <p>Hello ${reporter.name},</p>
        <p>Your incident has been resolved:</p>
        <p><strong>Incident Number:</strong> ${incident.incidentNumber}</p>
        <p><strong>Title:</strong> ${incident.title}</p>
        <p><strong>Resolved At:</strong> ${new Date(incident.resolvedAt).toLocaleString()}</p>
        <p><strong>Resolution Notes:</strong> ${incident.resolutionNotes || 'N/A'}</p>
        <hr>
        <p>If you're satisfied with the resolution, no further action is needed. If the issue persists, please reopen the incident.</p>
      </div>
    `
  }),

  dailySummary: (stats, adminName) => ({
    subject: `📊 Daily Incident Management Summary - ${new Date().toDateString()}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Daily Summary Report</h2>
        <p>Hello ${adminName},</p>
        <p>Here's your daily incident management summary:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Metric</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Count</strong></td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #dee2e6;">Open Incidents</td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${stats.openIncidents}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #dee2e6;">In Progress</td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${stats.inProgress}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #dee2e6;">Resolved Today</td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${stats.resolvedToday}</td>
          </tr>
          <tr style="background-color: #f8d7da;">
            <td style="padding: 10px; border: 1px solid #dee2e6;">SLA Breaches</td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${stats.slaBreaches}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #dee2e6;">Average Resolution Time</td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${stats.avgResolutionTime} hours</td>
          </tr>
        </table>
        
        <hr>
        <p>Have a great day!</p>
      </div>
    `
  })
};

module.exports = {
  createTransporter,
  emailTemplates
};