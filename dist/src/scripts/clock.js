/**
 * Clock & Date Widget Module
 */

export class ClockWidget {
  constructor(options = {}) {
    this.timeEl = document.getElementById(options.timeId || 'clockTime');
    this.periodEl = document.getElementById(options.periodId || 'clockPeriod');
    this.dateEl = document.getElementById(options.dateId || 'clockDate');
    this.use24Hour = options.use24Hour || false;
    this.timer = null;
  }

  set24HourMode(enabled) {
    this.use24Hour = enabled;
    this.update();
  }

  start() {
    this.update();
    // Synchronize updates on minute tick
    const now = new Date();
    const delay = (60 - now.getSeconds()) * 1000;
    
    setTimeout(() => {
      this.update();
      this.timer = setInterval(() => this.update(), 1000);
    }, delay);

    // Initial interval until sync
    this.timer = setInterval(() => this.update(), 1000);
  }

  update() {
    const now = new Date();
    
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    let period = '';

    if (!this.use24Hour) {
      period = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // 0 becomes 12
    }

    const timeStr = `${hours}:${minutes}`;
    
    if (this.timeEl) this.timeEl.textContent = timeStr;
    if (this.periodEl) {
      this.periodEl.textContent = period;
      this.periodEl.style.display = this.use24Hour ? 'none' : 'inline';
    }

    if (this.dateEl) {
      const options = { weekday: 'long', month: 'long', day: 'numeric' };
      this.dateEl.textContent = now.toLocaleDateString('en-US', options);
    }
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
  }
}
