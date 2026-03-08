const { createTransporter, emailTemplates } = require('../config/email');

// Send email
const sendEmail = async (to, templateType, data) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log('Email not configured. Skipping email send.');
      return;
    }

    const transporter = createTransporter();
    const template = emailTemplates[templateType];
    
    if (!template) {
      console.error('Invalid email template type:', templateType);
      return;
    }

    const { subject, html } = template(data);
    
    const mailOptions = {
      from: `Incident Management System <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error.message);
    // Don't throw - email failure shouldn't break the main flow
  }
};

// Send SLA breach email
const sendSLABreachEmail = async (incident, users) => {
  try {
    const emailPromises = users.map(user => 
      sendEmail(user.email, 'slaBreachAlert', { incident })
    );
    
    await Promise.all(emailPromises);
  } catch (error) {
    console.error('Error sending SLA breach emails:', error);
  }
};

// Send daily summary email
const sendDailySummaryEmail = async (adminEmail, adminName, stats) => {
  try {
    await sendEmail(adminEmail, 'dailySummary', { stats, adminName });
  } catch (error) {
    console.error('Error sending daily summary email:', error);
  }
};

module.exports = {
  sendEmail,
  sendSLABreachEmail,
  sendDailySummaryEmail
};