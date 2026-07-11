const nodemailer = require('nodemailer');
require('dotenv').config();

const normalizeEmailSetting = (value) => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

const resolveEmailConfig = () => {
  const fromAddress = normalizeEmailSetting(process.env.EMAIL_FROM || process.env.EMAIL_USER || 'fahssauniuyoeditorialboard@gmail.com');
  const user = normalizeEmailSetting(process.env.EMAIL_USER || process.env.EMAIL_FROM || fromAddress || 'fahssauniuyoeditorialboard@gmail.com');
  const pass = normalizeEmailSetting(process.env.EMAIL_PASSWORD || '');
  const fromName = normalizeEmailSetting(process.env.NEWSLETTER_FROM_NAME || 'FAHSSA Newsletter');

  return {
    fromAddress,
    user,
    pass,
    fromName,
  };
};

const buildTransportOptions = () => {
  const { user, pass } = resolveEmailConfig();

  if (process.env.EMAIL_SMTP_HOST) {
    return {
      host: process.env.EMAIL_SMTP_HOST,
      port: parseInt(process.env.EMAIL_SMTP_PORT || '465', 10),
      secure: (process.env.EMAIL_SMTP_SECURE || 'true').toLowerCase() === 'true',
      requireTLS: true,
      auth: user && pass ? { user, pass } : undefined,
      authMethod: process.env.EMAIL_SMTP_AUTH_METHOD || 'PLAIN',
      family: 4,
      connectionTimeout: 30000,
      greetingTimeout: 30000,
      socketTimeout: 30000,
      tls: { rejectUnauthorized: false, minVersion: 'TLSv1.2' },
    };
  }

  return {
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    requireTLS: true,
    auth: user && pass ? { user, pass } : undefined,
    authMethod: 'PLAIN',
    family: 4,
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,
    tls: { rejectUnauthorized: false, minVersion: 'TLSv1.2' },
  };
};

// Create transporter for sending emails
let transporter = null;

const initializeTransporter = () => {
  try {
    const { fromAddress, user, pass } = resolveEmailConfig();

    transporter = nodemailer.createTransport(buildTransportOptions());

    // Verify transporter connectivity immediately so startup logs any auth/config issues
    transporter.verify().then(() => {
      console.log('✅ Email service initialized and verified. Using sender:', fromAddress);
    }).catch(err => {
      console.warn('⚠️ Email transporter verification failed:', err && err.message ? err.message : err);
    });

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

// Send confirmation email to new subscriber (returns structured result)
const sendSubscriptionConfirmation = async (email, name = 'Subscriber') => {
  try {
    const trans = getTransporter();
    if (!trans) {
      const msg = 'Email service not configured';
      console.warn('⚠️', msg, 'skipping confirmation email');
      return { success: false, error: msg };
    }

    const { fromAddress, fromName } = resolveEmailConfig();

    if (!fromAddress) {
      const msg = 'No valid FROM address configured';
      console.error('❌', msg);
      return { success: false, error: msg };
    }

    const mailOptions = {
      from: `"${fromName}" <${fromAddress}>`,
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
    console.log('✅ Confirmation email sent to:', email, 'Message ID:', info && info.messageId);
    return { success: true, messageId: info && info.messageId };
  } catch (error) {
    console.error('❌ Error sending confirmation email:', error && error.message ? error.message : error);
    return { success: false, error: error && error.message ? error.message : String(error) };
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

    const { fromAddress, fromName } = resolveEmailConfig();

    if (!fromAddress) {
      console.error('❌ No valid FROM address configured. Set EMAIL_FROM or EMAIL_USER to a valid email address.');
      return false;
    }

    const mailOptions = {
      from: `"${fromName}" <${fromAddress}>`,
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
    console.log('✅ Newsletter sent to:', email, 'Message ID:', info && info.messageId);
    return { success: true, messageId: info && info.messageId };
  } catch (error) {
    console.error('❌ Error sending newsletter to', email, ':', error && error.message ? error.message : error);
    return { success: false, error: error && error.message ? error.message : String(error) };
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
    for (const emailAddr of subscribers) {
      try {
        const result = await sendNewsletterToSubscriber(emailAddr, newsletterData);
        if (result && result.success) {
          sent++;
        } else {
          failed++;
          errors.push(`Failed to send to ${emailAddr}${result && result.error ? `: ${result.error}` : ''}`);
        }
      } catch (err) {
        failed++;
        errors.push(`Error sending to ${emailAddr}: ${err && err.message ? err.message : String(err)}`);
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
  resolveEmailConfig,
  buildTransportOptions,
  sendSubscriptionConfirmation,
  sendNewsletterToSubscriber,
  sendNewsletterToAll,
  testEmailConnection,
};
