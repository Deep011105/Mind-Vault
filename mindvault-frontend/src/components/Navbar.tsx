import { NavLink, useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { clearToken } from '../api/client';

const NAV_ITEMS = [
  { to: '/', label: 'Journal' },
  { to: '/planner', label: 'Planner' },
  { to: '/goals', label: 'Goals' },
  { to: '/chat', label: 'Companion' },
  { to: '/insights', label: 'Insights' },
];

export default function Navbar() {
  const navigate = useNavigate();

  function handleLock() {
    clearToken();
    navigate('/lock', { replace: true });
  }

  return (
    <header className="sticky top-0 z-30 border-b border-ink/10 dark:border-mist/10 bg-paper/85 dark:bg-night/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5">
        <div className="flex items-center gap-2">
          <svg width="22" height="22" viewBox="0 0 32 32" className="text-moss-600 dark:text-moss-400">
            <rect width="32" height="32" rx="7" fill="currentColor" opacity="0.12" />
            <path d="M9 8h10a3 3 0 0 1 3 3v13H12a3 3 0 0 1-3-3V8Z" fill="none" stroke="currentColor" strokeWidth="1.4" />
            <line x1="12" y1="13" x2="19" y2="13" stroke="currentColor" strokeWidth="1" opacity="0.6" />
            <line x1="12" y1="16.5" x2="19" y2="16.5" stroke="currentColor" strokeWidth="1" opacity="0.6" />
          </svg>
          <span className="font-display text-lg tracking-tight text-ink dark:text-mist">MindVault</span>
        </div>

        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-moss-600 text-white'
                    : 'text-ink-soft dark:text-mist-soft hover:bg-ink/5 dark:hover:bg-mist/10'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <button
            onClick={handleLock}
            aria-label="Lock MindVault"
            title="Lock"
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft dark:text-mist-soft hover:bg-ink/5 dark:hover:bg-mist/10 transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="11" width="14" height="9" rx="2" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
          </button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
