import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink, Outlet } from 'react-router-dom';
import {
  BookOpen,
  Compass,
  Layers,
  Library,
  History,
  Menu,
  Sparkles,
  TrendingUp,
  UserRound,
  X,
} from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import { cn } from '../lib/utils';

const NAV_ITEMS = [
  {
    to: '/',
    labelKey: 'shell.nav.home',
    icon: Sparkles,
    iconColor: 'text-[var(--accent-blue)]',
    end: true,
  },
  {
    to: '/problems',
    labelKey: 'shell.nav.problems',
    icon: Library,
    iconColor: 'text-[var(--accent-teal)]',
    end: false,
  },
  {
    to: '/studio',
    labelKey: 'shell.nav.studio',
    icon: Layers,
    iconColor: 'text-[var(--accent-amber)]',
    end: false,
  },
  {
    to: '/roadmap',
    labelKey: 'shell.nav.roadmap',
    icon: Compass,
    iconColor: 'text-[var(--accent-sky)]',
    end: false,
  },
  {
    to: '/history',
    labelKey: 'shell.nav.history',
    icon: History,
    iconColor: 'text-[var(--accent-coral-text)]',
    end: false,
  },
  {
    to: '/progress',
    labelKey: 'shell.nav.progress',
    icon: TrendingUp,
    iconColor: 'text-[var(--accent-green)]',
    end: false,
  },
] as const;

export function AppShell() {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--surface-canvas)] text-[var(--text-primary)]">
      <a href="#main-content" className="skip-link">
        {t('shell.skipToContent')}
      </a>

      <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[var(--surface-nav)] backdrop-blur-xs">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-6 xl:px-8">
          {/* Brand cluster: logo always prominent, tagline only on wide screens, subtle Beta pill on xl+ */}
          <div className="flex shrink-0 items-center gap-2.5">
            <Link
              to="/"
              className="flex shrink-0 items-center gap-2.5 rounded-xl py-1 pr-1 text-[var(--text-primary)] no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-blue)]"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-blue-solid)] text-white shadow-xs"
                aria-hidden="true"
              >
                <BookOpen className="h-5 w-5" />
              </span>
              <span className="flex flex-col leading-none">
                <span className="whitespace-nowrap text-lg font-extrabold tracking-tight">
                  Algo<span className="text-[var(--accent-blue-link)]">Miri</span>
                </span>
                <span className="hidden 2xl:block whitespace-nowrap text-xs font-medium text-[var(--text-secondary)]">
                  {t('shell.productTagline')}
                </span>
              </span>
            </Link>
            <Badge
              variant="indigo"
              className="hidden xl:inline-flex shrink-0 whitespace-nowrap"
            >
              {t('shell.beta')}
            </Badge>
          </div>

          {/* Primary desktop navigation: single-row non-wrapping links with compact lg spacing and spacious xl spacing */}
          <nav
            aria-label={t('shell.primaryNavigation')}
            className="hidden lg:flex min-w-0 items-center justify-center gap-1 xl:gap-1.5"
          >
            {NAV_ITEMS.map(({ to, labelKey, icon: Icon, iconColor, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'inline-flex shrink-0 items-center gap-1.5 xl:gap-2 whitespace-nowrap rounded-xl px-2.5 xl:px-3.5 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-blue)]',
                    isActive
                      ? 'bg-[var(--accent-blue-soft)] text-[var(--accent-blue-text)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]',
                  )
                }
              >
                <Icon className={cn('h-4 w-4 shrink-0', iconColor)} aria-hidden="true" />
                <span>{t(labelKey)}</span>
              </NavLink>
            ))}
          </nav>

          {/* Utility controls: compact Profile avatar button, Theme & Language switchers */}
          <div className="hidden lg:flex shrink-0 items-center gap-2">
            <ThemeSwitcher compact />
            <LanguageSwitcher compact />
            <NavLink
              to="/profile"
              aria-label={t('shell.nav.profile')}
              title={t('shell.nav.profile')}
              className={({ isActive }) =>
                cn(
                  'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-blue)]',
                  isActive
                    ? 'border-[var(--accent-blue-border)] bg-[var(--accent-blue-soft)] text-[var(--accent-blue-text)]'
                    : 'border-[var(--border-subtle)] bg-[var(--surface-card)] text-[var(--text-secondary)] hover:border-[var(--border-control)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]',
                )
              }
            >
              <UserRound className="h-4 w-4" aria-hidden="true" />
            </NavLink>
          </div>

          {/* Mobile & tablet navigation drawer toggle */}
          <button
            type="button"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] text-[var(--text-primary)] lg:hidden cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-blue)]"
            aria-label={
              mobileMenuOpen ? t('shell.closeMenu') : t('shell.openMenu')
            }
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>

        {mobileMenuOpen && (
          <nav
            id="mobile-nav"
            aria-label={t('shell.mobileNavigation')}
            className="border-t border-[var(--border-subtle)] bg-[var(--surface-card)] px-4 py-3 lg:hidden"
          >
            <div className="flex flex-col gap-1">
              {NAV_ITEMS.map(({ to, labelKey, icon: Icon, iconColor, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex min-h-[44px] items-center gap-2.5 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-blue)]',
                      isActive
                        ? 'bg-[var(--accent-blue-soft)] text-[var(--accent-blue-text)]'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]',
                    )
                  }
                >
                  <Icon className={cn('h-4 w-4 shrink-0', iconColor)} aria-hidden="true" />
                  <span>{t(labelKey)}</span>
                </NavLink>
              ))}
              <NavLink
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-[44px] items-center gap-2.5 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-blue)]',
                    isActive
                      ? 'bg-[var(--accent-blue-soft)] text-[var(--accent-blue-text)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]',
                  )
                }
              >
                <UserRound className="h-4 w-4 shrink-0 text-[var(--accent-blue-link)]" aria-hidden="true" />
                <span>{t('shell.nav.profile')}</span>
              </NavLink>
              <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-[var(--border-subtle)] pt-3">
                <ThemeSwitcher />
                <LanguageSwitcher />
              </div>
            </div>
          </nav>
        )}
      </header>

      <main id="main-content" className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-[var(--border-subtle)] bg-[var(--surface-card)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-[var(--text-secondary)] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>
            <span className="font-semibold text-[var(--text-primary)]">
              AlgoMiri
            </span>{' '}
            — {t('shell.footerPrimary')}
          </p>
          <p>{t('shell.footerSecondary')}</p>
        </div>
      </footer>
    </div>
  );
}
