# Newsletter Email Notification System - Setup Guide

## Overview
This system enables users to:
1. **Register for newsletters** with email confirmation notifications
2. **Admin sending newsletters** automatically to all registered subscribers
3. **Manage subscribers** - view active/inactive subscribers
4. **Unsubscribe** - users can unsubscribe anytime

---

## 🔧 Prerequisites

### Gmail Setup (Recommended for Development)
Since the system uses Gmail SMTP by default, you'll need:

1. **Gmail Account** - Your personal or faculty Gmail account
2. **App Password** (if 2FA is enabled):
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer"
   - Generate a 16-character app password
   - Copy this password for use in `.env`

3. **Less Secure Apps** (if 2FA is NOT enabled):
   - Go to: https://myaccount.google.com/lesssecureapps
   - Enable "Allow less secure apps"

---

## ⚙️ Configuration Steps

### Step 1: Update `.env` File
Edit `backend/.env` and add/update these variables:

```env
# Email Configuration (Gmail/SMTP)
EMAIL_SERVICE=gmail
EMAIL_FROM=your-email@gmail.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password-or-password
NEWSLETTER_EMAIL_SUBJECT=FAHSSA Newsletter Update
NEWSLETTER_FROM_NAME=FAHSSA Newsletter
```

**Replace with your actual:**
- `your-email@gmail.com` - Your Gmail address
- `your-app-password-or-password` - 16-char app password (if 2FA) OR your Gmail password

### Step 2: Verify Installation
Nodemailer should already be installed. Verify in `backend/package.json`:

```json
"dependencies": {
  ...
  "nodemailer": "^6.9.x"
  ...
}
```

If missing, run:
```bash
cd backend
npm install nodemailer
```

---

## 📋 System Architecture

### Backend Components

#### 1. **Email Service** (`backend/config/email.js`)
Handles all email operations:
- `sendSubscriptionConfirmation(email, name)` - Welcome email
- `sendNewsletterToSubscriber(email, newsletterData)` - Single subscriber
- `sendNewsletterToAll(newsletterData, db)` - All active subscribers
- `testEmailConnection()` - Verify Gmail setup

#### 2. **API Endpoints** (`backend/routes/new-features.js`)
New endpoints added:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/newsletter/subscribe` | Register subscriber (sends confirmation email) |
| POST | `/newsletter/create` | Create newsletter & auto-send to all subscribers |
| GET | `/newsletter/subscribers/list` | Get all subscribers (admin only) |
| POST | `/newsletter/unsubscribe` | Unsubscribe from newsletter |
| PUT | `/newsletter/:id` | Update newsletter (does NOT resend) |
| DELETE | `/newsletter/:id` | Delete newsletter |

### Frontend Components

#### 1. **Newsletter Registration Page** (`pages/newsletter-login.html`)
- User enters: Registration Number, Department, Email
- **New:** Sends confirmation email on registration
- Shows success/error messages
- Redirects to newsletter page

#### 2. **Newsletter Display Page** (`pages/newsletter.html`)
- Shows all active newsletters
- **New:** Unsubscribe button with backend integration
- Filter by category

#### 3. **Admin Dashboard** (`assets/js/admin-dashboard.js`)
- **New:** "View Subscribers" button shows:
  - Active subscriber count
  - Inactive subscriber count
  - List of all subscribers with email, department, status, date
- Newsletter creation now shows email distribution status
- Confirmation message includes: "Email Distribution: ✅ Sent: X/Y"

---

## 🚀 How It Works

### User Registration Flow
```
1. User visits: /pages/newsletter-login.html
2. Enters: Reg No, Department, Email
3. Form submits to: POST /newsletter/subscribe
4. Backend:
   - Checks for duplicate email
   - Stores in Firestore: newsletter_subscribers collection
   - Sends confirmation email
   - Returns success with emailConfirmation status
5. Frontend shows: "Registration successful! Confirmation email sent"
6. Redirects to: /pages/newsletter.html
```

### Newsletter Distribution Flow
```
1. Admin visits: Admin Dashboard
2. Clicks: "Add Newsletter"
3. Fills form: Title, Content, Category, Preview
4. Submits to: POST /newsletter/create
5. Backend:
   - Stores newsletter in Firestore
   - Fetches ALL active subscribers from newsletter_subscribers
   - Sends email to each subscriber (formatted HTML email)
   - Returns distribution stats
6. Admin sees: "✅ Sent: 45/45 | ❌ Failed: 0"
7. All subscribers receive: Beautiful formatted newsletter email
```

### Unsubscribe Flow
```
1. Subscriber clicks: "Unsubscribe" button
2. Confirms action in dialog
3. Sends: POST /newsletter/unsubscribe with email
4. Backend:
   - Marks subscriber as inactive (not deleted)
   - Returns success
5. Frontend shows: "Unsubscribed successfully"
6. Redirects to home page
```

---

## 📧 Email Templates

### Subscription Confirmation Email
- **Subject:** Welcome to FAHSSA Newsletter!
- **Content:**
  - Welcome message
  - List of what they'll receive
  - Unsubscribe notice
  - Professional FAHSSA branding

### Newsletter Email
- **Subject:** [Category] - Newsletter Title
- **Content:**
  - Newsletter title with category
  - Full newsletter content (HTML formatted)
  - Professional footer

---

## 🧪 Testing the System

### Local Testing

#### Test 1: Email Connection
```bash
cd backend
node -e "
const email = require('./config/email');
email.testEmailConnection().then(result => {
  console.log(result);
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
"
```

Expected output: `{ success: true, message: "Email connection verified" }`

#### Test 2: Newsletter Registration
```bash
curl -X POST http://localhost:5000/api/newsletter/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "regNo": "ENG/2023/001",
    "department": "Engineering",
    "email": "test@gmail.com"
  }'
```

Check your email for confirmation message!

#### Test 3: Create Newsletter
```bash
curl -X POST http://localhost:5000/api/newsletter/create \
  -H "Content-Type: application/json" \
  -H "Authorization: your-firebase-token" \
  -d '{
    "title": "Test Newsletter",
    "content": "This is a test newsletter",
    "category": "Updates",
    "preview": "Test preview"
  }'
```

Check subscriber emails for the newsletter!

---

## 📊 Database Schema

### Newsletter Subscribers Collection
```javascript
// firestore collection: newsletter_subscribers
{
  id: "auto-generated",
  regNo: "ENG/2023/001",           // Registration number
  department: "Engineering",        // Department
  email: "user@gmail.com",          // Email address (indexed)
  subscribedAt: Timestamp,          // Subscription date
  active: true                      // Active/Inactive status
}
```

### Newsletters Collection (Unchanged)
```javascript
{
  id: "auto-generated",
  title: "Newsletter Title",
  content: "Full HTML content",
  category: "Updates",
  preview: "Short preview",
  createdAt: Timestamp
}
```

---

## 🔐 Security Considerations

1. **Email Password Protection:**
   - Never commit `.env` file with real passwords
   - Use environment variables in production
   - Rotate app passwords periodically

2. **Subscriber Data:**
   - Emails are indexed for duplicate checking
   - Only store necessary information
   - GDPR: Implement data deletion on request

3. **Rate Limiting:**
   - Consider adding rate limits for `/newsletter/subscribe`
   - Prevent spam registrations

4. **Admin Authentication:**
   - All admin endpoints require Firebase Auth token
   - Only authenticated admins can send newsletters

---

## 📱 Admin Dashboard Features

### Newsletter Management Section
```
[View Subscribers]  [Add Newsletter]

Recent Newsletters:
├─ Newsletter 1 (Edit | Delete)
├─ Newsletter 2 (Edit | Delete)
└─ Newsletter 3 (Edit | Delete)

Subscriber Stats:
├─ Total Subscribers: 150
├─ Active: 145
└─ Inactive: 5
```

### View Subscribers Modal
- Displays table with columns:
  - Email
  - Department
  - Status (Active/Inactive badge)
  - Subscription Date
- Shows active count and inactive count
- Sortable by clicking headers

---

## 🐛 Troubleshooting

### Issue: "Email service not configured"
**Solution:** 
- Check `.env` file has EMAIL_USER and EMAIL_PASSWORD
- Restart backend: `npm start`

### Issue: "Failed to send confirmation email"
**Solution:**
- Verify Gmail account allows less secure apps OR 2FA app password is valid
- Check firewall/proxy isn't blocking Gmail SMTP (port 587)
- Test with `testEmailConnection()`

### Issue: "Email already subscribed"
**Solution:**
- This is expected - preventing duplicate registrations
- User should use unsubscribe first if switching emails

### Issue: Newsletter not reaching subscribers
**Solution:**
- Check admin sees "Email Distribution: ✅ Sent: X/Y"
- Check subscriber emails for spam folder
- Verify subscriber marked as `active: true` in database

### Issue: Unsubscribe not working
**Solution:**
- Check email is correct in localStorage
- Clear browser cache
- Try unsubscribing again

---

## 🌐 Production Deployment

### For Render/Production:

1. **Update Environment Variables in Render Dashboard:**
   - Go to: https://dashboard.render.com
   - Select your service
   - Go to: Environment
   - Add:
     ```
     EMAIL_SERVICE=gmail
     EMAIL_FROM=faculty@uniuyo.edu.ng
     EMAIL_USER=faculty@uniuyo.edu.ng
     EMAIL_PASSWORD=your-app-password
     NEWSLETTER_EMAIL_SUBJECT=FAHSSA Newsletter
     NEWSLETTER_FROM_NAME=FAHSSA Editorial
     ```

2. **Use Custom Email (Optional):**
   - Instead of Gmail, use SendGrid, Mailgun, or AWS SES
   - Update `backend/config/email.js` to support multiple providers
   - Update `.env` variables accordingly

3. **Monitor Email Delivery:**
   - Log successful/failed sends
   - Track bounce rates
   - Monitor subscriber engagement

---

## 📚 API Response Examples

### Success: Newsletter Subscribe
```json
{
  "success": true,
  "id": "abc123",
  "message": "Subscription successful",
  "emailConfirmation": true
}
```

### Success: Create Newsletter
```json
{
  "success": true,
  "id": "xyz789",
  "emailDistribution": {
    "success": true,
    "message": "Newsletter sent to 45 subscribers",
    "sent": 45,
    "failed": 0,
    "total": 45
  }
}
```

### Success: Get Subscribers
```json
{
  "success": true,
  "total": 150,
  "active": 145,
  "inactive": 5,
  "subscribers": [
    {
      "id": "sub1",
      "email": "user@gmail.com",
      "regNo": "ENG/2023/001",
      "department": "Engineering",
      "active": true,
      "subscribedAt": "2024-01-15"
    }
  ]
}
```

---

## 📝 Next Steps

1. **Configure Gmail:** Follow "Gmail Setup" section above
2. **Test locally:** Run backend and test registration
3. **Deploy to production:** Update environment variables on Render
4. **Monitor:** Check email delivery and subscriber engagement
5. **Improve:** Consider adding:
   - Unsubscribe link in email footer
   - Email templates management
   - Scheduled newsletters
   - Subscriber preferences (digest vs individual)

---

## ✅ Checklist Before Going Live

- [ ] Gmail account configured with 2FA and app password
- [ ] `.env` file updated with EMAIL_USER and EMAIL_PASSWORD
- [ ] Backend restarted after .env changes
- [ ] Test email sent successfully
- [ ] Newsletter registration form works
- [ ] Confirmation email received
- [ ] Admin can create newsletter and see distribution stats
- [ ] Unsubscribe functionality works
- [ ] Production environment variables updated on Render
- [ ] Admin dashboard shows subscriber count

---

## 📞 Support

For issues or questions:
1. Check troubleshooting section above
2. Review backend console logs: `npm start` output
3. Check browser console (F12) for frontend errors
4. Verify Firebase Admin SDK is initialized correctly

---

**Last Updated:** 2024  
**Version:** 1.0.0  
**System:** FAHSSA Faculty Portal
