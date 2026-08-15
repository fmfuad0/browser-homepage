/**
 * Main Application Initializer
 */

import { ClockWidget } from './clock.js';
import { WeatherGreetingService } from './weather.js';
import { WallpaperEngine } from './wallpaper.js';
import { ShortcutsManager } from './shortcuts.js';
import { BookmarksDrawer } from './bookmarks.js';
import { SearchManager } from './search.js';
import { SettingsManager } from './settings.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize Wallpaper & Audio Engine
  const wallpaperEngine = new WallpaperEngine({
    containerId: 'backgroundContainer',
    audioBtnId: 'audioToggleBtn',
    volumeSliderId: 'volumeSlider'
  });
  await wallpaperEngine.init();

  // Initialize Clock Widget
  const is24h = localStorage.getItem('clock_24h') === 'true';
  const clockWidget = new ClockWidget({
    timeId: 'clockTime',
    periodId: 'clockPeriod',
    dateId: 'clockDate',
    use24Hour: is24h
  });
  clockWidget.start();

  // Initialize Weather Greeting Service
  const weatherService = new WeatherGreetingService({
    headingId: 'greetingHeading',
    subtextId: 'greetingSubtext',
    badgeId: 'weatherBadge'
  });
  await weatherService.init();

  // Initialize Shortcuts Launcher
  const shortcutsManager = new ShortcutsManager({
    containerId: 'shortcutsContainer',
    modalId: 'addShortcutModal',
    formId: 'addShortcutForm'
  });
  shortcutsManager.init();

  // Initialize Bookmarks Tree Drawer
  const bookmarksDrawer = new BookmarksDrawer({
    drawerId: 'bookmarksDrawer',
    toggleBtnId: 'bookmarksToggleBtn',
    closeBtnId: 'closeBookmarksBtn',
    containerId: 'bookmarksTreeContainer',
    searchId: 'bookmarksSearchInput'
  });
  await bookmarksDrawer.init();

  // Initialize Search Manager
  const searchManager = new SearchManager({
    formId: 'searchForm',
    inputId: 'searchInput',
    engineBtnId: 'searchEngineBtn',
    engineIconId: 'searchEngineIcon'
  });
  searchManager.init();

  // Initialize Settings Modal Controller
  const settingsManager = new SettingsManager({
    modalId: 'settingsModal',
    openBtnId: 'settingsToggleBtn',
    closeBtnId: 'closeSettingsBtn',
    wallpaperEngine,
    clockWidget,
    searchManager
  });
  settingsManager.init();

  console.log('✨ Aesthetic Browser Homepage initialized successfully.');
});
