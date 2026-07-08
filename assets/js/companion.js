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

let advisorsData = [];
let faqData = [];
let topicsData = [];

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  loadAllData();
  setupEventListeners();
});

function setupEventListeners() {
  // Category buttons
  document.querySelectorAll(".category-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".category-btn").forEach((b) => b.classList.remove("active"));
      e.target.closest(".category-btn").classList.add("active");
    });
  });

  // Post question button
  document.getElementById("postQuestionBtn").addEventListener("click", () => {
    document.getElementById("questionModal").classList.add("show");
  });

  // Modal close
  document.querySelectorAll(".modal-close").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.target.closest(".modal").classList.remove("show");
    });
  });

  // Question form
  document.getElementById("questionForm").addEventListener("submit", handlePostQuestion);

  // FAQ accordions
  document.querySelectorAll(".faq-question").forEach((question) => {
    question.addEventListener("click", (e) => {
      const faqItem = e.target.closest(".faq-item");
      faqItem.classList.toggle("expanded");
    });
  });
}

async function loadAllData() {
  try {
    // Load advisors
    const advisorsSnapshot = await getDocs(query(collection(db, "advisors"), orderBy("order", "asc")));
    advisorsData = [];
    advisorsSnapshot.forEach((doc) => {
      advisorsData.push({ id: doc.id, ...doc.data() });
    });
    displayAdvisors();

    // Load FAQ
    const faqSnapshot = await getDocs(query(collection(db, "faq"), orderBy("order", "asc")));
    faqData = [];
    faqSnapshot.forEach((doc) => {
      faqData.push({ id: doc.id, ...doc.data() });
    });
    displayFAQ();

    // Load topics
    const topicsSnapshot = await getDocs(query(collection(db, "companion_topics"), orderBy("createdAt", "desc")));
    topicsData = [];
    topicsSnapshot.forEach((doc) => {
      topicsData.push({ id: doc.id, ...doc.data() });
    });
    displayTopics();
  } catch (error) {
    console.error("Error loading companion data:", error);
  }
}

function displayAdvisors() {
  const container = document.getElementById("advisorsList");

  if (advisorsData.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No advisors available</p></div>';
    return;
  }

  container.innerHTML = "";

  advisorsData.forEach((advisor) => {
    const card = document.createElement("div");
    card.className = "advisor-card";
    card.innerHTML = `
      <div class="advisor-image">
        ${advisor.image ? `<img src="${advisor.image}" alt="${escapeHtml(advisor.name)}">` : '<i class="fa-solid fa-user"></i>'}
      </div>
      <div class="advisor-info">
        <h4>${escapeHtml(advisor.name)}</h4>
        <p class="advisor-title">${escapeHtml(advisor.title || "Advisor")}</p>
        <p>${escapeHtml(advisor.bio || "")}</p>
      </div>
    `;

    container.appendChild(card);
  });
}

function displayFAQ() {
  const container = document.getElementById("faqList");

  if (faqData.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No FAQ available</p></div>';
    return;
  }

  container.innerHTML = "";

  faqData.forEach((faq) => {
    const item = document.createElement("div");
    item.className = "faq-item";
    item.innerHTML = `
      <button class="faq-question">
        <span>${escapeHtml(faq.question)}</span>
        <i class="fa-solid fa-chevron-down"></i>
      </button>
      <div class="faq-answer">${faq.answer}</div>
    `;

    item.querySelector(".faq-question").addEventListener("click", () => {
      item.classList.toggle("expanded");
    });

    container.appendChild(item);
  });
}

function displayTopics() {
  const container = document.getElementById("topicsList");

  if (topicsData.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No topics yet. Be the first to ask!</p></div>';
    return;
  }

  container.innerHTML = "";

  topicsData.forEach((topic) => {
    const card = document.createElement("div");
    card.className = "topic-card";

    const date = topic.createdAt?.toDate ? formatDate(topic.createdAt.toDate()) : "N/A";
    const replies = topic.replies || 0;

    card.innerHTML = `
      <span class="topic-category-badge">${escapeHtml(topic.category)}</span>
      <h4>${escapeHtml(topic.title)}</h4>
      <p>${escapeHtml(topic.preview || topic.content?.substring(0, 100) || "")}</p>
      <div class="topic-meta">
        <span><i class="fa-solid fa-user"></i> ${escapeHtml(topic.studentName || "Anonymous")}</span>
        <span><i class="fa-solid fa-comment"></i> ${replies} replies</span>
        <span><i class="fa-solid fa-calendar"></i> ${date}</span>
      </div>
    `;

    card.addEventListener("click", () => openTopicDetail(topic));
    container.appendChild(card);
  });
}

async function handlePostQuestion(e) {
  e.preventDefault();

  const name = document.getElementById("studentName").value.trim();
  const email = document.getElementById("studentEmail").value.trim();
  const category = document.getElementById("questionCategory").value;
  const title = document.getElementById("questionTitle").value.trim();
  const content = document.getElementById("questionText").value.trim();
  const anonymous = document.getElementById("anonymousQuestion").checked;

  if (!name || !email || !category || !title || !content) {
    showFormError("Please fill all required fields");
    return;
  }

  try {
    await addDoc(collection(db, "companion_topics"), {
      studentName: anonymous ? "Anonymous" : name,
      email,
      category,
      title,
      content,
      preview: content.substring(0, 100),
      replies: 0,
      createdAt: serverTimestamp(),
      anonymous,
    });

    alert("Question posted successfully!");
    document.getElementById("questionForm").reset();
    document.getElementById("questionModal").classList.remove("show");
    loadAllData();
  } catch (error) {
    console.error("Error posting question:", error);
    showFormError("Error posting question. Please try again.");
  }
}

function openTopicDetail(topic) {
  const modal = document.getElementById("detailModal");
  const modalBody = document.getElementById("modalBody");

  const date = topic.createdAt?.toDate ? formatDate(topic.createdAt.toDate()) : "N/A";

  modalBody.innerHTML = `
    <div class="detail-modal">
      <h2>${escapeHtml(topic.title)}</h2>
      <span class="topic-category-badge">${escapeHtml(topic.category)}</span>
      
      <div style="margin-top: 16px; padding: 16px; background: #F3F4F6; border-radius: 8px; font-size: 0.9rem;">
        <p style="margin: 0;">
          <strong>Asked by:</strong> ${escapeHtml(topic.studentName || "Anonymous")}
        </p>
        <p style="margin: 8px 0 0 0;">
          <i class="fa-solid fa-calendar"></i> ${date}
        </p>
      </div>

      <div style="margin-top: 20px; line-height: 1.8;">
        ${escapeHtml(topic.content)}
      </div>

      ${
        topic.replies && topic.replies > 0
          ? `
        <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #E5E7EB;">
          <p><strong>${topic.replies} ${topic.replies === 1 ? "reply" : "replies"}</strong></p>
          <p style="color: #6B7280; font-size: 0.9rem;">Check back for community responses and advisor guidance.</p>
        </div>
      `
          : ""
      }
    </div>
  `;

  modal.classList.add("show");
}

function showFormError(message) {
  const errorEl = document.getElementById("formError");
  errorEl.textContent = message;
  errorEl.style.display = "block";
  setTimeout(() => {
    errorEl.style.display = "none";
  }, 5000);
}

function formatDate(date) {
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

// Close modals
document.querySelectorAll(".modal").forEach((modal) => {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.remove("show");
    }
  });
});
