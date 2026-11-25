import { Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/themeStorage';

interface ThemeSwitcherProps {
  compact?: boolean;
}

export function ThemeSwitcher({ compact = false }: ThemeSwitcherProps) {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const label = isDark ? t('common.switchToLight') : t('common.switchToDark');

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      aria-pressed={isDark}
      title={label}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-control)] bg-[var(--surface-card)] text-[var(--text-primary)] transition-colors hover:border-[var(--accent-blue)] hover:bg-[var(--surface-elevated)] cursor-pointer ${
        compact ? 'h-9 w-9 p-0' : 'h-10 px-3 text-sm font-semibold'
      }`}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-[var(--accent-amber)]" aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4 text-[var(--accent-blue-link)]" aria-hidden="true" />
      )}
      {!compact && (
        <span>{isDark ? t('common.lightMode') : t('common.darkMode')}</span>
      )}
    </button>
  );
}
