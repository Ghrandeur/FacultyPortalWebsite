const API_URL = 'http://localhost:5000/api';
let currentUser = null;
let currentForm = null;

// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  setupEventListeners();
  loadDashboardStats();
});

function checkAuth() {
  if (!window.firebaseAuth || typeof window.firebaseAuth.onAuthStateChanged !== 'function') {
    window.location.href = 'login.html';
    return;
  }

  window.firebaseAuth.onAuthStateChanged((user) => {
    if (!user) {
      window.location.href = 'login.html';
      return;
    }
    currentUser = user;
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
    window.firebaseAuth.signOut().then(() => {
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
  }
}

async function loadDashboardStats() {
  try {
    const archive = await fetch(`${API_URL}/archive`).then(r => r.json());
    const gallery = await fetch(`${API_URL}/gallery`).then(r => r.json());
    const leaders = await fetch(`${API_URL}/leaders`).then(r => r.json());
    const documents = await fetch(`${API_URL}/documents`).then(r => r.json());

    document.getElementById('archiveCount').textContent = archive.length;
    document.getElementById('galleryCount').textContent = gallery.length;
    document.getElementById('leadersCount').textContent = leaders.length;
    document.getElementById('docsCount').textContent = documents.length;
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

async function handleArchiveSubmit() {
  const title = document.getElementById('archiveTitle').value;
  const description = document.getElementById('archiveDescription').value;
  const fileInput = document.getElementById('archiveImageFile');
  const content = document.getElementById('archiveContent').value;

  try {
    let imageUrl = '';
    if (fileInput && fileInput.files && fileInput.files[0]) {
      imageUrl = await uploadImageToStorage(fileInput.files[0], 'archive');
    }

    const response = await fetch(`${API_URL}/archive`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': await currentUser.getIdToken()
      },
      body: JSON.stringify({ title, description, image: imageUrl, content })
    });

    if (response.ok) {
      closeModal();
      loadArchiveEvents();
      loadDashboardStats();
      alert('Event added successfully!');
    } else {
      alert('Error adding event');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error adding event');
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
          <button class="delete-btn" onclick="deleteGalleryPhoto('${photo.id}')">Delete</button>
        </div>
      `;
      container.appendChild(item);
    });
  } catch (error) {
    console.error('Error loading gallery:', error);
  }
}

async function uploadImageToStorage(file, folderName) {
  if (!file) {
    return '';
  }

  const formData = new FormData();
  formData.append('folder', folderName);
  formData.append('image', file);

  const response = await fetch(`${API_URL}/upload`, {
    method: 'POST',
    headers: {
      'Authorization': currentUser && typeof currentUser.getIdToken === 'function' ? await currentUser.getIdToken() : ''
    },
    body: formData
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Image upload failed');
  }

  const data = await response.json();
  return data.url || '';
}

function openGalleryForm() {
  currentForm = 'gallery';
  const modalBody = document.getElementById('modalBody');
  modalBody.innerHTML = `
    <h3>Add Photo</h3>
    <div class="form-group">
      <label for="galleryEvent">Event Name</label>
      <input type="text" id="galleryEvent" placeholder="Event name" required>
    </div>
    <div class="form-group">
      <label for="galleryPhotoFile">Upload Image From Device</label>
      <input type="file" id="galleryPhotoFile" accept="image/*" required>
    </div>
    <div class="form-group">
      <label for="galleryDescription">Description</label>
      <input type="text" id="galleryDescription" placeholder="Photo description">
    </div>
  `;
  openModal();
}

async function handleGallerySubmit() {
  const event = document.getElementById('galleryEvent').value;
  const fileInput = document.getElementById('galleryPhotoFile');
  const description = document.getElementById('galleryDescription').value;

  try {
    const photoUrl = await uploadImageToStorage(fileInput.files[0], 'gallery');

    const response = await fetch(`${API_URL}/gallery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': await currentUser.getIdToken()
      },
      body: JSON.stringify({ photoUrl, event, description })
    });

    if (response.ok) {
      closeModal();
      loadGalleryPhotos();
      loadDashboardStats();
      alert('Photo added successfully!');
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

async function handleLeaderSubmit() {
  const name = document.getElementById('leaderName').value;
  const department = document.getElementById('leaderDepartment').value;
  const position = document.getElementById('leaderPosition').value;
  const fileInput = document.getElementById('leaderPhotoFile');

  try {
    const photoUrl = await uploadImageToStorage(fileInput.files[0], 'leaders');

    const response = await fetch(`${API_URL}/leaders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': await currentUser.getIdToken()
      },
      body: JSON.stringify({ name, department, position, photoUrl })
    });

    if (response.ok) {
      closeModal();
      loadLeaders();
      loadDashboardStats();
      alert('Leader added successfully!');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error adding leader');
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

async function handleDocumentSubmit() {
  const fileName = document.getElementById('documentName').value;
  const category = document.getElementById('documentCategory').value;
  const fileUrl = document.getElementById('documentUrl').value;
  const description = document.getElementById('documentDescription').value;

  try {
    const response = await fetch(`${API_URL}/documents`, {
      method: 'POST',
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

async function handleTeamSubmit() {
  const name = document.getElementById('teamName').value;
  const department = document.getElementById('teamDepartment').value;
  const position = document.getElementById('teamPosition').value;
  const fileInput = document.getElementById('teamPhotoFile');

  try {
    const photoUrl = await uploadImageToStorage(fileInput.files[0], 'team');

    const response = await fetch(`${API_URL}/team`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': await currentUser.getIdToken()
      },
      body: JSON.stringify({ name, department, position, photoUrl })
    });

    if (response.ok) {
      closeModal();
      loadTeamMembers();
      loadDashboardStats();
      alert('Team member added successfully!');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error adding team member');
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

async function handleQuestionSubmit() {
  const fileName = document.getElementById('questionName').value;
  const subject = document.getElementById('questionSubject').value;
  const semester = document.getElementById('questionSemester').value;
  const fileUrl = document.getElementById('questionUrl').value;
  const description = document.getElementById('questionDescription').value;

  try {
    const response = await fetch(`${API_URL}/past-questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': await currentUser.getIdToken()
      },
      body: JSON.stringify({ fileName, fileUrl, subject, semester, description })
    });

    if (response.ok) {
      closeModal();
      loadPastQuestions();
      loadDashboardStats();
      alert('Resource uploaded successfully!');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error uploading resource');
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

// ===== MODAL FUNCTIONS =====
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
    }
  };
}

function closeModal() {
  document.getElementById('modal').classList.remove('show');
  document.getElementById('modalForm').reset();
  document.getElementById('modalBody').innerHTML = '';
}
