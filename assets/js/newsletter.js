import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  getDocs,
  deleteDoc,
  doc,
  writeBatch,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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
      if (email) {
        // Delete from newsletter_subscribers collection
        const q = query(collection(db, "newsletter_subscribers"), where("email", "==", email));
        const docs = await getDocs(q);
        const batch = writeBatch(db);

        docs.forEach((d) => {
          batch.delete(d.ref);
        });

        await batch.commit();
        alert("You have been unsubscribed from our newsletter");
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Error unsubscribing:", error);
    }
  }
});

async function loadNewsletters() {
  try {
    const q = query(collection(db, "newsletters"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    newslettersData = [];
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
      <div class="newsletter-item-preview">${escapeHtml(newsletter.preview || newsletter.content.substring(0, 150))}...</div>
      <div class="newsletter-item-meta">
        <span><i class="fa-solid fa-calendar"></i> ${formatDate(newsletter.createdAt?.toDate())}</span>
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
    <p><small>${formatDate(newsletter.createdAt?.toDate())}</small></p>
    <div style="margin-top: 16px; line-height: 1.8;">
      ${newsletter.content}
    </div>
  `;

  modal.classList.add("show");
}

function formatDate(date) {
  if (!date) return "N/A";
  return date.toLocaleDateString("en-US", {
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
