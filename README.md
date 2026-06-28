# Faculty Portal Website - Phase 2 Implementation

## Project Overview

This is a complete Faculty Portal system with a public-facing website and an admin dashboard for managing content. The system includes:

### Public Sections
- **Archive**: Past events with images, descriptions, and expandable content
- **Faculty Info**: Text-based faculty information (history, mission, vision)
- **Gallery**: Photo gallery organized by events
- **Leaders**: Faculty leadership team profiles (photo, name, department, position)
- **Documents**: Downloadable faculty documents (categorized)
- **Team**: Editorial team member profiles
- **Past Questions**: Study materials and past exam questions (organized by subject and level)

### Admin Features
- Secure admin login with Firebase Authentication
- Dashboard with statistics
- CRUD operations for all content sections
- File upload support
- Team-based management system

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Backend**: Node.js with Express.js
- **Database**: Firebase Firestore
- **Authentication**: Firebase Authentication
- **Hosting**: Can be deployed to any Node.js-compatible server

## Setup Instructions

### 1. Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)
- Firebase account (free tier works fine)

### 2. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication (Email/Password)
4. Create a Firestore Database
5. Get your Firebase credentials:
   - Go to Project Settings
   - Copy the Firebase config object
   - Copy the Service Account Key JSON file

### 3. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your Firebase credentials
# Also place your serviceAccountKey.json in the backend folder

# Start the server
npm start
# Server will run on http://localhost:5000
```

### 4. Frontend Configuration

1. **Update Firebase Config** in `assets/js/firebase-config.js`:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project-id.appspot.com",
     messagingSenderId: "YOUR_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

2. **Update API URL** if needed in JavaScript files (currently `http://localhost:5000`)

### 5. Admin User Setup

1. Go to Firebase Console → Authentication
2. Create admin user(s) with Email/Password
3. Share login credentials with team members
4. Admin dashboard: `http://localhost:5000/admin/login.html`

## Deploying to Vercel (Frontend) and a separate Node host (Backend)

1. Deploy frontend to Vercel
   - Import `Ghrandeur/FacultyPortalWebsite` into Vercel
   - Root directory: `/`
   - No build command needed for the static frontend
   - Set output directory to `/` if required

2. Host the backend separately
   - Deploy `backend/server.js` to Render, Railway, or another Node host
   - Set the backend URL to something like `https://api.example.com`
   - Configure Firebase credentials with environment variables on the backend host

3. Connect frontend to backend
   - In Vercel, set a global runtime value before the app loads, for example:
     ```html
     <script>window.__BACKEND_URL__ = 'https://api.example.com';</script>
     ```
   - Or change the fallback in `assets/js/api-config.js` to your deployed backend URL:
     ```js
     window.API_URL = 'https://api.example.com/api';
     ```
   - Push the changes to GitHub and redeploy Vercel after updating the URL

4. CORS is already enabled in `backend/server.js`, so Vercel should be able to call the backend once deployed.

## File Structure

```
FacultyPortalWebsite/
├── index.html                 # Main homepage
├── admin/
│   ├── login.html            # Admin login page
│   └── dashboard.html        # Admin dashboard
├── pages/
│   ├── archive.html          # Archive events page
│   ├── faculty.html          # Faculty info page
│   ├── gallery.html          # Gallery page
│   ├── leaders.html          # Leaders page
│   ├── documents.html        # Documents page
│   ├── team.html             # Team page
│   └── past-questions.html   # Past questions page
├── assets/
│   ├── css/
│   │   ├── styles.css        # Main styles
│   │   ├── pages.css         # Page-specific styles
│   │   └── admin.css         # Admin dashboard styles
│   ├── js/
│   │   ├── main.js           # Shared functionality (theme toggle, etc)
│   │   ├── firebase-config.js # Firebase configuration
│   │   ├── admin-login.js    # Login logic
│   │   ├── admin-dashboard.js # Dashboard logic
│   │   ├── archive.js        # Archive page logic
│   │   ├── faculty.js        # Faculty page logic
│   │   ├── gallery.js        # Gallery page logic
│   │   ├── leaders.js        # Leaders page logic
│   │   ├── documents.js      # Documents page logic
│   │   ├── team.js           # Team page logic
│   │   └── pastQuestions.js  # Past questions page logic
│   └── uploads/              # User-uploaded files
└── backend/
    ├── server.js             # Express server
    ├── package.json          # Dependencies
    ├── .env                  # Environment variables
    ├── config/
    │   └── firebase.js       # Firebase initialization
    └── routes/
        ├── archive.js        # Archive API
        ├── faculty.js        # Faculty API
        ├── gallery.js        # Gallery API
        ├── leaders.js        # Leaders API
        ├── documents.js      # Documents API
        ├── team.js           # Team API
        ├── pastQuestions.js  # Past questions API
        └── auth.js           # Auth API
```

## API Endpoints

All endpoints are prefixed with `/api`

### Archive
- `GET /api/archive` - Get all events
- `GET /api/archive/:id` - Get single event
- `POST /api/archive` - Create event (requires auth)
- `PUT /api/archive/:id` - Update event (requires auth)
- `DELETE /api/archive/:id` - Delete event (requires auth)

### Faculty
- `GET /api/faculty` - Get faculty info
- `PUT /api/faculty` - Update faculty info (requires auth)

### Gallery
- `GET /api/gallery` - Get all photos
- `GET /api/gallery/event/:event` - Get photos by event
- `POST /api/gallery` - Add photo (requires auth)
- `DELETE /api/gallery/:id` - Delete photo (requires auth)

### Leaders
- `GET /api/leaders` - Get all leaders
- `POST /api/leaders` - Add leader (requires auth)
- `PUT /api/leaders/:id` - Update leader (requires auth)
- `DELETE /api/leaders/:id` - Delete leader (requires auth)

### Documents
- `GET /api/documents` - Get all documents
- `GET /api/documents/category/:category` - Get documents by category
- `POST /api/documents` - Upload document (requires auth)
- `DELETE /api/documents/:id` - Delete document (requires auth)

### Team
- `GET /api/team` - Get all team members
- `POST /api/team` - Add team member (requires auth)
- `PUT /api/team/:id` - Update team member (requires auth)
- `DELETE /api/team/:id` - Delete team member (requires auth)

### Past Questions
- `GET /api/past-questions` - Get all resources
- `GET /api/past-questions/subject/:subject` - Get by subject
- `POST /api/past-questions` - Upload resource (requires auth)
- `DELETE /api/past-questions/:id` - Delete resource (requires auth)

## Data Models

### Archive Event
```javascript
{
  id: string,
  title: string,
  description: string,
  image: string (URL),
  content: string (full text),
  date: timestamp,
  createdAt: timestamp
}
```

### Faculty
```javascript
{
  id: string,
  history: string,
  mission: string,
  vision: string,
  content: string,
  updatedAt: timestamp
}
```

### Gallery Photo
```javascript
{
  id: string,
  photoUrl: string,
  event: string,
  description: string,
  date: timestamp
}
```

### Leader/Team Member
```javascript
{
  id: string,
  name: string,
  department: string,
  position: string,
  photoUrl: string,
  createdAt: timestamp
}
```

### Document
```javascript
{
  id: string,
  fileName: string,
  fileUrl: string,
  category: string (syllabus|guidelines|forms|policies),
  description: string,
  uploadDate: timestamp
}
```

### Past Question/Resource
```javascript
{
  id: string,
  fileName: string,
  fileUrl: string,
  subject: string,
  semester: string (100|200|300|400),
  description: string,
  uploadDate: timestamp
}
```

## Usage Guide

### For Regular Users
1. Visit `http://localhost:5000`
2. Browse through different sections (Archive, Faculty, Gallery, etc.)
3. Download documents and resources
4. Toggle dark mode with the moon icon button

### For Administrators
1. Go to `http://localhost:5000/admin/login.html`
2. Login with your Firebase credentials
3. Use the sidebar to navigate to different management sections
4. Add, edit, or delete content as needed
5. You can share these credentials with your team

## Deployment

### Development
```bash
cd backend
npm start
```
Access at `http://localhost:5000`

### Production
1. Deploy backend to Heroku, AWS, or your preferred host
2. Update API URLs in frontend JavaScript files
3. Update Firebase project settings to allow your domain
4. Deploy frontend files to a static hosting service (Firebase Hosting, GitHub Pages, etc.)

## Features

✅ Responsive design (mobile, tablet, desktop)
✅ Dark mode support
✅ Firebase authentication
✅ CRUD operations for all content
✅ Image galleries with lightbox
✅ Document downloads
✅ Expandable event content
✅ Admin dashboard
✅ Multi-user support
✅ Organized file uploads
✅ Statistics dashboard

## Security Notes

- All admin operations require Firebase authentication
- Use strong passwords for admin accounts
- Enable Firestore security rules in production
- Never commit `.env` or `serviceAccountKey.json` to version control
- Keep Firebase keys secure

## Troubleshooting

### API Connection Issues
- Ensure backend server is running (`npm start` in backend folder)
- Check if port 5000 is not blocked by firewall
- Verify API URL in JavaScript files matches your server

### Authentication Issues
- Ensure Firebase project is properly configured
- Check Firebase credentials in `firebase-config.js`
- Verify user exists in Firebase Authentication

### Data Not Showing
- Check browser console for errors (F12 → Console)
- Verify Firestore database has data
- Check CORS configuration on backend

## Support & Updates

For issues or suggestions:
1. Check the console logs (F12 in browser)
2. Verify backend is running
3. Check Firebase project settings
4. Review API endpoint responses

## License

This project is part of the Faculty Portal system.

---

**Next Steps:**
1. Set up Firebase project
2. Install backend dependencies
3. Configure environment variables
4. Start the server
5. Access admin dashboard to add content
6. Share with your team!
