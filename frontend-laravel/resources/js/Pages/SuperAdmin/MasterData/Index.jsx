import { useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head } from '@inertiajs/react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

import CategoriesTab from './Categories/Index';
import ServicesTab from './Services/Index';
import TeamsTab from './Teams/Index';
import JobsTab from './Jobs/Index';

export default function MasterDataIndex() {
  const queryParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const initialTab = queryParams?.get('tab') || 'categories';

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

      {/* Toast Notification (Responsif: bawah di Mobile, atas di Desktop) */}
      {toast && (
        <div className={`fixed bottom-4 left-4 right-4 sm:bottom-auto sm:top-6 sm:left-auto sm:right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border transition ${
          toast.type === 'success'
            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
            : 'bg-red-500/15 border-red-500/40 text-red-600 dark:text-red-400'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} className="shrink-0" /> : <AlertCircle size={18} className="shrink-0" />}
          <span className="text-xs sm:text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-brand-text">Management</h1>
        <p className="text-xs sm:text-sm text-brand-text-muted mt-0.5 sm:mt-1">
          Kelola data dasar layanan dan tim untuk mendukung operasional.
        </p>
      </div>

      {/* Tab Navigation (Responsif Scrollable) */}
      <div className="flex border-b border-brand-border mb-4 sm:mb-6 overflow-x-auto scrollbar-none whitespace-nowrap">
        <button
          onClick={() => handleTabChange('categories')}
          className={`pb-2.5 sm:pb-3 text-xs sm:text-sm font-semibold transition px-3.5 sm:px-6 shrink-0 relative ${
            activeTab === 'categories' ? 'text-brand-accent border-b-2 border-brand-accent' : 'text-brand-text-muted hover:text-brand-text'
          }`}
        >
          Service Kategori
        </button>
        <button
          onClick={() => handleTabChange('services')}
          className={`pb-2.5 sm:pb-3 text-xs sm:text-sm font-semibold transition px-3.5 sm:px-6 shrink-0 relative ${
            activeTab === 'services' ? 'text-brand-accent border-b-2 border-brand-accent' : 'text-brand-text-muted hover:text-brand-text'
          }`}
        >
          Service
        </button>
        <button
          onClick={() => handleTabChange('teams')}
          className={`pb-2.5 sm:pb-3 text-xs sm:text-sm font-semibold transition px-3.5 sm:px-6 shrink-0 relative ${
            activeTab === 'teams' ? 'text-brand-accent border-b-2 border-brand-accent' : 'text-brand-text-muted hover:text-brand-text'
          }`}
        >
          Teams
        </button>
        <button
          onClick={() => handleTabChange('jobs')}
          className={`pb-2.5 sm:pb-3 text-xs sm:text-sm font-semibold transition px-3.5 sm:px-6 shrink-0 relative ${
            activeTab === 'jobs' ? 'text-brand-accent border-b-2 border-brand-accent' : 'text-brand-text-muted hover:text-brand-text'
          }`}
        >
          Jobs
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'categories' && <CategoriesTab showToast={showToast} />}
      {activeTab === 'services' && <ServicesTab showToast={showToast} />}
      {activeTab === 'teams' && <TeamsTab showToast={showToast} />}
      {activeTab === 'jobs' && <JobsTab showToast={showToast} />} 
    </RoleLayout>
  );
}