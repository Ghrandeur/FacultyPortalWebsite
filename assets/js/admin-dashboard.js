import { auth } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js';

const API_URL = window.API_URL;
let currentUser = null;
let currentForm = null;
let currentEditId = null;
let currentEditData = null;

// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  setupEventListeners();
  loadDashboardStats();
});

function checkAuth() {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = 'login.html';
      return;
    }
    currentUser = user;
    window.currentUser = user;
    document.title = `Admin - ${user.email}`;
  });
}

function setupEventListeners() {
  // Sidebar navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const section = item.getAttribute('data-section');
      showSection(section);
      
      document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      
      loadSectionData(section);
    });
  });

  // Logout button
  document.getElementById('logoutBtn').addEventListener('click', () => {
    signOut(auth).then(() => {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminEmail');
      window.location.href = 'login.html';
    });
  });

  // Modal close button
  document.querySelector('.modal .close').addEventListener('click', closeModal);
  window.addEventListener('click', (e) => {
    if (e.target.id === 'modal') closeModal();
  });

  // Faculty form submission
  document.getElementById('facultyForm').addEventListener('submit', handleFacultySubmit);
}

function showSection(sectionId) {
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
  const section = document.getElementById(sectionId);
  if (section) section.classList.add('active');
}

function loadSectionData(section) {
  switch(section) {
    case 'archive':
      loadArchiveEvents();
      break;
    case 'gallery':
      loadGalleryPhotos();
      break;
    case 'leaders':
      loadLeaders();
      break;
    case 'documents':
      loadDocuments();
      break;
    case 'team':
      loadTeamMembers();
      break;
    case 'past-questions':
      loadPastQuestions();
      break;
    case 'faculty':
      loadFacultyInfo();
      break;
    case 'newsletter':
      loadNewsletters();
      break;
    case 'marketplace':
      loadMarketplaceItems();
      break;
    case 'departments':
      loadDepartments();
      break;
    case 'parliamentarians':
      loadParliamentarians();
      break;
    case 'social-handles':
      loadSocialHandles();
      break;
    case 'companion':
      loadCompanionContent();
      break;
  }
}

async function loadDashboardStats() {
  try {
    const archive = await fetch(`${API_URL}/archive`).then(r => r.json());
    const gallery = await fetch(`${API_URL}/gallery`).then(r => r.json());
    const leaders = await fetch(`${API_URL}/leaders`).then(r => r.json());
    const documents = await fetch(`${API_URL}/documents`).then(r => r.json());
    const newsletters = await fetch(`${API_URL}/newsletter/all`).then(r => r.json());
    const marketplace = await fetch(`${API_URL}/marketplace/items`).then(r => r.json());
    const departments = await fetch(`${API_URL}/departments/all`).then(r => r.json());
    const parliamentarians = await fetch(`${API_URL}/parliamentarians/all`).then(r => r.json());
    const socialHandles = await fetch(`${API_URL}/social-handles/all`).then(r => r.json());
    const companionTopics = await fetch(`${API_URL}/companion/topics`).then(r => r.json());
    const subscribers = await fetch(`${API_URL}/newsletter/subscribers/list`).then(r => r.json());

    document.getElementById('archiveCount').textContent = archive.length;
    document.getElementById('galleryCount').textContent = gallery.length;
    document.getElementById('leadersCount').textContent = leaders.length;
    document.getElementById('docsCount').textContent = documents.length;
    document.getElementById('newsletterCount').textContent = newsletters.length;
    document.getElementById('marketplaceCount').textContent = marketplace.length;
    document.getElementById('departmentsCount').textContent = departments.length;
    document.getElementById('parliamentarianCount').textContent = parliamentarians.length;
    document.getElementById('socialHandlesCount').textContent = socialHandles.length;
    document.getElementById('companionTopicsCount').textContent = companionTopics.length;
    
    // Update subscriber count if element exists
    if (document.getElementById('subscriberCount')) {
      document.getElementById('subscriberCount').textContent = subscribers.active || 0;
    }
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

// ===== ARCHIVE FUNCTIONS =====
async function loadArchiveEvents() {
  try {
    const response = await fetch(`${API_URL}/archive`);
    const events = await response.json();
    const container = document.getElementById('archiveList');
    container.innerHTML = '';

    events.forEach(event => {
      const item = document.createElement('div');
      item.className = 'item';
      item.innerHTML = `
        <div class="item-info">
          <h3>${event.title}</h3>
          <p>${event.description}</p>
        </div>
        <div class="item-actions">
          <button class="edit-btn" onclick="editArchiveEvent('${event.id}')">Edit</button>
          <button class="delete-btn" onclick="deleteArchiveEvent('${event.id}')">Delete</button>
        </div>
      `;
      container.appendChild(item);
    });
  } catch (error) {
    console.error('Error loading archive:', error);
  }
}

function openArchiveForm() {
  currentEditId = null;
  currentEditData = null;
  currentForm = 'archive';
  const modalBody = document.getElementById('modalBody');
  modalBody.innerHTML = `
    <h3>Add Archive Event</h3>
    <div class="form-group">
      <label for="archiveTitle">Event Title</label>
      <input type="text" id="archiveTitle" placeholder="Event title" required>
    </div>
    <div class="form-group">
      <label for="archiveDescription">Description</label>
      <input type="text" id="archiveDescription" placeholder="Short description" required>
    </div>
    <div class="form-group">
      <label for="archiveDate">Event Date</label>
      <input type="date" id="archiveDate">
    </div>
    <div class="form-group">
      <label for="archiveImageFile">Upload Image From Device</label>
      <input type="file" id="archiveImageFile" accept="image/*">
    </div>
    <div class="form-group">
      <label for="archiveContent">Full Content</label>
      <textarea id="archiveContent" rows="6" placeholder="Event details..."></textarea>
    </div>
  `;
  openModal();
}

async function editArchiveEvent(id) {
  try {
    console.log('Fetching archive event:', id);
    const response = await fetch(`${API_URL}/archive/${id}`);
    console.log('Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', errorText);
      alert(`Failed to load event: ${response.status} ${response.statusText}\n${errorText}`);
      return;
    }
    
    const event = await response.json();
    console.log('Event loaded:', event);
    currentEditId = id;
    currentEditData = event;
    currentForm = 'archive';

    const archiveDateValue = (() => {
      if (!event.date) return '';
      if (typeof event.date === 'object' && event.date !== null) {
        if (typeof event.date.toDate === 'function') {
          const dateObj = event.date.toDate();
          return !isNaN(dateObj.getTime()) ? dateObj.toISOString().substring(0, 10) : '';
        }
        if (typeof event.date._seconds === 'number') {
          const dateObj = new Date(event.date._seconds * 1000 + (event.date._nanoseconds || 0) / 1e6);
          return !isNaN(dateObj.getTime()) ? dateObj.toISOString().substring(0, 10) : '';
        }
      }
      const dateObj = new Date(event.date);
      return !isNaN(dateObj.getTime()) ? dateObj.toISOString().substring(0, 10) : '';
    })();
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
      <h3>Edit Archive Event</h3>
      <div class="form-group">
        <label for="archiveTitle">Event Title</label>
        <input type="text" id="archiveTitle" value="${event.title || ''}" placeholder="Event title" required>
      </div>
      <div class="form-group">
        <label for="archiveDescription">Description</label>
        <input type="text" id="archiveDescription" value="${event.description || ''}" placeholder="Short description" required>
      </div>
      <div class="form-group">
        <label for="archiveDate">Event Date</label>
        <input type="date" id="archiveDate" value="${archiveDateValue}">
      </div>
      <div class="form-group">
        <label for="archiveImageFile">Upload New Image From Device (optional)</label>
        <input type="file" id="archiveImageFile" accept="image/*">
      </div>
      <div class="form-group">
        <label for="archiveContent">Full Content</label>
        <textarea id="archiveContent" rows="6" placeholder="Event details...">${event.content || ''}</textarea>
      </div>
    `;
    openModal();
  } catch (error) {
    console.error('Error loading event for edit:', error);
    alert(`Unable to load event for editing: ${error.message}`);
  }
}

async function handleArchiveSubmit() {
  const title = document.getElementById('archiveTitle').value;
  const description = document.getElementById('archiveDescription').value;
  const date = document.getElementById('archiveDate')?.value;
  const fileInput = document.getElementById('archiveImageFile');
  const content = document.getElementById('archiveContent').value;

  try {
    console.log('Archive submit - starting', { title, description, date, hasFile: !!(fileInput?.files?.[0]) });
    
    let imageUrl = currentEditData?.image || '';
    if (fileInput && fileInput.files && fileInput.files[0]) {
      console.log('Uploading new image');
      imageUrl = await uploadImageToStorage(fileInput.files[0], 'archive');
      console.log('Image URL after upload:', imageUrl);
      if (!imageUrl || !imageUrl.trim()) {
        console.error('Image upload returned empty URL');
        alert('Warning: Image upload may have failed. The event will be saved without an image.');
        imageUrl = '';
      }
    } else {
      console.log('No new image provided, using existing:', imageUrl || 'none');
      if (!imageUrl || !imageUrl.trim()) {
        console.warn('No image available for event');
      }
    }

    const method = currentEditId ? 'PUT' : 'POST';
    const url = currentEditId ? `${API_URL}/archive/${currentEditId}` : `${API_URL}/archive`;
    const body = { title, description, content };
    
    // Only include image if it has a non-empty value
    if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim()) {
      body.image = imageUrl.trim();
    }
    
    if (date) {
      body.date = date;
    }

    console.log('Sending to API:', { method, url, body });
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': await currentUser.getIdToken()
      },
      body: JSON.stringify(body)
    });

    const responseData = await response.json().catch(() => ({}));
    console.log('API response:', { status: response.status, data: responseData });

    if (response.ok) {
      closeModal();
      loadArchiveEvents();
      loadDashboardStats();
      alert('Event added successfully!');
    } else {
      const errorMsg = responseData.error || 'Error adding event';
      console.error('API error:', errorMsg);
      alert(`Error: ${errorMsg}`);
    }
  } catch (error) {
    console.error('Error:', error);
    alert(`Error adding event: ${error.message}`);
  }
}

async function deleteArchiveEvent(id) {
  if (!confirm('Are you sure you want to delete this event?')) return;

  try {
    const response = await fetch(`${API_URL}/archive/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': await currentUser.getIdToken()
      }
    });

    if (response.ok) {
      loadArchiveEvents();
      loadDashboardStats();
      alert('Event deleted successfully!');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error deleting event');
  }
}

// ===== FACULTY FUNCTIONS =====
async function loadFacultyInfo() {
  try {
    const response = await fetch(`${API_URL}/faculty`);
    const data = await response.json();

    document.getElementById('facultyHistory').value = data.history || '';
    document.getElementById('facultyMission').value = data.mission || '';
    document.getElementById('facultyVision').value = data.vision || '';
    document.getElementById('facultyContent').value = data.content || '';
  } catch (error) {
    console.error('Error loading faculty info:', error);
  }
}

async function handleFacultySubmit(e) {
  e.preventDefault();

  const data = {
    history: document.getElementById('facultyHistory').value,
    mission: document.getElementById('facultyMission').value,
    vision: document.getElementById('facultyVision').value,
    content: document.getElementById('facultyContent').value
  };

  try {
    const response = await fetch(`${API_URL}/faculty`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': await currentUser.getIdToken()
      },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      alert('Faculty information updated!');
    } else {
      alert('Error updating faculty information');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error updating faculty information');
  }
}

// ===== GALLERY FUNCTIONS =====
async function loadGalleryPhotos() {
  try {
    const response = await fetch(`${API_URL}/gallery`);
    const photos = await response.json();
    const container = document.getElementById('galleryList');
    container.innerHTML = '';

    photos.forEach(photo => {
      const item = document.createElement('div');
      item.className = 'item';
      item.innerHTML = `
        <div class="item-info">
          <h3>${photo.event}</h3>
          <p>${photo.description}</p>
        </div>
        <div class="item-actions">
          <button class="edit-btn" onclick="editGalleryPhoto('${photo.id}')">Edit</button>
          <button class="delete-btn" onclick="deleteGalleryPhoto('${photo.id}')">Delete</button>
        </div>
      `;
      container.appendChild(item);
    });
  } catch (error) {
    console.error('Error loading gallery:', error);
  }
}

async function uploadImageToStorage(fileOrFiles, folderName) {
  if (!fileOrFiles) {
    console.log('No file(s) provided to uploadImageToStorage');
    return '';
  }

  const files = Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles];
  if (files.length === 0) return '';

  console.log('Uploading image(s):', { count: files.length, folderName });
  const url = `${API_URL}/upload`;
  const formData = new FormData();
  formData.append('folder', folderName);
  files.forEach((f) => formData.append('image', f));

  const headers = {};
  try {
    const user = currentUser || window.currentUser;
    if (user && typeof user.getIdToken === 'function') {
      headers.Authorization = await user.getIdToken();
    }
  } catch (e) {
    console.warn('Unable to get auth token for upload:', e && e.message);
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData
    });

    const data = await response.json().catch(() => ({}));
    console.log('Upload response:', { status: response.status, data });
    if (!response.ok) {
      const message = data.error || data.message || `Upload failed (${response.status})`;
      throw new Error(message);
    }

    // Normalize response: if backend returns single url or multiple
    if (data.urls && Array.isArray(data.urls)) {
      return data.urls;
    }
    if (data.url) return [data.url];
    return [];
  } catch (err) {
    console.error('Upload error:', err);
    throw err;
  }
}

function normalizeGalleryImageLink(rawValue) {
  if (typeof rawValue !== 'string') return '';

  const trimmed = rawValue.trim();
  if (!trimmed) return '';

  try {
    const url = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`);
    const hostname = url.hostname.toLowerCase();

    if (hostname === 'drive.google.com' || hostname === 'www.drive.google.com') {
      const fileId = url.searchParams.get('id');
      if (fileId) {
        return `https://drive.google.com/uc?export=view&id=${fileId}`;
      }

      const match = trimmed.match(/\/file\/d\/([^/]+)/i);
      if (match && match[1]) {
        return `https://drive.google.com/uc?export=view&id=${match[1]}`;
      }
    }

    return trimmed;
  } catch (error) {
    return trimmed;
  }
}

function parseGalleryImageLinks(rawValue) {
  if (typeof rawValue !== 'string') return [];

  return rawValue
    .split(/\r?\n|,|;/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => normalizeGalleryImageLink(item));
}

function openGalleryForm() {
  currentEditId = null;
  currentEditData = null;
  currentForm = 'gallery';
  const modalBody = document.getElementById('modalBody');
  modalBody.innerHTML = `
    <h3>Add Photos</h3>
    <div class="form-group">
      <label for="galleryEvent">Event Name</label>
      <input type="text" id="galleryEvent" placeholder="Event name" required>
    </div>
    <div class="form-group">
      <label for="galleryPhotoFile">Upload Images From Device</label>
      <input type="file" id="galleryPhotoFile" accept="image/*" multiple>
    </div>
    <div class="form-group">
      <label for="galleryImageLinks">Or paste image links (one per line, Drive links supported)</label>
      <textarea id="galleryImageLinks" rows="4" placeholder="https://drive.google.com/uc?export=view&id=...\nhttps://example.com/photo.jpg"></textarea>
    </div>
    <div class="form-group">
      <label for="galleryDescription">Description</label>
      <input type="text" id="galleryDescription" placeholder="Photo description">
    </div>
  `;
  openModal();
}

async function editGalleryPhoto(id) {
  try {
    const response = await fetch(`${API_URL}/gallery/${id}`);
    const photo = await response.json();
    currentEditId = id;
    currentEditData = photo;
    currentForm = 'gallery';

    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
      <h3>Edit Gallery Photo</h3>
      <div class="form-group">
        <label for="galleryEvent">Event Name</label>
        <input type="text" id="galleryEvent" value="${photo.event || ''}" placeholder="Event name" required>
      </div>
      <div class="form-group">
        <label for="galleryPhotoFile">Upload New Images From Device (optional)</label>
        <input type="file" id="galleryPhotoFile" accept="image/*" multiple>
      </div>
      <div class="form-group">
        <label for="galleryImageLinks">Or paste a replacement image link</label>
        <textarea id="galleryImageLinks" rows="4" placeholder="https://drive.google.com/uc?export=view&id=..."></textarea>
      </div>
      <div class="form-group">
        <label for="galleryDescription">Description</label>
        <input type="text" id="galleryDescription" value="${photo.description || ''}" placeholder="Photo description">
      </div>
    `;
    openModal();
  } catch (error) {
    console.error('Error loading gallery photo for edit:', error);
    alert('Unable to load photo for editing');
  }
}

async function handleGallerySubmit() {
  const event = document.getElementById('galleryEvent').value;
  const fileInput = document.getElementById('galleryPhotoFile');
  const linkInput = document.getElementById('galleryImageLinks');
  const description = document.getElementById('galleryDescription').value;

  try {
    if (!event) {
      alert('Please enter an event name for the photo.');
      return;
    }

    const selectedFiles = fileInput && fileInput.files ? Array.from(fileInput.files) : [];
    const pastedLinks = parseGalleryImageLinks(linkInput?.value || '');
    console.log('Gallery submit - starting', { event, description, selectedFileCount: selectedFiles.length, pastedLinkCount: pastedLinks.length });

    const method = currentEditId ? 'PUT' : 'POST';
    const url = currentEditId ? `${API_URL}/gallery/${currentEditId}` : `${API_URL}/gallery`;

    if (currentEditId) {
      let photoUrl = currentEditData?.photoUrl || '';
      if (selectedFiles.length > 0) {
        console.log('Uploading replacement gallery photo(s)');
        const uploaded = await uploadImageToStorage(selectedFiles, 'gallery');
        console.log('Photo URLs after upload:', uploaded);
        if (Array.isArray(uploaded) && uploaded.length > 0) {
          photoUrl = uploaded[0] || '';
        } else {
          console.error('Photo upload returned empty URLs');
          alert('Warning: Photo upload may have failed. The photo will be saved without an image.');
          photoUrl = '';
        }
      } else if (pastedLinks.length > 0) {
        photoUrl = pastedLinks[0];
      } else {
        console.log('No new photo provided, using existing:', photoUrl || 'none');
        if (!photoUrl || !photoUrl.trim()) {
          console.warn('No photo available for gallery');
        }
      }

      const body = { event, description };
      if (photoUrl && typeof photoUrl === 'string' && photoUrl.trim()) {
        body.photoUrl = photoUrl.trim();
      }

      console.log('Sending to API:', { method, url, body });
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': await currentUser.getIdToken()
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        closeModal();
        loadGalleryPhotos();
        loadDashboardStats();
        alert('Photo updated successfully!');
      } else {
        const errorText = await response.text();
        console.error('Gallery save failed:', response.status, errorText);
        alert('Error updating photo. Check the browser console for details.');
      }
      return;
    }

    let uploadedUrls = [];
    if (selectedFiles.length > 0) {
      // Send all selected files in one request
      try {
        const uploaded = await uploadImageToStorage(selectedFiles, 'gallery');
        if (Array.isArray(uploaded)) uploadedUrls = uploaded.map(u => (typeof u === 'string' ? u.trim() : '')).filter(Boolean);
      } catch (e) {
        console.error('Batch upload failed, attempting per-file fallback:', e && e.message);
        // Fallback: upload one by one
        for (const file of selectedFiles) {
          try {
            const res = await uploadImageToStorage(file, 'gallery');
            if (Array.isArray(res)) {
              uploadedUrls.push(...res.map(u => (typeof u === 'string' ? u.trim() : '')).filter(Boolean));
            }
          } catch (err) {
            console.warn('Per-file upload failed for', file.name, err && err.message);
          }
        }
      }
    }

    const body = { event, description };
    const allPhotoUrls = [...uploadedUrls, ...pastedLinks];
    if (allPhotoUrls.length > 0) {
      body.photoUrls = allPhotoUrls;
    }

    console.log('Sending to API:', { method, url, body });
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': await currentUser.getIdToken()
      },
      body: JSON.stringify(body)
    });

    if (response.ok) {
      closeModal();
      loadGalleryPhotos();
      loadDashboardStats();
      alert(allPhotoUrls.length > 1 ? 'Photos added successfully!' : 'Photo added successfully!');
    } else {
      const errorText = await response.text();
      console.error('Gallery save failed:', response.status, errorText);
      alert('Error adding photo. Check the browser console for details.');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error adding photo');
  }
}

async function deleteGalleryPhoto(id) {
  if (!confirm('Are you sure you want to delete this photo?')) return;

  try {
    const response = await fetch(`${API_URL}/gallery/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': await currentUser.getIdToken()
      }
    });

    if (response.ok) {
      loadGalleryPhotos();
      loadDashboardStats();
      alert('Photo deleted successfully!');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error deleting photo');
  }
}

// ===== LEADERS FUNCTIONS =====
async function loadLeaders() {
  try {
    const response = await fetch(`${API_URL}/leaders`);
    const leaders = await response.json();
    const container = document.getElementById('leadersList');
    container.innerHTML = '';

    leaders.forEach(leader => {
      const item = document.createElement('div');
      item.className = 'item';
      item.innerHTML = `
        <div class="item-info">
          <h3>${leader.name}</h3>
          <p>${leader.department} - ${leader.position}</p>
        </div>
        <div class="item-actions">
          <button class="edit-btn" onclick="editLeader('${leader.id}')">Edit</button>
          <button class="delete-btn" onclick="deleteLeader('${leader.id}')">Delete</button>
        </div>
      `;
      container.appendChild(item);
    });
  } catch (error) {
    console.error('Error loading leaders:', error);
  }
}

function openLeaderForm() {
  currentEditId = null;
  currentEditData = null;
  currentForm = 'leaders';
  const modalBody = document.getElementById('modalBody');
  modalBody.innerHTML = `
    <h3>Add Leader</h3>
    <div class="form-group">
      <label for="leaderName">Name</label>
      <input type="text" id="leaderName" placeholder="Full name" required>
    </div>
    <div class="form-group">
      <label for="leaderDepartment">Department</label>
      <input type="text" id="leaderDepartment" placeholder="Department" required>
    </div>
    <div class="form-group">
      <label for="leaderPosition">Position</label>
      <input type="text" id="leaderPosition" placeholder="Position" required>
    </div>
    <div class="form-group">
      <label for="leaderPhotoFile">Upload Photo From Device</label>
      <input type="file" id="leaderPhotoFile" accept="image/*">
    </div>
  `;
  openModal();
}

async function editLeader(id) {
  try {
    const response = await fetch(`${API_URL}/leaders/${id}`);
    const leader = await response.json();
    currentEditId = id;
    currentEditData = leader;
    currentForm = 'leaders';

    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
      <h3>Edit Leader</h3>
      <div class="form-group">
        <label for="leaderName">Name</label>
        <input type="text" id="leaderName" value="${leader.name || ''}" placeholder="Full name" required>
      </div>
      <div class="form-group">
        <label for="leaderDepartment">Department</label>
        <input type="text" id="leaderDepartment" value="${leader.department || ''}" placeholder="Department" required>
      </div>
      <div class="form-group">
        <label for="leaderPosition">Position</label>
        <input type="text" id="leaderPosition" value="${leader.position || ''}" placeholder="Position" required>
      </div>
      <div class="form-group">
        <label for="leaderPhotoFile">Upload New Photo From Device (optional)</label>
        <input type="file" id="leaderPhotoFile" accept="image/*">
      </div>
    `;
    openModal();
  } catch (error) {
    console.error('Error loading leader for edit:', error);
    alert('Unable to load leader for editing');
  }
}

async function handleLeaderSubmit() {
  const name = document.getElementById('leaderName').value;
  const department = document.getElementById('leaderDepartment').value;
  const position = document.getElementById('leaderPosition').value;
  const fileInput = document.getElementById('leaderPhotoFile');

  try {
    console.log('Leader submit - starting', { name, department, position, hasFile: !!(fileInput?.files?.[0]) });
    
    let photoUrl = currentEditData?.photoUrl || '';
    if (fileInput && fileInput.files && fileInput.files[0]) {
      console.log('Uploading new photo');
      photoUrl = await uploadImageToStorage(fileInput.files[0], 'leaders');
      console.log('Photo URL after upload:', photoUrl);
      if (!photoUrl || !photoUrl.trim()) {
        console.error('Photo upload returned empty URL');
        alert('Warning: Photo upload may have failed. The leader will be saved without a photo.');
        photoUrl = '';
      }
    } else {
      console.log('No new photo provided, using existing:', photoUrl || 'none');
      if (!photoUrl || !photoUrl.trim()) {
        console.warn('No photo available for leader');
      }
    }

    const method = currentEditId ? 'PUT' : 'POST';
    const url = currentEditId ? `${API_URL}/leaders/${currentEditId}` : `${API_URL}/leaders`;

    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const body = { name, department, position };
    
    // Only include photoUrl if it has a non-empty value
    if (photoUrl && typeof photoUrl === 'string' && photoUrl.trim()) {
      body.photoUrl = photoUrl.trim();
    }
    
    console.log('Sending to API:', { method, url, body });

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': await currentUser.getIdToken()
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Leader creation failed:', response.status, errorText);
      throw new Error(errorText || `Leader add failed (${response.status})`);
    }

    closeModal();
    loadLeaders();
    loadDashboardStats();
    alert('Leader added successfully!');
  } catch (error) {
    console.error('Error adding leader:', error);
    alert(`Error adding leader: ${error.message || 'Unknown error'}`);
  }
}

async function deleteLeader(id) {
  if (!confirm('Are you sure you want to delete this leader?')) return;

  try {
    const response = await fetch(`${API_URL}/leaders/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': await currentUser.getIdToken()
      }
    });

    if (response.ok) {
      loadLeaders();
      loadDashboardStats();
      alert('Leader deleted successfully!');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error deleting leader');
  }
}

// ===== DOCUMENTS FUNCTIONS =====
async function loadDocuments() {
  try {
    const response = await fetch(`${API_URL}/documents`);
    const documents = await response.json();
    const container = document.getElementById('documentsList');
    container.innerHTML = '';

    documents.forEach(doc => {
      const item = document.createElement('div');
      item.className = 'item';
      item.innerHTML = `
        <div class="item-info">
          <h3>${doc.fileName}</h3>
          <p>${doc.category}</p>
        </div>
        <div class="item-actions">
          <button class="edit-btn" onclick="editDocument('${doc.id}')">Edit</button>
          <button class="delete-btn" onclick="deleteDocument('${doc.id}')">Delete</button>
        </div>
      `;
      container.appendChild(item);
    });
  } catch (error) {
    console.error('Error loading documents:', error);
  }
}

function openDocumentForm() {
  currentEditId = null;
  currentEditData = null;
  currentForm = 'documents';
  const modalBody = document.getElementById('modalBody');
  modalBody.innerHTML = `
    <h3>Upload Document</h3>
    <div class="form-group">
      <label for="documentName">File Name</label>
      <input type="text" id="documentName" placeholder="Document name" required>
    </div>
    <div class="form-group">
      <label for="documentCategory">Category</label>
      <select id="documentCategory" required>
        <option value="">Select category</option>
        <option value="syllabus">Syllabus</option>
        <option value="guidelines">Guidelines</option>
        <option value="forms">Forms</option>
        <option value="policies">Policies</option>
      </select>
    </div>
    <div class="form-group">
      <label for="documentUrl">File URL</label>
      <input type="url" id="documentUrl" placeholder="https://example.com/document.pdf" required>
    </div>
    <div class="form-group">
      <label for="documentDescription">Description</label>
      <input type="text" id="documentDescription" placeholder="Document description">
    </div>
  `;
  openModal();
}

async function editDocument(id) {
  try {
    const response = await fetch(`${API_URL}/documents/${id}`);
    const doc = await response.json();
    currentEditId = id;
    currentEditData = doc;
    currentForm = 'documents';

    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
      <h3>Edit Document</h3>
      <div class="form-group">
        <label for="documentName">File Name</label>
        <input type="text" id="documentName" value="${doc.fileName || ''}" placeholder="Document name" required>
      </div>
      <div class="form-group">
        <label for="documentCategory">Category</label>
        <select id="documentCategory" required>
          <option value="">Select category</option>
          <option value="syllabus" ${doc.category === 'syllabus' ? 'selected' : ''}>Syllabus</option>
          <option value="guidelines" ${doc.category === 'guidelines' ? 'selected' : ''}>Guidelines</option>
          <option value="forms" ${doc.category === 'forms' ? 'selected' : ''}>Forms</option>
          <option value="policies" ${doc.category === 'policies' ? 'selected' : ''}>Policies</option>
        </select>
      </div>
      <div class="form-group">
        <label for="documentUrl">File URL</label>
        <input type="url" id="documentUrl" value="${doc.fileUrl || ''}" placeholder="https://example.com/document.pdf" required>
      </div>
      <div class="form-group">
        <label for="documentDescription">Description</label>
        <input type="text" id="documentDescription" value="${doc.description || ''}" placeholder="Document description">
      </div>
    `;
    openModal();
  } catch (error) {
    console.error('Error loading document for edit:', error);
    alert('Unable to load document for editing');
  }
}

async function handleDocumentSubmit() {
  const fileName = document.getElementById('documentName').value;
  const category = document.getElementById('documentCategory').value;
  const fileUrl = document.getElementById('documentUrl').value;
  const description = document.getElementById('documentDescription').value;

  try {
    const method = currentEditId ? 'PUT' : 'POST';
    const url = currentEditId ? `${API_URL}/documents/${currentEditId}` : `${API_URL}/documents`;

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': await currentUser.getIdToken()
      },
      body: JSON.stringify({ fileName, fileUrl, category, description })
    });

    if (response.ok) {
      closeModal();
      loadDocuments();
      loadDashboardStats();
      alert('Document uploaded successfully!');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error uploading document');
  }
}

async function deleteDocument(id) {
  if (!confirm('Are you sure you want to delete this document?')) return;

  try {
    const response = await fetch(`${API_URL}/documents/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': await currentUser.getIdToken()
      }
    });

    if (response.ok) {
      loadDocuments();
      loadDashboardStats();
      alert('Document deleted successfully!');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error deleting document');
  }
}

// ===== TEAM FUNCTIONS =====
async function loadTeamMembers() {
  try {
    const response = await fetch(`${API_URL}/team`);
    const members = await response.json();
    const container = document.getElementById('teamList');
    container.innerHTML = '';

    members.forEach(member => {
      const item = document.createElement('div');
      item.className = 'item';
      item.innerHTML = `
        <div class="item-info">
          <h3>${member.name}</h3>
          <p>${member.department} - ${member.position}</p>
        </div>
        <div class="item-actions">
          <button class="edit-btn" onclick="editTeamMember('${member.id}')">Edit</button>
          <button class="delete-btn" onclick="deleteTeamMember('${member.id}')">Delete</button>
        </div>
      `;
      container.appendChild(item);
    });
  } catch (error) {
    console.error('Error loading team:', error);
  }
}

function openTeamForm() {
  currentEditId = null;
  currentEditData = null;
  currentForm = 'team';
  const modalBody = document.getElementById('modalBody');
  modalBody.innerHTML = `
    <h3>Add Team Member</h3>
    <div class="form-group">
      <label for="teamName">Name</label>
      <input type="text" id="teamName" placeholder="Full name" required>
    </div>
    <div class="form-group">
      <label for="teamDepartment">Department</label>
      <input type="text" id="teamDepartment" placeholder="Department" required>
    </div>
    <div class="form-group">
      <label for="teamPosition">Position</label>
      <input type="text" id="teamPosition" placeholder="Position" required>
    </div>
    <div class="form-group">
      <label for="teamPhotoFile">Upload Photo From Device</label>
      <input type="file" id="teamPhotoFile" accept="image/*">
    </div>
  `;
  openModal();
}

async function editTeamMember(id) {
  try {
    const response = await fetch(`${API_URL}/team/${id}`);
    const member = await response.json();
    currentEditId = id;
    currentEditData = member;
    currentForm = 'team';

    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
      <h3>Edit Team Member</h3>
      <div class="form-group">
        <label for="teamName">Name</label>
        <input type="text" id="teamName" value="${member.name || ''}" placeholder="Full name" required>
      </div>
      <div class="form-group">
        <label for="teamDepartment">Department</label>
        <input type="text" id="teamDepartment" value="${member.department || ''}" placeholder="Department" required>
      </div>
      <div class="form-group">
        <label for="teamPosition">Position</label>
        <input type="text" id="teamPosition" value="${member.position || ''}" placeholder="Position" required>
      </div>
      <div class="form-group">
        <label for="teamPhotoFile">Upload New Photo From Device (optional)</label>
        <input type="file" id="teamPhotoFile" accept="image/*">
      </div>
    `;
    openModal();
  } catch (error) {
    console.error('Error loading team member for edit:', error);
    alert('Unable to load team member for editing');
  }
}

async function handleTeamSubmit() {
  const name = document.getElementById('teamName').value;
  const department = document.getElementById('teamDepartment').value;
  const position = document.getElementById('teamPosition').value;
  const fileInput = document.getElementById('teamPhotoFile');

  try {
    console.log('Team submit - starting', { name, department, position, hasFile: !!(fileInput?.files?.[0]) });
    
    let photoUrl = currentEditData?.photoUrl || '';
    if (fileInput && fileInput.files && fileInput.files[0]) {
      console.log('Uploading new photo');
      photoUrl = await uploadImageToStorage(fileInput.files[0], 'team');
      console.log('Photo URL after upload:', photoUrl);
      if (!photoUrl || !photoUrl.trim()) {
        console.error('Photo upload returned empty URL');
        alert('Warning: Photo upload may have failed. The team member will be saved without a photo.');
        photoUrl = '';
      }
    } else {
      console.log('No new photo provided, using existing:', photoUrl || 'none');
      if (!photoUrl || !photoUrl.trim()) {
        console.warn('No photo available for team member');
      }
    }

    const method = currentEditId ? 'PUT' : 'POST';
    const url = currentEditId ? `${API_URL}/team/${currentEditId}` : `${API_URL}/team`;

    const body = { name, department, position };
    
    // Only include photoUrl if it has a non-empty value
    if (photoUrl && typeof photoUrl === 'string' && photoUrl.trim()) {
      body.photoUrl = photoUrl.trim();
    }
    
    console.log('Sending to API:', { method, url, body });

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': await currentUser.getIdToken()
      },
      body: JSON.stringify(body)
    });

    if (response.ok) {
      closeModal();
      loadTeamMembers();
      loadDashboardStats();
      alert('Team member added successfully!');
    } else {
      const errorText = await response.text();
      console.error('Team save failed:', response.status, errorText);
      throw new Error(errorText || `Team add failed (${response.status})`);
    }
  } catch (error) {
    console.error('Error adding team member:', error);
    alert(`Error adding team member: ${error.message || 'Unknown error'}`);
  }
}

async function deleteTeamMember(id) {
  if (!confirm('Are you sure you want to delete this team member?')) return;

  try {
    const response = await fetch(`${API_URL}/team/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': await currentUser.getIdToken()
      }
    });

    if (response.ok) {
      loadTeamMembers();
      loadDashboardStats();
      alert('Team member deleted successfully!');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error deleting team member');
  }
}

// ===== PAST QUESTIONS FUNCTIONS =====
async function loadPastQuestions() {
  try {
    const response = await fetch(`${API_URL}/past-questions`);
    const questions = await response.json();
    const container = document.getElementById('questionsList');
    container.innerHTML = '';

    questions.forEach(q => {
      const item = document.createElement('div');
      item.className = 'item';
      item.innerHTML = `
        <div class="item-info">
          <h3>${q.fileName}</h3>
          <p>${q.subject} - ${q.semester}</p>
        </div>
        <div class="item-actions">
          <button class="edit-btn" onclick="editPastQuestion('${q.id}')">Edit</button>
          <button class="delete-btn" onclick="deletePastQuestion('${q.id}')">Delete</button>
        </div>
      `;
      container.appendChild(item);
    });
  } catch (error) {
    console.error('Error loading past questions:', error);
  }
}

function openQuestionForm() {
  currentEditId = null;
  currentEditData = null;
  currentForm = 'past-questions';
  const modalBody = document.getElementById('modalBody');
  modalBody.innerHTML = `
    <h3>Upload Resource</h3>
    <div class="form-group">
      <label for="questionName">File Name</label>
      <input type="text" id="questionName" placeholder="File name" required>
    </div>
    <div class="form-group">
      <label for="questionSubject">Subject</label>
      <input type="text" id="questionSubject" placeholder="Subject name" required>
    </div>
    <div class="form-group">
      <label for="questionSemester">Semester/Level</label>
      <select id="questionSemester" required>
        <option value="">Select level</option>
        <option value="100">100 Level</option>
        <option value="200">200 Level</option>
        <option value="300">300 Level</option>
        <option value="400">400 Level</option>
      </select>
    </div>
    <div class="form-group">
      <label for="questionUrl">File URL</label>
      <input type="url" id="questionUrl" placeholder="https://example.com/file.pdf" required>
    </div>
    <div class="form-group">
      <label for="questionDescription">Description</label>
      <input type="text" id="questionDescription" placeholder="File description">
    </div>
  `;
  openModal();
}

async function editPastQuestion(id) {
  try {
    const response = await fetch(`${API_URL}/past-questions/${id}`);
    const q = await response.json();
    currentEditId = id;
    currentEditData = q;
    currentForm = 'past-questions';

    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
      <h3>Edit Resource</h3>
      <div class="form-group">
        <label for="questionName">File Name</label>
        <input type="text" id="questionName" value="${q.fileName || ''}" placeholder="File name" required>
      </div>
      <div class="form-group">
        <label for="questionSubject">Subject</label>
        <input type="text" id="questionSubject" value="${q.subject || ''}" placeholder="Subject name" required>
      </div>
      <div class="form-group">
        <label for="questionSemester">Semester/Level</label>
        <select id="questionSemester" required>
          <option value="">Select level</option>
          <option value="100" ${q.semester === '100' ? 'selected' : ''}>100 Level</option>
          <option value="200" ${q.semester === '200' ? 'selected' : ''}>200 Level</option>
          <option value="300" ${q.semester === '300' ? 'selected' : ''}>300 Level</option>
          <option value="400" ${q.semester === '400' ? 'selected' : ''}>400 Level</option>
        </select>
      </div>
      <div class="form-group">
        <label for="questionUrl">File URL</label>
        <input type="url" id="questionUrl" value="${q.fileUrl || ''}" placeholder="https://example.com/file.pdf" required>
      </div>
      <div class="form-group">
        <label for="questionDescription">Description</label>
        <input type="text" id="questionDescription" value="${q.description || ''}" placeholder="File description">
      </div>
    `;
    openModal();
  } catch (error) {
    console.error('Error loading resource for edit:', error);
    alert('Unable to load resource for editing');
  }
}

async function handleQuestionSubmit() {
  const fileName = document.getElementById('questionName').value;
  const subject = document.getElementById('questionSubject').value;
  const semester = document.getElementById('questionSemester').value;
  const fileUrl = document.getElementById('questionUrl').value;
  const description = document.getElementById('questionDescription').value;

  try {
    const method = currentEditId ? 'PUT' : 'POST';
    const url = currentEditId ? `${API_URL}/past-questions/${currentEditId}` : `${API_URL}/past-questions`;

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': await currentUser.getIdToken()
      },
      body: JSON.stringify({ fileName, subject, semester, fileUrl, description })
    });

    if (response.ok) {
      closeModal();
      loadPastQuestions();
      loadDashboardStats();
      alert('Resource saved successfully!');
    } else {
      alert('Error saving resource');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error saving resource');
  }
}

async function deletePastQuestion(id) {
  if (!confirm('Are you sure you want to delete this resource?')) return;

  try {
    const response = await fetch(`${API_URL}/past-questions/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': await currentUser.getIdToken()
      }
    });

    if (response.ok) {
      loadPastQuestions();
      loadDashboardStats();
      alert('Resource deleted successfully!');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error deleting resource');
  }
}

// ===== NEW FEATURE FUNCTIONS =====
async function loadNewsletters() {
  try {
    const response = await fetch(`${API_URL}/newsletter/all`);
    const items = await response.json();
    const container = document.getElementById('newsletterList');
    container.innerHTML = '';

    items.forEach(item => {
      const div = document.createElement('div');
      div.className = 'item';
      div.innerHTML = `
        <div class="item-info">
          <h3>${item.title}</h3>
          <p>${item.preview || item.content?.substring(0, 120) || ''}</p>
          <p>${item.category || 'General'}</p>
        </div>
        <div class="item-actions">
          <button class="edit-btn" onclick="editNewsletter('${item.id}')">Edit</button>
          <button class="delete-btn" onclick="deleteNewsletter('${item.id}')">Delete</button>
        </div>
      `;
      container.appendChild(div);
    });
  } catch (error) {
    console.error('Error loading newsletters:', error);
  }
}

function openNewsletterForm() {
  currentEditId = null;
  currentEditData = null;
  currentForm = 'newsletter';
  const modalBody = document.getElementById('modalBody');
  modalBody.innerHTML = `
    <h3>Add Newsletter</h3>
    <div class="form-group">
      <label for="newsletterTitle">Title</label>
      <input type="text" id="newsletterTitle" placeholder="Newsletter title" required>
    </div>
    <div class="form-group">
      <label for="newsletterCategory">Category</label>
      <input type="text" id="newsletterCategory" placeholder="Category (optional)">
    </div>
    <div class="form-group">
      <label for="newsletterPreview">Preview Text</label>
      <textarea id="newsletterPreview" rows="3" placeholder="Short preview text"></textarea>
    </div>
    <div class="form-group">
      <label for="newsletterContent">Content</label>
      <textarea id="newsletterContent" rows="6" placeholder="Full newsletter content" required></textarea>
    </div>
  `;
  openModal();
}

async function handleNewsletterSubmit() {
  const title = document.getElementById('newsletterTitle').value;
  const category = document.getElementById('newsletterCategory').value;
  const preview = document.getElementById('newsletterPreview').value;
  const content = document.getElementById('newsletterContent').value;

  try {
    const method = currentEditId ? 'PUT' : 'POST';
    const url = currentEditId ? `${API_URL}/newsletter/${currentEditId}` : `${API_URL}/newsletter/create`;
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': await currentUser.getIdToken()
      },
      body: JSON.stringify({ title, category, preview, content })
    });

    if (response.ok) {
      const data = await response.json();
      closeModal();
      loadNewsletters();
      loadDashboardStats();
      
      // Show email distribution status if available
      let message = currentEditId ? 'Newsletter updated successfully!' : 'Newsletter created successfully!';
      if (data.emailDistribution && !currentEditId) {
        const { sent, failed, total } = data.emailDistribution;
        message += `\n\n📧 Email Distribution:\n✅ Sent: ${sent}/${total}\n❌ Failed: ${failed}`;
        if (failed === 0 && sent > 0) {
          message += '\n\n🎉 All subscribers notified!';
        }
      }
      
      alert(message);
    } else {
      const err = await response.json().catch(() => ({}));
      alert(err.error || 'Error saving newsletter');
    }
  } catch (error) {
    console.error('Error saving newsletter:', error);
    alert(`Error saving newsletter: ${error.message}`);
  }
}

// View newsletter subscribers
async function viewNewsletterSubscribers() {
  try {
    const response = await fetch(`${API_URL}/newsletter/subscribers/list`, {
      headers: {
        'Authorization': await currentUser.getIdToken()
      }
    });

    if (!response.ok) {
      alert('Failed to load subscribers');
      return;
    }

    const data = await response.json();
    const { active, inactive, total, subscribers } = data;

    const modalBody = document.getElementById('modalBody');
    
    let subscribersHTML = `
      <h3>📧 Newsletter Subscribers</h3>
      <div style="margin: 15px 0; padding: 15px; background: #f0f4ff; border-radius: 8px;">
        <p style="margin: 5px 0;"><strong>Active Subscribers:</strong> ${active}</p>
        <p style="margin: 5px 0;"><strong>Inactive Subscribers:</strong> ${inactive}</p>
        <p style="margin: 5px 0;"><strong>Total:</strong> ${total}</p>
      </div>
      <div style="max-height: 400px; overflow-y: auto;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <thead>
            <tr style="background: #f5f5f5; border-bottom: 2px solid #ddd;">
              <th style="padding: 10px; text-align: left;">Email</th>
              <th style="padding: 10px; text-align: left;">Department</th>
              <th style="padding: 10px; text-align: left;">Status</th>
              <th style="padding: 10px; text-align: left;">Subscribed</th>
            </tr>
          </thead>
          <tbody>
    `;

    subscribers.forEach((sub, index) => {
      const bgColor = index % 2 === 0 ? '#fff' : '#f9f9f9';
      const statusBadge = sub.active 
        ? '<span style="background: #4CAF50; color: white; padding: 3px 8px; border-radius: 4px; font-size: 12px;">Active</span>'
        : '<span style="background: #999; color: white; padding: 3px 8px; border-radius: 4px; font-size: 12px;">Inactive</span>';
      
      const subscribedDate = sub.subscribedAt?.toDate ? sub.subscribedAt.toDate().toLocaleDateString() : 'N/A';
      
      subscribersHTML += `
        <tr style="background: ${bgColor}; border-bottom: 1px solid #eee;">
          <td style="padding: 10px;">${sub.email}</td>
          <td style="padding: 10px;">${sub.department || 'N/A'}</td>
          <td style="padding: 10px;">${statusBadge}</td>
          <td style="padding: 10px; font-size: 12px;">${subscribedDate}</td>
        </tr>
      `;
    });

    subscribersHTML += `
          </tbody>
        </table>
      </div>
    `;

    modalBody.innerHTML = subscribersHTML;
    openModal();
  } catch (error) {
    console.error('Error loading subscribers:', error);
    alert('Error loading subscribers: ' + error.message);
  }
}

async function editNewsletter(id) {
  try {
    const response = await fetch(`${API_URL}/newsletter/${id}`);
    if (!response.ok) {
      alert('Failed to load newsletter for editing');
      return;
    }
    
    const item = await response.json();
    currentEditId = id;
    currentEditData = item;
    currentForm = 'newsletter';
    
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
      <h3>Edit Newsletter</h3>
      <div class="form-group">
        <label for="newsletterTitle">Title</label>
        <input type="text" id="newsletterTitle" value="${item.title || ''}" placeholder="Newsletter title" required>
      </div>
      <div class="form-group">
        <label for="newsletterCategory">Category</label>
        <input type="text" id="newsletterCategory" value="${item.category || ''}" placeholder="Category (optional)">
      </div>
      <div class="form-group">
        <label for="newsletterPreview">Preview Text</label>
        <textarea id="newsletterPreview" rows="3" placeholder="Short preview text">${item.preview || ''}</textarea>
      </div>
      <div class="form-group">
        <label for="newsletterContent">Content</label>
        <textarea id="newsletterContent" rows="6" placeholder="Full newsletter content" required>${item.content || ''}</textarea>
      </div>
    `;
    openModal();
  } catch (error) {
    console.error('Error loading newsletter for edit:', error);
    alert('Error loading newsletter for editing');
  }
}

async function deleteNewsletter(id) {
  if (!confirm('Are you sure you want to delete this newsletter?')) return;

  try {
    const response = await fetch(`${API_URL}/newsletter/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': await currentUser.getIdToken()
      }
    });

    if (response.ok) {
      loadNewsletters();
      loadDashboardStats();
      alert('Newsletter deleted successfully!');
    } else {
      alert('Failed to delete newsletter');
    }
  } catch (error) {
    console.error('Error deleting newsletter:', error);
    alert(`Error deleting newsletter: ${error.message}`);
  }
}


async function loadMarketplaceItems() {
  try {
    const response = await fetch(`${API_URL}/marketplace/items`);
    const items = await response.json();
    const container = document.getElementById('marketplaceList');
    container.innerHTML = '';

    items.forEach(item => {
      const div = document.createElement('div');
      div.className = 'item';
      div.innerHTML = `
        <div class="item-info">
          <h3>${item.name}</h3>
          <p>${item.category} • ₦${item.price}</p>
          <p>${item.description || ''}</p>
        </div>
        <div class="item-actions">
          <button class="edit-btn" onclick="editMarketplaceItem('${item.id}')">Edit</button>
          <button class="delete-btn" onclick="deleteMarketplaceItem('${item.id}')">Delete</button>
        </div>
      `;
      container.appendChild(div);
    });
  } catch (error) {
    console.error('Error loading marketplace items:', error);
  }
}

function openMarketplaceForm() {
  currentEditId = null;
  currentEditData = null;
  currentForm = 'marketplace';
  const modalBody = document.getElementById('modalBody');
  modalBody.innerHTML = `
    <h3>Add Marketplace Item</h3>
    <div class="form-group">
      <label for="marketplaceName">Name</label>
      <input type="text" id="marketplaceName" placeholder="Item name" required>
    </div>
    <div class="form-group">
      <label for="marketplaceCategory">Category</label>
      <input type="text" id="marketplaceCategory" placeholder="Category" required>
    </div>
    <div class="form-group">
      <label for="marketplacePrice">Price</label>
      <input type="text" id="marketplacePrice" placeholder="Price" required>
    </div>
    <div class="form-group">
      <label for="marketplaceDescription">Description</label>
      <textarea id="marketplaceDescription" rows="4" placeholder="Item description" required></textarea>
    </div>
    <div class="form-group">
      <label for="marketplaceContactPhone">Contact Phone</label>
      <input type="text" id="marketplaceContactPhone" placeholder="Phone number" required>
    </div>
    <div class="form-group">
      <label for="marketplaceContactWhatsApp">WhatsApp (optional)</label>
      <input type="text" id="marketplaceContactWhatsApp" placeholder="WhatsApp contact">
    </div>
  `;
  openModal();
}

async function handleMarketplaceSubmit() {
  const name = document.getElementById('marketplaceName').value;
  const category = document.getElementById('marketplaceCategory').value;
  const price = document.getElementById('marketplacePrice').value;
  const description = document.getElementById('marketplaceDescription').value;
  const contactPhone = document.getElementById('marketplaceContactPhone').value;
  const contactWhatsApp = document.getElementById('marketplaceContactWhatsApp').value;

  try {
    const method = currentEditId ? 'PUT' : 'POST';
    const url = currentEditId ? `${API_URL}/marketplace/${currentEditId}` : `${API_URL}/marketplace/item/create`;
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': await currentUser.getIdToken()
      },
      body: JSON.stringify({ name, category, price, description, contactPhone, contactWhatsApp })
    });

    if (response.ok) {
      closeModal();
      loadMarketplaceItems();
      loadDashboardStats();
      alert(currentEditId ? 'Marketplace item updated successfully!' : 'Marketplace item created successfully!');
    } else {
      const err = await response.json().catch(() => ({}));
      alert(err.error || 'Error saving marketplace item');
    }
  } catch (error) {
    console.error('Error saving marketplace item:', error);
    alert(`Error saving marketplace item: ${error.message}`);
  }
}

async function editMarketplaceItem(id) {
  try {
    const response = await fetch(`${API_URL}/marketplace/${id}`);
    if (!response.ok) {
      alert('Failed to load marketplace item for editing');
      return;
    }
    
    const item = await response.json();
    currentEditId = id;
    currentEditData = item;
    currentForm = 'marketplace';
    
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
      <h3>Edit Marketplace Item</h3>
      <div class="form-group">
        <label for="marketplaceName">Name</label>
        <input type="text" id="marketplaceName" value="${item.name || ''}" placeholder="Item name" required>
      </div>
      <div class="form-group">
        <label for="marketplaceCategory">Category</label>
        <input type="text" id="marketplaceCategory" value="${item.category || ''}" placeholder="Category" required>
      </div>
      <div class="form-group">
        <label for="marketplacePrice">Price</label>
        <input type="text" id="marketplacePrice" value="${item.price || ''}" placeholder="Price" required>
      </div>
      <div class="form-group">
        <label for="marketplaceDescription">Description</label>
        <textarea id="marketplaceDescription" rows="4" placeholder="Item description" required>${item.description || ''}</textarea>
      </div>
      <div class="form-group">
        <label for="marketplaceContactPhone">Contact Phone</label>
        <input type="text" id="marketplaceContactPhone" value="${item.contactPhone || ''}" placeholder="Phone number" required>
      </div>
      <div class="form-group">
        <label for="marketplaceContactWhatsApp">WhatsApp (optional)</label>
        <input type="text" id="marketplaceContactWhatsApp" value="${item.contactWhatsApp || ''}" placeholder="WhatsApp contact">
      </div>
    `;
    openModal();
  } catch (error) {
    console.error('Error loading marketplace item for edit:', error);
    alert('Error loading marketplace item for editing');
  }
}

async function deleteMarketplaceItem(id) {
  if (!confirm('Are you sure you want to delete this marketplace item?')) return;

  try {
    const response = await fetch(`${API_URL}/marketplace/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': await currentUser.getIdToken()
      }
    });

    if (response.ok) {
      loadMarketplaceItems();
      loadDashboardStats();
      alert('Marketplace item deleted successfully!');
    } else {
      alert('Failed to delete marketplace item');
    }
  } catch (error) {
    console.error('Error deleting marketplace item:', error);
    alert(`Error deleting marketplace item: ${error.message}`);
  }
}

async function loadDepartments() {
  try {
    const response = await fetch(`${API_URL}/departments/all`);
    const departments = await response.json();
    const container = document.getElementById('departmentsList');
    container.innerHTML = '';

    departments.forEach(dept => {
      const div = document.createElement('div');
      div.className = 'item';
      div.innerHTML = `
        <div class="item-info">
          <h3>${dept.name}</h3>
          <p>${dept.hod || 'HOD: N/A'}</p>
          <p>${dept.location || ''}</p>
        </div>
        <div class="item-actions">
          <button class="edit-btn" onclick="editDepartment('${dept.id}')">Edit</button>
          <button class="delete-btn" onclick="deleteDepartment('${dept.id}')">Delete</button>
        </div>
      `;
      container.appendChild(div);
    });
  } catch (error) {
    console.error('Error loading departments:', error);
  }
}

function openDepartmentForm() {
  currentEditId = null;
  currentEditData = null;
  currentForm = 'departments';
  const modalBody = document.getElementById('modalBody');
  modalBody.innerHTML = `
    <h3>Add Department</h3>
    <div class="form-group">
      <label for="departmentName">Name</label>
      <input type="text" id="departmentName" placeholder="Department name" required>
    </div>
    <div class="form-group">
      <label for="departmentDescription">Description</label>
      <textarea id="departmentDescription" rows="4" placeholder="Department description" required></textarea>
    </div>
    <div class="form-group">
      <label for="departmentLogoFile">Department Logo</label>
      <input type="file" id="departmentLogoFile" accept="image/*">
    </div>
    <div class="form-group">
      <label for="departmentHod">Head of Department (HOD)</label>
      <input type="text" id="departmentHod" placeholder="HOD name">
    </div>
    <div class="form-group">
      <label for="departmentPresident">President/Chairman</label>
      <input type="text" id="departmentPresident" placeholder="President or Chairman name">
    </div>
    <div class="form-group">
      <label for="departmentContact">Contact Phone</label>
      <input type="tel" id="departmentContact" placeholder="Phone number">
    </div>
    <div class="form-group">
      <label for="departmentEmail">Email</label>
      <input type="email" id="departmentEmail" placeholder="Email address">
    </div>
    <div class="form-group">
      <label for="departmentLocation">Location</label>
      <input type="text" id="departmentLocation" placeholder="Building/Office location">
    </div>
    <div class="form-group">
      <label for="departmentWebsite">Website</label>
      <input type="url" id="departmentWebsite" placeholder="https://example.com">
    </div>
    <div class="form-group">
      <label for="departmentPrograms">Programs Offered</label>
      <textarea id="departmentPrograms" rows="3" placeholder="Programs offered (one per line or comma separated)"></textarea>
    </div>
    <div class="form-group">
      <label for="departmentAchievements">Achievements & Highlights</label>
      <textarea id="departmentAchievements" rows="3" placeholder="Key achievements and milestones"></textarea>
    </div>
    <div class="form-group">
      <label for="departmentOrder">Display Order</label>
      <input type="number" id="departmentOrder" placeholder="Order" min="0">
    </div>
  `;
  openModal();
}

async function handleDepartmentSubmit() {
  const name = document.getElementById('departmentName').value;
  const description = document.getElementById('departmentDescription').value;
  const hod = document.getElementById('departmentHod').value;
  const president = document.getElementById('departmentPresident').value;
  const contact = document.getElementById('departmentContact').value;
  const email = document.getElementById('departmentEmail').value;
  const location = document.getElementById('departmentLocation').value;
  const website = document.getElementById('departmentWebsite').value;
  const programsText = document.getElementById('departmentPrograms').value;
  const programs = programsText
    .split(/\r?\n|,/)
    .map(p => p.trim())
    .filter(Boolean);
  const achievements = document.getElementById('departmentAchievements').value;
  const order = Number(document.getElementById('departmentOrder').value || 0);
  const fileInput = document.getElementById('departmentLogoFile');

  try {
    let logoUrl = currentEditData?.logo || '';
    
    // Upload new logo if provided
    if (fileInput && fileInput.files && fileInput.files[0]) {
      try {
        logoUrl = await uploadImageToStorage(fileInput.files[0], 'departments');
      } catch (err) {
        console.warn('Logo upload failed:', err);
        // Continue without logo
      }
    }

    const method = currentEditId ? 'PUT' : 'POST';
    const url = currentEditId ? `${API_URL}/departments/${currentEditId}` : `${API_URL}/departments/create`;
    
    const body = { name, description, hod, president, contact, email, location, website, programs, achievements, order };
    if (logoUrl) {
      body.logo = logoUrl;
    }

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': await currentUser.getIdToken()
      },
      body: JSON.stringify(body)
    });

    if (response.ok) {
      closeModal();
      loadDepartments();
      loadDashboardStats();
      alert(currentEditId ? 'Department updated successfully!' : 'Department created successfully!');
    } else {
      const err = await response.json().catch(() => ({}));
      console.error('Department save failed:', response.status, err);
      alert(err.error || `Error saving department (${response.status})`);
    }
  } catch (error) {
    console.error('Error saving department:', error);
    alert(`Error saving department: ${error.message}`);
  }
}

async function editDepartment(id) {
  try {
    const response = await fetch(`${API_URL}/departments/${id}`);
    if (!response.ok) {
      alert('Failed to load department for editing');
      return;
    }
    
    const dept = await response.json();
    currentEditId = id;
    currentEditData = dept;
    currentForm = 'departments';
    
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
      <h3>Edit Department</h3>
      <div class="form-group">
        <label for="departmentName">Name</label>
        <input type="text" id="departmentName" value="${dept.name || ''}" placeholder="Department name" required>
      </div>
      <div class="form-group">
        <label for="departmentDescription">Description</label>
        <textarea id="departmentDescription" rows="4" placeholder="Department description" required>${dept.description || ''}</textarea>
      </div>
      <div class="form-group">
        <label for="departmentLogoFile">Update Logo (optional)</label>
        <input type="file" id="departmentLogoFile" accept="image/*">
      </div>
      <div class="form-group">
        <label for="departmentHod">Head of Department (HOD)</label>
        <input type="text" id="departmentHod" value="${dept.hod || ''}" placeholder="HOD name">
      </div>
      <div class="form-group">
        <label for="departmentPresident">President/Chairman</label>
        <input type="text" id="departmentPresident" value="${dept.president || ''}" placeholder="President or Chairman name">
      </div>
      <div class="form-group">
        <label for="departmentContact">Contact Phone</label>
        <input type="tel" id="departmentContact" value="${dept.contact || ''}" placeholder="Phone number">
      </div>
      <div class="form-group">
        <label for="departmentEmail">Email</label>
        <input type="email" id="departmentEmail" value="${dept.email || ''}" placeholder="Email address">
      </div>
      <div class="form-group">
        <label for="departmentLocation">Location</label>
        <input type="text" id="departmentLocation" value="${dept.location || ''}" placeholder="Building/Office location">
      </div>
      <div class="form-group">
        <label for="departmentWebsite">Website</label>
        <input type="url" id="departmentWebsite" value="${dept.website || ''}" placeholder="https://example.com">
      </div>
      <div class="form-group">
        <label for="departmentPrograms">Programs Offered</label>
        <textarea id="departmentPrograms" rows="3" placeholder="Programs offered (one per line or comma separated)">${Array.isArray(dept.programs) ? dept.programs.join('\n') : dept.programs || ''}</textarea>
      </div>
      <div class="form-group">
        <label for="departmentAchievements">Achievements & Highlights</label>
        <textarea id="departmentAchievements" rows="3" placeholder="Key achievements and milestones">${dept.achievements || ''}</textarea>
      </div>
      <div class="form-group">
        <label for="departmentOrder">Display Order</label>
        <input type="number" id="departmentOrder" value="${dept.order || 0}" placeholder="Order" min="0">
      </div>
    `;
    openModal();
  } catch (error) {
    console.error('Error loading department for edit:', error);
    alert('Error loading department for editing');
  }
}

async function deleteDepartment(id) {
  if (!confirm('Are you sure you want to delete this department?')) return;

  try {
    const response = await fetch(`${API_URL}/departments/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': await currentUser.getIdToken()
      }
    });

    if (response.ok) {
      loadDepartments();
      loadDashboardStats();
      alert('Department deleted successfully!');
    } else {
      alert('Failed to delete department');
    }
  } catch (error) {
    console.error('Error deleting department:', error);
    alert(`Error deleting department: ${error.message}`);
  }
}

async function loadParliamentarians() {
  try {
    const response = await fetch(`${API_URL}/parliamentarians/all`);
    const items = await response.json();
    const container = document.getElementById('parliamentariansList');
    container.innerHTML = '';

    items.forEach(person => {
      const div = document.createElement('div');
      div.className = 'item';
      div.innerHTML = `
        <div class="item-info">
          <h3>${person.name}</h3>
          <p>${person.position}</p>
          <p>${person.department || ''}</p>
        </div>
        <div class="item-actions">
          <button class="edit-btn" onclick="editParliamentarian('${person.id}')">Edit</button>
          <button class="delete-btn" onclick="deleteParliamentarian('${person.id}')">Delete</button>
        </div>
      `;
      container.appendChild(div);
    });
  } catch (error) {
    console.error('Error loading parliamentarians:', error);
  }
}

function openParliamentarianForm() {
  currentEditId = null;
  currentEditData = null;
  currentForm = 'parliamentarians';
  const modalBody = document.getElementById('modalBody');
  modalBody.innerHTML = `
    <h3>Add Parliamentarian</h3>
    <div class="form-group">
      <label for="parlName">Name</label>
      <input type="text" id="parlName" placeholder="Full name" required>
    </div>
    <div class="form-group">
      <label for="parlPosition">Position</label>
      <input type="text" id="parlPosition" placeholder="Position" required>
    </div>
    <div class="form-group">
      <label for="parlDepartment">Department</label>
      <input type="text" id="parlDepartment" placeholder="Department">
    </div>
    <div class="form-group">
      <label for="parlBio">Bio</label>
      <textarea id="parlBio" rows="4" placeholder="Short biography"></textarea>
    </div>
    <div class="form-group">
      <label for="parlPortfolio">Portfolio</label>
      <input type="text" id="parlPortfolio" placeholder="Portfolio link or summary">
    </div>
    <div class="form-group">
      <label for="parlEmail">Email</label>
      <input type="email" id="parlEmail" placeholder="Email address">
    </div>
    <div class="form-group">
      <label for="parlPhone">Phone</label>
      <input type="text" id="parlPhone" placeholder="Phone number">
    </div>
    <div class="form-group">
      <label for="parlOrder">Display Order</label>
      <input type="number" id="parlOrder" placeholder="Order" min="0">
    </div>
  `;
  openModal();
}

async function handleParliamentarianSubmit() {
  const name = document.getElementById('parlName').value;
  const position = document.getElementById('parlPosition').value;
  const department = document.getElementById('parlDepartment').value;
  const bio = document.getElementById('parlBio').value;
  const portfolio = document.getElementById('parlPortfolio').value;
  const email = document.getElementById('parlEmail').value;
  const phone = document.getElementById('parlPhone').value;
  const order = Number(document.getElementById('parlOrder').value || 0);

  try {
    const method = currentEditId ? 'PUT' : 'POST';
    const url = currentEditId ? `${API_URL}/parliamentarians/${currentEditId}` : `${API_URL}/parliamentarians/create`;
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': await currentUser.getIdToken()
      },
      body: JSON.stringify({ name, position, department, bio, portfolio, email, phone, order })
    });

    if (response.ok) {
      closeModal();
      loadParliamentarians();
      loadDashboardStats();
      alert(currentEditId ? 'Parliamentarian updated successfully!' : 'Parliamentarian created successfully!');
    } else {
      const err = await response.json().catch(() => ({}));
      alert(err.error || 'Error saving parliamentarian');
    }
  } catch (error) {
    console.error('Error saving parliamentarian:', error);
    alert(`Error saving parliamentarian: ${error.message}`);
  }
}

async function editParliamentarian(id) {
  try {
    const response = await fetch(`${API_URL}/parliamentarians/${id}`);
    if (!response.ok) {
      alert('Failed to load parliamentarian for editing');
      return;
    }
    
    const person = await response.json();
    currentEditId = id;
    currentEditData = person;
    currentForm = 'parliamentarians';
    
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
      <h3>Edit Parliamentarian</h3>
      <div class="form-group">
        <label for="parlName">Name</label>
        <input type="text" id="parlName" value="${person.name || ''}" placeholder="Full name" required>
      </div>
      <div class="form-group">
        <label for="parlPosition">Position</label>
        <input type="text" id="parlPosition" value="${person.position || ''}" placeholder="Position" required>
      </div>
      <div class="form-group">
        <label for="parlDepartment">Department</label>
        <input type="text" id="parlDepartment" value="${person.department || ''}" placeholder="Department">
      </div>
      <div class="form-group">
        <label for="parlBio">Bio</label>
        <textarea id="parlBio" rows="4" placeholder="Short biography">${person.bio || ''}</textarea>
      </div>
      <div class="form-group">
        <label for="parlPortfolio">Portfolio</label>
        <input type="text" id="parlPortfolio" value="${person.portfolio || ''}" placeholder="Portfolio link or summary">
      </div>
      <div class="form-group">
        <label for="parlEmail">Email</label>
        <input type="email" id="parlEmail" value="${person.email || ''}" placeholder="Email address">
      </div>
      <div class="form-group">
        <label for="parlPhone">Phone</label>
        <input type="text" id="parlPhone" value="${person.phone || ''}" placeholder="Phone number">
      </div>
      <div class="form-group">
        <label for="parlOrder">Display Order</label>
        <input type="number" id="parlOrder" value="${person.order || 0}" placeholder="Order" min="0">
      </div>
    `;
    openModal();
  } catch (error) {
    console.error('Error loading parliamentarian for edit:', error);
    alert('Error loading parliamentarian for editing');
  }
}

async function deleteParliamentarian(id) {
  if (!confirm('Are you sure you want to delete this parliamentarian?')) return;

  try {
    const response = await fetch(`${API_URL}/parliamentarians/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': await currentUser.getIdToken()
      }
    });

    if (response.ok) {
      loadParliamentarians();
      loadDashboardStats();
      alert('Parliamentarian deleted successfully!');
    } else {
      alert('Failed to delete parliamentarian');
    }
  } catch (error) {
    console.error('Error deleting parliamentarian:', error);
    alert(`Error deleting parliamentarian: ${error.message}`);
  }
}

async function loadSocialHandles() {
  try {
    const response = await fetch(`${API_URL}/social-handles/all`);
    const items = await response.json();
    const container = document.getElementById('socialHandlesList');
    container.innerHTML = '';

    items.forEach(handle => {
      const div = document.createElement('div');
      div.className = 'item';
      div.innerHTML = `
        <div class="item-info">
          <h3>${handle.name}</h3>
          <p>${handle.platform}</p>
          <p>${handle.handle || ''}</p>
          <p>${handle.url || ''}</p>
        </div>
        <div class="item-actions">
          <button class="edit-btn" onclick="editSocialHandle('${handle.id}')">Edit</button>
          <button class="delete-btn" onclick="deleteSocialHandle('${handle.id}')">Delete</button>
        </div>
      `;
      container.appendChild(div);
    });
  } catch (error) {
    console.error('Error loading social handles:', error);
  }
}

function openSocialHandleForm() {
  currentEditId = null;
  currentEditData = null;
  currentForm = 'social-handles';
  const modalBody = document.getElementById('modalBody');
  modalBody.innerHTML = `
    <h3>Add Social Handle</h3>
    <div class="form-group">
      <label for="socialName">Name</label>
      <input type="text" id="socialName" placeholder="Name" required>
    </div>
    <div class="form-group">
      <label for="socialPlatform">Platform</label>
      <input type="text" id="socialPlatform" placeholder="Platform" required>
    </div>
    <div class="form-group">
      <label for="socialHandle">Handle</label>
      <input type="text" id="socialHandle" placeholder="Handle">
    </div>
    <div class="form-group">
      <label for="socialUrl">URL</label>
      <input type="url" id="socialUrl" placeholder="https://example.com">
    </div>
    <div class="form-group">
      <label for="socialType">Type</label>
      <input type="text" id="socialType" placeholder="Type (e.g. main)">
    </div>
  `;
  openModal();
}

async function handleSocialHandleSubmit() {
  const name = document.getElementById('socialName').value;
  const platform = document.getElementById('socialPlatform').value;
  const handle = document.getElementById('socialHandle').value;
  const url = document.getElementById('socialUrl').value;
  const type = document.getElementById('socialType').value;

  try {
    const method = currentEditId ? 'PUT' : 'POST';
    const apiUrl = currentEditId ? `${API_URL}/social-handles/${currentEditId}` : `${API_URL}/social-handles/create`;
    
    const response = await fetch(apiUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': await currentUser.getIdToken()
      },
      body: JSON.stringify({ name, platform, handle, url, type })
    });

    if (response.ok) {
      closeModal();
      loadSocialHandles();
      loadDashboardStats();
      alert(currentEditId ? 'Social handle updated successfully!' : 'Social handle created successfully!');
    } else {
      const err = await response.json().catch(() => ({}));
      alert(err.error || 'Error saving social handle');
    }
  } catch (error) {
    console.error('Error saving social handle:', error);
    alert(`Error saving social handle: ${error.message}`);
  }
}

async function editSocialHandle(id) {
  try {
    const response = await fetch(`${API_URL}/social-handles/${id}`);
    if (!response.ok) {
      alert('Failed to load social handle for editing');
      return;
    }
    
    const handle = await response.json();
    currentEditId = id;
    currentEditData = handle;
    currentForm = 'social-handles';
    
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
      <h3>Edit Social Handle</h3>
      <div class="form-group">
        <label for="socialName">Name</label>
        <input type="text" id="socialName" value="${handle.name || ''}" placeholder="Name" required>
      </div>
      <div class="form-group">
        <label for="socialPlatform">Platform</label>
        <input type="text" id="socialPlatform" value="${handle.platform || ''}" placeholder="Platform" required>
      </div>
      <div class="form-group">
        <label for="socialHandle">Handle</label>
        <input type="text" id="socialHandle" value="${handle.handle || ''}" placeholder="Handle">
      </div>
      <div class="form-group">
        <label for="socialUrl">URL</label>
        <input type="url" id="socialUrl" value="${handle.url || ''}" placeholder="https://example.com">
      </div>
      <div class="form-group">
        <label for="socialType">Type</label>
        <input type="text" id="socialType" value="${handle.type || ''}" placeholder="Type (e.g. main)">
      </div>
    `;
    openModal();
  } catch (error) {
    console.error('Error loading social handle for edit:', error);
    alert('Error loading social handle for editing');
  }
}

async function deleteSocialHandle(id) {
  if (!confirm('Are you sure you want to delete this social handle?')) return;

  try {
    const response = await fetch(`${API_URL}/social-handles/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': await currentUser.getIdToken()
      }
    });

    if (response.ok) {
      loadSocialHandles();
      loadDashboardStats();
      alert('Social handle deleted successfully!');
    } else {
      alert('Failed to delete social handle');
    }
  } catch (error) {
    console.error('Error deleting social handle:', error);
    alert(`Error deleting social handle: ${error.message}`);
  }
}

async function loadCompanionContent() {
  try {
    const [advisorsRes, faqRes, topicsRes] = await Promise.all([
      fetch(`${API_URL}/companion/advisors`),
      fetch(`${API_URL}/companion/faq`),
      fetch(`${API_URL}/companion/topics`)
    ]);

    const advisors = await advisorsRes.json();
    const faq = await faqRes.json();
    const topics = await topicsRes.json();

    const advisorContainer = document.getElementById('companionAdvisorsList');
    const faqContainer = document.getElementById('companionFaqList');
    const topicContainer = document.getElementById('companionTopicsList');

    advisorContainer.innerHTML = '';
    faqContainer.innerHTML = '';
    topicContainer.innerHTML = '';

    advisors.forEach(item => {
      const div = document.createElement('div');
      div.className = 'item';
      div.innerHTML = `
        <div class="item-info">
          <h3>${item.name || item.title || 'Advisor'}</h3>
          <p>${item.title || item.position || ''}</p>
          <p>${item.bio || item.description || ''}</p>
        </div>
      `;
      advisorContainer.appendChild(div);
    });

    faq.forEach(item => {
      const div = document.createElement('div');
      div.className = 'item';
      div.innerHTML = `
        <div class="item-info">
          <h3>${item.question || item.title || 'FAQ'}</h3>
          <p>${item.answer || item.content || ''}</p>
        </div>
      `;
      faqContainer.appendChild(div);
    });

    topics.forEach(item => {
      const div = document.createElement('div');
      div.className = 'item';
      div.innerHTML = `
        <div class="item-info">
          <h3>${item.title || 'Topic'}</h3>
          <p>${item.category || ''}</p>
          <p>${item.preview || item.content || ''}</p>
        </div>
        <div class="item-actions">
          <button class="delete-btn" onclick="deleteCompanionTopic('${item.id}')">Delete</button>
        </div>
      `;
      topicContainer.appendChild(div);
    });
  } catch (error) {
    console.error('Error loading companion content:', error);
  }
}

async function deleteCompanionTopic(id) {
  if (!confirm('Are you sure you want to delete this student question and its replies?')) return;

  try {
    const token = currentUser && typeof currentUser.getIdToken === 'function'
      ? await currentUser.getIdToken()
      : '';

    const response = await fetch(`${API_URL}/companion/topics/${id}`, {
      method: 'DELETE',
      headers: {
        ...(token ? { Authorization: token } : {})
      }
    });

    if (response.ok) {
      loadCompanionContent();
      loadDashboardStats();
      alert('Student question deleted successfully!');
    } else {
      alert('Failed to delete topic');
    }
  } catch (error) {
    console.error('Error deleting topic:', error);
    alert(`Error deleting topic: ${error.message}`);
  }
}

function openModal() {
  document.getElementById('modal').classList.add('show');
  
  document.getElementById('modalForm').onsubmit = async (e) => {
    e.preventDefault();
    
    if (currentForm === 'archive') {
      await handleArchiveSubmit();
    } else if (currentForm === 'gallery') {
      await handleGallerySubmit();
    } else if (currentForm === 'leaders') {
      await handleLeaderSubmit();
    } else if (currentForm === 'documents') {
      await handleDocumentSubmit();
    } else if (currentForm === 'team') {
      await handleTeamSubmit();
    } else if (currentForm === 'past-questions') {
      await handleQuestionSubmit();
    } else if (currentForm === 'newsletter') {
      await handleNewsletterSubmit();
    } else if (currentForm === 'marketplace') {
      await handleMarketplaceSubmit();
    } else if (currentForm === 'departments') {
      await handleDepartmentSubmit();
    } else if (currentForm === 'parliamentarians') {
      await handleParliamentarianSubmit();
    } else if (currentForm === 'social-handles') {
      await handleSocialHandleSubmit();
    }
  };
}

function closeModal() {
  document.getElementById('modal').classList.remove('show');
  document.getElementById('modalForm').reset();
  document.getElementById('modalBody').innerHTML = '';
  currentEditId = null;
  currentEditData = null;
}

// Export functions globally
window.openArchiveForm = openArchiveForm;
window.openGalleryForm = openGalleryForm;
window.openLeaderForm = openLeaderForm;
window.openDocumentForm = openDocumentForm;
window.openTeamForm = openTeamForm;
window.openQuestionForm = openQuestionForm;
window.openNewsletterForm = openNewsletterForm;
window.openMarketplaceForm = openMarketplaceForm;
window.openDepartmentForm = openDepartmentForm;
window.openParliamentarianForm = openParliamentarianForm;
window.openSocialHandleForm = openSocialHandleForm;
window.editArchiveEvent = editArchiveEvent;
window.deleteArchiveEvent = deleteArchiveEvent;
window.editGalleryPhoto = editGalleryPhoto;
window.deleteGalleryPhoto = deleteGalleryPhoto;
window.editLeader = editLeader;
window.deleteLeader = deleteLeader;
window.editDocument = editDocument;
window.deleteDocument = deleteDocument;
window.editTeamMember = editTeamMember;
window.deleteTeamMember = deleteTeamMember;
window.editPastQuestion = editPastQuestion;
window.deletePastQuestion = deletePastQuestion;
// New features exports
window.editNewsletter = editNewsletter;
window.deleteNewsletter = deleteNewsletter;
window.viewNewsletterSubscribers = viewNewsletterSubscribers;
window.editMarketplaceItem = editMarketplaceItem;
window.deleteMarketplaceItem = deleteMarketplaceItem;
window.editDepartment = editDepartment;
window.deleteDepartment = deleteDepartment;
window.editParliamentarian = editParliamentarian;
window.deleteParliamentarian = deleteParliamentarian;
window.editSocialHandle = editSocialHandle;
window.deleteSocialHandle = deleteSocialHandle;
window.deleteCompanionTopic = deleteCompanionTopic;
