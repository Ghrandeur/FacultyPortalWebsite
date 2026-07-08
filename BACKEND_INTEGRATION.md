# Backend Integration - New Features

## Quick Setup Instructions

### 1. Update backend/server.js

Add this import at the top with other route imports:
```javascript
const newFeaturesRoutes = require('./routes/new-features.js');
```

Add this line where other routes are mounted (usually around line 30-40):
```javascript
app.use('/api', newFeaturesRoutes);
```

Your server.js should look like:
```javascript
// ... other imports ...
const newFeaturesRoutes = require('./routes/new-features.js');

// ... express setup ...

// Mount routes
app.use('/archive', archiveRoutes);
app.use('/faculty', facultyRoutes);
// ... other routes ...
app.use('/api', newFeaturesRoutes);  // ADD THIS LINE

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 2. Test API Endpoints

Once the server is running, test each endpoint:

**Newsletter:**
```bash
curl -X POST http://localhost:5000/api/newsletter/subscribe \
  -H "Content-Type: application/json" \
  -d '{"regNo":"ENG/2023/001","department":"agricultural-engineering","email":"student@example.com"}'

curl http://localhost:5000/api/newsletter/all
```

**Marketplace:**
```bash
curl http://localhost:5000/api/marketplace/items

curl -X POST http://localhost:5000/api/marketplace/item/create \
  -H "Content-Type: application/json" \
  -d '{"name":"Physics Book","category":"textbooks","price":5000,"description":"Good condition","contactPhone":"08012345678"}'
```

**Departments:**
```bash
curl http://localhost:5000/api/departments/all
```

**Parliamentarians:**
```bash
curl http://localhost:5000/api/parliamentarians/all
```

**Social Handles:**
```bash
curl http://localhost:5000/api/social-handles/all
```

**Companion:**
```bash
curl http://localhost:5000/api/companion/advisors
curl http://localhost:5000/api/companion/faq
curl http://localhost:5000/api/companion/topics
```

### 3. Firebase Console Setup

Go to Firebase Console and create these collections in Firestore:

1. **newsletter_subscribers**
   - Add test subscriber with fields: regNo, department, email, subscribedAt, active

2. **newsletters**
   - Add sample newsletter with fields: title, content, category, preview, createdAt

3. **marketplace_items**
   - Add sample item with fields: name, category, price, description, contactPhone, contactWhatsApp, views, createdAt

4. **departments**
   - Add 5 departments with fields: name, description, hod, contact, location, programs, achievements, logo, order

5. **parliamentarians**
   - Add sample parliamentarians with fields: name, position, department, bio, portfolio, email, phone, achievements, image, order

6. **social_handles**
   - Add social media links with fields: name, platform, handle, url, type

7. **department_socials**
   - Same structure as social_handles for department-specific channels

8. **faculty_info**
   - Add contact info with fields: email, phone, location

9. **advisors**
   - Add advisors with fields: name, title, bio, image, order

10. **faq**
    - Add FAQ items with fields: question, answer, order

11. **companion_topics**
    - Topics will be auto-created when students post questions

### 4. Enable Security Rules

In Firebase Console > Firestore > Rules, set appropriate access:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public read access for most collections
    match /{document=**} {
      allow read: if request.auth != null || true;  // Allow anonymous reads
      allow write: if request.auth != null;         // Require auth for writes
    }
    
    // Newsletter subscribers - public write for signup
    match /newsletter_subscribers/{document=**} {
      allow read: if request.auth != null;
      allow create: if request.resource.data.email != null;
    }
    
    // Marketplace items - public write
    match /marketplace_items/{document=**} {
      allow read: if true;
      allow create: if request.resource.data.name != null;
    }
    
    // Companion topics - public write
    match /companion_topics/{document=**} {
      allow read: if true;
      allow create: if request.resource.data.title != null;
    }
  }
}
```

### 5. Test from Frontend

Visit http://localhost:3000 and test:
1. Navigate to each new tab
2. Try subscribing to newsletter
3. Try uploading a marketplace item
4. Try posting a companion question
5. Verify data appears in Firebase Console

### 6. Common Issues & Solutions

**Issue: "Cannot GET /api/newsletter/all"**
- Solution: Make sure new-features.js is imported and routes are mounted

**Issue: Firebase connection error**
- Solution: Verify firebaseConfig is correct in assets/js/firebase-config.js

**Issue: CORS error**
- Solution: Add CORS headers to backend/server.js:
```javascript
const cors = require('cors');
app.use(cors());
```

**Issue: Items not appearing**
- Solution: Check browser console for errors, verify Firebase collections exist

### 7. Environment Variables

Add to backend/.env:
```
FIREBASE_API_KEY=your_key_here
FIREBASE_AUTH_DOMAIN=your_domain_here
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_bucket
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
```

## File Organization

```
backend/
├── routes/
│   ├── new-features.js          ← NEW
│   ├── archive.js
│   ├── faculty.js
│   └── ...
├── config/
│   └── firebase.js
├── server.js                     ← UPDATED
└── package.json

pages/
├── newsletter-login.html         ← NEW
├── newsletter.html               ← NEW
├── marketplace.html              ← NEW
├── departments.html              ← NEW
├── parliamentarians.html         ← NEW
├── social-handles.html           ← NEW
├── companion.html                ← NEW
└── ...

assets/
├── css/
│   ├── newsletter.css            ← NEW
│   ├── marketplace.css           ← NEW
│   ├── departments.css           ← NEW
│   ├── parliamentarians.css      ← NEW
│   ├── social-handles.css        ← NEW
│   ├── companion.css             ← NEW
│   └── styles.css                ← UPDATED
└── js/
    ├── newsletter-login.js       ← NEW
    ├── newsletter.js             ← NEW
    ├── marketplace.js            ← NEW
    ├── departments.js            ← NEW
    ├── parliamentarians.js       ← NEW
    ├── social-handles.js         ← NEW
    ├── companion.js              ← NEW
    └── ...
```

## Deployment Checklist

- [ ] Backend server updated with new routes
- [ ] All Firebase collections created
- [ ] Security rules configured
- [ ] Environment variables set
- [ ] All API endpoints tested
- [ ] Frontend pages tested in browser
- [ ] Dark mode tested
- [ ] Mobile responsiveness verified
- [ ] Form validation working
- [ ] Error messages displaying correctly
- [ ] Newsletter emails configured (optional)
- [ ] Ready for production deployment
