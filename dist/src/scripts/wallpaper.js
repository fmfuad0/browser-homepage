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
    
    // Load preset wallpaper instantly first
    this.loadPresetWallpaper(savedId);

    // Initialize DB asynchronously for custom wallpapers
    this.initDB().then(async () => {
      if (savedId.startsWith('custom-')) {
        await this.loadCustomWallpaperFromDB(savedId);
      }
    });
  }

  initDB() {
    return new Promise((resolve) => {
      const request = indexedDB.open('BrowserHomepageDB', 2);
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
    if (!this.db) return;
    const customWp = await new Promise((resolve) => {
      const tx = this.db.transaction('wallpapers', 'readonly');
      const store = tx.objectStore('wallpapers');
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });

    if (customWp && customWp.blob) {
      if (this.customObjectUrl) {
        URL.revokeObjectURL(this.customObjectUrl);
      }
      this.customObjectUrl = URL.createObjectURL(customWp.blob);
      customWp.url = this.customObjectUrl;
      this.applyWallpaper(customWp);
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

  async saveCustomWallpaper(file) {
    if (!this.db) return null;
    const isVideo = file.type.startsWith('video/');
    
    // Store actual File/Blob object in IndexedDB
    const wpRecord = {
      id: 'custom-' + Date.now(),
      name: file.name,
      type: isVideo ? 'video' : 'image',
      blob: file, // File is a subclass of Blob
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
}
