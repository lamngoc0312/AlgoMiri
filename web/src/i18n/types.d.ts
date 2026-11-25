import 'i18next';
import type { resources, DEFAULT_LANGUAGE } from './index';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    fallbackNS: 'translation';
    resources: (typeof resources)[typeof DEFAULT_LANGUAGE];
  }
}
