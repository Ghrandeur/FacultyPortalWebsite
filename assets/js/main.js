const themeToggle = document.getElementById('themeToggle');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const storedTheme = localStorage.getItem('facultyPortalTheme');

const setTheme = (mode) => {
  const isDark = mode === 'dark';
  document.documentElement.classList.toggle('dark-mode', isDark);
  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
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
  { href: '/pages/faculty', label: 'Faculty' },
  { href: '/pages/leaders', label: 'Leaders' },
  { href: '/pages/parliamentarians', label: 'Parliamentarians' },
  { href: '/pages/departments', label: 'Departments' },
  { href: '/pages/newsletter-login', label: 'Newsletter' },
  { href: '/pages/marketplace', label: 'Marketplace' },
  { href: '/pages/archive', label: 'Archive' },
  { href: '/pages/gallery', label: 'Gallery' },
  { href: '/pages/documents', label: 'Documents' },
  { href: '/pages/past-questions', label: 'Past Questions' },
  { href: '/pages/companion', label: 'Companion' },
  { href: '/pages/social-handles', label: 'Social Handles' },
  { href: '/admin/login', label: 'Admin' },
];

const topbar = document.querySelector('.topbar');
const isHomePage = window.location.pathname === '/';
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

const progressBar = document.createElement('div');
progressBar.className = 'portal-scroll-progress';
progressBar.setAttribute('aria-hidden', 'true');
document.body.appendChild(progressBar);

const backToTop = document.createElement('button');
backToTop.className = 'portal-back-to-top';
backToTop.type = 'button';
backToTop.setAttribute('aria-label', 'Back to top');
backToTop.innerHTML = '<i class="fa-solid fa-arrow-up" aria-hidden="true"></i>';
document.body.appendChild(backToTop);

const updatePageProgress = () => {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
  progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
  backToTop.classList.toggle('visible', window.scrollY > 520);
};

window.addEventListener('scroll', updatePageProgress, { passive: true });
backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
updatePageProgress();

const interactiveSelectors = '.event-card, .member-card, .document-item, .question-item, .department-card, .department-detail-card, .parliamentarian-card, .advisor-card, .topic-card, .newsletter-item, .gallery-item, .resource-card, .social-card, .contact-card, .quick-link-card';
const interactiveItems = document.querySelectorAll(interactiveSelectors);
interactiveItems.forEach((item, index) => {
  item.style.animationDelay = `${Math.min(index * 55, 330)}ms`;
});

document.querySelectorAll('img').forEach((image) => {
  image.addEventListener('load', () => image.classList.add('portal-image-loaded'), { once: true });
});
