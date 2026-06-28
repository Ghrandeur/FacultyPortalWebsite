const API_URL = window.API_URL;

async function loadGalleryPhotos() {
  try {
    const response = await fetch(`${API_URL}/gallery`);
    const photos = await response.json();
    
    const container = document.getElementById('galleryContainer');
    container.innerHTML = '';
    
    if (photos.length === 0) {
      container.innerHTML = '<p style="text-align: center; grid-column: 1/-1;">No photos available</p>';
      return;
    }

    photos.forEach(photo => {
      const photoUrl = window.normalizeMediaUrl(photo.photoUrl) || '/assets/images/placeholder.jpg';
      const item = document.createElement('div');
      item.className = 'gallery-item';
      item.innerHTML = `
        <img src="${photoUrl}" alt="${photo.event}" loading="lazy" onerror="this.src='/assets/images/placeholder.jpg'">
        <div class="gallery-caption">
          ${photo.event}
          <a class="details-btn" href="/pages/gallery-detail.html?id=${encodeURIComponent(photo.id)}">View Details</a>
        </div>
      `;
      item.onclick = () => openLightbox(photo.photoUrl, photo.event);
      item.tabIndex = 0;
      item.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openLightbox(photo.photoUrl, photo.event);
        }
      });
      const detailsLink = item.querySelector('.details-btn');
      if (detailsLink) {
        detailsLink.addEventListener('click', (ev) => ev.stopPropagation());
      }
      container.appendChild(item);
    });
  } catch (error) {
    console.error('Error loading gallery:', error);
    document.getElementById('galleryContainer').innerHTML = '<p style="color: red; grid-column: 1/-1;">Error loading photos</p>';
  }
}

function openLightbox(imageUrl, caption) {
  const lightbox = document.getElementById('lightbox');
  const img = lightbox.querySelector('.lightbox-image');
  const cap = lightbox.querySelector('.lightbox-caption');
  
  img.src = imageUrl;
  cap.textContent = caption;
  lightbox.style.display = 'block';
}

document.addEventListener('DOMContentLoaded', () => {
  loadGalleryPhotos();

  const lightbox = document.getElementById('lightbox');
  const closeBtn = lightbox.querySelector('.close');
  
  closeBtn.onclick = () => lightbox.style.display = 'none';
  window.onclick = (event) => {
    if (event.target === lightbox) lightbox.style.display = 'none';
  };
});
