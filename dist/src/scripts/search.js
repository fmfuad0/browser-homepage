/**
 * Search Engine Manager Module
 * Handles queries, engine switching, and search focus background blur effect.
 */

export const SEARCH_ENGINES = [
  { id: 'google', name: 'Google', url: 'https://www.google.com/search?q=', icon: 'https://www.google.com/favicon.ico' },
  { id: 'duckduckgo', name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=', icon: 'https://duckduckgo.com/favicon.ico' },
  { id: 'bing', name: 'Bing', url: 'https://www.bing.com/search?q=', icon: 'https://www.bing.com/favicon.ico' },
  { id: 'youtube', name: 'YouTube', url: 'https://www.youtube.com/results?search_query=', icon: 'https://www.youtube.com/favicon.ico' },
  { id: 'ecosia', name: 'Ecosia', url: 'https://www.ecosia.org/search?q=', icon: 'https://www.ecosia.org/favicon.ico' }
];

export class SearchManager {
  constructor(options = {}) {
    this.formEl = document.getElementById(options.formId || 'searchForm');
    this.inputEl = document.getElementById(options.inputId || 'searchInput');
    this.engineBtn = document.getElementById(options.engineBtnId || 'searchEngineBtn');
    this.engineIconEl = document.getElementById(options.engineIconId || 'searchEngineIcon');
    
    this.activeEngine = SEARCH_ENGINES[0];
  }

  init() {
    this.loadEngine();
    this.setupEventListeners();
  }

  loadEngine() {
    const savedId = localStorage.getItem('search_engine_id') || 'google';
    const engine = SEARCH_ENGINES.find(e => e.id === savedId) || SEARCH_ENGINES[0];
    this.activeEngine = engine;
    this.renderEngine();
  }

  renderEngine() {
    if (this.engineIconEl) {
      this.engineIconEl.src = this.activeEngine.icon;
      this.engineIconEl.alt = this.activeEngine.name;
    }
  }

  setEngine(engineId) {
    const engine = SEARCH_ENGINES.find(e => e.id === engineId);
    if (engine) {
      this.activeEngine = engine;
      localStorage.setItem('search_engine_id', engine.id);
      this.renderEngine();
    }
  }

  setupEventListeners() {
    if (this.formEl) {
      this.formEl.addEventListener('submit', (e) => {
        e.preventDefault();
        this.executeSearch();
      });

      // Background blur effect on search focus / hover
      this.formEl.addEventListener('mouseenter', () => {
        document.body.classList.add('search-focused');
      });

      this.formEl.addEventListener('mouseleave', () => {
        if (document.activeElement !== this.inputEl) {
          document.body.classList.remove('search-focused');
        }
      });
    }

    if (this.inputEl) {
      this.inputEl.addEventListener('focus', () => {
        document.body.classList.add('search-focused');
      });

      this.inputEl.addEventListener('blur', () => {
        document.body.classList.remove('search-focused');
      });
    }

    if (this.engineBtn) {
      this.engineBtn.addEventListener('click', () => {
        const nextIndex = (SEARCH_ENGINES.indexOf(this.activeEngine) + 1) % SEARCH_ENGINES.length;
        this.setEngine(SEARCH_ENGINES[nextIndex].id);
      });
    }
  }

  executeSearch() {
    if (!this.inputEl || !this.inputEl.value.trim()) return;
    const query = encodeURIComponent(this.inputEl.value.trim());
    window.location.href = this.activeEngine.url + query;
  }
}
