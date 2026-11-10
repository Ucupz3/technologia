import { useState, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import {
  Home, Users, Shield, Package,
  Calendar, LogOut, Menu,
  Sun, Moon, Contact, Database, Newspaper, ClipboardClock,
  Code, Check, Briefcase, Headset, Sparkles,
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

/* ============================================================
   KONFIGURASI MENU PER MODE
   ============================================================ */
const menuByRole = {
  super_admin: [
    { label: 'Dashboard',   href: '/dashboard',             icon: Home },
    { label: 'Users',       href: '/super-admin/users',      icon: Users },
    { label: 'Roles',       href: '/super-admin/roles',      icon: Shield },
    { label: 'Management',  href: '/super-admin/master-data', icon: Database },
    { label: 'Customers',   href: '/super-admin/customers',  icon: Contact },
    { label: 'Orders',      href: '/super-admin/orders',     icon: Package },
    { label: 'Invoices',    href: '/super-admin/invoices',   icon: Newspaper },
    { label: 'Schedules',   href: '/super-admin/schedules',  icon: Calendar },
    { label: 'Audit Logs',  href: '/super-admin/audit-logs', icon: ClipboardClock },
  ],
  admin: [
    { label: 'Dashboard', href: '/dashboard',         icon: Home },
    { label: 'Services',  href: '/admin/services',    icon: Database },
    { label: 'Customers', href: '/admin/customers',   icon: Contact },
    { label: 'Orders',    href: '/admin/orders',      icon: Package },
    { label: 'Schedules', href: '/admin/schedules',   icon: Calendar },
    { label: 'Invoices',  href: '/admin/invoices',    icon: Newspaper },
  ],
  sales: [
    { label: 'Dashboard', href: '/dashboard',         icon: Home },
    { label: 'Customers', href: '/sales/customers',   icon: Contact },
    { label: 'Orders',    href: '/sales/orders',      icon: Package },
    { label: 'Invoices',  href: '/sales/invoices',    icon: Newspaper },
  ],
  developer: [
    { label: 'Dashboard',       href: '/developer/dashboard', icon: Home },
    { label: 'Task & Progress', href: '/developer/tasks',     icon: Briefcase },
    { label: 'Jadwal',   href: '/developer/schedules', icon: Calendar },
    { label: 'Maintenance',     href: '/developer/maintenance',      icon: ClipboardClock },
  ],
};

/* ============================================================
   META PER MODE (label, deskripsi, icon, warna badge)
   ============================================================ */
const MODE_META = {
  super_admin: {
    label: 'Super Admin',
    description: 'Akses penuh ke seluruh sistem',
    icon: Shield,
    badge: 'bg-orange-500/10 text-orange-500 border-orange-500/30 dark:text-orange-400',
    dot: 'bg-orange-500',
  },
  admin: {
    label: 'Admin',
    description: 'Kelola operasional harian',
    icon: Shield,
    badge: 'bg-blue-500/10 text-blue-500 border-blue-500/30 dark:text-blue-400',
    dot: 'bg-blue-500',
  },
  sales: {
    label: 'Sales',
    description: 'Kelola customer & order',
    icon: Briefcase,
    badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  customer_service: {
    label: 'Customer Service',
    description: 'Layani customer',
    icon: Headset,
    badge: 'bg-teal-500/10 text-teal-500 border-teal-500/30 dark:text-teal-400',
    dot: 'bg-teal-500',
  },
  developer: {
    label: 'Developer',
    description: 'Tools untuk development',
    icon: Code,
    badge: 'bg-purple-500/10 text-purple-500 border-purple-500/30 dark:text-purple-400',
    dot: 'bg-purple-500',
  },
};

const SIDEBAR_STORAGE_KEY = 'erp_sidebar_open';
const MODE_STORAGE_KEY = 'erp_active_mode';

export default function RoleLayout({ children }) {
  const page = usePage();
  const auth = page.props.auth;
  const url = page.url;

  const { theme, toggle } = useTheme();

  const role = auth?.role;
  const user = auth?.user;

  const [activeMode, setActiveMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const storedMode = window.localStorage.getItem(MODE_STORAGE_KEY);
      if (storedMode && (storedMode === role || storedMode === 'developer')) {
        return storedMode;
      }
    }
    return role || 'super_admin';
  });

  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (stored !== null) return stored === 'true';
    }
    return true;
  });

  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    if (!role) return;

    const isDeveloperRoute = url.startsWith('/developer');
    const isMainDashboard = url === '/dashboard';

    if (activeMode === 'developer' && isMainDashboard) {
      router.visit('/developer/dashboard');
    } 
    else if (activeMode !== 'developer' && isDeveloperRoute) {
      router.visit('/dashboard');
    }
  }, [activeMode, url, role]);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      }
      return next;
    });
  };

  const switchMode = (newMode) => {
    setActiveMode(newMode);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(MODE_STORAGE_KEY, newMode);
    }
    setUserMenuOpen(false);

    if (newMode === 'developer') {
      router.visit('/developer/dashboard');
    } else {
      router.visit('/dashboard');
    }
  };

  const menus = menuByRole[activeMode] || [];
  const meta = MODE_META[activeMode] || MODE_META[role] || MODE_META.super_admin;
  const ModeIcon = meta.icon;

  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-primary">
        <div className="text-center max-w-md bg-brand-secondary p-8 rounded-lg shadow border border-brand-border">
          <h1 className="text-2xl font-bold text-red-400 mb-3">Akun Tidak Terdaftar</h1>
          <p className="text-brand-text-muted mb-4">
            Email <strong className="text-brand-text">{user?.email}</strong> belum terdaftar di sistem Tekna.id.
          </p>
          <Link
            href="/logout"
            method="post"
            as="button"
            className="bg-brand-accent text-brand-primary px-4 py-2 rounded hover:bg-brand-accent2 transition font-semibold"
          >
            Logout
          </Link>
        </div>
      </div>
    );
  }

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const isDeveloperMode = activeMode === 'developer';
  const roleMeta = MODE_META[role] || MODE_META.super_admin;

  return (
    <div className="min-h-screen bg-brand-primary flex">
      <aside
        className={`bg-brand-secondary text-brand-text transition-all duration-200 flex flex-col sticky top-0 h-screen shrink-0 border-r border-brand-border ${
          sidebarOpen ? 'w-64' : 'w-16'
        }`}
      >
        <div className="h-24 flex items-center relative px-4 border-b border-brand-border/40">
          {sidebarOpen ? (
            <button onClick={toggleSidebar} className="flex items-center gap-2 min-w-0 hover:opacity-80 transition" title="Sembunyikan sidebar">
              <img src="/logo.webp" alt="ERP Jasa" className="w-16 h-16 object-contain shrink-0" />
            </button>
          ) : (
            <button onClick={toggleSidebar} className="text-brand-text-muted hover:text-brand-accent transition shrink-0 mx-auto" title="Tampilkan sidebar">
              <Menu size={20} />
            </button>
          )}
        </div>

        <nav className="p-2 space-y-1 flex-1 overflow-y-auto">
          {menus.map((item) => {
            const Icon = item.icon;
            const active = url && url.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={!sidebarOpen ? item.label : ''}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition text-sm ${
                  sidebarOpen ? '' : 'justify-center'
                } ${
                  active
                    ? 'bg-brand-accent text-brand-primary font-semibold shadow-sm'
                    : 'text-brand-text-muted hover:bg-brand-muted hover:text-brand-text'
                }`}
              >
                <Icon size={18} className="shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-2 border-t border-brand-border">
          <Link
            href="/logout"
            method="post"
            as="button"
            title={!sidebarOpen ? 'Logout' : ''}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-brand-text-muted hover:bg-red-500/10 hover:text-red-500 w-full transition text-sm ${
              sidebarOpen ? '' : 'justify-center'
            }`}
          >
            <LogOut size={18} className="shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-brand-secondary shadow-sm px-6 py-3 flex items-center justify-between border-b border-brand-border sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${meta.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
              <ModeIcon size={13} />
              <span className="uppercase tracking-wide">{meta.label}</span>
            </div>

            {isDeveloperMode && role !== 'developer' && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-brand-border bg-brand-muted/50 text-[11px] text-brand-text-muted">
                <Sparkles size={11} className="text-purple-500" />
                Session as <strong className="text-brand-text">{roleMeta.label}</strong>
              </span>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-3 hover:bg-brand-muted rounded-lg px-2 py-1 transition"
            >
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-brand-text leading-tight">{user?.name}</div>
                <div className="text-xs text-brand-text-muted leading-tight">{user?.email}</div>
              </div>
              <div className="w-9 h-9 bg-gradient-to-br from-brand-accent to-brand-accent2 rounded-full flex items-center justify-center text-brand-primary font-semibold text-sm">
                {initials}
              </div>
            </button>

            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 mt-3 mr-2 w-72 bg-brand-tertiary rounded-xl shadow-2xl border border-brand-border z-20 overflow-hidden">
                  <div className="px-4 py-3 border-b border-brand-border">
                    <div className="text-sm font-semibold text-brand-text truncate">{user?.name}</div>
                    <div className="text-xs text-brand-text-muted truncate">{user?.email}</div>
                    <div className="mt-2">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full border font-semibold ${roleMeta.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${roleMeta.dot}`} />
                        {roleMeta.label}
                      </span>
                    </div>
                  </div>

                  <div className="py-2 border-b border-brand-border">
                    <div className="px-4 pt-1 pb-2 text-[10px] font-bold tracking-widest text-brand-text-muted uppercase">
                      Workspace
                    </div>
                    <div className="px-2 space-y-1">
                      <WorkspaceButton
                        active={activeMode === role}
                        icon={roleMeta.icon}
                        label={roleMeta.label}
                        description={roleMeta.description}
                        onClick={() => switchMode(role)}
                      />
                      <WorkspaceButton
                        active={activeMode === 'developer'}
                        icon={Code}
                        label={MODE_META.developer.label}
                        description={MODE_META.developer.description}
                        onClick={() => switchMode('developer')}
                        accent="purple"
                      />
                    </div>
                  </div>

                  <button onClick={toggle} className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-brand-text hover:bg-brand-muted transition">
                    <span className="flex items-center gap-2">
                      {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
                      {theme === 'dark' ? 'Tema Gelap' : 'Tema Terang'}
                    </span>
                    <span className={`w-8 h-4 rounded-full relative transition ${theme === 'dark' ? 'bg-brand-accent' : 'bg-brand-border'}`}>
                      <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${theme === 'dark' ? 'right-0.5' : 'left-0.5'}`} />
                    </span>
                  </button>

                  <Link href="/profile" className="block px-4 py-2.5 text-sm text-brand-text hover:bg-brand-muted transition" onClick={() => setUserMenuOpen(false)}>
                    Profile Saya
                  </Link>

                  <Link href="/logout" method="post" as="button" className="block w-full text-left px-4 py-2.5 text-sm text-red-500 dark:text-red-400 hover:bg-red-500/10 border-t border-brand-border transition">
                    Logout
                  </Link>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

function WorkspaceButton({ active, icon: Icon, label, description, onClick, accent = 'default' }) {
  const accentRing = accent === 'purple' ? 'ring-purple-500/40' : 'ring-brand-accent/40';
  const accentBg = accent === 'purple' ? 'bg-purple-500/10' : 'bg-brand-accent/10';
  const accentText = accent === 'purple' ? 'text-purple-500 dark:text-purple-400' : 'text-brand-accent';

  return (
    <button
      onClick={onClick}
      className={`group w-full text-left rounded-lg px-3 py-2.5 transition border ${
        active ? `border-transparent ring-2 ${accentRing} ${accentBg}` : 'border-transparent hover:bg-brand-muted'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${active ? `${accentBg} ${accentText}` : 'bg-brand-muted text-brand-text-muted'}`}>
          <Icon size={15} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className={`text-sm font-semibold truncate ${active ? accentText : 'text-brand-text'}`}>{label}</span>
            {active && <Check size={14} className={accentText} />}
          </div>
          <p className="text-[11px] text-brand-text-muted leading-tight mt-0.5 truncate">{description}</p>
        </div>
      </div>
    </button>
  );
}