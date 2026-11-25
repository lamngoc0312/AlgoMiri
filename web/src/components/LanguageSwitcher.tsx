import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  changeLanguage,
  isSupportedLanguage,
  type SupportedLanguage,
} from '../i18n';

interface LanguageSwitcherProps {
  compact?: boolean;
}

export function LanguageSwitcher({ compact = false }: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation();
  const currentLanguage: SupportedLanguage = isSupportedLanguage(i18n.resolvedLanguage)
    ? i18n.resolvedLanguage
    : 'en';

  return (
    <label
      className={`inline-flex items-center gap-1.5 rounded-xl border border-[#D7DCEB] bg-white text-[#526075] focus-within:border-[#397BDB] ${
        compact ? 'h-9 px-2' : 'h-10 px-2.5'
      }`}
    >
      <Languages className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="sr-only">{t('common.language')}</span>
      <select
        value={currentLanguage}
        onChange={(event) => {
          const nextLanguage = event.target.value;
          if (isSupportedLanguage(nextLanguage)) {
            void changeLanguage(nextLanguage);
          }
        }}
        aria-label={t('common.language')}
        className="h-full min-w-0 cursor-pointer bg-transparent text-xs font-bold text-[#202B3B] outline-none"
      >
        <option value="en">EN</option>
        <option value="vi">VI</option>
      </select>
    </label>
  );
}
