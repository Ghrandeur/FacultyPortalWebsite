import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getAuth,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";
import { API_URL as CONFIG_API_URL } from "./api-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const API_URL = window.API_URL || CONFIG_API_URL || 'http://localhost:5000/api';

window.newsletterLoginDebug = {
  scriptLoaded: true,
  apiUrl: API_URL,
  setupCalled: false,
  submitCalled: false,
  lastError: null,
};

const getErrorMessageElement = () => document.getElementById("errorMessage");
const getSuccessMessageElement = () => document.getElementById("successMessage");

// Show the effective API URL for debugging and allow the flow to proceed.
const debugBanner = document.createElement('div');
debugBanner.style.cssText = 'position:fixed;bottom:8px;right:8px;z-index:9999;background:#fff;border:1px solid #ddd;padding:6px 8px;border-radius:6px;font-size:12px;color:#333;box-shadow:0 2px 6px rgba(0,0,0,0.1)';
debugBanner.textContent = `API: ${API_URL}`;

function initializeNewsletterLogin() {
  document.body.appendChild(debugBanner);
  setupNewsletterForm();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeNewsletterLogin);
} else {
  initializeNewsletterLogin();
}

if (!API_URL || typeof API_URL !== 'string' || API_URL.indexOf('undefined') !== -1) {
  console.warn('Configuration warning: API_URL may be invalid:', API_URL);
  const errorMessage = getErrorMessageElement();
  if (errorMessage) {
    errorMessage.textContent = 'Warning: API URL may be invalid. Admin can fix this.';
    errorMessage.style.display = 'block';
  }
}

function setupNewsletterForm() {
  const form = document.getElementById("newsletterLoginForm");
  window.newsletterLoginDebug.setupCalled = true;
  if (!form) {
    console.error('Newsletter form not found on page');
    return;
  }

  form.addEventListener("submit", async (e) => {
    window.newsletterLoginDebug.submitCalled = true;
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
      const emailResult = {
        success: Boolean(data.emailConfirmation),
        message: data.message || (data.emailConfirmation ? `Successfully subscribed! A confirmation email has been sent to ${email}` : `Successfully subscribed! You will receive newsletters at ${email}`),
        error: data.emailResult?.error || null,
      };
      localStorage.setItem("newsletterEmailResult", JSON.stringify(emailResult));
      
      if (!data.emailConfirmation && data.emailResult && data.emailResult.error) {
        showError(`Subscribed but confirmation email failed: ${data.emailResult.error}`);
      } else {
        showSuccess(emailResult.message + " Redirecting to the newsletter page...");
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
}

function showError(message) {
  const errorMessage = getErrorMessageElement();
  const successMessage = getSuccessMessageElement();
  if (errorMessage) {
    errorMessage.textContent = message;
    errorMessage.style.display = "block";
  }
  if (successMessage) {
    successMessage.style.display = "none";
  }
}

function showSuccess(message) {
  const errorMessage = getErrorMessageElement();
  const successMessage = getSuccessMessageElement();
  if (successMessage) {
    successMessage.textContent = message;
    successMessage.style.display = "block";
  }
  if (errorMessage) {
    errorMessage.style.display = "none";
  }
}
