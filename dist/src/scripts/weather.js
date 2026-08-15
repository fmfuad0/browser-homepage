/**
 * Real-time Weather & Dynamic Greeting Module
 * Powered by Open-Meteo API + Geolocation
 */

export class WeatherGreetingService {
  constructor(options = {}) {
    this.headingEl = document.getElementById(options.headingId || 'greetingHeading');
    this.subtextEl = document.getElementById(options.subtextId || 'greetingSubtext');
    this.badgeEl = document.getElementById(options.badgeId || 'weatherBadge');
    
    this.tempUnit = localStorage.getItem('temp_unit') || 'C'; // 'C' or 'F'
    this.currentWeather = null;
  }

  async init() {
    this.updateGreetingHeading();
    this.setupEventListeners();
    await this.fetchWeather();
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
    
    if (hour >= 12 && hour < 17) {
      greeting = 'Good Afternoon';
    } else if (hour >= 17 && hour < 22) {
      greeting = 'Good Evening';
    } else if (hour >= 22 || hour < 5) {
      greeting = 'Good Night';
    }

    if (this.headingEl) {
      this.headingEl.textContent = greeting;
    }
    return greeting;
  }

  async getLocation() {
    return new Promise((resolve) => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude });
          },
          async () => {
            // Fallback to IP Geolocation
            const ipLoc = await this.getLocationByIP();
            resolve(ipLoc);
          },
          { timeout: 5000 }
        );
      } else {
        this.getLocationByIP().then(resolve);
      }
    });
  }

  async getLocationByIP() {
    try {
      const res = await fetch('https://ipapi.co/json/');
      if (res.ok) {
        const data = await res.json();
        return { lat: data.latitude, lon: data.longitude, city: data.city };
      }
    } catch (e) {
      console.warn('IP location failed, using default coords');
    }
    // Default fallback (London)
    return { lat: 51.5074, lon: -0.1278, city: 'London' };
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
        city: loc.city || ''
      };

      this.renderWeatherBadge();
      this.updateGreetingSubtext();
    } catch (err) {
      console.error('Failed to fetch weather:', err);
      if (this.subtextEl) {
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
    this.badgeEl.innerHTML = `${icon} <span>${temp}°${this.tempUnit}</span>`;
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
    if (!this.subtextEl || !this.currentWeather) return;

    const hour = new Date().getHours();
    const weatherDesc = this.getWeatherDescription(this.currentWeather.code).toLowerCase();
    
    let phrase = 'Mellow start to the day.';

    if (hour >= 5 && hour < 12) {
      phrase = weatherDesc.includes('rain') ? 'Fresh rainy morning.' 
        : weatherDesc.includes('clear') ? 'Bright sunny start to the day.' 
        : 'Mellow start to the day.';
    } else if (hour >= 12 && hour < 17) {
      phrase = `${weatherDesc.charAt(0).toUpperCase() + weatherDesc.slice(1)} this afternoon.`;
    } else if (hour >= 17 && hour < 22) {
      phrase = weatherDesc.includes('clear') ? 'Peaceful evening ahead.' : 'Cozy evening in.';
    } else {
      phrase = 'Quiet night in.';
    }

    this.subtextEl.innerHTML = `<span>${phrase}</span>`;
  }
}
