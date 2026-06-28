const API_URL = window.API_URL;
let allDocuments = [];

async function loadDocuments() {
  try {
    const response = await fetch(`${API_URL}/documents`);
    allDocuments = await response.json();
    
    displayDocuments(allDocuments);
  } catch (error) {
    console.error('Error loading documents:', error);
    document.getElementById('documentsContainer').innerHTML = '<p style="color: red; grid-column: 1/-1;">Error loading documents</p>';
  }
}

function displayDocuments(documents) {
  const container = document.getElementById('documentsContainer');
  container.innerHTML = '';
  
  if (documents.length === 0) {
    container.innerHTML = '<p style="text-align: center;">No documents found</p>';
    return;
  }

  documents.forEach(doc => {
    const item = document.createElement('div');
    item.className = 'document-item';
    item.innerHTML = `
      <div class="document-info">
        <h3><i class="fa-solid fa-file-pdf"></i> ${doc.fileName}</h3>
        <p><strong>Category:</strong> ${doc.category}</p>
        <p>${doc.description}</p>
      </div>
      <div class="document-actions">
        <a href="/pages/documents-detail.html?id=${encodeURIComponent(doc.id)}" class="details-btn">
          <i class="fa-solid fa-arrow-right"></i> View Details
        </a>
        <a href="${doc.fileUrl}" target="_blank" class="download-btn">
          <i class="fa-solid fa-download"></i> Download
        </a>
      </div>
    `;
    container.appendChild(item);
  });
}

function filterByCategory(category) {
  if (!category) {
    displayDocuments(allDocuments);
  } else {
    const filtered = allDocuments.filter(doc => doc.category === category);
    displayDocuments(filtered);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadDocuments();

  const filter = document.getElementById('categoryFilter');
  if (filter) {
    filter.addEventListener('change', (e) => filterByCategory(e.target.value));
  }
});
