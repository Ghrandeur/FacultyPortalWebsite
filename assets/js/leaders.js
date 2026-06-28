const API_URL = window.API_URL;

async function loadLeaders() {
  try {
    const response = await fetch(`${API_URL}/leaders`);
    const leaders = await response.json();
    
    const container = document.getElementById('leadersContainer');
    container.innerHTML = '';
    
    if (leaders.length === 0) {
      container.innerHTML = '<p style="text-align: center; grid-column: 1/-1;">No leaders found</p>';
      return;
    }

    leaders.forEach(leader => {
      const card = document.createElement('div');
      card.className = 'member-card';
      card.innerHTML = `
        <img src="${leader.photoUrl || '/assets/images/placeholder.svg'}" alt="${leader.name}" class="member-photo" onerror="this.onerror=null;this.src='/assets/images/placeholder.svg'">
        <div class="member-info">
          <h3>${leader.name}</h3>
          <p>${leader.department}</p>
          <p class="member-position">${leader.position}</p>
          <a class="details-btn" href="/pages/leaders-detail.html?id=${encodeURIComponent(leader.id)}">View Details</a>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (error) {
    console.error('Error loading leaders:', error);
    document.getElementById('leadersContainer').innerHTML = '<p style="color: red; grid-column: 1/-1;">Error loading leaders</p>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadLeaders();
});
