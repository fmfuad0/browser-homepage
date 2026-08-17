/**
 * Main Application Initializer
 */

import { ClockWidget } from './clock.js';
import { WeatherGreetingService } from './weather.js';
import { WallpaperEngine } from './wallpaper.js';
import { ShortcutsManager } from './shortcuts.js';
import { BookmarksDrawer } from './bookmarks.js';
import { GoogleAppsMenu } from './googleApps.js';
import { SearchManager } from './search.js';
import { SettingsManager } from './settings.js';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Wallpaper & Audio Engine (non-blocking)
  const wallpaperEngine = new WallpaperEngine({
    containerId: 'backgroundContainer',
    audioBtnId: 'audioToggleBtn',
    volumeSliderId: 'volumeSlider'
  });
  wallpaperEngine.init().catch(err => console.warn('Wallpaper init error:', err));

  // Handle Tab Visibility Changes to pause/resume WebGL Shaders and save GPU/battery
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      wallpaperEngine.pauseShader();
    } else {
      wallpaperEngine.resumeShader();
    }
  });

  // Initialize Clock Widget (instant synchronous)
  const is24h = localStorage.getItem('clock_24h') === 'true';
  const clockWidget = new ClockWidget({
    timeId: 'clockTime',
    periodId: 'clockPeriod',
    dateId: 'clockDate',
    use24Hour: is24h
  });
  clockWidget.start();

  // Initialize Weather Greeting Service (non-blocking, uses cached pre-data)
  const weatherService = new WeatherGreetingService({
    headingId: 'greetingHeading',
    subtextId: 'greetingSubtext',
    badgeId: 'weatherBadge'
  });
  weatherService.init().catch(err => console.warn('Weather init error:', err));

  // Initialize Shortcuts Launcher (instant synchronous)
  const shortcutsManager = new ShortcutsManager({
    containerId: 'shortcutsContainer',
    modalId: 'addShortcutModal',
    formId: 'addShortcutForm'
  });
  shortcutsManager.init();

  // Declare menu references for mutual exclusivity
  let googleAppsMenu, bookmarksDrawer, settingsManager;

  // Initialize Bookmarks Tree Popover
  bookmarksDrawer = new BookmarksDrawer({
    drawerId: 'bookmarksDrawer',
    toggleBtnId: 'bookmarksToggleBtn',
    closeBtnId: 'closeBookmarksBtn',
    containerId: 'bookmarksTreeContainer',
    searchId: 'bookmarksSearchInput',
    onBeforeOpen: () => {
      googleAppsMenu?.closePopover();
      settingsManager?.close();
    }
  });
  bookmarksDrawer.init();

  // Initialize Google Apps Popover Menu
  googleAppsMenu = new GoogleAppsMenu({
    toggleBtnId: 'googleAppsToggleBtn',
    popoverId: 'googleAppsPopover',
    onBeforeOpen: () => {
      bookmarksDrawer?.close();
      settingsManager?.close();
    }
  });
  googleAppsMenu.init();

  // Initialize Search Manager
  const searchManager = new SearchManager({
    formId: 'searchForm',
    inputId: 'searchInput',
    engineBtnId: 'searchEngineBtn',
    engineIconId: 'searchEngineIcon'
  });
  searchManager.init();

  // Initialize Settings Modal Controller
  settingsManager = new SettingsManager({
    modalId: 'settingsModal',
    openBtnId: 'settingsToggleBtn',
    closeBtnId: 'closeSettingsBtn',
    wallpaperEngine,
    clockWidget,
    searchManager,
    weatherService,
    onBeforeOpen: () => {
      googleAppsMenu?.closePopover();
      bookmarksDrawer?.close();
    }
  });
  settingsManager.init();

  console.log('✨ Aesthetic Browser Homepage initialized instantly with optimized non-blocking engine.');
});
