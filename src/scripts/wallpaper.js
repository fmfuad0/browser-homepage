/**
 * Wallpaper & Audio Engine
 * Supports video loops, static images, ambient audio, and persistent custom uploads using IndexedDB.
 */

export const PRESET_WALLPAPERS = [
  {
    id: 'lofi-room',
    name: 'Cozy Lo-Fi Room',
    type: 'video',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-cozy-living-room-with-a-fireplace-at-night-42864-large.mp4',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
    poster: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'cyberpunk-city',
    name: 'Cyberpunk Rain',
    type: 'video',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-rain-drops-on-a-window-pane-at-night-41544-large.mp4',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2021/09/06/audio_8b7e28ff0b.mp3?filename=rain-and-thunder-16705.mp3',
    poster: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'serene-nature',
    name: 'Serene Nature',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=85',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=forest-birds-109033.mp3',
    poster: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80'
  }
];

export class WallpaperEngine {
  constructor(options = {}) {
    this.container = document.getElementById(options.containerId || 'backgroundContainer');
    this.audioBtn = document.getElementById(options.audioBtnId || 'audioToggleBtn');
    this.volumeSlider = document.getElementById(options.volumeSliderId || 'volumeSlider');
    this.bgMediaEl = null;

    this.audioEl = new Audio();
    this.audioEl.loop = true;
    this.isPlayingAudio = false;

    this.activeWallpaper = null;
    this.db = null;
    this.customObjectUrl = null;
  }

  async init() {
    this.setupEventListeners();
    const savedId = localStorage.getItem('active_wallpaper_id') || 'lofi-room';
    
    // Load preset wallpaper instantly first for zero page load latency
    this.loadPresetWallpaper(savedId);

    // Initialize DB asynchronously for custom wallpapers without blocking main thread
    this.initDB().then(async () => {
      if (savedId.startsWith('custom-')) {
        await this.loadCustomWallpaperFromDB(savedId);
      }
    });
  }

  initDB() {
    return new Promise((resolve) => {
      const request = indexedDB.open('BrowserHomepageDB', 3);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('wallpapers')) {
          db.createObjectStore('wallpapers', { keyPath: 'id' });
        }
      };
      request.onsuccess = (e) => {
        this.db = e.target.result;
        resolve(this.db);
      };
      request.onerror = () => resolve(null);
    });
  }

  setupEventListeners() {
    if (this.audioBtn) {
      this.audioBtn.addEventListener('click', () => this.toggleAudio());
    }

    if (this.volumeSlider) {
      const savedVol = localStorage.getItem('audio_volume') || '0.5';
      this.volumeSlider.value = savedVol;
      this.audioEl.volume = parseFloat(savedVol);

      this.volumeSlider.addEventListener('input', (e) => {
        const vol = parseFloat(e.target.value);
        this.audioEl.volume = vol;
        localStorage.setItem('audio_volume', vol);
      });
    }
  }

  toggleAudio() {
    if (!this.audioEl.src) return;

    if (this.isPlayingAudio) {
      this.audioEl.pause();
      this.isPlayingAudio = false;
      if (this.audioBtn) this.audioBtn.classList.remove('playing');
    } else {
      this.audioEl.play().then(() => {
        this.isPlayingAudio = true;
        if (this.audioBtn) this.audioBtn.classList.add('playing');
      }).catch(err => console.warn('Audio play blocked:', err));
    }
  }

  loadPresetWallpaper(id) {
    let wp = PRESET_WALLPAPERS.find(w => w.id === id) || PRESET_WALLPAPERS[0];
    this.applyWallpaper(wp);
  }

  async loadCustomWallpaperFromDB(id) {
    if (!this.db) await this.initDB();
    if (!this.db) return;

    const customWp = await new Promise((resolve) => {
      const tx = this.db.transaction('wallpapers', 'readonly');
      const store = tx.objectStore('wallpapers');
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });

    if (!customWp) return;

    try {
      let fileBlob = customWp.blob;
      if (!fileBlob && customWp.handle) {
        // If handle permission is needed, query/request permission
        const perm = await customWp.handle.queryPermission({ mode: 'read' });
        if (perm === 'granted' || (await customWp.handle.requestPermission({ mode: 'read' })) === 'granted') {
          fileBlob = await customWp.handle.getFile();
        }
      }

      if (fileBlob) {
        if (this.customObjectUrl) {
          URL.revokeObjectURL(this.customObjectUrl);
        }
        this.customObjectUrl = URL.createObjectURL(fileBlob);
        const resolvedWp = {
          ...customWp,
          url: this.customObjectUrl
        };
        this.applyWallpaper(resolvedWp);
      }
    } catch (err) {
      console.warn('Failed to load custom wallpaper from storage:', err);
    }
  }

  applyWallpaper(wp) {
    this.activeWallpaper = wp;
    localStorage.setItem('active_wallpaper_id', wp.id);

    this.container.innerHTML = '';

    if (wp.type === 'video') {
      const video = document.createElement('video');
      video.className = 'background-media';
      video.id = 'bgMedia';
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.src = wp.url;
      if (wp.poster) video.poster = wp.poster;
      
      this.container.appendChild(video);
      this.bgMediaEl = video;
    } else {
      const img = document.createElement('img');
      img.className = 'background-media';
      img.id = 'bgMedia';
      img.src = wp.url;
      img.alt = 'Wallpaper';
      
      this.container.appendChild(img);
      this.bgMediaEl = img;
    }

    if (wp.audioUrl) {
      this.audioEl.src = wp.audioUrl;
    } else {
      this.audioEl.src = '';
    }

    // Re-apply focus blur settings if applicable
    const focusBlur = localStorage.getItem('search_focus_blur') || '12';
    document.documentElement.style.setProperty('--search-blur-amount', `${focusBlur}px`);
  }

  // Utility to determine media type from extension or mime
  static isSupportedMedia(filename, mimeType = '') {
    const ext = filename.split('.').pop().toLowerCase();
    const videoExts = ['mp4', 'webm', 'ogv', 'mov', 'm4v', 'mkv'];
    const imageExts = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'svg'];

    if (mimeType.startsWith('video/') || videoExts.includes(ext)) {
      return { supported: true, type: 'video' };
    }
    if (mimeType.startsWith('image/') || imageExts.includes(ext)) {
      return { supported: true, type: 'image' };
    }
    return { supported: false, type: null };
  }

  async saveCustomWallpaper(file) {
    const media = WallpaperEngine.isSupportedMedia(file.name, file.type);
    if (!media.supported) return null;
    if (!this.db) await this.initDB();
    if (!this.db) return null;

    const wpRecord = {
      id: 'custom-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      name: file.name,
      type: media.type,
      blob: file,
      timestamp: Date.now()
    };

    await new Promise((resolve, reject) => {
      const tx = this.db.transaction('wallpapers', 'readwrite');
      const store = tx.objectStore('wallpapers');
      const req = store.put(wpRecord);
      req.onsuccess = () => resolve(true);
      req.onerror = (e) => reject(e);
    });

    await this.loadCustomWallpaperFromDB(wpRecord.id);
    return wpRecord;
  }

  async saveCustomFiles(files) {
    if (!this.db) await this.initDB();
    if (!this.db) return [];

    const fileArray = Array.from(files);
    const validRecords = [];

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const media = WallpaperEngine.isSupportedMedia(file.name, file.type);
      if (media.supported) {
        validRecords.push({
          id: 'custom-' + Date.now() + '-' + i + '-' + Math.random().toString(36).substring(2, 6),
          name: file.name,
          type: media.type,
          blob: file,
          timestamp: Date.now()
        });
      }
    }

    if (validRecords.length === 0) return [];

    await new Promise((resolve, reject) => {
      const tx = this.db.transaction('wallpapers', 'readwrite');
      const store = tx.objectStore('wallpapers');
      validRecords.forEach(rec => store.put(rec));
      tx.oncomplete = () => resolve(true);
      tx.onerror = (e) => reject(e);
    });

    return validRecords;
  }

  async scanAndSaveDirectoryHandle(dirHandle) {
    if (!this.db) await this.initDB();
    if (!this.db) return [];

    const validRecords = [];
    let counter = 0;

    const scanDir = async (handle) => {
      for await (const entry of handle.values()) {
        if (entry.kind === 'file') {
          const media = WallpaperEngine.isSupportedMedia(entry.name);
          if (media.supported) {
            try {
              const file = await entry.getFile();
              validRecords.push({
                id: 'custom-' + Date.now() + '-' + (counter++) + '-' + Math.random().toString(36).substring(2, 6),
                name: entry.name,
                type: media.type,
                blob: file,
                handle: entry,
                timestamp: Date.now()
              });
            } catch (err) {
              console.warn('Skipping file from handle read error:', entry.name, err);
            }
          }
        } else if (entry.kind === 'directory') {
          // Scan top-level subdirectories as well
          await scanDir(entry);
        }
      }
    };

    await scanDir(dirHandle);

    if (validRecords.length === 0) return [];

    await new Promise((resolve, reject) => {
      const tx = this.db.transaction('wallpapers', 'readwrite');
      const store = tx.objectStore('wallpapers');
      validRecords.forEach(rec => store.put(rec));
      tx.oncomplete = () => resolve(true);
      tx.onerror = (e) => reject(e);
    });

    return validRecords;
  }

  async getAllCustomWallpapers() {
    if (!this.db) await this.initDB();
    if (!this.db) return [];

    return new Promise((resolve) => {
      const tx = this.db.transaction('wallpapers', 'readonly');
      const store = tx.objectStore('wallpapers');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  }

  async deleteCustomWallpaper(id) {
    if (!this.db) await this.initDB();
    if (!this.db) return false;

    return new Promise((resolve) => {
      const tx = this.db.transaction('wallpapers', 'readwrite');
      const store = tx.objectStore('wallpapers');
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  }

  async clearAllCustomWallpapers() {
    if (!this.db) await this.initDB();
    if (!this.db) return false;

    return new Promise((resolve) => {
      const tx = this.db.transaction('wallpapers', 'readwrite');
      const store = tx.objectStore('wallpapers');
      const req = store.clear();
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  }
}

