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

const siteNavigationLinks = [
  { href: '/pages/faculty.html', label: 'Faculty' },
  { href: '/pages/leaders.html', label: 'Leaders' },
  { href: '/pages/parliamentarians.html', label: 'Parliamentarians' },
  { href: '/pages/departments.html', label: 'Departments' },
  { href: '/pages/newsletter-login.html', label: 'Newsletter' },
  { href: '/pages/marketplace.html', label: 'Marketplace' },
  { href: '/pages/archive.html', label: 'Archive' },
  { href: '/pages/gallery.html', label: 'Gallery' },
  { href: '/pages/documents.html', label: 'Documents' },
  { href: '/pages/past-questions.html', label: 'Past Questions' },
  { href: '/pages/companion.html', label: 'Companion' },
  { href: '/pages/social-handles.html', label: 'Social Handles' },
  { href: '/admin/login.html', label: 'Admin' },
];

const topbar = document.querySelector('.topbar');
const isHomePage = window.location.pathname === '/' || window.location.pathname.endsWith('/index.html');
if (topbar && !isHomePage && !document.getElementById('pageNavButton')) {
  const navButton = document.createElement('button');
  navButton.id = 'pageNavButton';
  navButton.type = 'button';
  navButton.className = 'theme-button page-nav-button';
  navButton.setAttribute('aria-expanded', 'false');
  navButton.setAttribute('aria-controls', 'pageNavDropdown');
  navButton.title = 'Open navigation menu';
  navButton.innerHTML = '<i class="fa-solid fa-bars" aria-hidden="true"></i>';

  const dropdown = document.createElement('div');
  dropdown.id = 'pageNavDropdown';
  dropdown.className = 'page-nav-dropdown';
  dropdown.setAttribute('role', 'menu');
  dropdown.setAttribute('aria-hidden', 'true');

  const dropdownInner = document.createElement('div');
  dropdownInner.className = 'page-nav-dropdown-inner';

  function closeDropdown() {
    navButton.setAttribute('aria-expanded', 'false');
    dropdown.setAttribute('aria-hidden', 'true');
    dropdown.classList.remove('open');
  }

  siteNavigationLinks.forEach(({ href, label }) => {
    const link = document.createElement('a');
    link.href = href;
    link.className = 'page-nav-item';
    link.textContent = label;
    link.setAttribute('role', 'menuitem');
    link.addEventListener('click', closeDropdown);
    dropdownInner.appendChild(link);
  });

  dropdown.appendChild(dropdownInner);

  if (themeToggle) {
    topbar.insertBefore(navButton, themeToggle);
    document.body.appendChild(dropdown);
  } else {
    topbar.appendChild(navButton);
    document.body.appendChild(dropdown);
  }

  navButton.addEventListener('click', (event) => {
    event.stopPropagation();
    const isOpen = navButton.getAttribute('aria-expanded') === 'true';
    if (isOpen) {
      closeDropdown();
    } else {
      navButton.setAttribute('aria-expanded', 'true');
      dropdown.setAttribute('aria-hidden', 'false');
      dropdown.classList.add('open');
    }
  });

  document.addEventListener('click', (event) => {
    if (!topbar.contains(event.target)) {
      closeDropdown();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeDropdown();
    }
  });
}

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
