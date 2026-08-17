/**
 * Bookmarks Viewer & Popover Menu Module
 * Converts bookmarks tree into a popover menu matching Google Apps UI with quick access grid,
 * tree search, instant synchronous caching, and native extension sync.
 */

export const DEFAULT_BOOKMARKS_TREE = [
  {
    id: 'menu',
    title: 'Bookmarks Menu',
    children: [
      { id: 'm1', title: 'Archive.org', url: 'https://archive.org' },
      { id: 'm2', title: 'GitHub', url: 'https://github.com' }
    ]
  },
  {
    id: 'toolbar',
    title: 'Bookmarks Toolbar',
    children: [
      { id: 't1', title: 'Hacker News', url: 'https://news.ycombinator.com' },
      { id: 't2', title: 'Fedora Docs', url: 'https://docs.fedoraproject.org' },
      { id: 't3', title: 'Fedora Magazine', url: 'https://fedoramagazine.org' },
      {
        id: 't4',
        title: 'Fedora Project',
        children: [
          { id: 'fp1', title: 'Fedora Wiki', url: 'https://fedoraproject.org/wiki' },
          { id: 'fp2', title: 'Fedora Packages', url: 'https://src.fedoraproject.org' }
        ]
      },
      {
        id: 't5',
        title: 'User Communities',
        children: [
          { id: 'uc1', title: 'Reddit Fedora', url: 'https://reddit.com/r/fedora' },
          { id: 'uc2', title: 'Fedora Forum', url: 'https://forums.fedoraforum.org' }
        ]
      },
      {
        id: 't6',
        title: 'Red Hat',
        children: [
          { id: 'rh1', title: 'Red Hat Portal', url: 'https://access.redhat.com' }
        ]
      },
      {
        id: 't7',
        title: 'Free Content',
        children: [
          { id: 'fc1', title: 'Wikipedia', url: 'https://wikipedia.org' }
        ]
      }
    ]
  }
];

export class BookmarksDrawer {
  constructor(options = {}) {
    this.popoverEl = document.getElementById('bookmarksPopover');
    this.toggleBtn = document.getElementById(options.toggleBtnId || 'bookmarksToggleBtn');
    this.container = document.getElementById(options.containerId || 'bookmarksTreeContainer');
    this.favoritesGridContainer = document.getElementById('bookmarksFavoritesGrid');
    this.searchInput = document.getElementById(options.searchId || 'bookmarksSearchInput');
    this.onBeforeOpen = options.onBeforeOpen;
    
    this.isOpen = false;
    this.treeData = [];
    this.extBookmarksAPI = (typeof browser !== 'undefined' && browser.bookmarks) || (typeof chrome !== 'undefined' && chrome.bookmarks);
  }

  init() {
    this.setupEventListeners();
    
    // 1. Load cached/default bookmarks SYNCHRONOUSLY for instant zero-delay render
    this.loadCachedBookmarks();
    this.render();

    // 2. Fetch native extension bookmarks asynchronously in background
    if (this.extBookmarksAPI) {
      this.syncExtensionBookmarks();
    }
  }

  setupEventListeners() {
    if (this.toggleBtn) {
      this.toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggle();
      });
    }

    if (this.popoverEl) {
      this.popoverEl.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }

    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.filterBookmarks(e.target.value.trim().toLowerCase());
      });
    }

    // Close when clicking outside popover
    document.addEventListener('click', (e) => {
      if (this.isOpen && this.popoverEl && !this.popoverEl.contains(e.target) && !this.toggleBtn.contains(e.target)) {
        this.close();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    const exportBtn = document.getElementById('exportBookmarksBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportBookmarksJSON());
    }

    const importBtn = document.getElementById('importBookmarksBtn');
    const importInput = document.getElementById('importBookmarksInput');
    if (importBtn && importInput) {
      importBtn.addEventListener('click', () => importInput.click());
      importInput.addEventListener('change', (e) => this.importBookmarksJSON(e));
    }
  }

  toggle() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      if (typeof this.onBeforeOpen === 'function') {
        this.onBeforeOpen();
      }
      if (this.popoverEl) this.popoverEl.classList.add('active');
      if (this.toggleBtn) this.toggleBtn.classList.add('active');
      document.getElementById('rightControlsSidebar')?.classList.add('has-open-popover');
    } else {
      this.close();
    }
  }

  close() {
    this.isOpen = false;
    if (this.popoverEl) {
      this.popoverEl.classList.remove('active');
    }
    if (this.toggleBtn) {
      this.toggleBtn.classList.remove('active');
    }
    document.getElementById('rightControlsSidebar')?.classList.remove('has-open-popover');
  }

  loadCachedBookmarks() {
    const saved = localStorage.getItem('user_bookmarks_tree');
    if (saved) {
      try {
        this.treeData = JSON.parse(saved);
      } catch (e) {
        this.treeData = DEFAULT_BOOKMARKS_TREE;
      }
    } else {
      this.treeData = DEFAULT_BOOKMARKS_TREE;
    }
  }

  async syncExtensionBookmarks() {
    try {
      const tree = await new Promise((resolve) => {
        if (this.extBookmarksAPI.getTree.length === 1) {
          this.extBookmarksAPI.getTree().then(resolve).catch(() => resolve(null));
        } else {
          this.extBookmarksAPI.getTree((res) => resolve(res));
        }
      });

      if (tree && tree.length > 0) {
        this.treeData = tree[0].children || tree;
        localStorage.setItem('user_bookmarks_tree', JSON.stringify(this.treeData));
        this.render();
      }
    } catch (e) {
      console.warn('Native extension bookmarks sync fallback', e);
    }
  }

  // Extract flat list of individual bookmark links for Quick Access grid
  flattenBookmarks(nodes) {
    let result = [];
    nodes.forEach(node => {
      if (node.url) {
        result.push(node);
      }
      if (node.children && node.children.length > 0) {
        result = result.concat(this.flattenBookmarks(node.children));
      }
    });
    return result;
  }

  render(filterText = '') {
    this.renderQuickAccessGrid(filterText);
    this.renderTreeView(filterText);
  }

  renderQuickAccessGrid(filterText = '') {
    if (!this.favoritesGridContainer) return;
    this.favoritesGridContainer.innerHTML = '';

    let flatList = this.flattenBookmarks(this.treeData);
    if (filterText) {
      flatList = flatList.filter(bm => bm.title.toLowerCase().includes(filterText) || (bm.url && bm.url.toLowerCase().includes(filterText)));
    }

    const topItems = flatList.slice(0, 6);
    const quickCard = document.getElementById('bookmarksQuickCard');
    if (topItems.length === 0) {
      if (quickCard) quickCard.style.display = 'none';
      return;
    }

    if (quickCard) quickCard.style.display = 'block';

    topItems.forEach(item => {
      const faviconUrl = item.url ? `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(item.url)}&size=64` : '';
      const anchor = document.createElement('a');
      anchor.className = 'bm-grid-item';
      anchor.href = item.url || '#';
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.title = item.title;

      anchor.innerHTML = `
        <div class="bm-grid-icon-wrapper">
          <img class="bm-grid-icon" src="${faviconUrl}" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'24\\' height=\\'24\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'white\\' stroke-width=\\'2\\'><path d=\\'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71\\'/></svg>'"/>
        </div>
        <span class="bm-grid-label">${item.title}</span>
      `;
      this.favoritesGridContainer.appendChild(anchor);
    });
  }

  renderTreeView(filterText = '') {
    if (!this.container) return;
    this.container.innerHTML = '';

    const rootList = document.createElement('div');
    rootList.className = 'bm-children';

    this.treeData.forEach(node => {
      const nodeEl = this.createTreeNode(node, filterText);
      if (nodeEl) rootList.appendChild(nodeEl);
    });

    this.container.appendChild(rootList);
  }

  createTreeNode(node, filterText = '') {
    const isFolder = node.children && node.children.length > 0;
    
    // Filter logic
    if (filterText) {
      if (!isFolder) {
        const matches = node.title.toLowerCase().includes(filterText) || (node.url && node.url.toLowerCase().includes(filterText));
        if (!matches) return null;
      }
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'bm-node';

    const item = document.createElement(isFolder ? 'div' : 'a');
    item.className = 'bm-item';
    if (!isFolder) {
      item.href = node.url || '#';
      item.target = '_blank';
      item.rel = 'noopener noreferrer';
    }

    let toggleIconHtml = '';
    let iconHtml = '';

    if (isFolder) {
      toggleIconHtml = `<span class="bm-toggle-icon expanded">❯</span>`;
      iconHtml = `<svg class="bm-icon bm-folder-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`;
    } else {
      toggleIconHtml = `<span style="width:14px;"></span>`;
      const faviconUrl = node.url ? `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(node.url)}&size=32` : '';
      iconHtml = `<img class="bm-icon" src="${faviconUrl}" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'16\\' height=\\'16\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'white\\' stroke-width=\\'2\\'><path d=\\'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71\\'/></svg>'"/>`;
    }

    item.innerHTML = `
      ${toggleIconHtml}
      ${iconHtml}
      <span class="bm-title">${node.title}</span>
    `;

    wrapper.appendChild(item);

    if (isFolder) {
      const childrenContainer = document.createElement('div');
      childrenContainer.className = 'bm-children';

      let visibleChildrenCount = 0;
      node.children.forEach(child => {
        const childEl = this.createTreeNode(child, filterText);
        if (childEl) {
          childrenContainer.appendChild(childEl);
          visibleChildrenCount++;
        }
      });

      if (filterText && visibleChildrenCount === 0 && !node.title.toLowerCase().includes(filterText)) {
        return null;
      }

      wrapper.appendChild(childrenContainer);

      const toggleBtn = item.querySelector('.bm-toggle-icon');
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const isCollapsed = childrenContainer.classList.toggle('collapsed');
        if (toggleBtn) {
          toggleBtn.classList.toggle('expanded', !isCollapsed);
        }
      });
    }

    return wrapper;
  }

  filterBookmarks(text) {
    this.render(text);
  }

  exportBookmarksJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.treeData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "browser_homepage_bookmarks.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  importBookmarksJSON(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (Array.isArray(imported)) {
          this.treeData = imported;
          localStorage.setItem('user_bookmarks_tree', JSON.stringify(this.treeData));
          this.render();
        }
      } catch (err) {
        alert('Invalid Bookmarks JSON file');
      }
    };
    reader.readAsText(file);
  }
}
