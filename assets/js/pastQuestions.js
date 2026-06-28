const API_URL = 'http://localhost:5000/api';
let allResources = [];

async function loadResources() {
  try {
    const response = await fetch(`${API_URL}/past-questions`);
    allResources = await response.json();
    
    displayResources(allResources);
    populateSubjectFilter();
  } catch (error) {
    console.error('Error loading resources:', error);
    document.getElementById('questionsContainer').innerHTML = '<p style="color: red; grid-column: 1/-1;">Error loading resources</p>';
  }
}

function displayResources(resources) {
  const container = document.getElementById('questionsContainer');
  container.innerHTML = '';
  
  if (resources.length === 0) {
    container.innerHTML = '<p style="text-align: center;">No resources found</p>';
    return;
  }

  resources.forEach(resource => {
    const item = document.createElement('div');
    item.className = 'question-item';
    item.innerHTML = `
      <div class="question-info">
        <h3><i class="fa-solid fa-file-pdf"></i> ${resource.fileName}</h3>
        <p><strong>Subject:</strong> ${resource.subject}</p>
        <p><strong>Level:</strong> ${resource.semester}</p>
        <p>${resource.description}</p>
      </div>
      <div class="question-actions">
        <a href="${resource.fileUrl}" target="_blank" class="download-btn">
          <i class="fa-solid fa-download"></i> Download
        </a>
      </div>
    `;
    container.appendChild(item);
  });
}

function populateSubjectFilter() {
  const subjects = [...new Set(allResources.map(r => r.subject))];
  const filter = document.getElementById('subjectFilter');
  
  subjects.forEach(subject => {
    const option = document.createElement('option');
    option.value = subject;
    option.textContent = subject;
    filter.appendChild(option);
  });
}

function filterResources() {
  const subject = document.getElementById('subjectFilter').value;
  const semester = document.getElementById('semesterFilter').value;
  
  let filtered = allResources;
  
  if (subject) {
    filtered = filtered.filter(r => r.subject === subject);
  }
  if (semester) {
    filtered = filtered.filter(r => r.semester === semester);
  }
  
  displayResources(filtered);
}

document.addEventListener('DOMContentLoaded', () => {
  loadResources();

  const subjectFilter = document.getElementById('subjectFilter');
  const semesterFilter = document.getElementById('semesterFilter');
  
  if (subjectFilter) subjectFilter.addEventListener('change', filterResources);
  if (semesterFilter) semesterFilter.addEventListener('change', filterResources);
});
