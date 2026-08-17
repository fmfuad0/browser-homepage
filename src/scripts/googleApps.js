/**
 * Google Apps / Services Launcher Popover Controller
 * Provides an authentic Google App Launcher popover menu with favorites, reordering, and search.
 */

// SVG Icon Definitions for Google Services
const GOOGLE_ICONS = {
  classroom: `<svg viewBox="0 0 48 48"><rect width="44" height="34" x="2" y="7" fill="#0f9d58" rx="4"/><rect width="36" height="26" x="6" y="11" fill="#0f9d58" stroke="#f4b400" stroke-width="2.5" rx="2"/><circle cx="24" cy="20" r="4" fill="#ffffff"/><path fill="#ffffff" d="M16 32c0-3.5 3.5-6 8-6s8 2.5 8 6v1H16v-1z"/><circle cx="16" cy="21" r="3" fill="#ffffff" opacity="0.75"/><path fill="#ffffff" opacity="0.75" d="M10 32c0-2.5 2.5-4.5 6-4.5v4.5h-6z"/><circle cx="32" cy="21" r="3" fill="#ffffff" opacity="0.75"/><path fill="#ffffff" opacity="0.75" d="M38 32c0-2.5-2.5-4.5-6-4.5v4.5h6z"/></svg>`,
  
  account: `<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" fill="#1a73e8"/><circle cx="24" cy="17" r="8" fill="#ffffff"/><path fill="#ffffff" d="M24 28c-9 0-15 4.5-16.5 10.5A21.9 21.9 0 0 0 24 46a21.9 21.9 0 0 0 16.5-7.5C39 32.5 33 28 24 28z"/></svg>`,
  
  keep: `<svg viewBox="0 0 48 48"><rect width="36" height="40" x="6" y="4" fill="#f4b400" rx="6"/><path fill="#ffffff" d="M24 10a11 11 0 0 0-7 19.5V33a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3.5A11 11 0 0 0 24 10zm-3 27h6v2h-6v-2z"/></svg>`,
  
  gmail: `<svg viewBox="0 0 48 48"><path fill="#4285f4" d="M6 38V14l18 13.5L42 14v24a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3z"/><path fill="#34a853" d="M42 14v-4a3 3 0 0 0-4.8-2.4L24 17.25 10.8 7.6A3 3 0 0 0 6 10v4l18 13.5L42 14z"/><path fill="#ea4335" d="M6 10v4l18 13.5L42 14v-4l-18 13.5L6 10z"/><path fill="#fbbc04" d="M6 10a3 3 0 0 1 4.8-2.4L24 17.25l13.2-9.65A3 3 0 0 1 42 10v4L24 27.5 6 14v-4z"/></svg>`,
  
  docs: `<svg viewBox="0 0 48 48"><path fill="#4285f4" d="M30 4H12a4 4 0 0 0-4 4v32a4 4 0 0 0 4 4h24a4 4 0 0 0 4-4V14L30 4z"/><path fill="#a1c2fa" d="M30 4v10h10L30 4z"/><path fill="#ffffff" d="M16 22h16v3.5H16V22zm0 7h16v3.5H16V29zm0 7h10v3.5H16V36z"/></svg>`,
  
  search: `<svg viewBox="0 0 48 48"><path fill="#ea4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285f4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#fbbc05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34a853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>`,
  
  maps: `<svg viewBox="0 0 48 48"><path fill="#ea4335" d="M24 4C14.06 4 6 12.06 6 22c0 13.5 18 22 18 22s18-8.5 18-22c0-9.94-8.06-18-18-18z"/><circle cx="24" cy="20" r="7" fill="#ffffff"/></svg>`,
  
  drive: `<svg viewBox="0 0 48 48"><path fill="#ffba00" d="M16 6l-10 17 8 14h20l8-14L32 6H16z" opacity="0"/><path fill="#ffba00" d="M31.2 6H16.8L6 24.6l5.2 9 10.4-18z"/><path fill="#0066da" d="M42 24.6L31.2 6H16.8l10.4 18h14.8z"/><path fill="#00ac47" d="M21.6 33.6L11.2 33.6 6 24.6l5.2-9 10.4 18z"/><path fill="#00ac47" d="M11.2 33.6h25.6l5.2-9H27.2l-16 9z"/></svg>`,
  
  play: `<svg viewBox="0 0 48 48"><path fill="#00f0ff" d="M7 6.5A3 3 0 0 1 11.4 4L39.8 21a3 3 0 0 1 0 5.1L11.4 43A3 3 0 0 1 7 40.5v-34z"/><path fill="#00d7a4" d="M7 6.5L25 24.5 7 40.5v-34z"/><path fill="#ff3b00" d="M32 17.5L7 6.5l18 18 7-7z"/><path fill="#ffcc00" d="M32 30.5l-7-7-18 18 25-11z"/></svg>`,
  
  gemini: `<svg viewBox="0 0 48 48"><path fill="url(#geminiGrad)" d="M24 2C24 14.15 14.15 24 2 24c12.15 0 22 9.85 22 22 0-12.15 9.85-22 22-22-12.15 0-22-9.85-22-22z"/><defs><linearGradient id="geminiGrad" x1="2" y1="2" x2="46" y2="46" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#1ba0e3"/><stop offset="30%" stop-color="#9b72cb"/><stop offset="70%" stop-color="#d96570"/><stop offset="100%" stop-color="#f49c46"/></linearGradient></defs></svg>`,
  
  calendar: `<svg viewBox="0 0 48 48"><rect width="36" height="36" x="6" y="8" fill="#ffffff" rx="6"/><path fill="#ea4335" d="M6 14c0-3.3 2.7-6 6-6h24c3.3 0 6 2.7 6 6v4H6v-4z"/><text x="24" y="36" fill="#4285f4" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle">31</text></svg>`,
  
  chrome: `<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" fill="#4285f4"/><path fill="#ea4335" d="M24 4a20 20 0 0 1 17.3 10H24V4z"/><path fill="#fbbc05" d="M41.3 14A20 20 0 0 1 24 44v-20h17.3z"/><path fill="#34a853" d="M24 44A20 20 0 0 1 6.7 14L24 24v20z"/><circle cx="24" cy="24" r="9" fill="#ffffff"/><circle cx="24" cy="24" r="7" fill="#1a73e8"/></svg>`,
  
  news: `<svg viewBox="0 0 48 48"><rect width="36" height="38" x="6" y="5" fill="#4285f4" rx="6"/><path fill="#ffffff" d="M12 13h24v4H12zm0 8h24v3H12zm0 7h14v3H12zm0 6h14v3H12zm18-13h6v12h-6z"/><path fill="#ea4335" d="M30 20h6v12h-6z"/></svg>`,
  
  photos: `<svg viewBox="0 0 48 48"><path fill="#ea4335" d="M24 24V4a10 10 0 0 0-10 10 10 10 0 0 0 10 10z"/><path fill="#fbbc05" d="M24 24h20a10 10 0 0 0-10-10 10 10 0 0 0-10 10z"/><path fill="#34a853" d="M24 24v20a10 10 0 0 0 10-10 10 10 0 0 0-10-10z"/><path fill="#4285f4" d="M24 24H4a10 10 0 0 0 10 10 10 10 0 0 0 10-10z"/></svg>`,
  
  meet: `<svg viewBox="0 0 48 48"><rect width="24" height="24" x="4" y="12" fill="#00832d" rx="4"/><path fill="#00ac47" d="M28 20l12-8v24l-12-8v-8z"/><path fill="#ea4335" d="M28 12L4 36h24V12z" opacity="0.15"/><path fill="#ffba00" d="M4 16l24 16V16H4z" opacity="0.15"/></svg>`,
  
  youtube: `<svg viewBox="0 0 48 48"><rect width="42" height="30" x="3" y="9" fill="#ff0000" rx="8"/><path fill="#ffffff" d="M20 17l11 7-11 7v-14z"/></svg>`,
  
  sheets: `<svg viewBox="0 0 48 48"><path fill="#0f9d58" d="M30 4H12a4 4 0 0 0-4 4v32a4 4 0 0 0 4 4h24a4 4 0 0 0 4-4V14L30 4z"/><path fill="#87ceac" d="M30 4v10h10L30 4z"/><path fill="#ffffff" d="M14 20h20v14H14V20zm4 3v3h4v-3h-4zm6 0v3h6v-3h-6zm-6 5v3h4v-3h-4zm6 0v3h6v-3h-6z"/></svg>`,
  
  slides: `<svg viewBox="0 0 48 48"><path fill="#f4b400" d="M30 4H12a4 4 0 0 0-4 4v32a4 4 0 0 0 4 4h24a4 4 0 0 0 4-4V14L30 4z"/><path fill="#f7d16f" d="M30 4v10h10L30 4z"/><rect width="18" height="12" x="15" y="22" fill="#ffffff" rx="2"/><rect width="14" height="8" x="17" y="24" fill="#f4b400"/></svg>`,
  
  translate: `<svg viewBox="0 0 48 48"><path fill="#4285f4" d="M6 10h20v28H6z" rx="4"/><path fill="#ffffff" d="M16 16v3h4.5c-.5 2-2 4.5-4.5 6-1-1-1.5-2.5-2-4h-2.5c.5 2 1.5 4 3 5.5l-4 4 2 2 4-4 4 4 2-2-4-4c2-2 3.5-4.5 4-7.5H16z"/><path fill="#34a853" d="M22 18h20v24H22z" rx="4"/><text x="32" y="36" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle">A</text></svg>`,
  
  contacts: `<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" fill="#1a73e8"/><circle cx="24" cy="18" r="7" fill="#ffffff"/><path fill="#ffffff" d="M12 36c0-6 5.3-10 12-10s12 4 12 10v2H12v-2z"/></svg>`
};

// Default Google Services Configuration
const DEFAULT_GOOGLE_APPS = [
  { id: 'classroom', title: 'Classroom', url: 'https://classroom.google.com', icon: GOOGLE_ICONS.classroom, isFavorite: true },
  { id: 'account', title: 'Account', url: 'https://myaccount.google.com', icon: GOOGLE_ICONS.account, isFavorite: true },
  { id: 'keep', title: 'Keep', url: 'https://keep.google.com', icon: GOOGLE_ICONS.keep, isFavorite: true },
  { id: 'gmail', title: 'Gmail', url: 'https://mail.google.com', icon: GOOGLE_ICONS.gmail, isFavorite: true },
  { id: 'docs', title: 'Docs', url: 'https://docs.google.com', icon: GOOGLE_ICONS.docs, isFavorite: true },
  { id: 'search', title: 'Search', url: 'https://www.google.com', icon: GOOGLE_ICONS.search, isFavorite: true },
  { id: 'maps', title: 'Maps', url: 'https://maps.google.com', icon: GOOGLE_ICONS.maps, isFavorite: true },
  { id: 'drive', title: 'Drive', url: 'https://drive.google.com', icon: GOOGLE_ICONS.drive, isFavorite: true },
  { id: 'play', title: 'Play', url: 'https://play.google.com', icon: GOOGLE_ICONS.play, isFavorite: true },
  { id: 'gemini', title: 'Gemini', url: 'https://gemini.google.com', icon: GOOGLE_ICONS.gemini, isFavorite: false },
  { id: 'calendar', title: 'Calendar', url: 'https://calendar.google.com', icon: GOOGLE_ICONS.calendar, isFavorite: false },
  { id: 'chrome', title: 'Chrome', url: 'https://chromewebstore.google.com', icon: GOOGLE_ICONS.chrome, isFavorite: false },
  { id: 'news', title: 'News', url: 'https://news.google.com', icon: GOOGLE_ICONS.news, isFavorite: false },
  { id: 'photos', title: 'Photos', url: 'https://photos.google.com', icon: GOOGLE_ICONS.photos, isFavorite: false },
  { id: 'meet', title: 'Meet', url: 'https://meet.google.com', icon: GOOGLE_ICONS.meet, isFavorite: false },
  { id: 'youtube', title: 'YouTube', url: 'https://youtube.com', icon: GOOGLE_ICONS.youtube, isFavorite: false },
  { id: 'sheets', title: 'Sheets', url: 'https://sheets.google.com', icon: GOOGLE_ICONS.sheets, isFavorite: false },
  { id: 'slides', title: 'Slides', url: 'https://slides.google.com', icon: GOOGLE_ICONS.slides, isFavorite: false },
  { id: 'translate', title: 'Translate', url: 'https://translate.google.com', icon: GOOGLE_ICONS.translate, isFavorite: false },
  { id: 'contacts', title: 'Contacts', url: 'https://contacts.google.com', icon: GOOGLE_ICONS.contacts, isFavorite: false }
];

export class GoogleAppsMenu {
  constructor({ toggleBtnId, popoverId, onBeforeOpen }) {
    this.toggleBtn = document.getElementById(toggleBtnId);
    this.popover = document.getElementById(popoverId);
    this.onBeforeOpen = onBeforeOpen;
    this.isOpen = false;
    this.isEditMode = false;
    this.searchQuery = '';

    this.apps = this.loadAppsData();
  }

  init() {
    if (!this.toggleBtn || !this.popover) return;

    this.renderPopoverContent();
    this.bindEvents();
  }

  loadAppsData() {
    try {
      const stored = localStorage.getItem('google_apps_menu_data');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge stored favorites status with default app metadata
        return DEFAULT_GOOGLE_APPS.map(app => {
          const matched = parsed.find(item => item.id === app.id);
          return matched ? { ...app, isFavorite: matched.isFavorite } : app;
        });
      }
    } catch (e) {
      console.warn('Failed to load google apps menu data:', e);
    }
    return DEFAULT_GOOGLE_APPS;
  }

  saveAppsData() {
    try {
      const dataToSave = this.apps.map(app => ({
        id: app.id,
        isFavorite: app.isFavorite
      }));
      localStorage.setItem('google_apps_menu_data', JSON.stringify(dataToSave));
    } catch (e) {
      console.warn('Failed to save google apps menu data:', e);
    }
  }

  togglePopover() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      if (typeof this.onBeforeOpen === 'function') {
        this.onBeforeOpen();
      }
      this.popover.classList.add('active');
      this.toggleBtn.classList.add('active');
      document.getElementById('rightControlsSidebar')?.classList.add('has-open-popover');
    } else {
      this.closePopover();
    }
  }

  closePopover() {
    this.isOpen = false;
    this.isEditMode = false;
    this.popover.classList.remove('active', 'edit-mode');
    this.toggleBtn.classList.remove('active');
    document.getElementById('rightControlsSidebar')?.classList.remove('has-open-popover');
    const editBtn = this.popover.querySelector('.google-apps-edit-btn');
    if (editBtn) editBtn.classList.remove('active');
  }

  toggleEditMode() {
    this.isEditMode = !this.isEditMode;
    const editBtn = this.popover.querySelector('.google-apps-edit-btn');
    if (this.isEditMode) {
      this.popover.classList.add('edit-mode');
      if (editBtn) editBtn.classList.add('active');
    } else {
      this.popover.classList.remove('edit-mode');
      if (editBtn) editBtn.classList.remove('active');
    }
  }

  toggleFavorite(appId, event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const app = this.apps.find(a => a.id === appId);
    if (app) {
      app.isFavorite = !app.isFavorite;
      this.saveAppsData();
      this.renderBody();
    }
  }

  bindEvents() {
    // Toggle button click
    this.toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.togglePopover();
    });

    // Prevent clicks inside popover from closing it
    this.popover.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (this.isOpen && !this.popover.contains(e.target) && !this.toggleBtn.contains(e.target)) {
        this.closePopover();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.closePopover();
      }
    });
  }

  renderPopoverContent() {
    this.popover.innerHTML = `
      <div class="google-apps-header">
        <div class="google-apps-title-group">
          <span class="google-apps-title">Your favorites</span>
        </div>
        <button type="button" class="google-apps-edit-btn" title="Edit favorites">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
        </button>
      </div>

      <div class="google-apps-search-wrapper">
        <svg class="google-apps-search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <input type="text" class="google-apps-search-input" placeholder="Search Google services..." autocomplete="off">
      </div>

      <div class="google-apps-body">
        <!-- Injected dynamically -->
      </div>
    `;

    // Bind Edit button
    const editBtn = this.popover.querySelector('.google-apps-edit-btn');
    editBtn.addEventListener('click', () => this.toggleEditMode());

    // Bind Search Input
    const searchInput = this.popover.querySelector('.google-apps-search-input');
    searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      this.renderBody();
    });

    this.renderBody();
  }

  renderBody() {
    const bodyContainer = this.popover.querySelector('.google-apps-body');
    if (!bodyContainer) return;

    let filteredApps = this.apps;
    if (this.searchQuery) {
      filteredApps = this.apps.filter(app => 
        app.title.toLowerCase().includes(this.searchQuery)
      );
    }

    const favoriteApps = filteredApps.filter(app => app.isFavorite);
    const otherApps = filteredApps.filter(app => !app.isFavorite);

    let html = '';

    // Favorites Card Section
    if (favoriteApps.length > 0) {
      html += `
        <div class="google-apps-favorites-card">
          <div class="google-apps-grid">
            ${favoriteApps.map(app => this.createAppCardHtml(app)).join('')}
          </div>
        </div>
      `;
    }

    // Other Apps Section
    if (otherApps.length > 0) {
      html += `
        <div>
          ${favoriteApps.length > 0 ? '<div class="google-apps-section-label">More Google Services</div>' : ''}
          <div class="google-apps-grid">
            ${otherApps.map(app => this.createAppCardHtml(app)).join('')}
          </div>
        </div>
      `;
    }

    if (filteredApps.length === 0) {
      html = `<div style="text-align:center; padding: 2rem 0; color: rgba(255,255,255,0.4); font-size: 0.9rem;">No matching Google services found</div>`;
    }

    bodyContainer.innerHTML = html;

    // Attach pin toggle event listeners
    const pinBtns = bodyContainer.querySelectorAll('.google-app-pin-btn');
    pinBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const appId = btn.getAttribute('data-app-id');
        this.toggleFavorite(appId, e);
      });
    });
  }

  createAppCardHtml(app) {
    return `
      <a class="google-app-item" href="${app.url}" target="_blank" rel="noopener noreferrer" title="${app.title}">
        <button type="button" class="google-app-pin-btn ${app.isFavorite ? 'pinned' : ''}" data-app-id="${app.id}" title="${app.isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="${app.isFavorite ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
        </button>
        <div class="google-app-icon-wrapper">
          <div class="google-app-icon">${app.icon}</div>
        </div>
        <span class="google-app-label">${app.title}</span>
      </a>
    `;
  }
}
