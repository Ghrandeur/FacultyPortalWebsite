const themeToggle = document.getElementById('themeToggle');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const storedTheme = localStorage.getItem('facultyPortalTheme');

const setTheme = (mode) => {
  document.documentElement.classList.toggle('dark-mode', mode === 'dark');
  // update only the icon inside the theme toggle button
  const themeIcon = document.querySelector('#themeToggle .theme-icon');
  if (themeIcon) {
    themeIcon.textContent = mode === 'dark' ? '☀️' : '🌙';
  }
  localStorage.setItem('facultyPortalTheme', mode);
};

const currentTheme = storedTheme || (prefersDark ? 'dark' : 'light');
setTheme(currentTheme);

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const nextTheme = document.documentElement.classList.contains('dark-mode') ? 'light' : 'dark';
    setTheme(nextTheme);
  });
}

const topbar = document.querySelector('.topbar');
const isHomePage = window.location.pathname === '/' || window.location.pathname.endsWith('/index.html');
if (topbar && !document.getElementById('pageBackButton') && !isHomePage) {
  const backButton = document.createElement('button');
  backButton.id = 'pageBackButton';
  backButton.type = 'button';
  backButton.className = 'theme-button page-back-button';
  // use FontAwesome icon for consistent styling and avoid emoji swapping
  backButton.innerHTML = '<i class="fa-solid fa-arrow-left back-icon" aria-hidden="true"></i>';
  backButton.title = 'Go back';
  backButton.addEventListener('click', () => {
    if (window.history.length > 1 && document.referrer) {
      window.history.back();
    } else {
      window.location.href = '/index.html';
    }
  });

  if (themeToggle) {
    topbar.insertBefore(backButton, themeToggle);
  } else {
    topbar.appendChild(backButton);
  }
}

const updateGreeting = () => {
  const greetingElement = document.getElementById('timeGreeting');
  if (!greetingElement) return;

  const hour = new Date().getHours();
  let greeting = 'Good morning';
  let icon = '🌅';

  if (hour >= 12 && hour < 17) {
    greeting = 'Good afternoon';
    icon = '🌞';
  } else if (hour >= 17) {
    greeting = 'Good evening';
    icon = '🌙';
  }

  greetingElement.textContent = `${greeting}, Students! ${icon}`;
};

updateGreeting();

const portalLinks = document.querySelectorAll('.portal-card');
portalLinks.forEach((link) => {
  link.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      link.click();
    }
  });
});
