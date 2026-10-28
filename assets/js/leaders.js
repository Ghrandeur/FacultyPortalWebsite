const API_URL = window.API_URL;
let activeAdministration = '2026-2027';
let leadersData = [];

async function loadLeaders() {
  try {
    const response = await fetch(`${API_URL}/leaders`);
    leadersData = await response.json();
    displayLeaders();
  } catch (error) {
    console.error('Error loading leaders:', error);
    document.getElementById('leadersContainer').innerHTML = '<p style="color: red; grid-column: 1/-1;">Error loading leaders</p>';
  }
}

function displayLeaders() {
  const container = document.getElementById('leadersContainer');
  container.innerHTML = '';
  const leaders = leadersData.filter(leader => (leader.administration || 'past') === activeAdministration);

  if (leaders.length === 0) {
    container.innerHTML = activeAdministration === '2026-2027'
      ? '<p style="text-align: center; grid-column: 1/-1;">No leaders have been added to the 2026–2027 administration yet.</p>'
      : '<p style="text-align: center; grid-column: 1/-1;">No past administration leaders found.</p>';
    return;
  }

  leaders.forEach(leader => {
    const rawPhotoUrl = leader.photoUrl || leader.url || leader.image || '';
    let photoUrl = '/assets/images/placeholder.svg';
    if (rawPhotoUrl && typeof rawPhotoUrl === 'string' && rawPhotoUrl.trim()) {
      const normalized = window.normalizeMediaUrl(rawPhotoUrl);
      if (normalized && normalized.trim()) photoUrl = normalized;
    }
    const escapedName = (leader.name || 'Leader').replace(/['"`<>]/g, '');
    const card = document.createElement('div');
    card.className = 'member-card';
    card.innerHTML = `
      <img src="${photoUrl}" alt="${escapedName}" class="member-photo" loading="lazy" onerror="this.onerror=null;this.src='/assets/images/placeholder.svg'">
      <div class="member-info">
        <h3>${leader.name}</h3>
        <p>${leader.department}</p>
        <p class="member-position">${leader.position}</p>
        <a class="details-btn" href="/pages/leaders-detail?id=${encodeURIComponent(leader.id)}">View Details</a>
      </div>`;
    container.appendChild(card);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.administration-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.administration-tab').forEach(item => {
        item.classList.remove('active');
        item.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      activeAdministration = tab.dataset.administration;
      displayLeaders();
    });
  });
  loadLeaders();
});
