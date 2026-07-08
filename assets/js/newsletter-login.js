import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const form = document.getElementById("newsletterLoginForm");
const errorMessage = document.getElementById("errorMessage");
const successMessage = document.getElementById("successMessage");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const regNo = document.getElementById("regNo").value.trim();
  const department = document.getElementById("department").value;
  const email = document.getElementById("email").value.trim();

  if (!regNo || !department || !email) {
    showError("All fields are required");
    return;
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showError("Please enter a valid email address");
    return;
  }

  try {
    // Check if student already subscribed
    const q = query(
      collection(db, "newsletter_subscribers"),
      where("email", "==", email)
    );
    const existingDocs = await getDocs(q);

    if (!existingDocs.empty) {
      showError("This email is already registered for our newsletter!");
      return;
    }

    // Add to newsletter subscribers
    await addDoc(collection(db, "newsletter_subscribers"), {
      regNo,
      department,
      email,
      subscribedAt: serverTimestamp(),
      active: true,
    });

    showSuccess("Registration successful! You will receive newsletters at " + email);
    form.reset();

    // Redirect to newsletter page after 2 seconds
    setTimeout(() => {
      window.location.href = "/pages/newsletter.html";
    }, 2000);
  } catch (error) {
    console.error("Error registering for newsletter:", error);
    showError("Error registering for newsletter. Please try again.");
  }
});

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = "block";
  successMessage.style.display = "none";
}

function showSuccess(message) {
  successMessage.textContent = message;
  successMessage.style.display = "block";
  errorMessage.style.display = "none";
}
