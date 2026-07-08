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

let departmentsData = [];

// Load departments on page load
document.addEventListener("DOMContentLoaded", loadDepartments);

// Modal close button
document.querySelector(".modal-close").addEventListener("click", () => {
  document.getElementById("departmentModal").classList.remove("show");
});

// Close modal when clicking outside
document.getElementById("departmentModal").addEventListener("click", (e) => {
  if (e.target.id === "departmentModal") {
    e.target.classList.remove("show");
  }
});

async function loadDepartments() {
  try {
    const q = query(collection(db, "departments"), orderBy("order", "asc"));
    const querySnapshot = await getDocs(q);

    departmentsData = [];
    querySnapshot.forEach((doc) => {
      departmentsData.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    displayDepartments();
  } catch (error) {
    console.error("Error loading departments:", error);
    document.getElementById("departmentsList").innerHTML =
      "<p>Error loading departments. Please try again.</p>";
  }
}

function displayDepartments() {
  const container = document.getElementById("departmentsList");
  const emptyState = document.getElementById("emptyState");

  if (departmentsData.length === 0) {
    container.style.display = "none";
    emptyState.style.display = "flex";
    return;
  }

  container.style.display = "grid";
  emptyState.style.display = "none";
  container.innerHTML = "";

  departmentsData.forEach((dept) => {
    const card = document.createElement("div");
    card.className = "department-card";
    card.innerHTML = `
      <div class="dept-logo-section">
        ${dept.logo ? `<img src="${dept.logo}" alt="${escapeHtml(dept.name)}">` : '<i class="fa-solid fa-building dept-logo-placeholder"></i>'}
      </div>
      <div class="dept-card-content">
        <h3 class="dept-card-title">${escapeHtml(dept.name)}</h3>
        <div class="dept-card-hod">
          <i class="fa-solid fa-user"></i>
          <span>HOD: ${escapeHtml(dept.hod || "N/A")}</span>
        </div>
        <p class="dept-card-description">${escapeHtml(dept.description)}</p>
        <div class="dept-card-footer">
          <span class="dept-programs-count">
            <i class="fa-solid fa-graduation-cap"></i>
            ${(dept.programs || []).length} Programs
          </span>
          <button class="view-detail-btn">View Details</button>
        </div>
      </div>
    `;

    card.querySelector(".view-detail-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      openDepartmentDetail(dept);
    });

    card.addEventListener("click", () => openDepartmentDetail(dept));
    container.appendChild(card);
  });
}

function openDepartmentDetail(dept) {
  const modal = document.getElementById("departmentModal");
  const modalBody = document.getElementById("modalBody");

  const programsList = (dept.programs || [])
    .map((prog) => `<li><i class="fa-solid fa-check"></i> ${escapeHtml(prog)}</li>`)
    .join("");

  modalBody.innerHTML = `
    <div class="dept-detail">
      <div class="dept-logo-container">
        ${dept.logo ? `<img src="${dept.logo}" alt="${escapeHtml(dept.name)}">` : '<i class="fa-solid fa-building" style="font-size: 4rem;"></i>'}
      </div>
      <h2>${escapeHtml(dept.name)}</h2>
      <p class="dept-desc">${escapeHtml(dept.description)}</p>
      
      <div class="dept-info">
        <div class="info-item">
          <strong>HOD:</strong>
          <p>${escapeHtml(dept.hod || "N/A")}</p>
        </div>
        <div class="info-item">
          <strong>Contact:</strong>
          <p>${escapeHtml(dept.contact || "N/A")}</p>
        </div>
        <div class="info-item">
          <strong>Office Location:</strong>
          <p>${escapeHtml(dept.location || "N/A")}</p>
        </div>
      </div>

      ${
        programsList
          ? `
        <div class="dept-programs">
          <h3>Programs Offered</h3>
          <ul>${programsList}</ul>
        </div>
      `
          : ""
      }

      ${
        dept.achievements
          ? `
        <div class="dept-achievements">
          <h3>Recent Achievements</h3>
          <p>${escapeHtml(dept.achievements)}</p>
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
