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
    <div className="min-h-screen flex flex-col bg-[#F7F8FC] text-[#20253B]">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <header className="sticky top-0 z-40 border-b border-[#E3E7F2] bg-white/95 backdrop-blur-xs">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-2.5 rounded-xl py-1 pr-2 text-[#20253B] no-underline"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#645BE8] text-white shadow-xs"
                aria-hidden="true"
              >
                <BookOpen className="h-5 w-5" />
              </span>
              <span className="flex flex-col leading-none">
                <span className="text-lg font-extrabold tracking-tight">
                  Algo<span className="text-[#645BE8]">Miri</span>
                </span>
                <span className="text-[11px] font-medium text-[#555D7A]">
                  Visual Algorithm Studio
                </span>
              </span>
            </Link>
            <Badge variant="demo" className="hidden sm:inline-flex">
              v0.2 Demo
            </Badge>
          </div>

          <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors',
                    isActive
                      ? 'bg-[#EEF0FF] text-[#4F46D8]'
                      : 'text-[#555D7A] hover:bg-[#F7F8FC] hover:text-[#20253B]',
                  )
                }
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden md:flex items-center">
            <Link
              to="/problems"
              className="inline-flex h-9 items-center justify-center rounded-xl bg-[#645BE8] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#4F46D8]"
            >
              Browse Problems
            </Link>
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#E3E7F2] bg-white text-[#20253B] md:hidden"
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
            className="border-t border-[#E3E7F2] bg-white px-4 py-3 md:hidden"
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
                        ? 'bg-[#EEF0FF] text-[#4F46D8]'
                        : 'text-[#555D7A] hover:bg-[#F7F8FC] hover:text-[#20253B]',
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

      <footer className="border-t border-[#E3E7F2] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-[#555D7A] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>
            <span className="font-semibold text-[#20253B]">AlgoMiri</span> — Understand first. Code second.
          </p>
          <p>
            Frontend visual learning studio · No backend, login, or external AI API connected.
          </p>
        </div>
      </footer>
    </div>
  );
}
