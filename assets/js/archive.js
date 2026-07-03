const API_URL = window.API_URL;

async function loadArchiveEvents() {
  try {
    const response = await fetch(`${API_URL}/archive`);
    const events = await response.json();

    const container = document.getElementById('archiveContainer');
    if (!container) return;
    container.innerHTML = '';

    if (!Array.isArray(events) || events.length === 0) {
      container.innerHTML = '<p style="text-align: center; grid-column: 1/-1; color: var(--text-light);">No events found</p>';
      return;
    }

    events.forEach((event) => {
      console.log('Processing archive event:', { id: event.id, title: event.title, image: event.image });
      const rawImageUrl = event.image;
      
      // Validate image URL
      let imageUrl = '/assets/images/placeholder.svg';
      if (rawImageUrl && typeof rawImageUrl === 'string' && rawImageUrl.trim()) {
        const normalized = window.normalizeMediaUrl(rawImageUrl);
        if (normalized && normalized.trim()) {
          imageUrl = normalized;
          console.log('Using image URL:', imageUrl);
        } else {
          console.warn('Image URL normalization returned empty:', rawImageUrl);
        }
      } else {
        console.warn('No valid image URL for event:', event.id, '- using placeholder');
      }
      
      const card = document.createElement('div');
      card.className = 'event-card';
      card.innerHTML = `
        <img src="${imageUrl}" alt="${event.title || 'Archive event'}" loading="lazy" onerror="console.warn('Image failed to load:', '${imageUrl}'); this.onerror=null;this.src='/assets/images/placeholder.svg';">
        <div class="event-card-content">
          <h3>${event.title || 'Untitled event'}</h3>
          <p>${(event.description || '').replace(/\n/g, '<br>')}</p>
          <div class="archive-actions">
            <button type="button" class="read-more-btn">Read More</button>
            <a class="details-btn" href="/pages/archive-detail.html?id=${encodeURIComponent(event.id)}">View Details</a>
          </div>
        </div>
      `;

      card.querySelector('.read-more-btn').addEventListener('click', () => showFullEvent(event));
      container.appendChild(card);
    });
  } catch (error) {
    console.error('Error loading archive:', error);
    const container = document.getElementById('archiveContainer');
    if (container) {
      container.innerHTML = '<p style="color: red; grid-column: 1/-1;">Error loading events</p>';
    }
  }
}

function showFullEvent(event) {
  const modal = document.getElementById('eventModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');

  if (!modal || !modalTitle || !modalBody) return;

  modalTitle.textContent = event.title || 'Archive Event';
  modalBody.innerHTML = '';

  if (event.description) {
    const description = document.createElement('p');
    description.textContent = event.description;
    modalBody.appendChild(description);
  }

  if (event.content) {
    const content = document.createElement('p');
    content.textContent = event.content;
    modalBody.appendChild(content);
  }

  modal.style.display = 'block';
}

document.addEventListener('DOMContentLoaded', () => {
  loadArchiveEvents();

  const modal = document.getElementById('eventModal');
  const closeBtn = modal?.querySelector('.close');
  if (closeBtn) {
    closeBtn.onclick = () => {
      modal.style.display = 'none';
    };
  }

  window.onclick = (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  };
});
