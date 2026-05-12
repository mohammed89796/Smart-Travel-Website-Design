/**
 * Email Service
 * Handles sending emails for notifications
 */

const nodemailer = require('nodemailer');

// Create transporter - using ethereal for demo (replace with real SMTP in production)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'your-email@gmail.com',
    pass: process.env.SMTP_PASS || 'your-app-password',
  },
});

// Email templates
const templates = {
  welcomeUser: (name) => ({
    subject: 'Welcome to Smart Travel',
    html: `
      <h2>Welcome, ${name}!</h2>
      <p>Thank you for joining Smart Travel. You now have access to curated Egypt travel experiences.</p>
      <p><a href="${process.env.REACT_APP_URL}/dashboard">View your dashboard</a></p>
    `,
  }),

  bookingConfirmation: (name, bookingRef, destination, departureDate, amount) => ({
    subject: `Booking Confirmed: ${destination}`,
    html: `
      <h2>Your Booking has been Confirmed!</h2>
      <p>Hi ${name},</p>
      <p>Thank you for booking with us. Here are your booking details:</p>
      <ul>
        <li><strong>Booking Reference:</strong> ${bookingRef}</li>
        <li><strong>Destination:</strong> ${destination}</li>
        <li><strong>Departure Date:</strong> ${new Date(departureDate).toLocaleDateString()}</li>
        <li><strong>Total Amount:</strong> $${amount}</li>
      </ul>
      <p>You will receive further updates via email as your trip approaches.</p>
      <p><a href="${process.env.REACT_APP_URL}/dashboard">View your booking</a></p>
    `,
  }),

  bookingCancellation: (name, bookingRef) => ({
    subject: `Booking Cancelled: ${bookingRef}`,
    html: `
      <h2>Booking Cancelled</h2>
      <p>Hi ${name},</p>
      <p>Your booking (Reference: ${bookingRef}) has been successfully cancelled.</p>
      <p>If you have any questions, please contact our support team.</p>
    `,
  }),

  tripReminder: (name, bookingRef, destination, departureDate) => ({
    subject: `Your Trip is Coming Up: ${destination}`,
    html: `
      <h2>Your Adventure Awaits!</h2>
      <p>Hi ${name},</p>
      <p>Your trip to ${destination} is departing on ${new Date(departureDate).toLocaleDateString()}.</p>
      <p>Make sure to:</p>
      <ul>
        <li>Check your travel documents</li>
        <li>Review your itinerary</li>
        <li>Pack your belongings</li>
      </ul>
      <p><a href="${process.env.REACT_APP_URL}/dashboard">View your itinerary</a></p>
    `,
  }),

  reviewRequest: (name, bookingRef) => ({
    subject: 'Share Your Experience with Smart Travel',
    html: `
      <h2>How was your trip?</h2>
      <p>Hi ${name},</p>
      <p>We hope you had an amazing experience on your recent trip (Booking: ${bookingRef}).</p>
      <p>Would you like to share your experience with us? Your review helps other travelers make informed decisions.</p>
      <p><a href="${process.env.REACT_APP_URL}/dashboard">Write a review</a></p>
    `,
  }),

  adminNotification: (action, resourceType, resourceName) => ({
    subject: `[Admin] New ${action}: ${resourceType}`,
    html: `
      <h2>Admin Notification</h2>
      <p>A new ${action.toLowerCase()} has been performed:</p>
      <ul>
        <li><strong>Type:</strong> ${resourceType}</li>
        <li><strong>Name:</strong> ${resourceName}</li>
        <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
      </ul>
    `,
  }),
};

// Fallback template function
const getTemplate = (templateType, ...args) => {
  if (templates[templateType]) {
    return templates[templateType](...args);
  }
  return { subject: 'Smart Travel Notification', html: '<p>Notification from Smart Travel</p>' };
};

// Send email function
const sendEmail = async (to, templateType, ...args) => {
  try {
    // Skip if SMTP not configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log(`[EMAIL DISABLED] Would send ${templateType} to ${to}`);
      return { success: true, skipped: true };
    }

    const template = getTemplate(templateType, ...args);

    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@smarttravel.com',
      to,
      ...template,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendEmail,
  getTemplate,
};
