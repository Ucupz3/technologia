import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
  Home, Users, Shield, FileText, Package, Briefcase,
  UserCircle, Calendar, CreditCard, Receipt, LogOut, Menu,
  Sun, Moon, Contact, Wallet,
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

const menuByRole = {
    super_admin: [
      { label: 'Dashboard', href: '/dashboard', icon: Home },
      { label: 'Users', href: '/super-admin/users', icon: Users },
      { label: 'Roles', href: '/super-admin/roles', icon: Shield },
      { label: 'Kategori Service', href: '/super-admin/master-data/categories', icon: Package },
      { label: 'Services', href: '/super-admin/master-data/services', icon: Briefcase },
      { label: 'Team Members', href: '/super-admin/master-data/team-members', icon: UserCircle },
      { label: 'Customers', href: '/super-admin/customers', icon: Contact },
      { label: 'Orders', href: '/super-admin/orders', icon: FileText },
      { label: 'Payments', href: '/super-admin/payments', icon: Wallet },
      { label: 'Audit Logs', href: '/super-admin/audit-logs', icon: FileText },
    ],
  admin: [
    { label: 'Dashboard', href: '/dashboard', icon: Home },
    { label: 'Services', href: '/admin/services', icon: Package },
    { label: 'Customers', href: '/admin/customers', icon: Contact },
    { label: 'Orders', href: '/admin/orders', icon: FileText },
    { label: 'Schedules', href: '/admin/schedules', icon: Calendar },
    { label: 'Payments', href: '/admin/payments', icon: Wallet },
  ],
  sales: [
    { label: 'Dashboard', href: '/dashboard', icon: Home },
    { label: 'Customers', href: '/sales/customers', icon: Contact },
    { label: 'Orders', href: '/sales/orders', icon: FileText },
    { label: 'Invoices', href: '/sales/invoices', icon: Receipt },
  ],
};

const roleLabel = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  sales: 'Sales',
};

const roleBadgeColor = {
  super_admin: 'bg-orange-500/15 text-orange-400 border-orange-500/40',
  admin:       'bg-blue-500/15 text-blue-400 border-blue-500/40',
  sales:       'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
};

const SIDEBAR_STORAGE_KEY = 'erp_sidebar_open';

export default function RoleLayout({ children }) {
  const page = usePage();
  const auth = page.props.auth;
  const url = page.url;

  const { theme, toggle } = useTheme();

  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (stored !== null) return stored === 'true';
    }
    return true;
  });

  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      }
      return next;
    });
  };

  const role = auth?.role;
  const user = auth?.user;
  const menus = menuByRole[role] || [];

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

  return (
    <div className="min-h-screen bg-brand-primary flex">
      {/* SIDEBAR */}
      <aside
        className={`bg-brand-secondary text-brand-text transition-all duration-200 flex flex-col sticky top-0 h-screen shrink-0 ${
          sidebarOpen ? 'w-64' : 'w-16'
        }`}
      >
        {/* Logo + Toggle */}
        <div className="h-24 flex items-center relative px-4">
          {sidebarOpen ? (
            <button
              onClick={toggleSidebar}
              className="flex items-center gap-2 min-w-0 hover:opacity-80 transition"
              title="Sembunyikan sidebar"
            >
              <img
                src="/logo.webp"
                alt="ERP Jasa"
                className="w-16 h-16 object-contain shrink-0"
              />
            </button>
          ) : (
            <button
              onClick={toggleSidebar}
              className="text-brand-text-muted hover:text-brand-accent transition shrink-0 mx-auto"
              title="Tampilkan sidebar"
            >
              <Menu size={20} />
            </button>
          )}
        </div>

        {/* Menu sidebar */}
        <nav className="p-2 space-y-1 flex-1">
          {menus.map((item) => {
            const Icon = item.icon;
            const active = url && url.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={!sidebarOpen ? item.label : ''}
                className={`flex items-center gap-3 px-3 py-2 rounded transition ${
                  sidebarOpen ? '' : 'justify-center'
                } ${
                  active
                    ? 'bg-brand-accent text-brand-primary font-semibold'
                    : 'text-brand-text-muted hover:bg-brand-muted hover:text-brand-text'
                }`}
              >
                <Icon size={18} className="shrink-0" />
                {sidebarOpen && <span className="text-sm">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-2 border-t border-brand-border">
          <Link
            href="/logout"
            method="post"
            as="button"
            title={!sidebarOpen ? 'Logout' : ''}
            className={`flex items-center gap-3 px-3 py-2 rounded text-brand-text-muted hover:bg-red-500/20 hover:text-red-400 w-full transition ${
              sidebarOpen ? '' : 'justify-center'
            }`}
          >
            <LogOut size={18} className="shrink-0" />
            {sidebarOpen && <span className="text-sm">Logout</span>}
          </Link>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="bg-brand-secondary shadow-sm px-6 py-3 flex items-center justify-between border-b border-brand-border sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${roleBadgeColor[role]}`}>
              <span className="text-xs font-semibold uppercase tracking-wide">
                {roleLabel[role]}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* ============ USER MENU ============ */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 hover:bg-brand-muted rounded-lg px-2 py-1 transition"
              >
                <div className="text-right">
                  <div className="text-sm font-semibold text-brand-text leading-tight">
                    {user?.name}
                  </div>
                  <div className="text-xs text-brand-text-muted leading-tight">
                    {user?.email}
                  </div>
                </div>
                <div className="w-9 h-9 bg-gradient-to-br from-brand-accent to-brand-accent2 rounded-full flex items-center justify-center text-brand-primary font-semibold text-sm">
                  {initials}
                </div>
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-3 mr-2 w-64 bg-brand-tertiary rounded-lg shadow-lg border border-brand-border z-20 overflow-hidden">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-brand-border">
                      <div className="text-sm font-medium text-brand-text">{user?.name}</div>
                      <div className="text-xs text-brand-text-muted">{user?.email}</div>
                      <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full border ${roleBadgeColor[role]}`}>
                        {roleLabel[role]}
                      </span>
                    </div>

                    {/* Theme Toggle */}
                    <button
                      onClick={toggle}
                      className="w-full flex items-center justify-between px-4 py-2 text-sm text-brand-text hover:bg-brand-muted transition"
                    >
                      <span className="flex items-center gap-2">
                        {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
                        {theme === 'dark' ? 'Tema Gelap' : 'Tema Terang'}
                      </span>
                      <span className={`w-8 h-4 rounded-full relative transition ${theme === 'dark' ? 'bg-brand-accent' : 'bg-brand-border'}`}>
                        <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${theme === 'dark' ? 'right-0.5' : 'left-0.5'}`} />
                      </span>
                    </button>

                    {/* Profile */}
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-brand-text hover:bg-brand-muted transition"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Profile Saya
                    </Link>

                    {/* Logout */}
                    <Link
                      href="/logout"
                      method="post"
                      as="button"
                      className="block w-full text-left px-4 py-2 text-sm text-red-500 dark:text-red-400 hover:bg-red-500/10 border-t border-brand-border transition"
                    >
                      Logout
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}