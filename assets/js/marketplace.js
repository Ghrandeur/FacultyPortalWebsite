import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  getDocs,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let itemsData = [];
let currentCategory = "";
let currentSort = "newest";
let savedOnly = false;
let currentView = "grid";
let savedItems = new Set(JSON.parse(localStorage.getItem("facultyMarketplaceSaved") || "[]"));

function getMarketplaceImageUrl(item) {
  const rawImage = item && item.image;
  if (typeof rawImage !== "string") return "";

  const trimmed = rawImage.trim();
  if (!trimmed) return "";

  if (typeof window.normalizeMediaUrl === "function") {
    return window.normalizeMediaUrl(trimmed);
  }

  if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith("/")) {
    return trimmed;
  }

  return `/${trimmed.replace(/^\.?\//, "")}`;
}

async function uploadMarketplaceImage(file) {
  if (!file) return "";

  const formData = new FormData();
  formData.append("image", file);
  formData.append("folder", "marketplace");

  const apiBaseUrl = (window.API_URL || "/api").replace(/\/$/, "");
  const response = await fetch(`${apiBaseUrl}/upload`, {
    method: "POST",
    body: formData,
  });

  let data = {};
  try {
    data = await response.json();
  } catch (error) {
    console.warn("Unable to parse image upload response", error);
  }

  if (!response.ok) {
    throw new Error(data.error || `Image upload failed (${response.status})`);
  }

  return data.url || data.urls?.[0] || "";
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  loadItems();
  setupEventListeners();
});

function openModal(modal) {
  modal.classList.add("show");
  document.body.classList.add("marketplace-modal-open");

  const focusTarget = modal.querySelector("input:not([type='file']), textarea, select") || modal.querySelector("button, a[href]");
  if (focusTarget) {
    window.requestAnimationFrame(() => focusTarget.focus());
  }
}

function closeModal(modal) {
  modal.classList.remove("show");
  if (!document.querySelector(".modal.show")) {
    document.body.classList.remove("marketplace-modal-open");
  }
}

function setupEventListeners() {
  // Upload button
  document.getElementById("uploadItemBtn").addEventListener("click", () => {
    openModal(document.getElementById("uploadModal"));
  });

  // Modal close
  document.querySelectorAll(".modal-close").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      closeModal(e.target.closest(".modal"));
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      const openModalElement = document.querySelector(".modal.show");
      if (openModalElement) closeModal(openModalElement);
    }
  });

  // Upload form
  document.getElementById("uploadForm").addEventListener("submit", handleUploadItem);

  // Filters
  document.getElementById("searchInput").addEventListener("input", displayItems);
  document.getElementById("categoryFilter").addEventListener("change", (e) => {
    currentCategory = e.target.value;
    document.querySelectorAll(".category-chip").forEach((chip) => {
      chip.classList.toggle("active", (chip.dataset.category || "") === currentCategory);
    });
    displayItems();
  });
  document.getElementById("sortFilter").addEventListener("change", (e) => {
    currentSort = e.target.value;
    displayItems();
  });

  document.querySelectorAll(".category-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      currentCategory = chip.dataset.category || "";
      document.getElementById("categoryFilter").value = currentCategory;
      document.querySelectorAll(".category-chip").forEach((item) => item.classList.remove("active"));
      chip.classList.add("active");
      displayItems();
    });
  });

  document.getElementById("savedFilter").addEventListener("click", (event) => {
    savedOnly = !savedOnly;
    event.currentTarget.classList.toggle("active", savedOnly);
    displayItems();
  });

  document.querySelectorAll(".view-btn").forEach((button) => {
    button.addEventListener("click", () => {
      currentView = button.dataset.view;
      document.querySelectorAll(".view-btn").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      document.getElementById("itemsList").classList.toggle("list-view", currentView === "list");
    });
  });

  document.getElementById("itemImage").addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    const preview = document.getElementById("imagePreview");
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { preview.innerHTML = `<img src="${reader.result}" alt="Product preview">`; };
    reader.readAsDataURL(file);
  });
}

async function loadItems() {
  try {
    const q = query(collection(db, "marketplace_items"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    itemsData = [];
    querySnapshot.forEach((doc) => {
      itemsData.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    displayItems();
  } catch (error) {
    console.error("Error loading items:", error);
    document.getElementById("itemsList").innerHTML = "<p>Error loading items</p>";
  }
}

function displayItems() {
  const container = document.getElementById("itemsList");
  const emptyState = document.getElementById("emptyState");
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();

  let filtered = itemsData.filter((item) => {
    const matchesSearch =
      String(item.name || "").toLowerCase().includes(searchTerm) ||
      String(item.description || "").toLowerCase().includes(searchTerm) ||
      String(item.category || "").toLowerCase().includes(searchTerm);
    const matchesCategory = !currentCategory || item.category === currentCategory;
    const matchesSaved = !savedOnly || savedItems.has(item.id);
    return matchesSearch && matchesCategory && matchesSaved;
  });

  // Sort
  if (currentSort === "price-low") {
    filtered.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
  } else if (currentSort === "price-high") {
    filtered.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
  } else if (currentSort === "popular") {
    filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
  }

  document.getElementById("itemCount").textContent = itemsData.length;
  document.getElementById("resultCount").textContent = filtered.length;

  if (filtered.length === 0) {
    container.style.display = "none";
    emptyState.style.display = "flex";
    return;
  }

  container.style.display = "grid";
  emptyState.style.display = "none";
  container.innerHTML = "";

  filtered.forEach((item) => {
    const imageUrl = getMarketplaceImageUrl(item);
    const card = document.createElement("div");
    card.className = "item-card";
    const saved = savedItems.has(item.id);
    card.innerHTML = `
      <div class="item-image">
        ${imageUrl ? `<img src="${imageUrl}" alt="${escapeHtml(item.name)}" loading="lazy" onerror="this.onerror=null;this.src='/assets/images/placeholder.svg';">` : '<i class="fa-solid fa-box-open"></i>'}
        <button class="save-item-btn ${saved ? "saved" : ""}" type="button" aria-label="${saved ? "Remove from saved items" : "Save item"}"><i class="${saved ? "fa-solid" : "fa-regular"} fa-heart"></i></button>
        <span class="item-category-badge">${escapeHtml(item.category || "other")}</span>
      </div>
      <div class="item-content">
        <h3 class="item-title">${escapeHtml(item.name)}</h3>
        <p class="item-description">${escapeHtml(item.description)}</p>
        <div class="item-footer">
          <div class="item-price">₦${Number(item.price || 0).toLocaleString()}</div>
          <button class="item-contact-btn"><i class="fa-solid fa-comment-dots"></i> Contact</button>
        </div>
      </div>
    `;

    card.querySelector(".save-item-btn").addEventListener("click", (event) => {
      event.stopPropagation();
      if (savedItems.has(item.id)) savedItems.delete(item.id);
      else savedItems.add(item.id);
      localStorage.setItem("facultyMarketplaceSaved", JSON.stringify([...savedItems]));
      displayItems();
    });

    card.querySelector(".item-contact-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      openItemDetail(item);
    });

    card.addEventListener("click", () => openItemDetail(item));
    container.appendChild(card);
  });
}

async function handleUploadItem(e) {
  e.preventDefault();

  const name = document.getElementById("itemName").value.trim();
  const category = document.getElementById("itemCategory").value;
  const price = parseFloat(document.getElementById("itemPrice").value);
  const description = document.getElementById("itemDescription").value.trim();
  const phone = document.getElementById("contactPhone").value.trim();
  const whatsapp = document.getElementById("contactWhatsApp").value.trim();

  if (!name || !category || !price || !description || !phone) {
    document.getElementById("uploadError").textContent = "Please fill all required fields";
    document.getElementById("uploadError").style.display = "block";
    return;
  }

  const submitButton = document.querySelector("#uploadForm .upload-submit-btn");
  const imageFile = document.getElementById("itemImage").files?.[0] || null;

  try {
    let imageUrl = "";
    if (imageFile) {
      submitButton.disabled = true;
      submitButton.textContent = "Uploading image...";
      imageUrl = await uploadMarketplaceImage(imageFile);
    }

    await addDoc(collection(db, "marketplace_items"), {
      name,
      category,
      price,
      description,
      contactPhone: phone,
      contactWhatsApp: whatsapp || null,
      image: imageUrl || null,
      views: 0,
      createdAt: serverTimestamp(),
    });

    alert("Item uploaded successfully!");
    document.getElementById("uploadForm").reset();
    document.getElementById("imagePreview").innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i><span>Add a clear product photo</span>';
    closeModal(document.getElementById("uploadModal"));
    loadItems();
  } catch (error) {
    console.error("Error uploading item:", error);
    document.getElementById("uploadError").textContent = error.message || "Error uploading item. Please try again.";
    document.getElementById("uploadError").style.display = "block";
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "Upload Item";
    }
  }
}

function openItemDetail(item) {
  const modal = document.getElementById("itemModal");
  const modalBody = document.getElementById("modalBody");
  const imageUrl = getMarketplaceImageUrl(item);

  let contactButtons = `
    <div class="contact-seller">
      <h3>Contact Seller</h3>
  `;

  if (item.contactPhone) {
    contactButtons += `
      <div class="contact-method">
        <i class="fa-solid fa-phone"></i>
        <a href="tel:${item.contactPhone}">${item.contactPhone}</a>
      </div>
    `;
  }

  if (item.contactWhatsApp) {
    contactButtons += `
      <div class="contact-method">
        <i class="fa-brands fa-whatsapp"></i>
        <a href="https://wa.me/${item.contactWhatsApp}" target="_blank">WhatsApp: ${item.contactWhatsApp}</a>
      </div>
    `;
  }

  contactButtons += `</div>`;

  modalBody.innerHTML = `
    <div class="item-detail">
      <div class="item-detail-image">
        ${imageUrl ? `<img src="${imageUrl}" alt="${escapeHtml(item.name)}" loading="lazy" onerror="this.onerror=null;this.src='/assets/images/placeholder.svg';">` : '<i class="fa-solid fa-image"></i>'}
      </div>
      <div class="item-detail-header">
        <h2>${escapeHtml(item.name)}</h2>
        <span class="item-category-badge">${item.category}</span>
        <div class="item-detail-price">₦${item.price.toLocaleString()}</div>
      </div>
      <div class="item-detail-description">${escapeHtml(item.description)}</div>
      ${contactButtons}
    </div>
  `;

  openModal(modal);
}

function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Close modals
document.querySelectorAll(".modal").forEach((modal) => {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal(modal);
    }
  });
});
