# QUICK START GUIDE

## 5-Minute Setup

### Step 1: Get Firebase Credentials
1. Create a Firebase project at https://console.firebase.google.com
2. Enable Email/Password Authentication
3. Create a Firestore Database
4. Download Service Account Key (Project Settings → Service Accounts)

### Step 2: Configure Backend
```bash
cd backend
npm install
```

Create `.env` file:
```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_ADMIN_SDK_PATH=./serviceAccountKey.json
PORT=5000
```

Place your `serviceAccountKey.json` in the `backend/` folder

### Step 3: Configure Frontend
Edit `assets/js/firebase-config.js` with your Firebase config:
```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### Step 4: Run the Application
```bash
cd backend
npm start
```

Visit: `http://localhost:5000`

### Step 5: Access Admin Panel
1. Create admin user in Firebase Console (Authentication → Add User)
2. Go to `http://localhost:5000/admin/login.html`
3. Login with your admin credentials
4. Start managing content!

## Admin Dashboard Features

### Archive Management
- Add past events with images, descriptions, and full content
- Organize events chronologically
- View and delete events

### Faculty Information
- Edit faculty history, mission, and vision statements
- Update general faculty information

### Gallery
- Upload event photos
- Organize by event name
- Add descriptions

### Leaders & Team
- Add team member profiles (photo, name, department, position)
- Manage leadership and editorial teams

### Documents
- Upload faculty documents (PDFs, Word docs, etc.)
- Categorize by type (Syllabi, Guidelines, Forms, Policies)
- Create downloadable links

### Past Questions & Resources
- Upload study materials
- Organize by subject and semester level
- Support for past exam questions, lecture notes, etc.

## Sharing with Your Team

1. Create admin users in Firebase Console
2. Share login credentials securely
3. Each team member gets access to the admin dashboard
4. All changes sync in real-time via Firebase

## Troubleshooting

### "Cannot connect to server"
- Check if backend is running: `npm start` in backend folder
- Verify port 5000 is available

### "Login not working"
- Verify Firebase credentials in `firebase-config.js`
- Check user exists in Firebase Authentication

### "Data not loading"
- Check browser console (F12)
- Verify Firestore database has data
- Check network tab for API errors

## File Upload Tips

Use URLs from:
- Google Drive (get shareable link)
- Firebase Storage
- Cloudinary (free image hosting)
- Imgur (for photos)
- Any public hosting service

## Next Steps

1. ✅ Set up Firebase project
2. ✅ Configure backend
3. ✅ Configure frontend
4. ✅ Start the server
5. ⏭ Add sample content to admin dashboard
6. ⏭ Share with team members
7. ⏭ Customize branding (colors, fonts, text)

---

**Need Help?**
- Check README.md for detailed documentation
- Review browser console for error messages
- Verify all credentials are correctly entered
