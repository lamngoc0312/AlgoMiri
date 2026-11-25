import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import {
  BookOpen,
  Compass,
  Layers,
  Library,
  Menu,
  Sparkles,
  TrendingUp,
  X,
} from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { cn } from '../lib/utils';

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: Sparkles, end: true },
  { to: '/problems', label: 'Problems', icon: Library, end: false },
  { to: '/studio', label: 'Learning Studio', icon: Layers, end: false },
  { to: '/roadmap', label: 'Roadmap', icon: Compass, end: false },
  { to: '/progress', label: 'Progress', icon: TrendingUp, end: false },
];

export function AppShell() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F9FC] text-[#202B3B]">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <header className="sticky top-0 z-40 border-b border-[#E2E8F0] bg-white/95 backdrop-blur-xs">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-2.5 rounded-xl py-1 pr-2 text-[#202B3B] no-underline"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2B6CC9] text-white shadow-xs"
                aria-hidden="true"
              >
                <BookOpen className="h-5 w-5" />
              </span>
              <span className="flex flex-col leading-none">
                <span className="text-lg font-extrabold tracking-tight">
                  Algo<span className="text-[#2664C2]">Miri</span>
                </span>
                <span className="text-xs font-medium text-[#526075]">
                  Visual Algorithm Studio
                </span>
              </span>
            </Link>
            <Badge variant="indigo" className="hidden sm:inline-flex">
              Beta Preview
            </Badge>
          </div>

          <nav aria-label="Primary navigation" className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors',
                    isActive
                      ? 'bg-[#EAF2FD] text-[#2257A8]'
                      : 'text-[#526075] hover:bg-[#F7F9FC] hover:text-[#202B3B]',
                  )
                }
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden lg:flex items-center">
            <Link
              to="/problems"
              className="inline-flex h-9 items-center justify-center rounded-xl bg-[#2B6CC9] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#2257A8]"
            >
              Browse Problems
            </Link>
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white text-[#202B3B] lg:hidden"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
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
            aria-label="Mobile navigation"
            className="border-t border-[#E2E8F0] bg-white px-4 py-3 lg:hidden"
          >
            <div className="flex flex-col gap-1">
              {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors',
                      isActive
                        ? 'bg-[#EAF2FD] text-[#2257A8]'
                        : 'text-[#526075] hover:bg-[#F7F9FC] hover:text-[#202B3B]',
                    )
                  }
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {label}
                </NavLink>
              ))}
            </div>
          </nav>
        )}
      </header>

      <main id="main-content" className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-[#E2E8F0] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-[#526075] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>
            <span className="font-semibold text-[#202B3B]">AlgoMiri</span> — Understand first. Code second.
          </p>
          <p>
            Verified deterministic studios + optional server-side AI conceptual tutor · Local browser history only (no account sync).
          </p>
        </div>
      </footer>
    </div>
  );
}
