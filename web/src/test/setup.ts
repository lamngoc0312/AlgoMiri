import '@testing-library/jest-dom/vitest';
import { beforeEach } from 'vitest';
import i18n, { LANGUAGE_STORAGE_KEY } from '../i18n';

beforeEach(async () => {
  window.localStorage.removeItem(LANGUAGE_STORAGE_KEY);
  await i18n.changeLanguage('en');
});
