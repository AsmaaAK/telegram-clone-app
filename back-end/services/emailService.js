const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Email templates
const emailTemplates = {
  welcome: (user) => ({
    subject: 'Welcome to Telegram Clone! 🎉',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0088cc, #006699); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 24px; background: #0088cc; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Telegram Clone! 🎉</h1>
          </div>
          <div class="content">
            <h2>Hello ${user.name}!</h2>
            <p>We're excited to have you on board. Your account has been successfully created and you can start using all the features right away.</p>
            
            <p><strong>Your account details:</strong></p>
            <ul>
              <li><strong>Username:</strong> ${user.username}</li>
              <li><strong>Email:</strong> ${user.email}</li>
              <li><strong>Joined:</strong> ${new Date().toLocaleDateString()}</li>
            </ul>
            
            <p>You can now:</p>
            <ul>
              <li>💬 Start chatting with friends</li>
              <li>👥 Create and join groups</li>
              <li>📁 Share files and media</li>
              <li>🎨 Customize your profile</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}" class="button">Start Messaging</a>
            </div>
            
            <p>If you have any questions or need help, don't hesitate to contact our support team.</p>
            
            <p>Happy messaging!<br>The Telegram Clone Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} Telegram Clone. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  notification: (user, notification) => ({
    subject: notification.title || 'New Notification',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0088cc; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 25px; border-radius: 0 0 10px 10px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>${notification.title || 'New Notification'}</h2>
          </div>
          <div class="content">
            <p>Hello ${user.name},</p>
            <p>${notification.message}</p>
            ${notification.actionUrl ? `
            <div style="text-align: center; margin: 20px 0;">
              <a href="${notification.actionUrl}" style="display: inline-block; padding: 10px 20px; background: #0088cc; color: white; text-decoration: none; border-radius: 5px;">View Details</a>
            </div>
            ` : ''}
          </div>
          <div class="footer">
            <p>You received this email because you have notifications enabled in your account settings.</p>
            <p>&copy; ${new Date().getFullYear()} Telegram Clone</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  passwordReset: (user, resetToken) => ({
    subject: 'Reset Your Telegram Clone Password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 25px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 24px; background: #dc3545; color: white; text-decoration: none; border-radius: 5px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Password Reset Request</h2>
          </div>
          <div class="content">
            <p>Hello ${user.name},</p>
            <p>We received a request to reset your password for your Telegram Clone account.</p>
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}/reset-password?token=${resetToken}" class="button">Reset Password</a>
            </div>
            
            <p>This link will expire in 1 hour for security reasons.</p>
            
            <div class="warning">
              <p><strong>Important:</strong> If you didn't request this password reset, please ignore this email. Your account remains secure.</p>
            </div>
            
            <p>For security purposes, this request was received from:</p>
            <ul>
              <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
              <li><strong>Account:</strong> ${user.email}</li>
            </ul>
          </div>
          <div class="footer">
            <p>This is an automated security message from Telegram Clone.</p>
            <p>&copy; ${new Date().getFullYear()} Telegram Clone</p>
          </div>
        </div>
      </body>
      </html>
    `
  })
};

// Send email function
const sendEmail = async (to, templateName, data) => {
  try {
    // Check if email service is configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('Email service not configured. Skipping email send.');
      return { success: false, message: 'Email service not configured' };
    }

    const transporter = createTransporter();
    const template = emailTemplates[templateName](data.user, data);

    if (!template) {
      throw new Error(`Email template '${templateName}' not found`);
    }

    const mailOptions = {
      from: `"Telegram Clone" <${process.env.SMTP_USER}>`,
      to: to,
      subject: template.subject,
      html: template.html,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}: ${result.messageId}`);
    
    return { 
      success: true, 
      messageId: result.messageId,
      message: 'Email sent successfully'
    };

  } catch (error) {
    console.error('Error sending email:', error);
    return { 
      success: false, 
      error: error.message,
      message: 'Failed to send email'
    };
  }
};

// Specific email functions
const sendWelcomeEmail = async (user) => {
  return await sendEmail(user.email, 'welcome', { user });
};

const sendNotificationEmail = async (user, notification) => {
  return await sendEmail(user.email, 'notification', { user, ...notification });
};

const sendPasswordResetEmail = async (user, resetToken) => {
  return await sendEmail(user.email, 'passwordReset', { user, resetToken });
};

// Bulk email sending (for announcements, etc.)
const sendBulkEmail = async (users, templateName, data) => {
  const results = [];
  
  for (const user of users) {
    const result = await sendEmail(user.email, templateName, { user, ...data });
    results.push({
      userId: user._id,
      email: user.email,
      ...result
    });
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
};

// Email service health check
const checkEmailService = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    return { 
      success: true, 
      message: 'Email service is configured and ready' 
    };
  } catch (error) {
    return { 
      success: false, 
      message: 'Email service is not available',
      error: error.message 
    };
  }
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendNotificationEmail,
  sendPasswordResetEmail,
  sendBulkEmail,
  checkEmailService,
  emailTemplates
};