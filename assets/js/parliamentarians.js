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
let activeAdministration = "2026-2027";

// Load parliamentarians and administration tabs on page load
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".administration-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".administration-tab").forEach(item => {
        item.classList.remove("active");
        item.setAttribute("aria-selected", "false");
      });
      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");
      activeAdministration = tab.dataset.administration;
      displayParliamentarians();
    });
  });
  loadParliamentarians();
});

// No modal present on the page anymore; guard against missing elements.
const modalCloseBtn = document.querySelector(".modal-close");
const modalEl = document.getElementById("parliamentarianModal");
if (modalCloseBtn && modalEl) {
  modalCloseBtn.addEventListener("click", () => modalEl.classList.remove("show"));
  modalEl.addEventListener("click", (e) => {
    if (e.target.id === "parliamentarianModal") modalEl.classList.remove("show");
  });
}

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

  const filteredData = parliamentariansData.filter(parl => {
    const administration = parl.administration === "past" ? "2025-2026" : (parl.administration || "2025-2026");
    return administration === activeAdministration;
  });

  container.style.display = "grid";
  if (emptyState) emptyState.style.display = "none";
  container.innerHTML = "";

  if (filteredData.length === 0) {
    container.innerHTML = activeAdministration === "2026-2027"
      ? '<p style="grid-column: 1/-1; text-align:center;">No parliamentarians have been added to the 2026–2027 administration yet.</p>'
      : '<p style="grid-column: 1/-1; text-align:center;">No parliamentarians found for the 2025–2026 administration.</p>';
    return;
  }

  filteredData.forEach((parl) => {
    const rawPhotoUrl = parl.image || parl.photoUrl || parl.url || '';
    const photoUrl = rawPhotoUrl && typeof rawPhotoUrl === 'string' && rawPhotoUrl.trim()
      ? (window.normalizeMediaUrl ? window.normalizeMediaUrl(rawPhotoUrl) : rawPhotoUrl)
      : '';

    const card = document.createElement("div");
    card.className = "parliamentarian-card";
    card.innerHTML = `
      <div class="parl-image-section">
        ${photoUrl ? `<img src="${photoUrl}" alt="${escapeHtml(parl.name)}" onerror="this.onerror=null;this.src='/assets/images/placeholder.svg'">` : '<i class="fa-solid fa-user parl-image-placeholder"></i>'}
        ${parl.position ? `<span class="parl-badge">${escapeHtml(parl.position)}</span>` : ""}
      </div>
      <div class="parl-card-content">
        <h3 class="parl-card-name">${escapeHtml(parl.name)}</h3>
        <p class="parl-card-position">${escapeHtml(parl.position || "Parliamentarian")}</p>
        <p class="parl-card-department">
          <i class="fa-solid fa-building"></i>
          ${escapeHtml(parl.department || "N/A")}
        </p>
      </div>
    `;
    container.appendChild(card);
  });
}

// Modal/detail view removed — clicking a card is now a no-op to avoid showing details.
function openParliamentarianDetail(parl) {
  // Intentionally left blank: detail modal removed per design.
  console.info('Detail view disabled for', parl && parl.name);
}

function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
