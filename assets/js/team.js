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
      console.log('Processing team member:', { id: member.id, name: member.name, photoUrl: member.photoUrl });
      const rawPhotoUrl = member.photoUrl || member.url || member.image || '';
      
      // Validate photo URL
      let photoUrl = '/assets/images/placeholder.svg';
      if (rawPhotoUrl && typeof rawPhotoUrl === 'string' && rawPhotoUrl.trim()) {
        const normalized = window.normalizeMediaUrl(rawPhotoUrl);
        if (normalized && normalized.trim()) {
          photoUrl = normalized;
          console.log('Using photo URL:', photoUrl);
        } else {
          console.warn('Photo URL normalization returned empty:', rawPhotoUrl);
        }
      } else {
        console.warn('No valid photo URL for team member:', member.id, '- using placeholder');
      }
      
      const card = document.createElement('div');
      card.className = 'member-card';
      card.innerHTML = `
        <img src="${photoUrl}" alt="${member.name}" class="member-photo" loading="lazy" onerror="console.warn('Photo failed to load:', '${photoUrl}'); this.onerror=null;this.src='/assets/images/placeholder.svg'">
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
