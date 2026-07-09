const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter for sending emails
let transporter = null;

const initializeTransporter = () => {
  try {
    transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const configuredFrom = process.env.EMAIL_FROM || process.env.EMAIL_USER;
    const fromAddress = /@/.test(configuredFrom) ? configuredFrom : process.env.EMAIL_USER;
    console.log('✅ Email service initialized successfully. Using sender:', fromAddress);
    return transporter;
  } catch (error) {
    console.error('❌ Failed to initialize email service:', error.message);
    return null;
  }
};

const getTransporter = () => {
  if (!transporter) {
    return initializeTransporter();
  }
  return transporter;
};

// Send confirmation email to new subscriber
const sendSubscriptionConfirmation = async (email, name = 'Subscriber') => {
  try {
    const trans = getTransporter();
    if (!trans) {
      console.warn('⚠️ Email service not configured, skipping confirmation email');
      return false;
    }

    const fromAddress = process.env.EMAIL_FROM && /@/.test(process.env.EMAIL_FROM)
      ? process.env.EMAIL_FROM
      : process.env.EMAIL_USER;

    if (!fromAddress) {
      console.error('❌ No valid FROM address configured. Set EMAIL_FROM or EMAIL_USER to a valid email address.');
      return false;
    }

    const mailOptions = {
      from: `"${process.env.NEWSLETTER_FROM_NAME || 'FAHSSA'}" <${fromAddress}>`,
      to: email,
      subject: 'Welcome to FAHSSA Newsletter!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; color: white; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Welcome to FAHSSA Newsletter! 🎉</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              Hi ${name},
            </p>
            
            <p style="color: #555; font-size: 14px; line-height: 1.8;">
              Thank you for registering for the FAHSSA (Faculty of Arts, Home Science and Social Sciences) Newsletter! 
              You're now subscribed to receive:
            </p>
            
            <ul style="color: #555; font-size: 14px; line-height: 1.8; padding-left: 20px;">
              <li>Latest faculty updates and announcements</li>
              <li>Academic events and workshops</li>
              <li>Departmental news and achievements</li>
              <li>Opportunities and scholarships</li>
              <li>Community highlights and celebrations</li>
            </ul>
            
            <p style="color: #555; font-size: 14px; line-height: 1.6; margin-top: 20px;">
              You can unsubscribe anytime by visiting our newsletter page.
            </p>
            
            <p style="color: #888; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              © 2024 FAHSSA Editorial. All rights reserved.
            </p>
          </div>
        </div>
      `,
      text: `Welcome to FAHSSA Newsletter!\n\nThank you for registering. You will now receive our latest updates and announcements.\n\nYou can unsubscribe anytime from our newsletter page.`,
    };

    const info = await trans.sendMail(mailOptions);
    console.log('✅ Confirmation email sent to:', email, 'Message ID:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error sending confirmation email:', error.message);
    return false;
  }
};

// Send newsletter to a single subscriber
const sendNewsletterToSubscriber = async (email, newsletterData) => {
  try {
    const trans = getTransporter();
    if (!trans) {
      console.warn('⚠️ Email service not configured');
      return false;
    }

    const fromAddress = process.env.EMAIL_FROM && /@/.test(process.env.EMAIL_FROM)
      ? process.env.EMAIL_FROM
      : process.env.EMAIL_USER;

    if (!fromAddress) {
      console.error('❌ No valid FROM address configured. Set EMAIL_FROM or EMAIL_USER to a valid email address.');
      return false;
    }

    const mailOptions = {
      from: `"${process.env.NEWSLETTER_FROM_NAME || 'FAHSSA'}" <${fromAddress}>`,
      to: email,
      subject: `${process.env.NEWSLETTER_EMAIL_SUBJECT}: ${newsletterData.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; color: white; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">📧 ${newsletterData.title}</h1>
            <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">
              Category: <strong>${newsletterData.category || 'General'}</strong>
            </p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #eee; border-top: none;">
            <div style="color: #333; font-size: 14px; line-height: 1.8; margin-bottom: 20px;">
              ${newsletterData.content}
            </div>
            
            <p style="color: #888; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              © 2024 FAHSSA Editorial. All rights reserved.<br>
              This is an automated newsletter message. Please do not reply to this email.
            </p>
          </div>
        </div>
      `,
      text: `${newsletterData.title}\n\nCategory: ${newsletterData.category || 'General'}\n\n${newsletterData.content}`,
    };

    const info = await trans.sendMail(mailOptions);
    console.log('✅ Newsletter sent to:', email, 'Message ID:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error sending newsletter to', email, ':', error.message);
    return false;
  }
};

// Send newsletter to all subscribers
const sendNewsletterToAll = async (newsletterData, db) => {
  try {
    const trans = getTransporter();
    if (!trans) {
      console.warn('⚠️ Email service not configured, skipping newsletter send');
      return { success: false, message: 'Email service not configured', sent: 0, failed: 0 };
    }

    // Get all active subscribers
    const subscribersSnapshot = await db.collection('newsletter_subscribers')
      .where('active', '==', true)
      .get();

    if (subscribersSnapshot.empty) {
      console.log('ℹ️ No active subscribers found');
      return { success: true, message: 'No active subscribers', sent: 0, failed: 0 };
    }

    const subscribers = [];
    subscribersSnapshot.forEach(doc => {
      subscribers.push(doc.data().email);
    });

    console.log(`📬 Sending newsletter to ${subscribers.length} subscribers...`);

    let sent = 0;
    let failed = 0;
    const errors = [];

    // Send to each subscriber
    for (const email of subscribers) {
      try {
        const success = await sendNewsletterToSubscriber(email, newsletterData);
        if (success) {
          sent++;
        } else {
          failed++;
          errors.push(`Failed to send to ${email}`);
        }
      } catch (err) {
        failed++;
        errors.push(`Error sending to ${email}: ${err.message}`);
      }
    }

    const result = {
      success: true,
      message: `Newsletter sent to ${sent} subscribers${failed > 0 ? `, ${failed} failed` : ''}`,
      sent,
      failed,
      total: subscribers.length,
    };

    if (errors.length > 0) {
      result.errors = errors;
    }

    console.log(`✅ Newsletter distribution complete: ${sent} sent, ${failed} failed`);
    return result;
  } catch (error) {
    console.error('❌ Error sending newsletter to all subscribers:', error.message);
    return {
      success: false,
      message: error.message,
      sent: 0,
      failed: 0,
    };
  }
};

// Test email connection
const testEmailConnection = async () => {
  try {
    const trans = getTransporter();
    if (!trans) {
      return { success: false, message: 'Email transporter not initialized' };
    }

    await trans.verify();
    console.log('✅ Email connection verified successfully');
    return { success: true, message: 'Email connection verified' };
  } catch (error) {
    console.error('❌ Email connection failed:', error.message);
    return { success: false, message: error.message };
  }
};

module.exports = {
  initializeTransporter,
  getTransporter,
  sendSubscriptionConfirmation,
  sendNewsletterToSubscriber,
  sendNewsletterToAll,
  testEmailConnection,
};
