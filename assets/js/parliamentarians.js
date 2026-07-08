import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  getDocs,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let parliamentariansData = [];

// Load parliamentarians on page load
document.addEventListener("DOMContentLoaded", loadParliamentarians);

// Modal close button
document.querySelector(".modal-close").addEventListener("click", () => {
  document.getElementById("parliamentarianModal").classList.remove("show");
});

// Close modal when clicking outside
document.getElementById("parliamentarianModal").addEventListener("click", (e) => {
  if (e.target.id === "parliamentarianModal") {
    e.target.classList.remove("show");
  }
});

async function loadParliamentarians() {
  try {
    const q = query(collection(db, "parliamentarians"), orderBy("order", "asc"));
    const querySnapshot = await getDocs(q);

    parliamentariansData = [];
    querySnapshot.forEach((doc) => {
      parliamentariansData.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    displayParliamentarians();
  } catch (error) {
    console.error("Error loading parliamentarians:", error);
    document.getElementById("parliamentariansList").innerHTML =
      "<p>Error loading parliamentarians. Please try again.</p>";
  }
}

function displayParliamentarians() {
  const container = document.getElementById("parliamentariansList");
  const emptyState = document.getElementById("emptyState");

  if (parliamentariansData.length === 0) {
    container.style.display = "none";
    emptyState.style.display = "flex";
    return;
  }

  container.style.display = "grid";
  emptyState.style.display = "none";
  container.innerHTML = "";

  parliamentariansData.forEach((parl) => {
    const card = document.createElement("div");
    card.className = "parliamentarian-card";
    card.innerHTML = `
      <div class="parl-image-section">
        ${parl.image ? `<img src="${parl.image}" alt="${escapeHtml(parl.name)}">` : '<i class="fa-solid fa-user parl-image-placeholder"></i>'}
        ${parl.position ? `<span class="parl-badge">${escapeHtml(parl.position)}</span>` : ""}
      </div>
      <div class="parl-card-content">
        <h3 class="parl-card-name">${escapeHtml(parl.name)}</h3>
        <p class="parl-card-position">${escapeHtml(parl.position || "Parliamentarian")}</p>
        <p class="parl-card-department">
          <i class="fa-solid fa-building"></i>
          ${escapeHtml(parl.department || "N/A")}
        </p>
        <p class="parl-card-bio">${escapeHtml(parl.bio || "")}</p>
        <div class="parl-card-footer">
          <span class="parl-contact-badge">
            <i class="fa-solid fa-envelope"></i>
            Contact
          </span>
          <button class="parl-view-btn">View Profile</button>
        </div>
      </div>
    `;

    card.querySelector(".parl-view-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      openParliamentarianDetail(parl);
    });

    card.addEventListener("click", () => openParliamentarianDetail(parl));
    container.appendChild(card);
  });
}

function openParliamentarianDetail(parl) {
  const modal = document.getElementById("parliamentarianModal");
  const modalBody = document.getElementById("modalBody");

  const achievementsList = (parl.achievements || [])
    .map((ach) => `<li><i class="fa-solid fa-star"></i> ${escapeHtml(ach)}</li>`)
    .join("");

  let contactHtml = "";
  if (parl.email) {
    contactHtml += `<p id="parlEmail"><strong>Email:</strong> <a href="mailto:${parl.email}">${escapeHtml(parl.email)}</a></p>`;
  }
  if (parl.phone) {
    contactHtml += `<p id="parlPhone"><strong>Phone:</strong> <a href="tel:${parl.phone}">${escapeHtml(parl.phone)}</a></p>`;
  }

  modalBody.innerHTML = `
    <div class="parl-detail">
      <div class="parl-image-container">
        ${parl.image ? `<img src="${parl.image}" alt="${escapeHtml(parl.name)}">` : '<i class="fa-solid fa-user" style="font-size: 4rem;"></i>'}
      </div>
      <h2 id="parlName">${escapeHtml(parl.name)}</h2>
      <p id="parlPosition" class="parl-position">${escapeHtml(parl.position || "Parliamentarian")}</p>
      <p id="parlDepartment" class="parl-department">
        <i class="fa-solid fa-building"></i>
        ${escapeHtml(parl.department || "N/A")}
      </p>
      
      ${
        parl.bio
          ? `
        <div class="parl-bio">
          <h3>Biography</h3>
          <p id="parlBio">${escapeHtml(parl.bio)}</p>
        </div>
      `
          : ""
      }

      ${
        parl.portfolio
          ? `
        <div class="parl-portfolio">
          <h3>Portfolio & Responsibilities</h3>
          <p id="parlPortfolio">${escapeHtml(parl.portfolio)}</p>
        </div>
      `
          : ""
      }

      ${
        contactHtml
          ? `
        <div class="parl-contact">
          <h3>Get in Touch</h3>
          ${contactHtml}
        </div>
      `
          : ""
      }

      ${
        achievementsList
          ? `
        <div class="parl-achievements">
          <h3>Key Achievements</h3>
          <ul id="parlAchievements">${achievementsList}</ul>
        </div>
      `
          : ""
      }
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
