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

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  loadItems();
  setupEventListeners();
});

function setupEventListeners() {
  // Upload button
  document.getElementById("uploadItemBtn").addEventListener("click", () => {
    document.getElementById("uploadModal").classList.add("show");
  });

  // Modal close
  document.querySelectorAll(".modal-close").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.target.closest(".modal").classList.remove("show");
    });
  });

  // Upload form
  document.getElementById("uploadForm").addEventListener("submit", handleUploadItem);

  // Filters
  document.getElementById("searchInput").addEventListener("input", displayItems);
  document.getElementById("categoryFilter").addEventListener("change", (e) => {
    currentCategory = e.target.value;
    displayItems();
  });
  document.getElementById("sortFilter").addEventListener("change", (e) => {
    currentSort = e.target.value;
    displayItems();
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
      item.name.toLowerCase().includes(searchTerm) ||
      item.description.toLowerCase().includes(searchTerm);
    const matchesCategory = !currentCategory || item.category === currentCategory;
    return matchesSearch && matchesCategory;
  });

  // Sort
  if (currentSort === "price-low") {
    filtered.sort((a, b) => a.price - b.price);
  } else if (currentSort === "price-high") {
    filtered.sort((a, b) => b.price - a.price);
  } else if (currentSort === "popular") {
    filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
  }

  if (filtered.length === 0) {
    container.style.display = "none";
    emptyState.style.display = "flex";
    return;
  }

  container.style.display = "grid";
  emptyState.style.display = "none";
  container.innerHTML = "";

  filtered.forEach((item) => {
    const card = document.createElement("div");
    card.className = "item-card";
    card.innerHTML = `
      <div class="item-image">
        ${item.image ? `<img src="${item.image}" alt="${escapeHtml(item.name)}">` : '<i class="fa-solid fa-image"></i>'}
      </div>
      <div class="item-content">
        <span class="item-category-badge">${item.category}</span>
        <h3 class="item-title">${escapeHtml(item.name)}</h3>
        <p class="item-description">${escapeHtml(item.description)}</p>
        <div class="item-footer">
          <div class="item-price">₦${item.price.toLocaleString()}</div>
          <button class="item-contact-btn">Contact</button>
        </div>
      </div>
    `;

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

  try {
    await addDoc(collection(db, "marketplace_items"), {
      name,
      category,
      price,
      description,
      contactPhone: phone,
      contactWhatsApp: whatsapp || null,
      image: null,
      views: 0,
      createdAt: serverTimestamp(),
    });

    alert("Item uploaded successfully!");
    document.getElementById("uploadForm").reset();
    document.getElementById("uploadModal").classList.remove("show");
    loadItems();
  } catch (error) {
    console.error("Error uploading item:", error);
    document.getElementById("uploadError").textContent = "Error uploading item. Please try again.";
    document.getElementById("uploadError").style.display = "block";
  }
}

function openItemDetail(item) {
  const modal = document.getElementById("itemModal");
  const modalBody = document.getElementById("modalBody");

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
        ${item.image ? `<img src="${item.image}" alt="${escapeHtml(item.name)}">` : '<i class="fa-solid fa-image"></i>'}
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

  modal.classList.add("show");
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
      modal.classList.remove("show");
    }
  });
});
