import { useMemo, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head } from '@inertiajs/react';

// TODO: ganti dengan fetch ke API backend
const mkItems = (total) => [{ name: 'Pembuatan Website E-Commerce', qty: 1, price: total }];
const INITIAL = [
  { id: 11, no: 'INV-202610-011', orderNo: 'ORD-20261022-001', customer: 'Toko Buku Cerdas', pic: 'Budi', date: '2026-10-22T09:15:00', items: mkItems(4500000), discount: 0, tax: 0, paid: 0 },
  { id: 10, no: 'INV-202610-010', orderNo: 'ORD-20261021-002', customer: 'PT Maju Terus', pic: 'Citra Dewi', date: '2026-10-21T13:31:00', items: mkItems(20000000), discount: 5, tax: 2399999.4, paid: 10000000 },
  { id: 9, no: 'INV-202610-009', orderNo: 'ORD-20261021-001', customer: 'pt ops', pic: 'agus', date: '2026-10-21T10:05:00', items: mkItems(18249000), discount: 0, tax: 0, paid: 12000000 },
  { id: 8, no: 'INV-202610-008', orderNo: 'ORD-20261019-001', customer: 'PT Maju Terus', pic: 'Citra Dewi', date: '2026-10-19T14:20:00', items: mkItems(20700000), discount: 0, tax: 0, paid: 20700000 },
  { id: 7, no: 'INV-202610-007', orderNo: 'ORD-20261018-004', customer: 'PT Maju Terus', pic: 'Citra Dewi', date: '2026-10-18T16:40:00', items: mkItems(10000000), discount: 0, tax: 1199994.4, paid: 11199994.4 },
  { id: 6, no: 'INV-202610-006', orderNo: 'ORD-20261018-003', customer: 'PT Maju Terus', pic: 'Citra Dewi', date: '2026-10-18T11:10:00', items: mkItems(11664000), discount: 0, tax: 0, paid: 200000 },
  { id: 5, no: 'INV-202610-005', orderNo: 'ORD-20261018-002', customer: 'Toko Buku Cerdas', pic: 'Budi', date: '2026-10-18T09:00:00', items: mkItems(3024000), discount: 0, tax: 0, paid: 0 },
  { id: 4, no: 'INV-202610-004', orderNo: 'ORD-20261017-001', customer: 'CV Sejahtera Abadi', pic: 'Rina', date: '2026-10-17T13:00:00', items: mkItems(7500000), discount: 0, tax: 0, paid: 0 },
  { id: 3, no: 'INV-202610-003', orderNo: 'ORD-20261015-002', customer: 'CV Sejahtera Abadi', pic: 'Rina', date: '2026-10-15T10:30:00', items: mkItems(9000000), discount: 0, tax: 0, paid: 4000000 },
  { id: 2, no: 'INV-202610-002', orderNo: 'ORD-20261012-001', customer: 'Toko Buku Cerdas', pic: 'Budi', date: '2026-10-12T15:45:00', items: mkItems(3200000), discount: 0, tax: 0, paid: 3200000 },
  { id: 1, no: 'INV-202610-001', orderNo: 'ORD-20261010-001', customer: 'PT Maju Terus', pic: 'Citra Dewi', date: '2026-10-10T08:50:00', items: mkItems(5000000), discount: 0, tax: 0, paid: 5000000 },
];

// TODO: ganti dengan email asli dari API (customer + PIC)
const CONTACTS = {
  'Toko Buku Cerdas': { main: 'admin@bukucerdas.id', pic: 'eka@bukucerdas.id' },
  'PT Maju Terus': { main: 'contact@majuterus.co.id', pic: 'citra@majuterus.co.id' },
  'CV Sejahtera Abadi': { main: 'info@sejahtera-abadi.id', pic: 'rina@sejahtera-abadi.id' },
  'pt ops': { main: 'darkneve30@gmail.com', pic: 'sangatselow13@gmail.com' },
};

const num = (n) => Number(n).toLocaleString('id-ID', { maximumFractionDigits: 1 });
const rp = (n) => 'Rp ' + num(n);
const subtotalOf = (v) => v.items.reduce((s, i) => s + i.qty * i.price, 0);
const totalOf = (v) => subtotalOf(v) - v.discount + v.tax;
const sisaOf = (v) => Math.max(0, Math.round((totalOf(v) - v.paid) * 100) / 100);
const statusOf = (v) => (sisaOf(v) <= 0.01 ? 'paid' : v.paid > 0 ? 'partial' : 'unpaid');
const longDate = (d) => {
  const x = new Date(d);
  return `${x.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} pukul ${x.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.')}`;
};

const STATUS_CLS = {
  partial: 'bg-[#3a2a0f] text-orange-400 border-orange-700',
  paid: 'bg-[#0f3326] text-emerald-400 border-emerald-800',
  unpaid: 'bg-[#3a1418] text-red-400 border-red-900',
};
const Badge = ({ s, big }) => (
  <span className={`inline-block rounded-full border whitespace-nowrap ${big ? 'px-3 py-[3px] text-[13px] leading-5' : 'px-2 py-px text-xs leading-5'} ${STATUS_CLS[s]}`}>{s}</span>
);

/* ---------- Ikon outline (SVG) ---------- */
const Svg = ({ children, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
    {children}
  </svg>
);
const IArrowLeft = (p) => <Svg {...p}><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></Svg>;
const IMail = (p) => <Svg {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></Svg>;
const ICard = (p) => <Svg {...p}><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></Svg>;
const IBank = (p) => <Svg {...p}><path d="M3 10 12 4l9 6" /><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 21h18" /></Svg>;
const IUpload = (p) => <Svg {...p}><path d="M7 18a4.5 4.5 0 0 1-.5-9A6 6 0 0 1 18 9.5 4 4 0 0 1 17.5 18" /><path d="M12 12v8M9 15l3-3 3 3" /></Svg>;
const IQr = (p) => <Svg {...p}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M20 20h-3v-3" /></Svg>;
const IReceipt = (p) => <Svg {...p}><path d="M6 3h12v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5L6 21z" /><path d="M9 8h6M9 12h6" /></Svg>;
const ICheckCircle = (p) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="m8.5 12.5 2.5 2.5 4.5-5" /></Svg>;
const IClose = (p) => <Svg {...p}><path d="M6 6l12 12M18 6 6 18" /></Svg>;

/* ---------- Simulasi QR (bukan QR asli, hanya contoh tampilan) ---------- */
function QrSim({ seed }) {
  const N = 25;
  const cells = useMemo(() => {
    let h = 2166136261;
    for (const c of String(seed)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
    const rnd = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 1000) / 1000; };
    const inFinder = (x, y) => (x < 8 && y < 8) || (x >= N - 8 && y < 8) || (x < 8 && y >= N - 8);
    const out = [];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!inFinder(x, y) && rnd() > 0.5) out.push([x, y]);
    return out;
  }, [seed]);

  const Finder = ({ x, y }) => (
    <g>
      <rect x={x} y={y} width="7" height="7" fill="#000" />
      <rect x={x + 1} y={y + 1} width="5" height="5" fill="#fff" />
      <rect x={x + 2} y={y + 2} width="3" height="3" fill="#000" />
    </g>
  );

  return (
    <svg viewBox="-1 -1 27 27" className="w-48 h-48 block" shapeRendering="crispEdges">
      {cells.map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#000" />)}
      <Finder x={0} y={0} />
      <Finder x={N - 7} y={0} />
      <Finder x={0} y={N - 7} />
    </svg>
  );
}

/* ---------- Modal Kirim Invoice ke Email ---------- */
function EmailModal({ contact, targets, setTargets, onClose, onSend }) {
  const rows = [
    { key: 'main', title: 'Customer Utama', email: contact.main },
    { key: 'pic', title: 'PIC Customer', email: contact.pic },
  ];
  const any = targets.main || targets.pic;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="w-full max-w-[600px] overflow-hidden rounded-2xl border border-[#223332] bg-[#141f1e] text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#223332] px-7 py-5">
          <h3 className="text-xl font-semibold">Kirim Invoice ke Email</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
            <IClose size={20} />
          </button>
        </div>

        <div className="px-7 py-6">
          <p className="mb-4 text-[15px] text-slate-400">Pilih tujuan pengiriman email:</p>
          <div className="space-y-4">
            {rows.map((r) => (
              <label
                key={r.key}
                className="flex cursor-pointer items-center gap-4 rounded-xl border border-[#223332] bg-[#131c1b] px-5 py-4"
              >
                <input
                  type="checkbox"
                  className="hidden"
                  checked={targets[r.key]}
                  onChange={(e) => setTargets({ ...targets, [r.key]: e.target.checked })}
                />
                <span
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-md ${targets[r.key] ? 'bg-cyan-400' : 'border border-[#3a4f4e] bg-[#101817]'}`}
                >
                  {targets[r.key] && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m5 12.5 4.5 4.5L19 7.5" />
                    </svg>
                  )}
                </span>
                <span>
                  <span className="block font-semibold">{r.title}</span>
                  <span className="block text-sm text-slate-400">{r.email}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-[#223332] px-7 py-4">
          <button type="button" onClick={onClose} className="h-11 rounded-xl bg-[#34494a] px-6 font-semibold hover:bg-[#3e5758] transition">
            Batal
          </button>
          <button
            type="button"
            disabled={!any}
            onClick={onSend}
            className="flex h-11 items-center gap-2.5 rounded-xl bg-cyan-400 px-6 font-semibold text-[#04282a] transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <IMail /> Kirim Email
          </button>
        </div>
      </div>
    </div>
  );
}

const card = 'bg-[#131c1b] border border-[#223332] rounded-2xl';
const mono = { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' };
const lbl = 'mt-7 text-sm font-semibold text-slate-300 uppercase leading-5';

export default function Page() {
  const [data, setData] = useState(INITIAL);
  const [selectedId, setSelectedId] = useState(null);

  const [tipe, setTipe] = useState('full');
  const [nominal, setNominal] = useState('');
  const [metode, setMetode] = useState('transfer');
  const [file, setFile] = useState(null);

  const [emailOpen, setEmailOpen] = useState(false);
  const [targets, setTargets] = useState({ main: true, pic: true });

  const current = data.find((v) => v.id === selectedId);

  const openDetail = (v) => {
    setSelectedId(v.id);
    setTipe('full');
    setNominal(String(sisaOf(v)));
    setMetode('transfer');
    setFile(null);
    setEmailOpen(false);
    setTargets({ main: true, pic: true });
  };

  const pickTipe = (t) => {
    setTipe(t);
    setNominal(t === 'full' ? String(sisaOf(current)) : '');
  };

  const pay = () => {
    const n = Number(String(nominal).replace(',', '.'));
    const sisa = sisaOf(current);
    if (!n || n <= 0) return alert('Nominal tidak valid');
    if (n > sisa + 0.01) return alert('Nominal melebihi sisa tagihan');
    if (metode === 'transfer' && !file) return alert('Upload bukti transfer terlebih dahulu');
    setData((d) => d.map((v) => (v.id === current.id ? { ...v, paid: Math.round((v.paid + n) * 100) / 100 } : v)));
    setNominal('');
    setFile(null);
    alert('Pembayaran berhasil dicatat');
  };

  const bayar = (e) => {
    e.preventDefault();
    if (metode === 'transfer') pay();
  };

  const sendEmail = () => {
    const c = CONTACTS[current.customer] || { main: '-', pic: '-' };
    const list = [targets.main && c.main, targets.pic && c.pic].filter(Boolean);
    // TODO: panggil API kirim email di sini
    alert(`Invoice ${current.no} dikirim ke: ${list.join(', ')}`);
    setEmailOpen(false);
  };

  /* ---------------- DETAIL ---------------- */
  if (current) {
    const total = totalOf(current);
    const sisa = sisaOf(current);
    const st = statusOf(current);
    const lunasSelected = tipe === 'full';
    const nominalNum = Number(String(nominal).replace(',', '.')) || 0;
    const contact = CONTACTS[current.customer] || { main: '-', pic: '-' };

    const tipeBtn = (active) =>
      `flex h-[54px] items-center justify-center gap-2.5 rounded-2xl text-[15px] font-medium border transition ${active ? 'bg-[#123a3c] border-cyan-500 text-cyan-400' : 'bg-[#101817] border-[#223332] text-slate-300'}`;

    return (
      <RoleLayout>
        <Head title={`Invoice ${current.no}`} />
        <div className="text-white w-full">
          <button type="button" className="text-slate-300 hover:text-white mb-3 flex items-center gap-2.5 text-[15px] leading-6" onClick={() => setSelectedId(null)}>
            <IArrowLeft /> Kembali ke Invoices
          </button>

          <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold leading-8">Detail Tagihan</h1>
              <Badge s={st} big />
            </div>
            <button
              type="button"
              className="bg-cyan-400 hover:bg-cyan-300 text-[#04282a] text-[15px] font-medium rounded-xl h-[43px] px-5 flex items-center gap-2.5"
              onClick={() => setEmailOpen(true)}
            >
              <IMail /> Kirim ke Email
            </button>
          </div>

          <div className="grid gap-5 md:grid-cols-3 mb-[30px]">
            <div className={`${card} h-28 p-6`}>
              <div className="text-sm uppercase text-slate-300 leading-5">Total Tagihan</div>
              <div className="text-[26px] leading-9 font-bold mt-2">{rp(total)}</div>
            </div>
            <div className="h-28 rounded-2xl p-6 border border-emerald-900 bg-[#0d2a24]">
              <div className="text-sm uppercase text-emerald-400 leading-5">Sudah Dibayar</div>
              <div className="text-[26px] leading-9 font-bold mt-2 text-emerald-400">{rp(current.paid)}</div>
            </div>
            <div className="h-28 rounded-2xl p-6 border border-red-900 bg-[#241618]">
              <div className="text-sm uppercase text-red-400 leading-5">Sisa Tagihan</div>
              <div className="text-[26px] leading-9 font-bold mt-2 text-red-400">{rp(sisa)}</div>
            </div>
          </div>

          <form onSubmit={bayar} className={`${card} p-[30px] mb-8`}>
            <h3 className="font-bold uppercase flex items-center gap-3 pb-3.5 border-b border-[#223332] leading-6">
              <ICard /> Proses Pembayaran
            </h3>

            {sisa <= 0.01 ? (
              <div className="mt-7 flex flex-col items-center justify-center rounded-2xl border border-emerald-900 bg-[#172a26] px-6 py-12 text-center">
                <svg width="68" height="68" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="m8 12.5 2.8 2.8L16 9.5" />
                </svg>
                <div className="mt-5 text-xl font-semibold text-emerald-500">Lunas</div>
                <div className="mt-1 text-[15px] text-emerald-700">Tagihan ini sudah dibayar sepenuhnya.</div>
              </div>
            ) : (
              <>
                <div className={lbl}>1. Pilih Tipe Pembayaran</div>
                <div className="grid grid-cols-2 gap-3.5 mt-2.5">
                  <button type="button" onClick={() => pickTipe('full')} className={tipeBtn(lunasSelected)}>
                    <IBank /> Lunas (Full)
                  </button>
                  <button type="button" onClick={() => pickTipe('dp')} className={tipeBtn(!lunasSelected)}>
                    <ICard /> DP / Cicilan
                  </button>
                </div>

                <div className={lbl}>2. Nominal Bayar (Rp)</div>
                <input
                  className={`w-full h-[54px] mt-2 rounded-2xl px-5 text-lg outline-none border focus:border-cyan-400 ${lunasSelected ? 'bg-[#24353a] text-slate-300 border-transparent' : 'bg-[#101817] border-[#223332] text-white'}`}
                  value={nominal}
                  readOnly={lunasSelected}
                  placeholder="Masukkan nominal"
                  inputMode="decimal"
                  onChange={(e) => setNominal(e.target.value)}
                />
                {lunasSelected && <p className="text-emerald-400 text-xs leading-4 mt-2">*Nominal otomatis terisi sesuai sisa tagihan.</p>}

                <div className={lbl}>3. Pilih Metode Pembayaran</div>
                <div className="grid grid-cols-2 h-[54px] mt-2.5 rounded-2xl border border-[#223332] bg-[#101817] p-1 gap-1">
                  {[['transfer', IUpload, 'Transfer Manual'], ['qris', IQr, 'QRIS / E-Wallet']].map(([k, Ic, l]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setMetode(k)}
                      className={`flex items-center justify-center gap-2.5 rounded-xl text-[15px] font-medium transition ${metode === k ? 'bg-[#0b1110] text-white' : 'text-slate-400'}`}
                    >
                      <Ic /> {l}
                    </button>
                  ))}
                </div>

                {metode === 'transfer' ? (
                  <>
                    <div className={lbl}>Upload Bukti Transfer</div>
                    <label className="mt-2.5 flex h-[54px] items-center gap-3 rounded-2xl border border-[#223332] bg-[#101817] px-5 text-[15px] text-slate-400 cursor-pointer hover:border-cyan-400">
                      <IUpload />
                      <span>{file ? file.name : 'Pilih file (JPG/PNG/PDF)'}</span>
                      <input type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden" onChange={(e) => setFile(e.target.files[0] || null)} />
                    </label>

                    <button type="submit" className="w-full h-[54px] mt-7 bg-cyan-400 hover:bg-cyan-300 text-[#04282a] text-[15px] font-bold rounded-2xl transition">
                      Proses Pembayaran
                    </button>
                  </>
                ) : (
                  <div className="mt-6 rounded-2xl border border-[#223332] bg-[#101817] px-[30px] pt-9 pb-6 flex flex-col items-center">
                    <div className="bg-white rounded-2xl p-2">
                      <QrSim seed={`${current.no}-${nominalNum}`} />
                    </div>
                    <div className="mt-5 text-[15px] font-bold text-white">Scan QRIS untuk Membayar</div>
                    <p className="mt-1 text-sm text-slate-400 text-center max-w-sm leading-5">
                      Nominal: <span className="font-bold text-cyan-400">{rp(nominalNum)}</span>. Buka m-banking atau e-wallet, lalu scan QR code.
                    </p>
                    <button
                      type="button"
                      onClick={pay}
                      className="w-full h-[54px] mt-6 flex items-center justify-center gap-2.5 bg-blue-600 hover:bg-blue-500 text-white text-[15px] font-bold rounded-2xl transition"
                    >
                      <ICheckCircle /> Simulasi Pembayaran Lunas
                    </button>
                  </div>
                )}
              </>
            )}
          </form>

          <h3 className="text-xl font-bold flex items-center gap-3 mb-6">
            <IReceipt size={22} /> Preview Struk Tagihan
          </h3>
          <div className="bg-white text-black rounded-2xl max-w-xl mx-auto px-10 py-12 shadow-xl" style={mono}>
            <div className="text-center">
              <div className="text-3xl font-bold tracking-[0.2em]">TEKNA.ID</div>
              <div className="text-slate-500 mt-3">Solusi Digital Terbaik</div>
              <div className="text-slate-500">Jl. Teknologi No. 123, Jakarta</div>
            </div>
            <div className="border-t border-dashed border-slate-300 my-6" />
            <div className="space-y-1.5 text-[15px]">
              <div className="flex justify-between"><span>No. Invoice:</span><b>{current.no}</b></div>
              <div className="flex justify-between"><span>Tanggal:</span><span>{longDate(current.date)}</span></div>
              <div className="flex justify-between"><span>Customer:</span><span>{current.customer}</span></div>
              <div className="flex justify-between"><span>PIC:</span><span>{current.pic}</span></div>
            </div>
            <div className="border-t border-dashed border-slate-300 my-6" />
            <div className="flex justify-between font-bold border-b border-slate-300 pb-2"><span>Item</span><span>Total</span></div>
            {current.items.map((i, k) => (
              <div key={k} className="mt-4">
                <div className="flex justify-between"><span>{i.name}</span><span>{rp(i.qty * i.price)}</span></div>
                <div className="text-xs text-slate-500 mt-1">{i.qty} x {rp(i.price)}</div>
              </div>
            ))}
            <div className="border-t border-dashed border-slate-300 my-6" />
            <div className="space-y-1.5 text-[15px]">
              <div className="flex justify-between"><span>Subtotal</span><span>{rp(subtotalOf(current))}</span></div>
              <div className="flex justify-between text-slate-500"><span>Diskon</span><span>-{rp(current.discount)}</span></div>
              <div className="flex justify-between"><span>Pajak</span><span>{rp(current.tax)}</span></div>
            </div>
            <div className="border-t border-slate-300 mt-3 pt-4 space-y-2">
              <div className="flex justify-between text-lg font-bold"><span>Grand Total</span><span>{rp(total)}</span></div>
              <div className="flex justify-between font-bold text-emerald-600"><span>Sudah Dibayar</span><span>{rp(current.paid)}</span></div>
              <div className="flex justify-between text-lg font-bold text-red-600"><span>Sisa Tagihan</span><span>{rp(sisa)}</span></div>
            </div>
          </div>
        </div>

        {emailOpen && (
          <EmailModal
            contact={contact}
            targets={targets}
            setTargets={setTargets}
            onClose={() => setEmailOpen(false)}
            onSend={sendEmail}
          />
        )}
      </RoleLayout>
    );
  }

  /* ---------------- LIST (ringkas) ---------------- */
  return (
    <RoleLayout>
      <Head title="Invoices" />
      <div className="text-white w-full">
        <h1 className="text-2xl font-bold leading-tight">Invoices</h1>
        <p className="text-slate-300 text-sm mt-1 mb-5">Total {data.length} tagihan</p>

        <div className="bg-[#131c1b] border border-[#223332] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#1f2e2e] text-slate-300 uppercase text-xs">
                <tr>
                  <th className="pl-5 pr-3 py-3 font-semibold">Invoice</th>
                  <th className="px-3 py-3 font-semibold">Customer</th>
                  <th className="px-3 py-3 font-semibold">Total Tagihan</th>
                  <th className="px-3 py-3 font-semibold">Dibayar</th>
                  <th className="px-3 py-3 font-semibold">Sisa</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="pl-3 pr-5 py-3 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.map((v) => (
                  <tr key={v.id} className="border-t border-[#223332] hover:bg-[#1c2928] align-middle">
                    <td className="pl-5 pr-3 py-2.5">
                      <div className="font-bold leading-5" style={mono}>{v.no}</div>
                      <div className="text-slate-400 text-xs leading-4">{v.orderNo}</div>
                    </td>
                    <td className="px-3 py-2.5">{v.customer}</td>
                    <td className="px-3 py-2.5">{rp(totalOf(v))}</td>
                    <td className="px-3 py-2.5 text-emerald-500">{rp(v.paid)}</td>
                    <td className="px-3 py-2.5 text-red-500">{rp(sisaOf(v))}</td>
                    <td className="px-3 py-2.5"><Badge s={statusOf(v)} /></td>
                    <td className="pl-3 pr-5 py-2.5 text-right">
                      <button
                        className="text-cyan-400 text-xs font-semibold border border-cyan-900 rounded-md px-3 py-1.5 hover:bg-cyan-950"
                        onClick={() => openDetail(v)}
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </RoleLayout>
  );
}