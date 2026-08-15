/**
 * Shortcuts Launcher Manager Module
 * Instant loading + URL-specific favicon resolution + Edit modal
 */

export const DEFAULT_SHORTCUTS = [
  { id: '1', title: 'YouTube', url: 'https://youtube.com', icon: '' },
  { id: '2', title: 'Google', url: 'https://google.com', icon: '' },
  { id: '3', title: 'Pinterest', url: 'https://pinterest.com', icon: '' },
  { id: '4', title: 'Steam', url: 'https://store.steampowered.com', icon: '' }
];

export class ShortcutsManager {
  constructor(options = {}) {
    this.container = document.getElementById(options.containerId || 'shortcutsContainer');
    this.addModalEl = document.getElementById(options.modalId || 'addShortcutModal');
    this.addFormEl = document.getElementById(options.formId || 'addShortcutForm');
    
    this.editModalEl = document.getElementById('editShortcutModal');
    this.editFormEl = document.getElementById('editShortcutForm');

    this.shortcuts = [];
    this.editingId = null;
  }

  init() {
    this.loadShortcuts();
    this.render(); // Instant synchronous render
    this.setupEventListeners();
  }

  loadShortcuts() {
    const saved = localStorage.getItem('user_shortcuts');
    if (saved) {
      try {
        this.shortcuts = JSON.parse(saved);
      } catch (e) {
        this.shortcuts = DEFAULT_SHORTCUTS;
      }
    } else {
      this.shortcuts = DEFAULT_SHORTCUTS;
    }
  }

  saveShortcuts() {
    localStorage.setItem('user_shortcuts', JSON.stringify(this.shortcuts));
  }

  getFaviconUrl(urlStr, customIcon) {
    if (customIcon && customIcon.trim()) return customIcon.trim();
    try {
      const fullUrl = urlStr.startsWith('http') ? urlStr : 'https://' + urlStr;
      // Google faviconV2 service resolves full URL paths (e.g. docs.google.com/document vs docs.google.com/spreadsheets)
      return `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(fullUrl)}&size=64`;
    } catch (e) {
      return `https://www.google.com/s2/favicons?domain=google.com&sz=64`;
    }
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = '';

    // Render Shortcut Tiles
    this.shortcuts.forEach(sc => {
      const card = document.createElement('a');
      card.className = 'shortcut-card fade-in';
      card.href = sc.url;
      card.target = '_self';
      
      const faviconUrl = this.getFaviconUrl(sc.url, sc.icon);

      card.innerHTML = `
        <button class="shortcut-options-btn" data-id="${sc.id}" title="Edit Shortcut">⋮</button>
        <div class="shortcut-icon-wrapper">
          <img class="shortcut-icon" src="${faviconUrl}" alt="${sc.title}" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'24\\' height=\\'24\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'white\\' stroke-width=\\'2\\'><circle cx=\\'12\\' cy=\\'12\\' r=\\'10\\'/></svg>'"/>
        </div>
        <span class="shortcut-title">${sc.title}</span>
      `;

      // Option button edit event listener
      const editBtn = card.querySelector('.shortcut-options-btn');
      editBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.openEditModal(sc.id);
      });

      this.container.appendChild(card);
    });

    // Render '+' Add Card Tile
    const addCard = document.createElement('div');
    addCard.className = 'shortcut-add-card fade-in';
    addCard.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
    `;
    addCard.title = 'Add Shortcut';
    addCard.addEventListener('click', () => this.openAddModal());

    this.container.appendChild(addCard);
  }

  openAddModal() {
    if (this.addModalEl) {
      this.addModalEl.classList.add('open');
      const titleInput = document.getElementById('shortcutTitleInput');
      if (titleInput) titleInput.focus();
    }
  }

  closeAddModal() {
    if (this.addModalEl) {
      this.addModalEl.classList.remove('open');
      if (this.addFormEl) this.addFormEl.reset();
    }
  }

  openEditModal(id) {
    const sc = this.shortcuts.find(s => s.id === id);
    if (!sc || !this.editModalEl) return;

    this.editingId = id;
    const titleInput = document.getElementById('editShortcutTitleInput');
    const urlInput = document.getElementById('editShortcutUrlInput');
    const iconInput = document.getElementById('editShortcutIconInput');

    if (titleInput) titleInput.value = sc.title;
    if (urlInput) urlInput.value = sc.url;
    if (iconInput) iconInput.value = sc.icon || '';

    this.editModalEl.classList.add('open');
  }

  closeEditModal() {
    if (this.editModalEl) {
      this.editModalEl.classList.remove('open');
      this.editingId = null;
      if (this.editFormEl) this.editFormEl.reset();
    }
  }

  setupEventListeners() {
    // Add Modal cancel/backdrop
    const cancelAddBtn = document.getElementById('cancelShortcutBtn');
    if (cancelAddBtn) {
      cancelAddBtn.addEventListener('click', () => this.closeAddModal());
    }

    if (this.addModalEl) {
      this.addModalEl.addEventListener('click', (e) => {
        if (e.target === this.addModalEl) this.closeAddModal();
      });
    }

    // Add Form Submit
    if (this.addFormEl) {
      this.addFormEl.addEventListener('submit', (e) => {
        e.preventDefault();
        const titleInput = document.getElementById('shortcutTitleInput');
        const urlInput = document.getElementById('shortcutUrlInput');
        const iconInput = document.getElementById('shortcutIconInput');

        if (titleInput && urlInput && urlInput.value) {
          let url = urlInput.value.trim();
          if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
          }
          
          const newShortcut = {
            id: String(Date.now()),
            title: titleInput.value.trim(),
            url: url,
            icon: iconInput ? iconInput.value.trim() : ''
          };

          this.shortcuts.push(newShortcut);
          this.saveShortcuts();
          this.render();
          this.closeAddModal();
        }
      });
    }

    // Edit Modal cancel/backdrop/delete
    const cancelEditBtn = document.getElementById('cancelEditShortcutBtn');
    if (cancelEditBtn) {
      cancelEditBtn.addEventListener('click', () => this.closeEditModal());
    }

    const deleteEditBtn = document.getElementById('deleteShortcutBtn');
    if (deleteEditBtn) {
      deleteEditBtn.addEventListener('click', () => {
        if (this.editingId) {
          this.removeShortcut(this.editingId);
          this.closeEditModal();
        }
      });
    }

    if (this.editModalEl) {
      this.editModalEl.addEventListener('click', (e) => {
        if (e.target === this.editModalEl) this.closeEditModal();
      });
    }

    // Edit Form Submit
    if (this.editFormEl) {
      this.editFormEl.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!this.editingId) return;

        const titleInput = document.getElementById('editShortcutTitleInput');
        const urlInput = document.getElementById('editShortcutUrlInput');
        const iconInput = document.getElementById('editShortcutIconInput');

        const scIndex = this.shortcuts.findIndex(s => s.id === this.editingId);
        if (scIndex !== -1 && titleInput && urlInput) {
          let url = urlInput.value.trim();
          if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
          }

          this.shortcuts[scIndex] = {
            ...this.shortcuts[scIndex],
            title: titleInput.value.trim(),
            url: url,
            icon: iconInput ? iconInput.value.trim() : ''
          };

          this.saveShortcuts();
          this.render();
          this.closeEditModal();
        }
      });
    }
  }

  removeShortcut(id) {
    this.shortcuts = this.shortcuts.filter(s => s.id !== id);
    this.saveShortcuts();
    this.render();
  }
}
