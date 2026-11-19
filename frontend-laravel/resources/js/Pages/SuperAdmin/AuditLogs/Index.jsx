import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head, usePage } from '@inertiajs/react';
import { Activity, RefreshCw, Search, Filter, ChevronLeft, ChevronRight, Eye, X } from 'lucide-react';
import { apiFetch } from '@/utils/api';

export default function AuditLogsPage() {
  const { auth } = usePage().props;
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [total, setTotal] = useState(0);
  
  // Filters
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterEntity, setFilterEntity] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Detail modal
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  
  // User list untuk filter
  const [users, setUsers] = useState([]);

  const load = () => {
    setLoading(true);
    setError('');
    
    const params = new URLSearchParams({
      page: page.toString(),
      limit: perPage.toString(),
      ...(search && { search }),
      ...(filterAction && { action: filterAction }),
      ...(filterEntity && { entity_type: filterEntity }),
      ...(filterUser && { user_id: filterUser }),
      ...(filterDateFrom && { date_from: filterDateFrom }),
      ...(filterDateTo && { date_to: filterDateTo }),
    });

    apiFetch(`/api/v1/audit-logs?${params}`, {}, auth)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setLogs(d.data.logs || d.data);
          setTotal(d.data.total || d.data.length || 0);
        } else {
          setError(d.message || 'Gagal ambil data');
        }
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  };
  
  // Load users untuk filter
  useEffect(() => {
    apiFetch('/api/v1/users', {}, auth)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setUsers(d.data || []);
        }
      })
      .catch(e => console.error('Failed to load users:', e));
  }, []);

  useEffect(() => {
    load();
  }, [page, search, filterAction, filterEntity, filterUser, filterDateFrom, filterDateTo]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setFilterAction('');
    setFilterEntity('');
    setFilterUser('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setPage(1);
  };

  const totalPages = Math.ceil(total / perPage);

  return (
    <RoleLayout>
      <Head title="Audit Logs" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-brand-text flex items-center gap-2">
            <span>Audit Logs</span>
          </h1>
          <p className="text-xs sm:text-sm text-brand-text-muted mt-0.5">
            Catatan aktivitas seluruh pengguna dalam sistem
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="bg-brand-secondary border border-brand-border text-brand-text px-3.5 py-2.5 sm:py-2 rounded-xl hover:bg-brand-muted flex items-center justify-center gap-2 text-xs sm:text-sm font-medium transition shadow-sm w-full sm:w-auto disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search & Filters Toolbar */}
      <div className="bg-brand-secondary rounded-xl border border-brand-border p-3.5 sm:p-4 mb-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-text-muted" />
            <input
              type="text"
              placeholder="Cari user, aksi, entity..."
              value={search}
              onChange={handleSearchChange}
              className="w-full bg-brand-primary border border-brand-border text-brand-text rounded-xl pl-10 pr-9 py-2.5 sm:py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-brand-text transition p-1"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter Toggle */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="bg-brand-primary border border-brand-border text-brand-text px-4 py-2.5 sm:py-2 rounded-xl hover:bg-brand-muted flex items-center justify-center gap-2 text-xs sm:text-sm font-medium transition shadow-sm"
          >
            <Filter size={15} className={showFilters ? 'text-brand-accent' : ''} />
            <span>{showFilters ? 'Sembunyikan Filter' : 'Filter'}</span>
          </button>
        </div>

        {/* Filter Options Panel */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 mt-4 pt-4 border-t border-brand-border">
            <div>
              <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-1">User</label>
              <select
                value={filterUser}
                onChange={(e) => { setFilterUser(e.target.value); setPage(1); }}
                className="w-full bg-brand-primary border border-brand-border text-brand-text rounded-xl px-3 py-2.5 sm:py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
              >
                <option value="">Semua User</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.roles?.name || 'N/A'})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-1">Aksi</label>
              <select
                value={filterAction}
                onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}
                className="w-full bg-brand-primary border border-brand-border text-brand-text rounded-xl px-3 py-2.5 sm:py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
              >
                <option value="">Semua Aksi</option>
                <option value="LOGIN">LOGIN</option>
                <option value="LOGOUT">LOGOUT</option>
                <option value="CREATE">CREATE</option>
                <option value="UPDATE">UPDATE</option>
                <option value="DELETE">DELETE</option>
                <option value="SEND_EMAIL">SEND EMAIL</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-1">Entity</label>
              <select
                value={filterEntity}
                onChange={(e) => { setFilterEntity(e.target.value); setPage(1); }}
                className="w-full bg-brand-primary border border-brand-border text-brand-text rounded-xl px-3 py-2.5 sm:py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
              >
                <option value="">Semua Entity</option>
                <option value="User">User</option>
                <option value="Order">Order</option>
                <option value="Service">Service</option>
                <option value="Customer">Customer</option>
                <option value="Payment">Payment</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-1">Dari Tanggal</label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => { setFilterDateFrom(e.target.value); setPage(1); }}
                className="w-full bg-brand-primary border border-brand-border text-brand-text rounded-xl px-3 py-2.5 sm:py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-1">Sampai Tanggal</label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => { setFilterDateTo(e.target.value); setPage(1); }}
                className="w-full bg-brand-primary border border-brand-border text-brand-text rounded-xl px-3 py-2.5 sm:py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
              />
            </div>

            <div className="sm:col-span-2 md:col-span-5 flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleResetFilters}
                className="w-full sm:w-auto bg-brand-primary border border-brand-border text-brand-text px-4 py-2 rounded-xl hover:bg-brand-muted text-xs sm:text-sm font-medium transition"
              >
                Reset Filter
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stats Card */}
      <div className="bg-brand-secondary rounded-xl border border-brand-border p-3.5 sm:p-4 mb-4 shadow-sm">
        <div className="text-xs sm:text-sm text-brand-text-muted">
          Total: <span className="font-semibold text-brand-text">{total}</span> aktivitas tercatat
        </div>
      </div>

      {/* Data View Container */}
      <div className="bg-brand-secondary rounded-xl border border-brand-border overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 sm:p-12 text-center text-brand-text-muted">
            <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-brand-accent" />
            <p className="text-xs sm:text-sm">Memuat data audit log...</p>
          </div>
        ) : error ? (
          <div className="p-6 sm:p-8 text-center text-red-600 dark:text-red-400 text-xs sm:text-sm">
            Error: {error}
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 sm:p-12 text-center text-brand-text-muted text-xs sm:text-sm">
            Tidak ada aktivitas ditemukan
          </div>
        ) : (
          <>
            {/* 1. CARD VIEW (MOBILE - < md) */}
            <div className="block md:hidden divide-y divide-brand-border/50">
              {logs.map((log) => (
                <div key={log.id} className="p-4 space-y-3 hover:bg-brand-muted/30 transition">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[11px] text-brand-text-muted font-mono">
                      {formatDateTime(log.created_at)}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold shrink-0 ${getActionBadge(log.action)}`}>
                      {log.action}
                    </span>
                  </div>

                  <div className="bg-brand-primary/40 rounded-xl p-3 border border-brand-border/40 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-brand-text">{log.user_name || '—'}</span>
                      {log.user_role && (
                        <span className="text-[10px] text-brand-accent font-semibold">{log.user_role}</span>
                      )}
                    </div>
                    {log.user_email && (
                      <p className="text-[11px] text-brand-text-muted truncate">{log.user_email}</p>
                    )}
                    {log.entity_type && (
                      <p className="text-[11px] text-brand-text-muted pt-1 border-t border-brand-border/30 mt-1">
                        Entity: <span className="text-brand-text font-medium">{log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-end pt-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLog(log);
                        setShowDetail(true);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-accent border border-brand-accent/40 hover:bg-brand-accent/10 transition flex items-center gap-1.5"
                    >
                      <Eye size={14} />
                      <span>Lihat Detail</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* 2. TABLE VIEW (DESKTOP - >= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-brand-muted/50 border-b border-brand-border">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">Waktu</th>
                    <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">User</th>
                    <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">Aksi</th>
                    <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest text-right">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/50">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-brand-muted/40 transition">
                      <td className="px-4 py-3 text-brand-text-muted text-xs whitespace-nowrap">
                        {formatDateTime(log.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-brand-text font-medium">{log.user_name || '—'}</span>
                          {log.user_email && (
                            <span className="text-brand-text-muted text-xs">{log.user_email}</span>
                          )}
                          {log.user_role && (
                            <span className="text-brand-accent text-xs font-semibold">{log.user_role}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded font-mono font-semibold ${getActionBadge(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLog(log);
                            setShowDetail(true);
                          }}
                          className="inline-flex items-center gap-1 text-brand-accent hover:text-brand-accent2 text-xs font-medium transition"
                        >
                          <Eye size={14} />
                          Lihat
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-brand-border bg-brand-secondary">
                <div className="text-xs sm:text-sm text-brand-text-muted">
                  Halaman <strong className="text-brand-text">{page}</strong> dari <strong className="text-brand-text">{totalPages}</strong>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="flex-1 sm:flex-initial px-3 py-1.5 bg-brand-primary border border-brand-border text-brand-text text-xs sm:text-sm rounded-xl hover:bg-brand-muted disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-1"
                  >
                    <ChevronLeft size={16} />
                    <span>Prev</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="flex-1 sm:flex-initial px-3 py-1.5 bg-brand-primary border border-brand-border text-brand-text text-xs sm:text-sm rounded-xl hover:bg-brand-muted disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-1"
                  >
                    <span>Next</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal (Responsif Mobile) */}
      {showDetail && selectedLog && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4" onClick={() => setShowDetail(false)}>
          <div className="bg-brand-secondary border border-brand-border rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header Modal */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-brand-border shrink-0">
              <h3 className="text-base sm:text-lg font-bold text-brand-text">Detail Aktivitas</h3>
              <button type="button" onClick={() => setShowDetail(false)} className="text-brand-text-muted hover:text-brand-text p-1 rounded-lg transition">
                <X size={20} />
              </button>
            </div>

            {/* Body Content */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs sm:text-sm">
              {/* Waktu */}
              <div>
                <label className="text-[11px] sm:text-xs text-brand-text-muted uppercase tracking-wider font-semibold block">Waktu</label>
                <p className="text-brand-text mt-0.5 font-mono text-xs sm:text-sm">{formatDateTime(selectedLog.created_at)}</p>
              </div>

              {/* User */}
              <div>
                <label className="text-[11px] sm:text-xs text-brand-text-muted uppercase tracking-wider font-semibold block">User</label>
                <div className="mt-1 bg-brand-primary/40 border border-brand-border/60 p-3 rounded-xl">
                  <p className="text-brand-text font-medium">{selectedLog.user_name || '—'}</p>
                  {selectedLog.user_email && <p className="text-brand-text-muted text-xs mt-0.5">{selectedLog.user_email}</p>}
                  {selectedLog.user_role && <p className="text-brand-accent text-xs font-semibold mt-0.5">{selectedLog.user_role}</p>}
                </div>
              </div>

              {/* Aksi */}
              <div>
                <label className="text-[11px] sm:text-xs text-brand-text-muted uppercase tracking-wider font-semibold block mb-1">Aksi</label>
                <div>
                  <span className={`text-xs px-2.5 py-1 rounded font-mono font-semibold inline-block ${getActionBadge(selectedLog.action)}`}>
                    {selectedLog.action}
                  </span>
                </div>
              </div>

              {/* Entity */}
              {selectedLog.entity_type && (
                <div>
                  <label className="text-[11px] sm:text-xs text-brand-text-muted uppercase tracking-wider font-semibold block">Entity</label>
                  <p className="text-brand-text mt-0.5 font-medium">
                    {selectedLog.entity_type} {selectedLog.entity_id ? `#${selectedLog.entity_id}` : ''}
                  </p>
                </div>
              )}

              {/* Detail Aktivitas */}
              <div>
                <label className="text-[11px] sm:text-xs text-brand-text-muted uppercase tracking-wider font-semibold block mb-1.5">Detail Aktivitas</label>
                <div className="bg-brand-primary rounded-xl border border-brand-border overflow-hidden">
                  {renderDetailTable(selectedLog)}
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="flex justify-end p-4 border-t border-brand-border shrink-0 bg-brand-secondary">
              <button
                type="button"
                onClick={() => setShowDetail(false)}
                className="w-full sm:w-auto px-5 py-2.5 bg-brand-accent text-brand-primary font-semibold text-xs sm:text-sm rounded-xl hover:bg-brand-accent2 transition shadow-sm"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </RoleLayout>
  );
}

// ============ HELPERS ============
function renderDetailTable(log) {
  const action = log.action;
  const entity = log.entity_type || 'Data';
  
  if (!log.after_data) {
    return (
      <div className="p-4 text-xs sm:text-sm text-brand-text-muted">
        Tidak ada detail perubahan
      </div>
    );
  }

  try {
    const data = JSON.parse(log.after_data);
    
    // Gunakan details jika ada (dari backend custom)
    if (data.details) {
      const lines = data.details.split('\n').filter(line => line.trim());
      const rows = [];
      
      if (data.module) {
        rows.push({ field: 'Modul/Fitur', value: data.module });
      }
      
      if (data.recipients && Array.isArray(data.recipients) && data.recipients.length > 0) {
        rows.push({ field: 'Email Tujuan', value: data.recipients.join(', ') });
      } else if (data.recipient) {
        rows.push({ field: 'Email Tujuan', value: data.recipient });
      }

      const bulletRecipients = lines
        .filter(l => l.trim().startsWith('- '))
        .map(l => l.replace(/^[-\s]+/, '').trim());
      if (bulletRecipients.length > 0 && !rows.some(r => r.field === 'Email Tujuan')) {
        rows.push({ field: 'Email Tujuan', value: bulletRecipients.join(', ') });
      }
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim().startsWith('- ')) continue;
        if (!line.includes(':') && !line.includes('→')) continue;
        
        if (line.includes('→')) {
          const [label, values] = line.split(':').map(s => s.trim());
          rows.push({ field: label, value: values });
        } else if (line.includes(':')) {
          const [label, ...valueParts] = line.split(':');
          const trimmedLabel = label.trim();
          const trimmedValue = valueParts.join(':').trim();
          if (trimmedValue) {
            rows.push({ field: trimmedLabel, value: trimmedValue });
          }
        }
      }
      
      if (rows.length === 0) {
        return (
          <div className="p-4 text-xs sm:text-sm text-brand-text break-words">
            {data.details}
          </div>
        );
      }
      
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-brand-secondary border-b border-brand-border">
              <tr>
                <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold text-brand-text-muted uppercase tracking-wider w-1/3">Field</th>
                <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold text-brand-text-muted uppercase tracking-wider">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-brand-secondary/30 transition">
                  <td className="px-3.5 py-2.5 font-medium text-brand-text align-top">{row.field}</td>
                  <td className="px-3.5 py-2.5 text-brand-text whitespace-pre-wrap break-words">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    
    // Fallback: gunakan data fields langsung
    const fields = [];
    if (data.module) fields.push({ field: 'Modul/Fitur', value: data.module });
    if (data.name) fields.push({ field: 'Nama', value: data.name });
    if (data.email) fields.push({ field: 'Email', value: data.email });
    if (data.phone) fields.push({ field: 'Telepon', value: data.phone });
    if (data.address) fields.push({ field: 'Alamat', value: data.address });
    if (data.role) fields.push({ field: 'Role', value: data.role });
    if (data.job) fields.push({ field: 'Job', value: data.job });
    if (data.jobs) fields.push({ field: 'Jobs', value: data.jobs });
    if (data.status) fields.push({ field: 'Status', value: data.status });
    if (data.description) fields.push({ field: 'Deskripsi', value: data.description });
    if (data.company_name) fields.push({ field: 'Perusahaan', value: data.company_name });
    if (data.recipient) fields.push({ field: 'Email Tujuan', value: data.recipient });
    if (data.recipients && Array.isArray(data.recipients)) {
      fields.push({ field: 'Email Tujuan', value: data.recipients.join(', ') });
    }
    if (data.invoice_number) fields.push({ field: 'Invoice Number', value: data.invoice_number });
    if (data.changes && Array.isArray(data.changes)) {
      data.changes.forEach(change => {
        fields.push({ field: 'Perubahan', value: change });
      });
    }
    
    if (fields.length === 0) {
      return (
        <div className="p-4 text-xs sm:text-sm text-brand-text-muted">
          {action === 'CREATE' && `Menambahkan ${entity} baru`}
          {action === 'UPDATE' && `Mengubah data ${entity}`}
          {action === 'DELETE' && `Menghapus ${entity}`}
          {!['CREATE', 'UPDATE', 'DELETE'].includes(action) && `${action} ${entity}`}
        </div>
      );
    }
    
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-brand-secondary border-b border-brand-border">
            <tr>
              <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold text-brand-text-muted uppercase tracking-wider w-1/3">Field</th>
              <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold text-brand-text-muted uppercase tracking-wider">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {fields.map((row, idx) => (
              <tr key={idx} className="hover:bg-brand-secondary/30 transition">
                <td className="px-3.5 py-2.5 font-medium text-brand-text align-top">{row.field}</td>
                <td className="px-3.5 py-2.5 text-brand-text whitespace-pre-wrap break-words">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  } catch (e) {
    return (
      <div className="p-4 text-xs sm:text-sm text-brand-text-muted">
        {action === 'CREATE' && `Menambahkan ${entity} baru`}
        {action === 'UPDATE' && `Mengubah data ${entity}`}
        {action === 'DELETE' && `Menghapus ${entity}`}
        {!['CREATE', 'UPDATE', 'DELETE'].includes(action) && `${action} ${entity}`}
      </div>
    );
  }
}

function formatDetail(log) {
  const action = log.action;
  const entity = log.entity_type || 'Data';
  
  if (!log.after_data) {
    if (action === 'CREATE') return `Menambahkan ${entity} baru`;
    if (action === 'UPDATE') return `Mengubah data ${entity}`;
    if (action === 'DELETE') return `Menghapus ${entity}`;
    return `${action} ${entity}`;
  }

  try {
    const data = JSON.parse(log.after_data);
    
    if (data.details) {
      return data.details;
    }
    
    if (action === 'CREATE') {
      const fields = [];
      if (data.name) fields.push(`Nama: ${data.name}`);
      if (data.email) fields.push(`Email: ${data.email}`);
      if (data.phone) fields.push(`Telepon: ${data.phone}`);
      if (data.address) fields.push(`Alamat: ${data.address}`);
      if (data.role) fields.push(`Role: ${data.role}`);
      if (data.job) fields.push(`Job: ${data.job}`);
      if (data.jobs) fields.push(`Jobs: ${data.jobs}`);
      if (data.status) fields.push(`Status: ${data.status}`);
      if (data.price) fields.push(`Harga: ${data.price}`);
      if (data.description) fields.push(`Deskripsi: ${data.description}`);
      if (data.company_name) fields.push(`Perusahaan: ${data.company_name}`);
      if (data.contact_person) fields.push(`Contact Person: ${data.contact_person}`);
      
      if (fields.length > 0) {
        return `Menambahkan ${entity} baru\n\n${fields.join('\n')}`;
      }
      return `Menambahkan ${entity} baru`;
    } 
    
    if (action === 'UPDATE') {
      if (data.changes && Array.isArray(data.changes)) {
        return `Mengubah data ${entity}\n\n${data.changes.join('\n')}`;
      }
      
      const fields = [];
      if (data.name) fields.push(`Nama: ${data.name}`);
      if (data.email) fields.push(`Email: ${data.email}`);
      if (data.phone) fields.push(`Telepon: ${data.phone}`);
      if (data.address) fields.push(`Alamat: ${data.address}`);
      if (data.role) fields.push(`Role: ${data.role}`);
      if (data.status) fields.push(`Status: ${data.status}`);
      if (data.description) fields.push(`Deskripsi: ${data.description}`);
      
      if (fields.length > 0) {
        return `Mengubah data ${entity}\n\n${fields.join('\n')}`;
      }
      return `Mengubah data ${entity}`;
    } 
    
    if (action === 'DELETE') {
      const identifier = data.name || data.email || data.id || '';
      if (identifier) {
        return `Menghapus ${entity}: ${identifier}`;
      }
      return `Menghapus ${entity}`;
    }
    
    return `${action} ${entity}`;
  } catch (e) {
    if (action === 'CREATE') return `Menambahkan ${entity} baru`;
    if (action === 'UPDATE') return `Mengubah data ${entity}`;
    if (action === 'DELETE') return `Menghapus ${entity}`;
    return `${action} ${entity}`;
  }
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function getActionBadge(action) {
  const badges = {
    LOGIN: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30',
    LOGOUT: 'bg-gray-500/15 text-gray-600 dark:text-gray-400 border border-gray-500/30',
    CREATE: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30',
    UPDATE: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30',
    DELETE: 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30',
    VIEW: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30',
  };
  return badges[action] || 'bg-brand-accent/15 text-brand-accent border border-brand-accent/30';
}