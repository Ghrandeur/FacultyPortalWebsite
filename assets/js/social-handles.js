import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  getDocs,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Load social handles on page load
document.addEventListener("DOMContentLoaded", () => {
  loadSocialHandles();
  loadDepartmentSocials();
  loadContactInfo();
  setupQuickLinks();
});

async function loadSocialHandles() {
  try {
    const querySnapshot = await getDocs(collection(db, "social_handles"));

    const container = document.getElementById("mainSocialList");
    container.innerHTML = "";

    let hasSocials = false;

    querySnapshot.forEach((doc) => {
      const social = doc.data();
      if (social.type === "main" || !social.type) {
        hasSocials = true;
        const card = createSocialCard(social);
        container.appendChild(card);
      }
    });

    if (!hasSocials) {
      container.innerHTML =
        '<div class="empty-state"><p>No social handles available</p></div>';
    }
  } catch (error) {
    console.error("Error loading social handles:", error);
    document.getElementById("mainSocialList").innerHTML =
      "<p>Error loading social handles</p>";
  }
}

async function loadDepartmentSocials() {
  try {
    const querySnapshot = await getDocs(collection(db, "department_socials"));

    const container = document.getElementById("departmentSocialList");
    container.innerHTML = "";

    let hasSocials = false;

    querySnapshot.forEach((doc) => {
      const social = doc.data();
      hasSocials = true;
      const card = createSocialCard(social);
      container.appendChild(card);
    });

    if (!hasSocials) {
      container.innerHTML =
        '<div class="empty-state"><p>No department channels available</p></div>';
    }
  } catch (error) {
    console.error("Error loading department socials:", error);
    document.getElementById("departmentSocialList").innerHTML =
      "<p>Error loading department channels</p>";
  }
}

async function loadContactInfo() {
  try {
    const querySnapshot = await getDocs(collection(db, "faculty_info"));

    querySnapshot.forEach((doc) => {
      const info = doc.data();
      if (info.email) {
        document.getElementById("facultyEmail").textContent = info.email;
      }
      if (info.phone) {
        document.getElementById("facultyPhone").textContent = info.phone;
      }
      if (info.location) {
        document.getElementById("facultyLocation").textContent = info.location;
      }
    });
  } catch (error) {
    console.error("Error loading contact info:", error);
  }
}

function setupQuickLinks() {
  const emailBtn = document.getElementById("emailLink");
  const email = document.getElementById("facultyEmail").textContent;
  if (email) {
    emailBtn.href = `mailto:${email}`;
  }

  document.getElementById("website").href = "https://www.uniuyo.edu.ng";
  document.getElementById("subscribe").href = "/pages/newsletter-login.html";
}

function createSocialCard(social) {
  const card = document.createElement("div");
  const platform = social.platform?.toLowerCase() || "social";
  card.className = `social-card ${platform}-card`;

  let icon = '<i class="fa-solid fa-share-nodes"></i>';
  let link = "#";

  // Set appropriate icon and link for each platform
  switch (platform) {
    case "facebook":
      icon = '<i class="fa-brands fa-facebook"></i>';
      link = social.url || "#";
      break;
    case "twitter":
    case "x":
      icon = '<i class="fa-brands fa-twitter"></i>';
      link = social.url || "#";
      break;
    case "instagram":
      icon = '<i class="fa-brands fa-instagram"></i>';
      link = social.url || "#";
      break;
    case "linkedin":
      icon = '<i class="fa-brands fa-linkedin"></i>';
      link = social.url || "#";
      break;
    case "whatsapp":
      icon = '<i class="fa-brands fa-whatsapp"></i>';
      link = social.url || "#";
      break;
    case "telegram":
      icon = '<i class="fa-brands fa-telegram"></i>';
      link = social.url || "#";
      break;
    case "tiktok":
      icon = '<i class="fa-brands fa-tiktok"></i>';
      link = social.url || "#";
      break;
    case "youtube":
      icon = '<i class="fa-brands fa-youtube"></i>';
      link = social.url || "#";
      break;
  }

  card.innerHTML = `
    <div class="social-icon">${icon}</div>
    <h4>${escapeHtml(social.name || social.platform)}</h4>
    <p>${escapeHtml(social.handle || "")}</p>
    <a href="${link}" target="_blank" rel="noopener noreferrer" class="social-card-link">
      <i class="fa-solid fa-arrow-up-right-from-square"></i> Follow
    </a>
  `;

  return card;
}

function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
