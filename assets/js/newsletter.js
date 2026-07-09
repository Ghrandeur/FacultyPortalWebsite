import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  getDocs,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";
import { API_URL as CONFIG_API_URL } from "./api-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const API_URL = window.API_URL || CONFIG_API_URL || 'http://localhost:5000/api';

let currentFilter = "all";
let newslettersData = [];

// Load newsletters on page load
document.addEventListener("DOMContentLoaded", loadNewsletters);

// Filter button listeners
document.querySelectorAll(".filter-btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
    e.target.classList.add("active");
    currentFilter = e.target.dataset.filter;
    displayNewsletters();
  });
});

// Modal close button
document.querySelector(".modal-close").addEventListener("click", () => {
  document.getElementById("newsletterModal").classList.remove("show");
});

// Unsubscribe button
document.getElementById("unsubscribeBtn").addEventListener("click", async () => {
  if (confirm("Are you sure you want to unsubscribe from our newsletter?")) {
    try {
      const email = localStorage.getItem("subscriberEmail");
      if (!email) {
        alert("Email not found. Please try again.");
        return;
      }

      const response = await fetch(`${API_URL}/newsletter/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert("You have been unsubscribed from our newsletter");
        localStorage.removeItem("subscriberEmail");
        window.location.href = "/";
      } else {
        alert(data.error || "Error unsubscribing. Please try again.");
      }
    } catch (error) {
      console.error("Error unsubscribing:", error);
      alert("Error unsubscribing. Please try again.");
    }
  }
});

async function loadNewsletters() {
  try {
    // Prefer backend API (admin-created newsletters) if available
    newslettersData = [];
    if (API_URL) {
      try {
        const res = await fetch(`${API_URL}/newsletter/all`);
        if (res.ok) {
          const list = await res.json();
          newslettersData = Array.isArray(list) ? list : [];
          displayNewsletters();
          const email = localStorage.getItem("subscriberEmail");
          if (email) document.getElementById("unsubscribeBtn").style.display = "inline-block";
          return;
        }
        console.warn('Failed to fetch newsletters from API, falling back to Firestore');
      } catch (err) {
        console.warn('Error fetching newsletters from API, falling back to Firestore', err);
      }
    }

    // Fallback: load directly from Firestore
    const q = query(collection(db, "newsletters"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((doc) => {
      newslettersData.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    displayNewsletters();

    // Show unsubscribe button if user is a subscriber
    const email = localStorage.getItem("subscriberEmail");
    if (email) {
      document.getElementById("unsubscribeBtn").style.display = "inline-block";
    }
  } catch (error) {
    console.error("Error loading newsletters:", error);
    document.getElementById("newsletterList").innerHTML =
      "<p>Error loading newsletters. Please try again.</p>";
  }
}

function displayNewsletters() {
  const listContainer = document.getElementById("newsletterList");
  const emptyState = document.getElementById("emptyState");

  let filtered = newslettersData;
  if (currentFilter !== "all") {
    filtered = newslettersData.filter((nl) => nl.category === currentFilter);
  }

  if (filtered.length === 0) {
    listContainer.style.display = "none";
    emptyState.style.display = "flex";
    return;
  }

  listContainer.style.display = "flex";
  emptyState.style.display = "none";
  listContainer.innerHTML = "";

  filtered.forEach((newsletter) => {
    const item = document.createElement("div");
    item.className = "newsletter-item";
    item.innerHTML = `
      <div class="newsletter-item-header">
        <h3>${escapeHtml(newsletter.title)}</h3>
      </div>
      <span class="newsletter-category-badge">${newsletter.category || "General"}</span>
      <div class="newsletter-item-preview">${escapeHtml(newsletter.preview || (newsletter.content || '').substring(0, 150))}...</div>
      <div class="newsletter-item-meta">
        <span><i class="fa-solid fa-calendar"></i> ${formatDate(newsletter.createdAt)}</span>
        <span><i class="fa-solid fa-envelope"></i> Newsletter</span>
      </div>
    `;

    item.addEventListener("click", () => openNewsletterDetail(newsletter));
    listContainer.appendChild(item);
  });
}

function openNewsletterDetail(newsletter) {
  const modal = document.getElementById("newsletterModal");
  const modalBody = document.getElementById("modalBody");

  modalBody.innerHTML = `
    <h2>${escapeHtml(newsletter.title)}</h2>
    <span class="newsletter-category-badge">${newsletter.category || "General"}</span>
    <p><small>${formatDate(newsletter.createdAt)}</small></p>
    <div style="margin-top: 16px; line-height: 1.8;">
      ${newsletter.content}
    </div>
  `;

  modal.classList.add("show");
}

function formatDate(date) {
  if (!date) return "N/A";
  // Support Firestore timestamp objects returned from backend or client
  let d = null;
  try {
    if (date && typeof date === 'object' && typeof date.seconds === 'number') {
      d = new Date(date.seconds * 1000);
    } else if (date && typeof date.toDate === 'function') {
      d = date.toDate();
    } else {
      d = new Date(date);
    }
  } catch (e) {
    return 'N/A';
  }
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Close modal when clicking outside
document.getElementById("newsletterModal").addEventListener("click", (e) => {
  if (e.target.id === "newsletterModal") {
    e.target.classList.remove("show");
  }
});
