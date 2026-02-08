import { useAppStore } from '@/lib/store';
import { t, languageNames } from '@/lib/i18n';
import { Language, AppPage } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Phone, Globe, Moon, Sun, LogOut } from 'lucide-react';
import { useState } from 'react';
import { User } from '@supabase/supabase-js';

const navItems: { page: AppPage; key: string }[] = [
  { page: 'dashboard', key: 'nav.dashboard' },
  { page: 'new-request', key: 'nav.newRequest' },
  { page: 'mission-control', key: 'nav.missionControl' },
  { page: 'results', key: 'nav.results' },
];

interface AppLayoutProps {
  children: React.ReactNode;
  signOut: () => Promise<void>;
  user: User;
}

export function AppLayout({ children, signOut, user }: AppLayoutProps) {
  const { currentPage, setPage, language, setLanguage } = useAppStore();
  const [dark, setDark] = useState(true);

  const toggleDark = () => {
    setDark(!dark);
    document.documentElement.classList.toggle('dark', !dark);
  };

  // Set dark mode on mount
  if (typeof document !== 'undefined' && !document.documentElement.classList.contains('dark') && dark) {
    document.documentElement.classList.add('dark');
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <button onClick={() => setPage('dashboard')} className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
              <Phone className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold gradient-text hidden sm:inline">
              {t('app.name', language)}
            </span>
          </button>

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            {navItems.map(({ page, key }) => (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPage(page)}
                className={currentPage === page ? 'glow-primary' : ''}
              >
                <span className="hidden sm:inline">{t(key, language)}</span>
                <span className="sm:hidden text-xs">{t(key, language).slice(0, 3)}</span>
              </Button>
            ))}
          </nav>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Language */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            >
              {Object.entries(languageNames).map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>

            {/* Dark mode */}
            <Button variant="ghost" size="icon" onClick={toggleDark}>
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {/* Sign out */}
            <Button variant="ghost" size="icon" onClick={signOut} title="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        {children}
      </main>
    </div>
  );
}
