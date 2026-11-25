import '@testing-library/jest-dom/vitest';
import { beforeEach } from 'vitest';
import i18n, { LANGUAGE_STORAGE_KEY } from '../i18n';
import { applyDocumentTheme, THEME_STORAGE_KEY } from '../theme/themeStorage';

beforeEach(async () => {
  window.localStorage.removeItem(LANGUAGE_STORAGE_KEY);
  window.localStorage.removeItem(THEME_STORAGE_KEY);
  applyDocumentTheme('light');
  await i18n.changeLanguage('en');
});
