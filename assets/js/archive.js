const API_URL = window.API_URL;

function archiveDateLabel(value) {
  if (!value) return 'Date not available';
  let date;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    date = new Date(year, month - 1, day);
  } else if (value._seconds) {
    date = new Date(value._seconds * 1000);
  } else if (value.seconds) {
    date = new Date(value.seconds * 1000);
  } else {
    date = new Date(value);
  }
  return isNaN(date.getTime()) ? 'Date not available' : date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

function escapeArchiveHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

function archiveParagraphHtml(text) {
  const safe = escapeArchiveHtml(text).trim();
  if (!safe) return '';
  return safe.split(/\n\s*\n/).filter(Boolean).map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
}

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
          <h3>${escapeArchiveHtml(event.title || 'Untitled event')}</h3>
          <p class="archive-card-date"><i class="fa-solid fa-calendar-days"></i> ${archiveDateLabel(event.date)}</p>
          <div class="archive-card-copy">${archiveParagraphHtml(event.description)}</div>
          <div class="archive-actions">
            <button type="button" class="read-more-btn">Read More</button>
            <a class="details-btn" href="/pages/archive-detail?id=${encodeURIComponent(event.id)}">View Details</a>
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

  const date = document.createElement('p');
  date.className = 'archive-card-date';
  date.innerHTML = `<i class="fa-solid fa-calendar-days"></i> ${archiveDateLabel(event.date)}`;
  modalBody.appendChild(date);

  if (event.description) {
    const description = document.createElement('div');
    description.className = 'archive-modal-copy';
    description.innerHTML = archiveParagraphHtml(event.description);
    modalBody.appendChild(description);
  }

  if (event.content) {
    const content = document.createElement('div');
    content.className = 'archive-modal-copy';
    content.innerHTML = archiveParagraphHtml(event.content);
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
