import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head, usePage } from '@inertiajs/react';
import { Activity, RefreshCw, Search, Filter, Download, ChevronLeft, ChevronRight, Eye, X } from 'lucide-react';
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
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-text flex items-center gap-2">
            <Activity size={28} className="text-brand-accent" />
            Audit Logs
          </h1>
          <p className="text-sm text-brand-text-muted mt-1">
            Catatan aktivitas seluruh pengguna dalam sistem
          </p>
        </div>
        <button
          onClick={load}
          className="bg-brand-secondary border border-brand-border text-brand-text px-3 py-2 rounded-lg hover:bg-brand-muted flex items-center gap-2 text-sm transition"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-brand-secondary rounded-lg border border-brand-border p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" />
            <input
              type="text"
              placeholder="Cari user, aksi, entity..."
              value={search}
              onChange={handleSearchChange}
              className="w-full bg-brand-primary border border-brand-border text-brand-text rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="bg-brand-primary border border-brand-border text-brand-text px-4 py-2 rounded-lg hover:bg-brand-muted flex items-center gap-2 text-sm transition"
          >
            <Filter size={16} />
            {showFilters ? 'Sembunyikan' : 'Filter'}
          </button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-4 pt-4 border-t border-brand-border">
            <div>
              <label className="block text-xs text-brand-text-muted mb-1">User</label>
              <select
                value={filterUser}
                onChange={(e) => { setFilterUser(e.target.value); setPage(1); }}
                className="w-full bg-brand-primary border border-brand-border text-brand-text rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
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
              <label className="block text-xs text-brand-text-muted mb-1">Aksi</label>
              <select
                value={filterAction}
                onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}
                className="w-full bg-brand-primary border border-brand-border text-brand-text rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
              >
                <option value="">Semua</option>
                <option value="LOGIN">LOGIN</option>
                <option value="LOGOUT">LOGOUT</option>
                <option value="CREATE">CREATE</option>
                <option value="UPDATE">UPDATE</option>
                <option value="DELETE">DELETE</option>
                <option value="SEND_EMAIL">SEND EMAIL</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-brand-text-muted mb-1">Entity</label>
              <select
                value={filterEntity}
                onChange={(e) => { setFilterEntity(e.target.value); setPage(1); }}
                className="w-full bg-brand-primary border border-brand-border text-brand-text rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
              >
                <option value="">Semua</option>
                <option value="User">User</option>
                <option value="Order">Order</option>
                <option value="Service">Service</option>
                <option value="Customer">Customer</option>
                <option value="Payment">Payment</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-brand-text-muted mb-1">Dari Tanggal</label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => { setFilterDateFrom(e.target.value); setPage(1); }}
                className="w-full bg-brand-primary border border-brand-border text-brand-text rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
              />
            </div>

            <div>
              <label className="block text-xs text-brand-text-muted mb-1">Sampai Tanggal</label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => { setFilterDateTo(e.target.value); setPage(1); }}
                className="w-full bg-brand-primary border border-brand-border text-brand-text rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
              />
            </div>

            <div className="md:col-span-4 flex gap-2">
              <button
                onClick={handleResetFilters}
                className="bg-brand-primary border border-brand-border text-brand-text px-4 py-2 rounded-lg hover:bg-brand-muted text-sm transition"
              >
                Reset Filter
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="bg-brand-secondary rounded-lg border border-brand-border p-4 mb-4">
        <div className="text-sm text-brand-text-muted">
          Total: <span className="font-semibold text-brand-text">{total}</span> aktivitas tercatat
        </div>
      </div>

      {/* Table */}
      <div className="bg-brand-secondary rounded-lg border border-brand-border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-brand-text-muted">
            <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-brand-accent" />
            Memuat data...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            Error: {error}
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-brand-text-muted">
            Tidak ada aktivitas ditemukan
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-brand-muted/50 border-b border-brand-border">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">Waktu</th>
                    <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">User</th>
                    <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">Aksi</th>
                    <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">Detail</th>
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
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            setSelectedLog(log);
                            setShowDetail(true);
                          }}
                          className="flex items-center gap-1 text-brand-accent hover:text-brand-accent2 text-xs font-medium transition"
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-brand-border">
                <div className="text-sm text-brand-text-muted">
                  Halaman {page} dari {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 bg-brand-primary border border-brand-border text-brand-text rounded hover:bg-brand-muted disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-1"
                  >
                    <ChevronLeft size={16} />
                    Prev
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 bg-brand-primary border border-brand-border text-brand-text rounded hover:bg-brand-muted disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-1"
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {showDetail && selectedLog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowDetail(false)}>
          <div className="bg-brand-secondary border border-brand-border rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-brand-border">
              <h3 className="text-lg font-semibold text-brand-text">Detail Aktivitas</h3>
              <button onClick={() => setShowDetail(false)} className="text-brand-text-muted hover:text-brand-text transition">
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              <div className="space-y-4">
                {/* Waktu */}
                <div>
                  <label className="text-xs text-brand-text-muted uppercase tracking-wider font-semibold">Waktu</label>
                  <p className="text-brand-text mt-1">{formatDateTime(selectedLog.created_at)}</p>
                </div>

                {/* User */}
                <div>
                  <label className="text-xs text-brand-text-muted uppercase tracking-wider font-semibold">User</label>
                  <div className="mt-1">
                    <p className="text-brand-text font-medium">{selectedLog.user_name || '—'}</p>
                    {selectedLog.user_email && <p className="text-brand-text-muted text-sm">{selectedLog.user_email}</p>}
                    {selectedLog.user_role && <p className="text-brand-accent text-sm font-semibold">{selectedLog.user_role}</p>}
                  </div>
                </div>

                {/* Aksi */}
                <div>
                  <label className="text-xs text-brand-text-muted uppercase tracking-wider font-semibold">Aksi</label>
                  <div className="mt-1">
                    <span className={`text-xs px-2 py-1 rounded font-mono font-semibold ${getActionBadge(selectedLog.action)}`}>
                      {selectedLog.action}
                    </span>
                  </div>
                </div>

                {/* Entity */}
                {selectedLog.entity_type && (
                  <div>
                    <label className="text-xs text-brand-text-muted uppercase tracking-wider font-semibold">Entity</label>
                    <p className="text-brand-text mt-1">
                      {selectedLog.entity_type} {selectedLog.entity_id ? `#${selectedLog.entity_id}` : ''}
                    </p>
                  </div>
                )}

                {/* IP Address */}
                {selectedLog.ip_address && (
                  <div>
                    <label className="text-xs text-brand-text-muted uppercase tracking-wider font-semibold">IP Address</label>
                    <p className="text-brand-text mt-1 font-mono text-sm">{selectedLog.ip_address}</p>
                  </div>
                )}

                {/* Detail Aktivitas */}
                <div>
                  <label className="text-xs text-brand-text-muted uppercase tracking-wider font-semibold">Detail Aktivitas</label>
                  <div className="mt-2 bg-brand-primary rounded-lg border border-brand-border overflow-hidden">
                    {renderDetailTable(selectedLog)}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end p-4 border-t border-brand-border">
              <button
                onClick={() => setShowDetail(false)}
                className="px-4 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent2 transition"
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
      <div className="p-4 text-sm text-brand-text-muted">
        Tidak ada detail perubahan
      </div>
    );
  }

  try {
    const data = JSON.parse(log.after_data);
    
    // Gunakan details jika ada (dari backend custom)
    if (data.details) {
      // Parse details jadi key-value pairs
      const lines = data.details.split('\n').filter(line => line.trim());
      const rows = [];
      
      // Tambahkan Module/Fitur di baris pertama jika ada
      if (data.module) {
        rows.push({ field: 'Modul/Fitur', value: data.module });
      }
      
      // Tambahkan Email Tujuan khusus untuk SEND_EMAIL
      if (data.recipients && Array.isArray(data.recipients) && data.recipients.length > 0) {
        rows.push({ field: 'Email Tujuan', value: data.recipients.join(', ') });
      } else if (data.recipient) {
        rows.push({ field: 'Email Tujuan', value: data.recipient });
      }

      // Deteksi jika details menyebut pengiriman invoice/email tapi barisnya list bullet
      const bulletRecipients = lines
        .filter(l => l.trim().startsWith('- '))
        .map(l => l.replace(/^[-\s]+/, '').trim());
      if (bulletRecipients.length > 0 && !rows.some(r => r.field === 'Email Tujuan')) {
        rows.push({ field: 'Email Tujuan', value: bulletRecipients.join(', ') });
      }
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim().startsWith('- ')) continue; // sudah diproses ke Email Tujuan
        // Skip header line (yang tidak ada : atau →)
        if (!line.includes(':') && !line.includes('→')) continue;
        
        if (line.includes('→')) {
          // Format UPDATE: "Nama: "old" → "new""
          const [label, values] = line.split(':').map(s => s.trim());
          rows.push({ field: label, value: values });
        } else if (line.includes(':')) {
          // Format CREATE/DELETE: "Nama: value"
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
          <div className="p-4 text-sm text-brand-text">
            {data.details}
          </div>
        );
      }
      
      return (
        <table className="w-full">
          <thead className="bg-brand-secondary border-b border-brand-border">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-brand-text-muted uppercase tracking-wider w-1/3">Field</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-brand-text-muted uppercase tracking-wider">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-brand-secondary/30 transition">
                <td className="px-4 py-3 text-sm font-medium text-brand-text">{row.field}</td>
                <td className="px-4 py-3 text-sm text-brand-text whitespace-pre-wrap break-words">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
        <div className="p-4 text-sm text-brand-text-muted">
          {action === 'CREATE' && `Menambahkan ${entity} baru`}
          {action === 'UPDATE' && `Mengubah data ${entity}`}
          {action === 'DELETE' && `Menghapus ${entity}`}
          {!['CREATE', 'UPDATE', 'DELETE'].includes(action) && `${action} ${entity}`}
        </div>
      );
    }
    
    return (
      <table className="w-full">
        <thead className="bg-brand-secondary border-b border-brand-border">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-semibold text-brand-text-muted uppercase tracking-wider w-1/3">Field</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-brand-text-muted uppercase tracking-wider">Value</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-border">
          {fields.map((row, idx) => (
            <tr key={idx} className="hover:bg-brand-secondary/30 transition">
              <td className="px-4 py-3 text-sm font-medium text-brand-text">{row.field}</td>
              <td className="px-4 py-3 text-sm text-brand-text whitespace-pre-wrap break-words">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  } catch (e) {
    return (
      <div className="p-4 text-sm text-brand-text-muted">
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
    
    // Prioritaskan details jika ada (dari backend custom audit log)
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
      // Cek ada changes array (dari backend)
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
