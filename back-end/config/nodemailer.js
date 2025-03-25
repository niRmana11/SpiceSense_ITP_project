import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp-relay.brevo.com', // Default to Brevo
  port: process.env.SMTP_PORT || 587,
  secure: false, // Use TLS, set to `true` if using port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error("Nodemailer Error:", error);
  } else {
    console.log("Nodemailer is ready to send emails");
  }
});

export default transporter;