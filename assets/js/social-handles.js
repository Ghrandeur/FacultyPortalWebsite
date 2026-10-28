const API_URL = window.API_URL;

// Load social handles on page load
document.addEventListener("DOMContentLoaded", () => {
  loadSocialHandles();
  loadDepartmentSocials();
  loadContactInfo();
});

async function loadSocialHandles() {
  try {
    const response = await fetch(`${API_URL}/social-handles/all`);
    const socials = await response.json();
    const container = document.getElementById("mainSocialList");
    container.innerHTML = "";

    const mainSocials = socials.filter(social => social.type === "main" || !social.type);

    if (mainSocials.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>No social handles available</p></div>';
      return;
    }

    mainSocials.forEach(social => container.appendChild(createSocialCard(social)));

  } catch (error) {
    console.error("Error loading social handles:", error);
    document.getElementById("mainSocialList").innerHTML =
      "<p>Error loading social handles</p>";
  }
}

async function loadDepartmentSocials() {
  try {
    const response = await fetch(`${API_URL}/social-handles/all`);
    const socials = await response.json();
    const departmentSocials = socials.filter(social => social.type === "department");
    const container = document.getElementById("departmentSocialList");
    container.innerHTML = "";

    if (departmentSocials.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>No department channels available</p></div>';
      return;
    }
    departmentSocials.forEach(social => container.appendChild(createSocialCard(social)));
  } catch (error) {
    console.error("Error loading department socials:", error);
    document.getElementById("departmentSocialList").innerHTML = "<p>Error loading department channels</p>";
  }
}

async function loadContactInfo() {
  try {
    const response = await fetch(`${API_URL}/social-settings`);
    const info = await response.json();
    document.getElementById("facultyEmail").textContent = info.email || "Not available";
    document.getElementById("facultyPhone").textContent = info.phone || "Not available";
    document.getElementById("facultyLocation").textContent = info.location || "Not available";
    setupQuickLinks(info);
  } catch (error) {
    console.error("Error loading contact info:", error);
  }
}

function setupQuickLinks(info = {}) {
  const email = info.email || "";
  const website = document.getElementById("website");
  const emailLink = document.getElementById("emailLink");
  const chat = document.getElementById("chat");
  const subscribe = document.getElementById("subscribe");

  if (email) emailLink.href = `mailto:${email}`;
  if (info.websiteUrl) website.href = info.websiteUrl;
  if (info.chatUrl) chat.href = info.chatUrl;
  if (info.newsletterUrl) subscribe.href = info.newsletterUrl;

  [[website, info.websiteUrl], [emailLink, email], [chat, info.chatUrl], [subscribe, info.newsletterUrl]].forEach(([element, configured]) => {
    element.style.display = configured ? "flex" : "none";
  });
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
    <a href="${escapeHtml(safeLink(link))}" target="_blank" rel="noopener noreferrer" class="social-card-link">
      <i class="fa-solid fa-arrow-up-right-from-square"></i> Follow
    </a>
  `;

  return card;
}

function safeLink(value) {
  if (!value || typeof value !== "string") return "#";
  const trimmed = value.trim();
  if (/^(https?:|mailto:|tel:)/i.test(trimmed) || trimmed.startsWith("/pages/")) return trimmed;
  return "#";
}

function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
