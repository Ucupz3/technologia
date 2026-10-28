import { useEffect, useMemo, useRef, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head } from '@inertiajs/react';

// TODO: ganti dengan data asli dari API
const SALES = [
  { id: 1, name: 'Agus', email: 'agus@tekna.id' },
  { id: 2, name: 'Arinal', email: 'arinal@tekna.id' },
  { id: 3, name: 'Nopal gantehg', email: 'masrestu787@gmail.com' },
  { id: 4, name: 'Prabowo', email: 'prabowo@tekna.id' },
];

const INITIAL = [
  {
    id: 4, name: 'pt ops', email: 'darkneve30@gmail.com', phone: '0805480680454', address: '',
    salesId: 1, created: '2026-10-21',
    pics: [{ name: 'agus', role: 'hr', email: 'sangatselow13@gmail.com', phone: '0708056', primary: true }],
    orders: [{ no: 'ORD-20261021-001', date: '2026-10-21', status: 'pending', payment: 'partial', total: 18249000 }],
  },
  {
    id: 1, name: 'PT Maju Terus', email: 'contact@majuterus.co.id', phone: '021-1234567', address: 'Jakarta',
    salesId: 1, created: '2026-01-10',
    pics: [{ name: 'Budi', role: 'Purchasing', email: 'budi@majuterus.co.id', phone: '0812345678', primary: true }],
    orders: Array.from({ length: 9 }, (_, i) => ({
      no: `ORD-202610${20 - i}-00${i + 1}`, date: `2026-10-${20 - i}`,
      status: ['pending', 'processing', 'done'][i % 3], payment: ['unpaid', 'partial', 'paid'][i % 3],
      total: 5000000 + i * 1500000,
    })),
  },
  {
    id: 2, name: 'CV Sejahtera Abadi', email: 'info@sejahtera-abadi.id', phone: '022-7654321', address: 'Bandung',
    salesId: 1, created: '2026-03-02', pics: [],
    orders: [
      { no: 'ORD-20260915-001', date: '2026-09-15', status: 'done', payment: 'paid', total: 7500000 },
      { no: 'ORD-20260820-002', date: '2026-08-20', status: 'done', payment: 'paid', total: 9000000 },
    ],
  },
  {
    id: 3, name: 'Toko Buku Cerdas', email: 'admin@bukucerdas.id', phone: '024-1112223', address: 'Semarang',
    salesId: 2, created: '2026-05-15', pics: [],
    orders: [
      { no: 'ORD-20260910-001', date: '2026-09-10', status: 'processing', payment: 'partial', total: 3200000 },
      { no: 'ORD-20260801-002', date: '2026-08-01', status: 'done', payment: 'paid', total: 4700000 },
    ],
  },
];

const rp = (n) => 'Rp ' + Number(n).toLocaleString('id-ID');
const fmtDate = (d) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
const initials = (n) => n.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
const salesOf = (id) => SALES.find((s) => s.id === Number(id));

/* ---------- Ikon outline ---------- */
const Svg = ({ children, size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`}>
    {children}
  </svg>
);
const ISearch = (p) => <Svg {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Svg>;
const IRefresh = (p) => <Svg {...p}><path d="M21 12a9 9 0 0 0-15.5-6.2L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 15.5 6.2L21 16" /><path d="M16 16h5v5" /></Svg>;
const IPlus = (p) => <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>;
const IChevron = (p) => <Svg {...p}><path d="m6 9 6 6 6-6" /></Svg>;
const ICheck = (p) => <Svg {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></Svg>;
const IMail = (p) => <Svg {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></Svg>;
const IPhone = (p) => <Svg {...p}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" /></Svg>;
const IPin = (p) => <Svg {...p}><path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></Svg>;
const IArrowLeft = (p) => <Svg {...p}><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></Svg>;
const IEdit = (p) => <Svg {...p}><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z" /><path d="m14 6 4 4" /></Svg>;
const ITrash = (p) => <Svg {...p}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></Svg>;
const IClose = (p) => <Svg {...p}><path d="M6 6l12 12M18 6 6 18" /></Svg>;

/* ---------- Dropdown custom (sama seperti Super Admin) ---------- */
function Dropdown({ value, onChange, options, placeholder = 'Pilih', className = '', full = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const down = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', down);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', down); document.removeEventListener('keydown', esc); };
  }, []);

  const selected = options.find((o) => String(o.v) === String(value));

  return (
    <div ref={ref} className={`relative ${full ? 'w-full' : 'w-[268px]'} ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex h-12 w-full items-center justify-between rounded-2xl border bg-[#101817] px-5 text-[15px] text-white outline-none transition-all duration-150 ${open ? 'border-cyan-400 ring-4 ring-cyan-400/15' : 'border-[#223332] hover:border-[#2f4a49]'
          }`}
      >
        <span className={selected ? '' : 'text-slate-500'}>{selected ? selected.l : placeholder}</span>
        <IChevron className={`text-slate-300 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      <div
        className={`absolute left-0 top-full z-40 mt-2 w-full origin-top rounded-2xl border border-[#223332] bg-[#101817] p-1.5 shadow-2xl shadow-black/60 transition-all duration-150 ${open ? 'translate-y-0 scale-100 opacity-100' : 'pointer-events-none -translate-y-1 scale-95 opacity-0'
          }`}
      >
        {options.map((o) => {
          const active = String(o.v) === String(value);
          return (
            <button
              key={o.v}
              type="button"
              onClick={() => { onChange(o.v); setOpen(false); }}
              className={`flex h-11 w-full items-center justify-between rounded-xl px-4 text-left text-[15px] transition-colors duration-100 ${active ? 'bg-[#123a3c] text-cyan-400' : 'text-white hover:bg-[#1a2a29]'
                }`}
            >
              <span>{o.l}</span>
              {active && <ICheck size={16} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Modal form ---------- */
function Modal({ title, fields, values, onClose, onSubmit, submitLabel = 'Simpan', plus = false }) {
  const [f, setF] = useState(values || {});
  const set = (name, val) => setF((p) => ({ ...p, [name]: val }));
  const field = 'w-full h-12 bg-[#101817] border border-[#223332] rounded-2xl px-5 text-white outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/15 placeholder:text-slate-500';

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => { e.preventDefault(); onSubmit(f); }}
        className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-[#223332] bg-[#141f1e] text-white"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[#223332] px-8 py-6">
          <h3 className="text-2xl font-semibold">{title}</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white"><IClose size={20} /></button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-8 py-6">
          {fields.map((x) =>
            x.type === 'checkbox' ? (
              <label key={x.name} className="flex cursor-pointer select-none items-center gap-3">
                <input type="checkbox" className="h-5 w-5 accent-cyan-400" checked={!!f[x.name]} onChange={(e) => set(x.name, e.target.checked)} />
                <span>{x.label}</span>
              </label>
            ) : (
              <div key={x.name}>
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                  {x.label} {x.req && <span className="text-red-400">*</span>}
                </div>
                {x.type === 'select' ? (
                  <Dropdown full value={f[x.name] ?? ''} onChange={(v) => set(x.name, v)} options={x.options} />
                ) : x.type === 'textarea' ? (
                  <textarea
                    rows={4}
                    className={`${field} h-auto resize-none py-3`}
                    placeholder={x.placeholder || ''}
                    value={f[x.name] ?? ''}
                    onChange={(e) => set(x.name, e.target.value)}
                  />
                ) : (
                  <input
                    className={field}
                    type={x.type || 'text'}
                    required={x.req}
                    placeholder={x.placeholder || ''}
                    value={f[x.name] ?? ''}
                    onChange={(e) => set(x.name, e.target.value)}
                  />
                )}
              </div>
            )
          )}
        </div>

        <div className="flex shrink-0 justify-end gap-3 border-t border-[#223332] px-8 py-4">
          <button type="button" onClick={onClose} className="h-11 rounded-xl bg-[#34494a] px-5 font-semibold transition hover:bg-[#3e5758] active:scale-[0.98]">Batal</button>
          <button type="submit" className="flex h-11 items-center gap-2 rounded-xl bg-cyan-400 px-5 font-semibold text-[#04282a] transition hover:bg-cyan-300 active:scale-[0.98]">
            {plus && <IPlus size={16} />} {submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

const salesOptions = SALES.map((s) => ({ v: s.id, l: s.name }));
const customerFields = [
  { name: 'name', label: 'Nama Customer', req: true, placeholder: 'PT Maju Bersama' },
  { name: 'email', label: 'Email', type: 'email', req: true, placeholder: 'contact@majubersama.com' },
  { name: 'phone', label: 'Phone', placeholder: '08123456789' },
  { name: 'salesId', label: 'Sales PIC', type: 'select', options: [{ v: '', l: '— Tidak ada —' }, ...salesOptions] },
  { name: 'address', label: 'Alamat', type: 'textarea' },
  { name: 'notes', label: 'Notes', type: 'textarea' },
];
const picFields = [
  { name: 'name', label: 'Nama PIC', req: true, placeholder: 'Budi Santoso' },
  { name: 'role', label: 'Jabatan', placeholder: 'Purchasing Manager' },
  { name: 'email', label: 'Email', type: 'email', placeholder: 'budi@customer.com' },
  { name: 'phone', label: 'Phone', placeholder: '08123456789' },
  { name: 'primary', label: 'Jadikan PIC utama', type: 'checkbox' },
];

const box = 'bg-[#131c1b] border border-[#223332] rounded-2xl overflow-hidden';
const btn = 'h-12 rounded-2xl border border-[#223332] bg-[#101817] px-5 text-[15px] text-white flex items-center gap-2.5 transition hover:border-cyan-400 active:scale-[0.98]';
const btnP = 'h-12 rounded-2xl bg-cyan-400 px-5 text-[15px] font-semibold text-[#04282a] flex items-center gap-2.5 transition hover:bg-cyan-300 active:scale-[0.98]';

const Avatar = ({ text, size = 'h-11 w-11 text-sm', cls = 'bg-gradient-to-br from-cyan-500 to-cyan-300 text-[#04282a]' }) => (
  <div className={`${size} ${cls} grid shrink-0 place-items-center rounded-full font-bold`}>{text}</div>
);

export default function Page() {
  const [data, setData] = useState(INITIAL);
  const [q, setQ] = useState('');
  const [salesFilter, setSalesFilter] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [modal, setModal] = useState(null); // 'add' | 'edit' | 'pic'
  const [spin, setSpin] = useState(false);

  const rows = useMemo(() => {
    const s = q.toLowerCase();
    return data
      .filter((c) => (!salesFilter || c.salesId === Number(salesFilter)) &&
        (!s || [c.name, c.email, c.phone].some((v) => (v || '').toLowerCase().includes(s))))
      .sort((a, b) => b.created.localeCompare(a.created) || b.id - a.id);
  }, [data, q, salesFilter]);

  const current = data.find((c) => c.id === selectedId);
  const update = (id, fn) => setData((d) => d.map((c) => (c.id === id ? fn(c) : c)));

  const refresh = () => {
    setSpin(true);
    setData((d) => [...d]); // TODO: panggil ulang API
    setTimeout(() => setSpin(false), 600);
  };

  const saveCustomer = (f) => {
    const v = { ...f, salesId: f.salesId ? Number(f.salesId) : null };
    if (modal === 'edit') update(current.id, (c) => ({ ...c, ...v }));
    else setData((d) => [...d, { ...v, id: Math.max(0, ...d.map((x) => x.id)) + 1, created: new Date().toISOString().slice(0, 10), pics: [], orders: [] }]);
    setModal(null);
  };
  const savePic = (f) => {
    update(current.id, (c) => ({
      ...c,
      pics: [...(f.primary ? c.pics.map((p) => ({ ...p, primary: false })) : c.pics), f],
    }));
    setModal(null);
  };
  const removeCustomer = () => {
    if (confirm(`Hapus customer "${current.name}"?`)) {
      setData((d) => d.filter((c) => c.id !== current.id));
      setSelectedId(null);
    }
  };

  const modals = (
    <>
      {modal === 'add' && <Modal title="Tambah Customer Baru" submitLabel="Buat" plus fields={customerFields} values={{ salesId: '' }} onClose={() => setModal(null)} onSubmit={saveCustomer} />}
      {modal === 'edit' && current && <Modal title="Edit Customer" fields={customerFields} values={current} onClose={() => setModal(null)} onSubmit={saveCustomer} />}
      {modal === 'pic' && current && <Modal title="Tambah PIC" submitLabel="+ Tambah PIC" fields={picFields} values={{ primary: !current.pics.length }} onClose={() => setModal(null)} onSubmit={savePic} />}
    </>
  );

  /* ---------------- DETAIL ---------------- */
  if (current) {
    const s = salesOf(current.salesId);
    return (
      <RoleLayout>
        <Head title={`Customer - ${current.name}`} />
        <div className="w-full text-white">
          <button type="button" className="mb-3 flex items-center gap-2.5 text-[15px] text-slate-300 hover:text-white" onClick={() => setSelectedId(null)}>
            <IArrowLeft /> Kembali ke Customers
          </button>

          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar text={initials(current.name)} size="h-16 w-16 text-xl" />
              <div>
                <h1 className="text-2xl font-bold leading-8">{current.name}</h1>
                <p className="text-sm text-slate-400">Customer ID: {current.id} · Terdaftar {fmtDate(current.created)}</p>
              </div>
            </div>
            <div className="flex gap-2.5">
              <button type="button" className={btn} onClick={refresh}><IRefresh className={spin ? 'animate-spin' : ''} /> Refresh</button>
              <button type="button" className={btnP} onClick={() => setModal('edit')}><IEdit /> Edit Customer</button>
              <button type="button" className="flex h-12 items-center gap-2.5 rounded-2xl border border-[#4a2327] bg-[#2a1618] px-5 text-[15px] text-red-400 transition hover:bg-[#341a1d] active:scale-[0.98]" onClick={removeCustomer}>
                <ITrash /> Hapus
              </button>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <div className="space-y-5">
              <div className={box}>
                <h3 className="border-b border-[#223332] px-6 py-4 text-sm font-semibold uppercase tracking-widest">Informasi Customer</h3>
                <div className="space-y-5 p-6">
                  {[['Email', current.email, IMail], ['Phone', current.phone, IPhone], ['Alamat', current.address || '—', IPin]].map(([l, v, Ic]) => (
                    <div key={l} className="flex items-center gap-4">
                      <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#1c2928] text-cyan-400"><Ic /></div>
                      <div><div className="text-xs uppercase tracking-widest text-slate-400">{l}</div><div>{v}</div></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className={box}>
                <h3 className="border-b border-[#223332] px-6 py-4 text-sm font-semibold uppercase tracking-widest">Sales PIC</h3>
                <div className="flex items-center gap-4 p-6">
                  <Avatar text={(s?.name || '?')[0]} size="h-12 w-12" cls="border border-cyan-900 bg-[#1c2928] text-cyan-400" />
                  <div><div className="font-semibold">{s?.name || '-'}</div><div className="text-sm text-slate-400">{s?.email}</div></div>
                </div>
              </div>
            </div>

            <div className="space-y-5 lg:col-span-2">
              <div className={box}>
                <div className="flex items-center justify-between border-b border-[#223332] px-6 py-4">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-widest">Customer PIC</h3>
                    <p className="text-sm text-slate-400">{current.pics.length} PIC terdaftar</p>
                  </div>
                  <button type="button" className="flex h-10 items-center gap-2 rounded-xl bg-cyan-400 px-4 text-sm font-semibold text-[#04282a] transition hover:bg-cyan-300 active:scale-[0.98]" onClick={() => setModal('pic')}>
                    <IPlus size={16} /> Tambah PIC
                  </button>
                </div>
                <div className="space-y-4 p-6">
                  {current.pics.length === 0 && <p className="text-slate-400">Belum ada PIC</p>}
                  {current.pics.map((p, i) => (
                    <div key={i} className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-4">
                        <Avatar text={p.name[0].toUpperCase()} size="h-12 w-12" cls="bg-[#1c2928] text-white" />
                        <div>
                          <div className="font-semibold">
                            {p.name}
                            {p.primary && <span className="ml-2 rounded border border-cyan-400 px-2 py-0.5 text-[11px] font-bold tracking-wider text-cyan-400">PRIMARY</span>}
                          </div>
                          <div className="text-sm text-slate-400">{p.role}</div>
                        </div>
                      </div>
                      <div className="text-right text-sm text-slate-400">
                        <div>{p.email}</div><div>{p.phone}</div>
                        <button type="button" className="text-xs text-red-400 hover:underline" onClick={() => update(current.id, (c) => ({ ...c, pics: c.pics.filter((_, k) => k !== i) }))}>hapus</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={box}>
                <div className="flex items-center justify-between border-b border-[#223332] px-6 py-4">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-widest">Orders</h3>
                    <p className="text-sm text-slate-400">{Math.min(5, current.orders.length)} order terakhir</p>
                  </div>
                  <a href="#" className="text-sm text-cyan-400">Lihat semua →</a>
                </div>
                <div className="overflow-x-auto p-6">
                  <table className="w-full whitespace-nowrap text-left">
                    <thead>
                      <tr className="border-b border-[#223332] text-xs tracking-widest text-slate-400">
                        <th className="pb-3">ORDER #</th><th className="pb-3">TANGGAL</th><th className="pb-3">STATUS</th><th className="pb-3">PAYMENT</th><th className="pb-3 text-right">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {current.orders.slice(0, 5).map((o) => (
                        <tr key={o.no} className="border-b border-[#223332] last:border-0">
                          <td className="py-3.5 font-semibold">{o.no}</td>
                          <td className="text-slate-400">{fmtDate(o.date)}</td>
                          <td><span className="inline-block rounded-full border border-yellow-900 bg-[#2d2610] px-2.5 py-px text-xs text-yellow-400">{o.status}</span></td>
                          <td><span className="inline-block rounded-full border border-yellow-900 bg-[#2d2610] px-2.5 py-px text-xs text-yellow-400">{o.payment}</span></td>
                          <td className="text-right font-semibold">{rp(o.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {current.orders.length === 0 && <p className="py-6 text-center text-slate-400">Belum ada order</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
        {modals}
      </RoleLayout>
    );
  }

  /* ---------------- LIST ---------------- */
  return (
    <RoleLayout>
      <Head title="Customers" />
      <div className="w-full text-white">
        <h1 className="text-3xl font-bold leading-tight">Customers</h1>
        <p className="mb-6 mt-1 text-slate-300">Total {data.length} customer</p>

        <div className="mb-5 flex flex-wrap items-center gap-3">
          <label className="group flex h-12 min-w-[220px] flex-1 items-center gap-3 rounded-2xl border border-[#223332] bg-[#101817] px-5 text-slate-400 transition focus-within:border-cyan-400 focus-within:ring-4 focus-within:ring-cyan-400/15">
            <ISearch />
            <input
              className="h-full w-full bg-transparent text-[15px] text-white outline-none placeholder:text-slate-500"
              placeholder="Cari nama, email, atau phone..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </label>

          <Dropdown
            value={salesFilter}
            onChange={setSalesFilter}
            options={[{ v: '', l: 'Semua Sales PIC' }, ...salesOptions]}
          />

          <button type="button" className={btn} onClick={refresh}>
            <IRefresh className={spin ? 'animate-spin' : ''} /> Refresh
          </button>
          <button type="button" className={btnP} onClick={() => setModal('add')}>
            <IPlus /> Tambah Customer
          </button>
        </div>

        <div className={box}>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#1f2e2e] text-xs uppercase tracking-[0.18em] text-slate-300">
                <tr>
                  <th className="px-6 py-4 font-semibold">No</th>
                  <th className="px-3 py-4 font-semibold">Customer</th>
                  <th className="px-3 py-4 font-semibold">Contact</th>
                  <th className="px-3 py-4 font-semibold">Sales PIC</th>
                  <th className="px-3 py-4 font-semibold">Order</th>
                  <th className="px-6 py-4 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c, i) => (
                  <tr key={c.id} className="border-t border-[#223332] transition-colors hover:bg-[#1c2928]">
                    <td className="px-6 py-3.5 text-slate-400">{i + 1}</td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-4">
                        <Avatar text={initials(c.name)} />
                        <div><div className="font-semibold">{c.name}</div><div className="text-sm text-slate-400">ID: {c.id}</div></div>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-[15px]">
                      <div className="flex items-center gap-2"><IMail size={15} className="text-slate-400" /> {c.email}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-slate-400"><IPhone size={15} /> {c.phone}</div>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="inline-block rounded-full border border-cyan-900 bg-[#0b3236] px-2.5 py-px text-xs text-cyan-400">{salesOf(c.salesId)?.name || '-'}</span>
                    </td>
                    <td className="px-3 py-3.5 text-slate-400">{c.orders.length} order</td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        type="button"
                        className="rounded-lg border border-cyan-900 px-4 py-1.5 text-sm font-semibold text-cyan-400 transition hover:bg-cyan-950 active:scale-95"
                        onClick={() => setSelectedId(c.id)}
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length === 0 && <p className="py-10 text-center text-slate-400">Tidak ada customer</p>}
          <div className="border-t border-[#223332] px-6 py-4 text-sm text-slate-400">Menampilkan {rows.length} customer</div>
        </div>
      </div>
      {modals}
    </RoleLayout>
  );
}