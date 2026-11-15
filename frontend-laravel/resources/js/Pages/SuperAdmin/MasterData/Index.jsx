import { useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head } from '@inertiajs/react';
import Toast from '@/Components/Toast';
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

      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="mb-14">
        <h1 className="text-2xl font-bold text-brand-text">Management</h1>
        <p className="text-sm text-brand-text-muted mt-1">
          Kelola data dasar layanan dan tim untuk mendukung operasional.
        </p>
      </div>

      <div className="inline-flex border-b border-brand-border mb-6 space-x-2">
        <button
          onClick={() => handleTabChange('categories')}
          className={`pb-3 text-sm font-semibold transition px-4 relative ${
            activeTab === 'categories' ? 'text-brand-accent border-b-2 border-brand-accent' : 'text-brand-text-muted hover:text-brand-text'
          }`}
        >
          Service Kategori
        </button>
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
        <button
          onClick={() => handleTabChange('jobs')}
          className={`pb-3 text-sm px-8 font-semibold transition relative ${
            activeTab === 'jobs' ? 'text-brand-accent border-b-2 border-brand-accent' : 'text-brand-text-muted hover:text-brand-text'
          }`}
        >
          Jobs
        </button>
      </div>

      {activeTab === 'categories' && <CategoriesTab showToast={showToast} />}
      {activeTab === 'services' && <ServicesTab showToast={showToast} />}
      {activeTab === 'teams' && <TeamsTab showToast={showToast} />}
      {activeTab === 'jobs' && <JobsTab showToast={showToast} />} 
    </RoleLayout>
  );
}