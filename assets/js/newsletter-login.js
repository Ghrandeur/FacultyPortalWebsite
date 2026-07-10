import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getAuth,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";
import { API_URL as CONFIG_API_URL } from "./api-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const API_URL = window.API_URL || CONFIG_API_URL || 'http://localhost:5000/api';

const form = document.getElementById("newsletterLoginForm");
const errorMessage = document.getElementById("errorMessage");
const successMessage = document.getElementById("successMessage");

// Show the effective API URL for debugging and allow the flow to proceed.
const debugBanner = document.createElement('div');
debugBanner.style.cssText = 'position:fixed;bottom:8px;right:8px;z-index:9999;background:#fff;border:1px solid #ddd;padding:6px 8px;border-radius:6px;font-size:12px;color:#333;box-shadow:0 2px 6px rgba(0,0,0,0.1)';
debugBanner.textContent = `API: ${API_URL}`;
document.body.appendChild(debugBanner);

if (!API_URL || typeof API_URL !== 'string' || API_URL.indexOf('undefined') !== -1) {
  console.warn('Configuration warning: API_URL may be invalid:', API_URL);
  if (errorMessage) {
    errorMessage.textContent = 'Warning: API URL may be invalid. Admin can fix this.';
    errorMessage.style.display = 'block';
  }
}

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
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Registering...';

    // Get user token for authentication
    let token = '';
    try {
      token = await auth.currentUser?.getIdToken() || '';
    } catch (err) {
      // User not logged in, proceed without token
      console.log('User not authenticated, proceeding as guest');
    }

    // Call backend endpoint
    const response = await fetch(`${API_URL}/newsletter/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': token })
      },
      body: JSON.stringify({ regNo, department, email })
    });

    const data = await response.json();
    console.log('Newsletter subscribe response', response.status, data);

    if (response.ok && data.success) {
      // Store email in localStorage for unsubscribe feature
      localStorage.setItem("subscriberEmail", email);
      
      const confirmationMsg = data.emailConfirmation 
        ? "Successfully subscribed! A confirmation email has been sent to " + email
        : "Successfully subscribed! You will receive newsletters at " + email;
      
        // If email failed, surface the error to the user but still proceed
        if (!data.emailConfirmation && data.emailResult && data.emailResult.error) {
          showError(`Subscribed but confirmation email failed: ${data.emailResult.error}`);
        } else {
          showSuccess(confirmationMsg + " Redirecting to the newsletter page...");
        }
      submitBtn.textContent = "Subscribed";
      submitBtn.disabled = true;
      form.reset();

      // Redirect to newsletter page immediately after showing confirmation
      setTimeout(() => {
        window.location.href = "/pages/newsletter.html";
      }, 1000);
    } else {
      showError(data.error || "Error registering for newsletter");
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  } catch (error) {
    console.error("Error registering for newsletter:", error);
    showError("Error registering for newsletter. Please try again.");
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = false;
    submitBtn.textContent = "Register for Newsletter";
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
