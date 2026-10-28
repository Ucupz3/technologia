import RoleLayout from '@/Layouts/RoleLayout';
import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import {
  AlertCircle, Calendar, CalendarDays, CalendarX, CheckCircle2, ChevronDown,
  ChevronLeft, ChevronRight, Clock, FileText, Loader2, Mail, Plus, RefreshCw, Search, TrendingUp,
  X, XCircle,
} from 'lucide-react';
import { api, ApiError, STATUS_OPTIONS, PAYMENT_OPTIONS } from '@/lib/dashboardApi';

const PAGE_SIZE = 10;

/* ───────── Gaya bersama ───────── */
const inputCls =
  'w-full rounded-lg border border-[#304862] bg-[#122337] px-3 py-2 text-[13px] text-white placeholder:text-slate-500 transition focus:border-[#4de8ff] focus:outline-none focus:ring-2 focus:ring-[#4de8ff]/30';
const card = 'rounded-2xl border border-[#304862] bg-[#1b2d42]';
const btnGhost =
  'rounded-xl border border-[#304862] px-4 py-2 text-[12px] font-semibold text-slate-200 transition hover:border-[#4de8ff]/50 hover:bg-[#4de8ff]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4de8ff]';
const btnPrimary =
  'rounded-xl bg-[#4de8ff] px-5 py-2 text-[12px] font-bold text-[#102033] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white';

const orderTone = {
  Diproses: 'bg-[#4de8ff]/15 text-[#72e7f7]',
  Pending: 'bg-amber-400/10 text-amber-300',
  Selesai: 'bg-slate-400/15 text-slate-300',
};
const scheduleTone = {
  Terjadwal: 'bg-amber-400/10 text-amber-300',
  Proses: 'bg-emerald-400/10 text-emerald-300',
  Siap: 'bg-sky-400/10 text-sky-300',
  Pending: 'bg-rose-400/10 text-rose-300',
};
const dueTone = (t = '') => (t.toLowerCase().includes('terlambat') ? 'text-rose-400' : /hari ini|besok/i.test(t) ? 'text-cyan-300' : 'text-slate-300');

function useDebounced(value, ms = 400) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/* ───────── Elemen dasar ───────── */
const Pill = ({ children, className = '' }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${className}`}>{children}</span>
);
const Skeleton = ({ className = '' }) => <div className={`animate-pulse rounded bg-white/10 ${className}`} />;

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-medium text-slate-300">{label}</span>
      {children}
      {error && <span className="mt-1 block text-[11px] text-rose-400">{error}</span>}
    </label>
  );
}

function Select({ value, onChange, options, label }) {
  return (
    <div className="relative">
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputCls} appearance-none pr-8`}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [toast, onClose]);
  if (!toast) return null;
  const ok = toast.type === 'success';
  return (
    <div role="status" className="fixed bottom-5 right-5 z-[60] flex max-w-sm items-start gap-2 rounded-xl border border-[#304862] bg-[#14263a] px-4 py-3 text-[13px] text-white shadow-xl">
      {ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />}
      <span>{toast.message}</span>
    </div>
  );
}

function Modal({ title, subtitle, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div
        role="dialog" aria-modal="true" aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#304862] bg-[#17283c] p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[18px] font-semibold tracking-tight text-white">{title}</h2>
            {subtitle && <p className="mt-0.5 text-[12px] text-slate-400">{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="Tutup" className="rounded-full p-1 text-slate-400 hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

const ErrorBox = ({ children }) => (
  <p className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[12px] text-rose-300">
    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {children}
  </p>
);

/* ───────── Modal: Add Project ───────── */
const EMPTY = { customer: '', service: '', value: '', team: '', date: '', time: '', notes: '' };

function AddProjectModal({ onClose, onDone }) {
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fieldErr, setFieldErr] = useState({});
  const [suggest, setSuggest] = useState([]);
  const [options, setOptions] = useState({ customers: [], services: [], teams: [] });
  const q = useDebounced(form.customer, 300);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    const ac = new AbortController();
    api.getOrderOptions(ac.signal)
      .then(setOptions)
      .catch((err) => err.name !== 'AbortError' && setError(err.message));
    return () => ac.abort();
  }, []);

  useEffect(() => {
    if (q.trim().length < 2) { setSuggest([]); return undefined; }
    const ac = new AbortController();
    api.getCustomers(q, ac.signal)
      .then(setSuggest)
      .catch((err) => err.name !== 'AbortError' && setError(err.message));
    return () => ac.abort();
  }, [q]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(''); setFieldErr({});
    try {
      await api.createOrder(form, options);
      onDone('Project berhasil ditambahkan.');
    } catch (err) {
      setError(err.message || 'Project gagal disimpan.');
      setFieldErr(err.details || {});
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Tambah Project" subtitle="Gunakan customer dan layanan yang sudah terdaftar." onClose={onClose}>
      <form onSubmit={submit} className="space-y-3.5">
        {error && <ErrorBox>{error}</ErrorBox>}
        <Field label="Nama customer" error={fieldErr.customer || fieldErr.customerName}>
          <input list="customer-list" className={inputCls} value={form.customer} onChange={set('customer')} placeholder="Cari customer terdaftar" required autoFocus />
          <datalist id="customer-list">{suggest.map((n) => <option key={n} value={n} />)}</datalist>
        </Field>
        <Field label="Layanan" error={fieldErr.service || fieldErr.serviceName}>
          <input list="service-list" className={inputCls} value={form.service} onChange={set('service')} placeholder="Pilih layanan aktif" required />
          <datalist id="service-list">{options.services.map((service) => <option key={service.id} value={service.name} />)}</datalist>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nilai project (Rp)" error={fieldErr.value || fieldErr.amount}>
            <input type="number" min="0" className={inputCls} value={form.value} onChange={set('value')} placeholder="0" />
          </Field>
          <Field label="Tim" error={fieldErr.team || fieldErr.teamName}>
            <input list="team-list" className={inputCls} value={form.team} onChange={set('team')} placeholder="Pilih tim aktif" />
            <datalist id="team-list">{options.teams.map((team) => <option key={team.id} value={team.name} />)}</datalist>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tanggal" error={fieldErr.date || fieldErr.scheduledAt}>
            <input type="date" className={inputCls} value={form.date} onChange={set('date')} />
          </Field>
          <Field label="Jam">
            <input type="time" className={inputCls} value={form.time} onChange={set('time')} />
          </Field>
        </div>
        <Field label="Catatan" error={fieldErr.notes}>
          <textarea rows={3} className={inputCls} value={form.notes} onChange={set('notes')} placeholder="Opsional" />
        </Field>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className={btnGhost}>Batal</button>
          <button disabled={busy} className={btnPrimary}>
            {busy ? <span className="inline-flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Menyimpan</span> : 'Simpan project'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ───────── Statistik ───────── */
function StatCard({ title, value, note, icon: Icon, accent, featured, loading }) {
  return (
    <div className={`group relative overflow-hidden rounded-xl border p-3.5 transition duration-200 hover:-translate-y-0.5 ${featured ? 'border-[#4de8ff] bg-[#4de8ff] text-[#102033] shadow-[0_8px_24px_-16px_rgba(77,232,255,0.9)]' : `border-[#38536d] ${accent.surface}`}`}>
      {!featured && <div className={`absolute inset-x-0 top-0 h-1 ${accent.strip}`} />}
      <div className="flex items-start justify-between">
        <h3 className={`text-[13px] font-semibold leading-tight ${featured ? 'text-[#102033]' : 'text-slate-200'}`}>{title}</h3>
        <span className={`grid h-8 w-8 place-items-center rounded-lg ${featured ? 'bg-[#102033]/10 text-[#102033]' : `${accent.bg} ring-1 ring-inset ring-white/5`}`}>
          <Icon className={`h-[18px] w-[18px] ${featured ? 'text-[#102033]' : accent.icon}`} strokeWidth={2} />
        </span>
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        {loading ? <Skeleton className="mb-1 h-9 w-16" /> : <span className={`text-[38px] font-semibold leading-none tracking-tight tabular-nums ${featured ? 'text-[#102033]' : 'text-white'}`}>{value}</span>}
        <Icon className={`mb-1 h-8 w-8 ${featured ? 'text-[#102033]/35' : `${accent.icon} opacity-80`}`} strokeWidth={1.7} />
      </div>
      <p className={`mt-2 truncate text-[11px] ${featured ? 'text-[#102033]/75' : 'text-slate-400'}`}>{note}</p>
    </div>
  );
}

function ProjectChart({ data, loading }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const peak = Math.max(...data.map((d) => d.value), 0);
  const bars = data.length ? data : Array.from({ length: 7 }, () => ({ label: '·', value: 0 }));
  return (
    <div className="flex h-full min-h-[205px] flex-col rounded-xl border border-[#38536d] bg-[#102033] p-3.5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[14px] font-semibold text-white">Analisis Project</h2>
        <span className="rounded-full bg-[#1b3650] px-2.5 py-1 text-[10px] font-medium text-[#a6c4df]">7 hari terakhir</span>
      </div>
      <div className="mt-2 flex flex-1 items-end justify-between gap-2" style={{ minHeight: 132 }}>
        {bars.map((d, i) => {
          const pct = d.value === 0 ? 12 : Math.max((d.value / max) * 100, 14);
          const barTone = peak > 0 && d.value === peak
            ? 'bg-[#4de8ff]'
            : ['bg-[#63c6df]', 'bg-[#5a9fc4]', 'bg-[#7da9d1]', 'bg-[#8a9fc7]'][i % 4];
          return (
            <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${d.label}: ${d.value} order`}>
              <span className="text-[10px] font-medium tabular-nums text-slate-400">{loading ? '' : d.value}</span>
              <div className="flex w-full max-w-[32px] flex-1 items-end overflow-hidden rounded-full bg-[#1b3650]">
                <div className={`w-full rounded-full transition-all duration-500 ${barTone}`} style={{ height: `${pct}%` }} />
              </div>
              <span className="text-[10px] font-medium text-slate-400">{d.label}</span>
            </div>
          );
        })}
      </div>
      {!loading && peak === 0 && <p className="mt-2 text-center text-[11px] text-slate-500">Belum ada order dalam 7 hari terakhir.</p>}
    </div>
  );
}

function Upcoming({ items, loading }) {
  const shown = items.slice(0, 3);
  return (
    <div className="flex h-full min-h-[205px] flex-col rounded-xl border border-[#4de8ff]/60 bg-[#4de8ff] p-3.5 text-[#102033] shadow-[0_10px_28px_-20px_rgba(77,232,255,0.85)]">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#102033]/10 text-[#102033]"><Calendar className="h-4 w-4" /></span>
        <div>
          <h2 className="text-[14px] font-bold">Jadwal Terdekat</h2>
          <p className="text-[10px] text-[#102033]/70">Agenda pengerjaan berikutnya</p>
        </div>
      </div>
      <div className="mt-2.5 grid flex-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {loading && [0, 1, 2].map((i) => <div key={i} className="min-h-[118px] animate-pulse rounded-lg bg-[#102033]/15" />)}
        {!loading && shown.map((s, index) => (
          <div key={s.id ?? s.title} className={`flex min-h-[118px] flex-col rounded-lg border border-[#102033]/10 border-l-2 border-l-[#4de8ff] p-3 transition-colors hover:border-[#4de8ff] ${index === 0 ? 'bg-[#183149]' : 'bg-[#122337]'}`}>
            <div className="flex items-center justify-between gap-2 text-[10px]">
                <span className="font-medium text-slate-200">{s.time}</span>
              <Pill className={scheduleTone[s.status] || 'bg-slate-500 text-white'}>{s.status}</Pill>
            </div>
            <p className="mt-2 text-[13px] font-semibold leading-tight">{s.title}</p>
            <p className="text-[11px] text-slate-300">{s.client}</p>
            <p className="mt-auto pt-2 text-[10px] font-medium text-slate-200">{s.team}</p>
          </div>
        ))}
        {!loading && shown.length === 0 && (
          <div className="col-span-full grid place-items-center rounded-lg border border-dashed border-[#102033]/30 bg-[#102033]/10 py-6 text-center">
            <div><CalendarX className="mx-auto h-6 w-6 opacity-60" /><p className="mt-1 text-[12px] font-semibold">Belum ada jadwal</p><p className="text-[10px] opacity-70">Tambah project untuk mengisi jadwal pengerjaan.</p></div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────── Tabel ───────── */
const Th = ({ children }) => <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">{children}</th>;
const SkeletonRows = ({ cols }) =>
  Array.from({ length: 6 }).map((_, r) => (
    <tr key={r} className="border-t border-[#304862]">{Array.from({ length: cols }).map((__, c) => <td key={c} className="px-2.5 py-2"><Skeleton className="h-3 w-full" /></td>)}</tr>
  ));

function OrdersTable({ data, loading, error, page, setPage, onRetry }) {
  return (
    <section className={`${card} flex flex-col p-4`}>
      <h3 className="text-[15px] font-semibold text-white">Order Aktif</h3>
      <p className="text-[12px] text-slate-400">{loading ? 'Memuat…' : `${data.items.length} dari ${data.total} order`}</p>
      <div className="mt-3 flex-1 overflow-x-auto">
        <table className="w-full min-w-[500px] text-[11px]">
          <thead className="bg-[#25445a]/55"><tr><Th>Order &amp; Klien</Th><Th>Layanan</Th><Th>Nilai</Th><Th>Status</Th><Th>Aksi</Th></tr></thead>
          <tbody>
            {loading && <SkeletonRows cols={5} />}
            {!loading && !error && data.items.map((o) => (
              <tr key={o.id ?? o.no} className="border-t border-[#304862] transition hover:bg-[#4de8ff]/[0.06]">
                <td className="whitespace-nowrap px-2.5 py-2"><span className="mr-1.5 font-mono text-[10px] text-cyan-300">{o.no}</span><span className="font-medium text-white">{o.client}</span></td>
                <td className="px-2.5 text-slate-300">{o.service}</td>
                <td className="px-2.5 font-medium tabular-nums text-white">{o.value}</td>
                <td className="px-2.5"><Pill className={orderTone[o.status] || 'bg-slate-400/15 text-slate-300'}>{o.status}</Pill></td>
                <td className="px-2.5">{o.status === 'Pending' && !o.hasTeam ? <button className="rounded-md border border-slate-500 px-2 py-0.5 text-[10px] text-slate-200 hover:bg-white/5">Tugaskan</button> : <ChevronRight className="h-4 w-4 text-slate-400" />}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {error && !loading && (
          <div className="grid place-items-center gap-2 py-10 text-center text-[13px] text-slate-300">
            <p>{error}</p>
            <button onClick={onRetry} className={`${btnGhost} inline-flex items-center gap-1.5`}><RefreshCw className="h-3.5 w-3.5" /> Coba lagi</button>
          </div>
        )}
        {!error && !loading && data.items.length === 0 && <p className="py-10 text-center text-[13px] text-slate-400">Tidak ada order yang cocok dengan filter.</p>}
      </div>
      <div className="mt-3 flex items-center justify-between text-[12px] text-slate-400">
        <span>Total {data.total} order</span>
        <div className="flex items-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} aria-label="Halaman sebelumnya" className="rounded p-1 hover:bg-white/10 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
          <span className="rounded-md bg-[#4de8ff] px-2.5 py-1 font-bold text-[#102033]">{page}</span>
          <span>/ {data.pages}</span>
          <button disabled={page >= data.pages} onClick={() => setPage(page + 1)} aria-label="Halaman berikutnya" className="rounded p-1 hover:bg-white/10 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>
    </section>
  );
}

function InvoicesTable({ items, loading, onRemind, onRemindAll, busyId, busyAll }) {
  return (
    <section className={`${card} flex flex-col p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div><h3 className="text-[15px] font-semibold text-white">Faktur &amp; Penagihan</h3><p className="text-[12px] text-slate-400">Status tagihan pending dan jatuh tempo</p></div>
        <button onClick={onRemindAll} disabled={busyAll || !items.length} className="inline-flex items-center gap-1.5 rounded-lg bg-[#25445a] px-3 py-1.5 text-[11px] font-medium text-slate-100 transition hover:bg-[#2e566d] disabled:opacity-50">
          {busyAll ? <Loader2 className="h-3 w-3 animate-spin" /> : <Mail className="h-3 w-3" />} Remind All
        </button>
      </div>
      <div className="mt-3 flex-1 overflow-x-auto">
        <table className="w-full min-w-[500px] text-[11px]">
          <thead className="bg-[#25445a]/55"><tr><Th>Faktur &amp; Klien</Th><Th>Nominal</Th><Th>Jatuh Tempo</Th><Th>Status</Th><Th>Aksi</Th></tr></thead>
          <tbody>
            {loading && <SkeletonRows cols={5} />}
            {!loading && items.map((v) => (
              <tr key={v.id ?? v.no} className="border-t border-[#304862] transition hover:bg-[#4de8ff]/[0.06]">
                <td className="whitespace-nowrap px-2.5 py-2"><span className="mr-1.5 font-mono text-[10px] text-cyan-300">{v.no}</span><span className="font-medium text-white">{v.client}</span></td>
                <td className={`px-2.5 font-semibold tabular-nums ${v.status === 'Overdue' ? 'text-rose-400' : 'text-white'}`}>{v.amount}</td>
                <td className={`px-2.5 ${dueTone(v.due)}`}>{v.due}</td>
                <td className="px-2.5"><Pill className={v.status === 'Overdue' ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-400/15 text-slate-300'}>{v.status}</Pill></td>
                <td className="px-2.5">
                  {v.status === 'Overdue'
                    ? <button onClick={() => onRemind(v)} disabled={busyId === v.id} className="rounded-md bg-rose-500/90 px-2 py-0.5 text-[11px] font-medium text-white hover:bg-rose-500 disabled:opacity-60">{busyId === v.id ? '…' : 'Ingatkan'}</button>
                    : <FileText className="h-4 w-4 text-slate-400" />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && items.length === 0 && <p className="py-10 text-center text-[13px] text-slate-400">Tidak ada tagihan pending.</p>}
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-[12px] text-slate-400"><span className="h-1.5 w-1.5 rounded-full bg-cyan-300" /> Auto-reminder aktif</p>
    </section>
  );
}

/* ───────── Halaman ───────── */
export default function Page() {
  const [summary, setSummary] = useState(null);
  const [summaryErr, setSummaryErr] = useState('');
  const [orders, setOrders] = useState({ items: [], total: 0, pages: 1 });
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersErr, setOrdersErr] = useState('');
  const [filters, setFilters] = useState({ search: '', status: '', payment: '', date: '' });
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [busyAll, setBusyAll] = useState(false);
  const search = useDebounced(filters.search);

  const refresh = () => setReload((n) => n + 1);
  const notify = (message, type = 'success') => setToast({ message, type, k: Date.now() });
  const setFilter = (k) => (v) => { setFilters((f) => ({ ...f, [k]: v })); setPage(1); };

  /* Ringkasan dashboard */
  useEffect(() => {
    const ac = new AbortController();
    setSummaryErr('');
    api.getSummary(ac.signal).then(setSummary).catch((e) => e.name !== 'AbortError' && setSummaryErr(e.message));
    return () => ac.abort();
  }, [reload]);

  /* Order aktif: search + filter + paginasi */
  useEffect(() => {
    const ac = new AbortController();
    setOrdersLoading(true);
    api
      .getOrders({ search, status: filters.status, payment: filters.payment, date: filters.date, page, limit: PAGE_SIZE }, ac.signal)
      .then((r) => { setOrders(r); setOrdersErr(''); })
      .catch((e) => e.name !== 'AbortError' && setOrdersErr(e instanceof ApiError ? e.message : 'Gagal memuat order.'))
      .finally(() => !ac.signal.aborted && setOrdersLoading(false));
    return () => ac.abort();
  }, [search, filters.status, filters.payment, filters.date, page, reload]);

  const done = (msg) => { setModal(null); notify(msg); setPage(1); refresh(); };

  const remind = async (inv) => {
    setBusyId(inv.id);
    try { await api.remindInvoice(inv.id); notify(`Pengingat dikirim ke ${inv.client}.`); }
    catch (e) { notify(e.message, 'error'); }
    finally { setBusyId(null); }
  };
  const remindAll = async () => {
    setBusyAll(true);
    try {
      const count = await api.remindAll(summary?.invoices || []);
      notify(`${count} pengingat berhasil dikirim.`);
    }
    catch (e) { notify(e.message, 'error'); }
    finally { setBusyAll(false); }
  };

  const loading = !summary && !summaryErr;
  const s = summary?.stats || {};
  const cards = [
    { title: 'Order Pending', value: s.orderPending ?? 0, note: 'Menunggu diproses', icon: TrendingUp, featured: true, accent: { bg: 'bg-[#4de8ff]/15', icon: 'text-[#72e7f7]' } },
    { title: 'Jadwal Hari Ini', value: s.jadwalHariIni ?? 0, note: 'Jadwal aktif hari ini', icon: CalendarDays, accent: { bg: 'bg-sky-400/15', icon: 'text-sky-300', strip: 'bg-sky-400', surface: 'bg-[#23425c]' } },
    { title: 'Order Deadline', value: s.orderDeadline ?? 0, note: 'Batas pengerjaan hari ini', icon: Clock, accent: { bg: 'bg-blue-400/15', icon: 'text-blue-300', strip: 'bg-blue-400', surface: 'bg-[#1b2d42]' } },
    { title: 'Payment Pending', value: s.paymentPending ?? 0, note: 'Tagihan belum lunas', icon: AlertCircle, accent: { bg: 'bg-indigo-400/15', icon: 'text-indigo-300', strip: 'bg-indigo-400', surface: 'bg-[#203750]' } },
  ];
  return (
    <RoleLayout>
      <Head title="Dashboard Admin" />
      <div className="rounded-2xl border border-[#2b425b] bg-[#142338] p-4 text-slate-100 shadow-[0_20px_60px_-32px_rgba(4,12,24,0.9)] sm:p-5 lg:p-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#63c6df]">Operations overview</p>
            <h1 className="text-[22px] font-bold tracking-tight text-white">Dashboard Operasional Admin</h1>
            <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-slate-400">Pusat kendali untuk memantau verifikasi order, jadwal, penagihan invoice, dan progres teknis.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setModal('add')} className="flex items-center gap-2 rounded-xl bg-[#4de8ff] px-4 py-2.5 text-[13px] font-semibold text-[#102033] shadow-[0_6px_20px_-8px_rgba(77,232,255,0.75)] transition hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4de8ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#142338]">
              <Plus className="h-4 w-4" /> Tambah Project
            </button>
            <button
              type="button"
              disabled
              title="Fitur import belum tersedia karena endpoint backend belum dibuat."
              className="cursor-not-allowed rounded-xl border border-[#38536d] bg-[#1b2d42] px-4 py-2.5 text-[13px] font-medium text-slate-400"
            >
              Import Data
            </button>
          </div>
        </div>

        {summaryErr && (
          <div className="mt-4 flex items-center justify-between gap-3"><ErrorBox>{summaryErr}</ErrorBox>
            <button onClick={refresh} className={`${btnGhost} inline-flex shrink-0 items-center gap-1.5`}><RefreshCw className="h-3.5 w-3.5" /> Coba lagi</button></div>
        )}

        {/* Statistik */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((c) => <StatCard key={c.title} {...c} loading={loading} />)}
        </div>

        {/* Analisis + Jadwal */}
        <div className="mt-3 grid items-stretch gap-3 lg:grid-cols-[minmax(280px,0.9fr)_2.1fr]">
          <ProjectChart data={summary?.chart || []} loading={loading} />
          <Upcoming items={summary?.schedules || []} loading={loading} />
        </div>

        {/* Pencarian & filter */}
        <div className="mt-3 grid gap-2 rounded-xl border-2 border-[#2789c5] bg-[#122337] p-2.5 shadow-[0_0_16px_-12px_rgba(39,137,197,0.9)] sm:grid-cols-2 lg:grid-cols-[1fr_170px_170px_170px]">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={filters.search}
              onChange={(e) => setFilter('search')(e.target.value)}
              placeholder="Cari No Order atau Customer..."
              aria-label="Cari order"
              className={`${inputCls} pl-9 pr-8`}
            />
            {filters.search && <button onClick={() => setFilter('search')('')} aria-label="Hapus pencarian" className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"><X className="h-4 w-4" /></button>}
          </div>
          <Select label="Filter status" value={filters.status} onChange={setFilter('status')} options={STATUS_OPTIONS} />
          <Select label="Filter payment" value={filters.payment} onChange={setFilter('payment')} options={PAYMENT_OPTIONS} />
          <input type="date" aria-label="Pilih tanggal" value={filters.date} onChange={(e) => setFilter('date')(e.target.value)} className={inputCls} />
        </div>

        {/* Tabel */}
        <div className="mt-3 grid gap-3 xl:grid-cols-2">
          <OrdersTable data={orders} loading={ordersLoading} error={ordersErr} page={page} setPage={setPage} onRetry={refresh} />
          <InvoicesTable items={summary?.invoices || []} loading={loading} onRemind={remind} onRemindAll={remindAll} busyId={busyId} busyAll={busyAll} />
        </div>
      </div>

      {modal === 'add' && <AddProjectModal onClose={() => setModal(null)} onDone={done} />}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </RoleLayout>
  );
}