const API_URL = window.API_URL;

async function loadFacultyInfo() {
  try {
    const response = await fetch(`${API_URL}/faculty`);
    const data = await response.json();
    
    const container = document.getElementById('facultyContent');
    
    if (!data.content) {
      container.innerHTML = '<p>Faculty information not available. Please check back later.</p>';
      return;
    }

    container.innerHTML = `
      <div class="faculty-text">
        ${data.history ? `<h3>History</h3><p>${data.history}</p>` : ''}
        ${data.mission ? `<h3>Mission</h3><p>${data.mission}</p>` : ''}
        ${data.vision ? `<h3>Vision</h3><p>${data.vision}</p>` : ''}
        <h3>About</h3>
        <p>${data.content}</p>
      </div>
    `;
  } catch (error) {
    console.error('Error loading faculty info:', error);
    document.getElementById('facultyContent').innerHTML = '<p style="color: red;">Error loading faculty information</p>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadFacultyInfo();
});
