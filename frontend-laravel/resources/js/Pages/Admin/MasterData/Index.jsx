import { useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head } from '@inertiajs/react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

import ServicesTab from './Services/Index';
import TeamsTab from './Teams/Index';

export default function MasterDataIndex() {
  const queryParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  // Default tab diubah ke 'services' karena 'categories' tidak ada di Admin
  const initialTab = queryParams?.get('tab') || 'services';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location);
      url.searchParams.set('tab', tabKey);
      window.history.pushState({}, '', url);
    }
  };

  return (
    <RoleLayout>
      <Head title="Master Data Management" />

      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-[100] max-w-sm flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md transition-all duration-300 ${
            toast.type === 'success'
              ? 'bg-emerald-500/15 dark:bg-emerald-950/90 border-emerald-500/40 text-emerald-600 dark:text-emerald-300'
              : 'bg-red-500/15 dark:bg-red-950/90 border-red-500/40 text-red-600 dark:text-red-300'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 size={18} className="shrink-0 text-emerald-500 dark:text-emerald-400" />
          ) : (
            <AlertCircle size={18} className="shrink-0 text-red-500 dark:text-red-400" />
          )}
          <span className="text-xs sm:text-sm font-semibold tracking-wide leading-snug break-words">
            {toast.message}
          </span>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-text">Management</h1>
        <p className="text-sm text-brand-text-muted mt-1">
          Kelola data dasar layanan dan tim untuk mendukung operasional.
        </p>
      </div>

      <div className="inline-flex border-b border-brand-border mb-6 space-x-2">
        <button
          onClick={() => handleTabChange('services')}
          className={`pb-3 text-sm font-semibold transition px-8 relative ${
            activeTab === 'services' ? 'text-brand-accent border-b-2 border-brand-accent' : 'text-brand-text-muted hover:text-brand-text'
          }`}
        >
          Service
        </button>
        <button
          onClick={() => handleTabChange('teams')}
          className={`pb-3 text-sm px-8 font-semibold transition relative ${
            activeTab === 'teams' ? 'text-brand-accent border-b-2 border-brand-accent' : 'text-brand-text-muted hover:text-brand-text'
          }`}
        >
          Teams
        </button>
      </div>

      {activeTab === 'services' && <ServicesTab showToast={showToast} />}
      {activeTab === 'teams' && <TeamsTab showToast={showToast} />}
    </RoleLayout>
  );
}