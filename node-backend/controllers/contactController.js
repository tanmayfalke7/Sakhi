const ContactMessage = require('../models/ContactMessage');
const { sendMail } = require('../utils/emailService');

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

exports.submitContact = async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const subject = String(req.body.subject || '').trim();
    const message = String(req.body.message || '').trim();

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: 'Name, email, subject, and message are required' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }

    if (message.length < 10) {
      return res.status(400).json({ success: false, message: 'Message must be at least 10 characters long' });
    }

    const saved = await ContactMessage.create({ name, email, subject, message });

    await sendMail({
      to: process.env.SMTP_USER,
      subject: `Sakhi contact form: ${subject}`,
      text: `From: ${name} <${email}>\n\n${message}`,
    }).catch(() => null);

    res.status(201).json({
      success: true,
      message: 'Thank you for contacting Sakhi. We will get back to you soon.',
      data: saved,
    });
  } catch (error) {
    next(error);
  }
};
