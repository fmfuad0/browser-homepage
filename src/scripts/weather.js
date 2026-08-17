/**
 * Real-time Weather & Dynamic Greeting Module
 * Accurate weather fetching WITHOUT requiring browser location permissions.
 * Strategy:
 * 1. Random cool intro text sequence on every page reload
 * 2. Smooth transition to dynamic greeting generated from local time, weather, and user profile
 * 3. User-configured City (saved in LocalStorage)
 * 4. Automatic IP-based Geolocation via ipapi.co (Zero permission popups)
 * 5. Open-Meteo Geocoding API for manual City Search in Settings
 */

const COOL_INTRO_TEXTS = [
  "Welcome back, space cowboy 🚀",
  "Ready to conquer the day? ✨",
  "Systems operational. Standby... ⚡",
  "Crafting digital magic... 🌌",
  "Your tab, your universe. 🪐",
  "A fresh perspective awaits. 🌿",
  "Unlocking infinite possibilities... 🔮",
  "Good vibes loading... ☀️",
  "Stay curious, stay inspired. 💡",
  "Making waves in the digital realm. 🌊",
  "The canvas is yours. 🎨",
  "Sparkling new moment initialized. 🎆",
  "Zero distractions. Full focus. 🎯",
  "Chasing horizons today. 🌅",
  "Fuelled by passion & energy. ⚡",
  "Creating awesome things... 🛠️",
  "Welcome to your sanctuary. 🌸",
  "Leveling up today. 🎮"
];

export class WeatherGreetingService {
  constructor(options = {}) {
    this.headingEl = document.getElementById(options.headingId || 'greetingHeading');
    this.subtextEl = document.getElementById(options.subtextId || 'greetingSubtext');
    this.badgeEl = document.getElementById(options.badgeId || 'weatherBadge');
    
    this.tempUnit = localStorage.getItem('temp_unit') || 'C'; // 'C' or 'F'
    this.currentWeather = null;
    this.introActive = false;
  }

  async init() {
    this.setupEventListeners();

    // 1. Instant cool intro text — shown immediately on page load
    this.showCoolIntro();

    // 2. Load cached weather data silently
    const cached = localStorage.getItem('cached_weather_data');
    if (cached) {
      try {
        this.currentWeather = JSON.parse(cached);
        this.renderWeatherBadge();
      } catch (e) {}
    }

    // 3. After a short moment, crossfade to real dynamic greeting
    setTimeout(() => this.transitionToRealGreeting(), 2500);

    // 4. Fetch fresh weather asynchronously in background
    this.fetchWeather().catch(err => console.warn('Background weather update failed:', err));
  }

  showCoolIntro() {
    const intro = COOL_INTRO_TEXTS[Math.floor(Math.random() * COOL_INTRO_TEXTS.length)];
    if (this.headingEl) {
      this.headingEl.textContent = intro;
    }
    if (this.subtextEl) {
      this.subtextEl.innerHTML = `<span>Your browser. Your universe.</span>`;
    }
    this.introActive = true;
  }

  transitionToRealGreeting() {
    this.introActive = false;
    // Fade out
    if (this.headingEl) {
      this.headingEl.classList.add('fade-transition');
    }
    if (this.subtextEl) {
      this.subtextEl.classList.add('fade-transition');
    }
    setTimeout(() => {
      this.updateGreetingHeading();
      this.updateGreetingSubtext();
      // Fade back in
      if (this.headingEl) this.headingEl.classList.remove('fade-transition');
      if (this.subtextEl) this.subtextEl.classList.remove('fade-transition');
    }, 380);
  }

  setupEventListeners() {
    if (this.badgeEl) {
      this.badgeEl.addEventListener('click', () => {
        this.tempUnit = this.tempUnit === 'C' ? 'F' : 'C';
        localStorage.setItem('temp_unit', this.tempUnit);
        this.renderWeatherBadge();
      });
    }
  }

  updateGreetingHeading() {
    const hour = new Date().getHours();
    let greeting = 'Good Morning';

    if (hour >= 5 && hour < 12) {
      greeting = 'Good Morning';
    } else if (hour >= 12 && hour < 17) {
      greeting = 'Good Afternoon';
    } else if (hour >= 17 && hour < 22) {
      greeting = 'Good Evening';
    } else {
      greeting = 'Good Night';
    }

    // Enhance greeting dynamically with weather condition if available
    if (this.currentWeather) {
      const code = this.currentWeather.code;
      if (code === 0 && hour >= 5 && hour < 12) {
        greeting = 'Sunny Morning';
      } else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
        greeting = 'Rainy Day';
      } else if (code >= 95) {
        greeting = 'Stormy Weather';
      }
    }

    const userName = (localStorage.getItem('user_display_name') || '').trim();
    if (userName) {
      greeting += `, ${userName}`;
    }
    greeting += ' 👋';

    if (this.headingEl) {
      this.headingEl.textContent = greeting;
    }
    return greeting;
  }

  /**
   * Resolves location WITHOUT browser permission prompts:
   * 1. Check custom saved city in LocalStorage
   * 2. Cached IP Geolocation
   * 3. Automatic IP-based Geolocation via ipapi.co (Zero permission popups)
   */
  async getLocation() {
    const saved = localStorage.getItem('user_weather_location');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.lat && parsed.lon) return parsed;
      } catch (e) {
        console.warn('Invalid saved weather location');
      }
    }

    const cachedIPLoc = localStorage.getItem('cached_ip_location');
    if (cachedIPLoc) {
      try {
        const parsedIP = JSON.parse(cachedIPLoc);
        if (parsedIP.lat && parsedIP.lon) {
          // Trigger async update in background without delaying return
          this.getLocationByIP().then(fresh => {
            if (fresh) localStorage.setItem('cached_ip_location', JSON.stringify(fresh));
          }).catch(() => {});
          return parsedIP;
        }
      } catch (e) {}
    }

    const ipLoc = await this.getLocationByIP();
    if (ipLoc) {
      localStorage.setItem('cached_ip_location', JSON.stringify(ipLoc));
    }
    return ipLoc;
  }

  async getLocationByIP() {
    try {
      const res = await fetch('https://ipapi.co/json/');
      if (res.ok) {
        const data = await res.json();
        if (data.latitude && data.longitude) {
          return {
            lat: data.latitude,
            lon: data.longitude,
            city: data.city || data.region || 'Local'
          };
        }
      }
    } catch (e) {
      console.warn('ipapi.co lookup failed, trying secondary IP service', e);
    }

    try {
      const res2 = await fetch('http://ip-api.com/json/');
      if (res2.ok) {
        const data2 = await res2.json();
        if (data2.lat && data2.lon) {
          return {
            lat: data2.lat,
            lon: data2.lon,
            city: data2.city || 'Local'
          };
        }
      }
    } catch (e) {
      console.warn('Secondary IP lookup failed');
    }

    return { lat: 40.7128, lon: -74.0060, city: 'New York' };
  }

  static async searchCities(query) {
    if (!query || query.trim().length < 2) return [];
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=5&language=en&format=json`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.results) {
          return data.results.map(r => ({
            name: r.name,
            country: r.country || '',
            admin1: r.admin1 || '',
            lat: r.latitude,
            lon: r.longitude,
            label: `${r.name}${r.admin1 ? ', ' + r.admin1 : ''}${r.country ? ', ' + r.country : ''}`
          }));
        }
      }
    } catch (e) {
      console.error('City geocoding search error:', e);
    }
    return [];
  }

  async setLocation(lat, lon, cityName) {
    const locObj = { lat, lon, city: cityName };
    localStorage.setItem('user_weather_location', JSON.stringify(locObj));
    await this.fetchWeather();
  }

  async clearCustomLocation() {
    localStorage.removeItem('user_weather_location');
    localStorage.removeItem('cached_ip_location');
    await this.fetchWeather();
  }

  async fetchWeather() {
    try {
      const loc = await this.getLocation();
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current_weather=true`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error('Weather API request failed');
      
      const data = await res.json();
      this.currentWeather = {
        tempC: Math.round(data.current_weather.temperature),
        code: data.current_weather.weathercode,
        city: loc.city || 'Local'
      };

      // Save to cache for instant loading on next reload
      localStorage.setItem('cached_weather_data', JSON.stringify(this.currentWeather));

      this.renderWeatherBadge();
      // Only update greeting text if intro has already finished transitioning
      if (!this.introActive) {
        this.updateGreetingHeading();
        this.updateGreetingSubtext();
      }
    } catch (err) {
      console.error('Failed to fetch weather:', err);
      if (this.subtextEl && !this.currentWeather && !this.introActive) {
        this.subtextEl.innerHTML = `<span>Mellow start to the day.</span>`;
      }
    }
  }

  renderWeatherBadge() {
    if (!this.badgeEl || !this.currentWeather) return;

    const temp = this.tempUnit === 'F' 
      ? Math.round((this.currentWeather.tempC * 9/5) + 32)
      : this.currentWeather.tempC;
    
    const icon = this.getWeatherIcon(this.currentWeather.code);
    this.badgeEl.innerHTML = `${icon} <span>${temp}°${this.tempUnit} • ${this.currentWeather.city}</span>`;
  }

  getWeatherIcon(code) {
    if (code === 0) return '☀️';
    if (code >= 1 && code <= 3) return '🌤️';
    if (code === 45 || code === 48) return '🌫️';
    if (code >= 51 && code <= 67) return '🌧️';
    if (code >= 71 && code <= 77) return '❄️';
    if (code >= 80 && code <= 82) return '🌦️';
    if (code >= 95) return '🌩️';
    return '🌡️';
  }

  getWeatherDescription(code) {
    if (code === 0) return 'Clear skies';
    if (code >= 1 && code <= 3) return 'Partly cloudy';
    if (code === 45 || code === 48) return 'Misty & foggy';
    if (code >= 51 && code <= 67) return 'Rainy weather';
    if (code >= 71 && code <= 77) return 'Snowy outside';
    if (code >= 80 && code <= 82) return 'Passing showers';
    if (code >= 95) return 'Thunderstorms';
    return 'Fair weather';
  }

  updateGreetingSubtext() {
    if (!this.subtextEl) return;

    const hour = new Date().getHours();
    const weatherDesc = this.currentWeather ? this.getWeatherDescription(this.currentWeather.code).toLowerCase() : '';
    
    let phrase = 'Mellow start to the day.';

    if (hour >= 5 && hour < 12) {
      phrase = weatherDesc.includes('rain') ? 'Fresh rainy morning.' 
        : weatherDesc.includes('clear') ? 'Bright sunny start to the day.' 
        : 'Mellow start to the day.';
    } else if (hour >= 12 && hour < 17) {
      phrase = weatherDesc ? `${weatherDesc.charAt(0).toUpperCase() + weatherDesc.slice(1)} this afternoon.` : 'Enjoy your afternoon.';
    } else if (hour >= 17 && hour < 22) {
      phrase = weatherDesc.includes('clear') ? 'Peaceful evening ahead.' : 'Cozy evening in.';
    } else {
      phrase = 'Quiet night in.';
    }

    this.subtextEl.innerHTML = `<span>${phrase}</span>`;
  }
}
