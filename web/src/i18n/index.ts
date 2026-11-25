import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en } from './locales/en';
import { vi } from './locales/vi';

export const SUPPORTED_LANGUAGES = ['en', 'vi'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_STORAGE_KEY = 'algomiri.language';
export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

export const resources = {
  en: { translation: en },
  vi: { translation: vi },
} as const;

export function isSupportedLanguage(value: unknown): value is SupportedLanguage {
  return typeof value === 'string' && SUPPORTED_LANGUAGES.includes(value as SupportedLanguage);
}

function getBrowserStorage(): Storage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

export function readStoredLanguage(
  storage?: Pick<Storage, 'getItem'>,
): SupportedLanguage {
  const safeStorage = storage ?? getBrowserStorage();
  if (!safeStorage) return DEFAULT_LANGUAGE;
  try {
    const stored = safeStorage.getItem(LANGUAGE_STORAGE_KEY);
    return isSupportedLanguage(stored) ? stored : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

export function persistLanguage(
  language: SupportedLanguage,
  storage?: Pick<Storage, 'setItem'>,
) {
  const safeStorage = storage ?? getBrowserStorage();
  if (!safeStorage) return;
  try {
    safeStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // The UI remains usable when storage is unavailable or blocked.
  }
}

export function syncDocumentLanguage(language: SupportedLanguage) {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = language;
  }
}

const initialLanguage = readStoredLanguage();

void i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage,
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: [...SUPPORTED_LANGUAGES],
  load: 'languageOnly',
  interpolation: { escapeValue: false },
  returnNull: false,
});

syncDocumentLanguage(initialLanguage);

i18n.on('languageChanged', (nextLanguage) => {
  const safeLanguage = isSupportedLanguage(nextLanguage)
    ? nextLanguage
    : DEFAULT_LANGUAGE;
  persistLanguage(safeLanguage);
  syncDocumentLanguage(safeLanguage);
});

export async function changeLanguage(language: SupportedLanguage) {
  await i18n.changeLanguage(language);
}

export default i18n;

