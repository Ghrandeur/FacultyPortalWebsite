const API_URL = window.API_URL;

async function loadTeamMembers() {
  try {
    const response = await fetch(`${API_URL}/team`);
    const members = await response.json();
    
    const container = document.getElementById('teamContainer');
    container.innerHTML = '';
    
    if (members.length === 0) {
      container.innerHTML = '<p style="text-align: center; grid-column: 1/-1;">No team members found</p>';
      return;
    }

    members.forEach(member => {
      const card = document.createElement('div');
      card.className = 'member-card';
      card.innerHTML = `
        <img src="${member.photoUrl}" alt="${member.name}" class="member-photo" onerror="this.src='/assets/images/placeholder.jpg'">
        <div class="member-info">
          <h3>${member.name}</h3>
          <p>${member.department}</p>
          <p class="member-position">${member.position}</p>
          <a class="details-btn" href="/pages/team-detail.html?id=${encodeURIComponent(member.id)}">View Details</a>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (error) {
    console.error('Error loading team:', error);
    document.getElementById('teamContainer').innerHTML = '<p style="color: red; grid-column: 1/-1;">Error loading team members</p>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadTeamMembers();
});
