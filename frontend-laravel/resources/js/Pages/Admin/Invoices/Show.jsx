import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head, Link } from '@inertiajs/react';
import {
  ArrowLeft, RefreshCw, CheckCircle2, AlertCircle,
  UploadCloud, Save, Mail, Receipt, CreditCard, QrCode, Landmark
} from 'lucide-react';

// ============ HELPERS ============
const formatRupiah = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID');

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

function getBasePath() {
  return window.location.pathname.replace(/\/invoices.*$/, '');
}

function PaymentStatusBadge({ status }) {
  const labels = {
    unpaid: 'Unpaid',
    partial: 'Partial',
    paid: 'Paid',
    cancelled: 'Cancelled',
  };
  const colors = {
    unpaid: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/40',
    partial: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40',
    paid: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40',
    cancelled: 'bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/40',
  };
  return (
    <span
      className={`inline-block text-[11px] sm:text-xs px-2.5 py-0.5 sm:py-1 rounded-full font-medium border shrink-0 ${
        colors[status] || colors.unpaid
      }`}
    >
      {labels[status] || status}
    </span>
  );
}

// ============ MAIN COMPONENT ============
export default function InvoiceShow({ invoiceId }) {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  // Form Pembayaran
  const [paymentType, setPaymentType] = useState('full'); // 'full' | 'dp'
  const [payMethod, setPayMethod] = useState('manual');   // 'manual' | 'qris'
  const [payAmount, setPayAmount] = useState('');
  const [payFile, setPayFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Modal Email
  const [emailOpen, setEmailOpen] = useState(false);
  const [sendToCustomer, setSendToCustomer] = useState(true);
  const [sendToPic, setSendToPic] = useState(true);
  const [sendingEmail, setSendingEmail] = useState(false);

  const basePath = getBasePath();

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // ============ LOAD DATA ============
  const load = () => {
    setLoading(true);
    setError('');
    fetch(`/api/v1/invoices/${invoiceId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setInvoice(d.data);
          // Default nominal = sisa tagihan
          setPayAmount(
            Number(d.data.orders?.grand_total || 0) - Number(d.data.total_paid)
          );
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

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  // ============ HANDLERS ============
  const handleTypeChange = (type) => {
    setPaymentType(type);
    if (type === 'full') {
      const rem =
        Number(invoice.orders?.grand_total || 0) - Number(invoice.total_paid);
      setPayAmount(rem);
    } else {
      setPayAmount('');
    }
  };

  // Submit Manual (Upload Bukti Transfer)
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!payAmount || Number(payAmount) <= 0) {
      return showToast('error', 'Nominal tidak valid');
    }
    setSubmitting(true);

    const formData = new FormData();
    formData.append('amount', payAmount);
    if (payFile) formData.append('proof_file', payFile);

    try {
      const res = await fetch(`/api/v1/invoices/${invoiceId}/pay`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        showToast('error', data.message || 'Gagal update pembayaran');
      } else {
        setPayFile(null);
        load();
        showToast('success', 'Pembayaran manual berhasil dicatat');
      }
    } catch {
      showToast('error', 'Gagal menghubungi server');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit QRIS (Simulasi Lunas)
  const handleQrisSubmit = async () => {
    if (!payAmount || Number(payAmount) <= 0) {
      return showToast('error', 'Nominal tidak valid');
    }
    setSubmitting(true);

    const formData = new FormData();
    formData.append('amount', payAmount);

    try {
      const res = await fetch(`/api/v1/invoices/${invoiceId}/pay`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        showToast('error', data.message || 'Gagal memproses QRIS');
      } else {
        load();
        showToast('success', 'Pembayaran QRIS berhasil diproses');
      }
    } catch {
      showToast('error', 'Gagal menghubungi server');
    } finally {
      setSubmitting(false);
    }
  };

  // Kirim Email
  const handleSendEmail = async () => {
    setSendingEmail(true);
    try {
      const res = await fetch(`/api/v1/invoices/${invoiceId}/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          send_to_customer: sendToCustomer,
          send_to_pic: sendToPic,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        showToast('error', data.message || 'Gagal mengirim email');
      } else {
        setEmailOpen(false);
        showToast('success', data.message);
      }
    } catch {
      showToast('error', 'Gagal menghubungi server');
    } finally {
      setSendingEmail(false);
    }
  };

  // ============ LOADING STATE ============
  if (loading) {
    return (
      <RoleLayout>
        <Head title="Detail Invoice" />
        <div className="p-8 sm:p-12 text-center text-brand-text-muted">
          <RefreshCw
            size={24}
            className="animate-spin mx-auto mb-3 text-brand-accent"
          />
          <p className="text-xs sm:text-sm">Loading invoice...</p>
        </div>
      </RoleLayout>
    );
  }

  // ============ ERROR STATE ============
  if (error || !invoice) {
    return (
      <RoleLayout>
        <Head title="Detail Invoice" />
        <div className="p-6 sm:p-8 text-center">
          <p className="text-red-600 dark:text-red-400 mb-3 text-xs sm:text-sm">
            Error: {error || 'Data tidak ditemukan'}
          </p>
          <Link
            href={`${basePath}/invoices`}
            className="text-brand-accent underline hover:no-underline text-xs sm:text-sm font-medium"
          >
            ← Kembali ke daftar
          </Link>
        </div>
      </RoleLayout>
    );
  }

  // ============ DERIVED VALUES ============
  const grandTotal = Number(invoice.orders?.grand_total || 0);
  const totalPaid = Number(invoice.total_paid || 0);
  const remaining = grandTotal - totalPaid;
  const services = invoice.orders?.order_services || [];
  const customerName =
    invoice.orders?.customer_name_snapshot || invoice.customers?.name || '—';
  const picName = invoice.orders?.pic_name_snapshot || '—';

  // ============ RENDER ============
  return (
    <RoleLayout>
      <Head title={`Invoice — ${invoice.invoice_number}`} />

      {/* Toast Notification (Responsif: Bawah di Mobile, Atas di Desktop) */}
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

      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <Link
          href={`${basePath}/invoices`}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-brand-text-muted hover:text-brand-accent transition mb-6"
        >
          <ArrowLeft size={16} /> Kembali ke Invoices
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-brand-text flex items-center gap-2.5 flex-wrap">
              <span>Detail Tagihan</span>
              <PaymentStatusBadge status={invoice.status} />
            </h1>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setEmailOpen(true)}
              className="w-full sm:w-auto justify-center bg-brand-accent text-brand-primary px-4 py-2.5 sm:py-2 rounded-xl hover:bg-brand-accent2 flex items-center gap-2 text-xs sm:text-sm font-semibold transition shadow-sm"
            >
              <Mail size={16} /> Kirim ke Email
            </button>
          </div>
        </div>
      </div>

      {/* Ringkasan 3 Kolom */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-brand-secondary rounded-xl border border-brand-border p-4 sm:p-5 shadow-sm">
          <div className="text-[11px] sm:text-xs text-brand-text-muted uppercase tracking-widest font-semibold mb-1">
            Total Tagihan
          </div>
          <div className="text-xl sm:text-2xl font-bold text-brand-text">
            {formatRupiah(grandTotal)}
          </div>
        </div>
        <div className="bg-emerald-500/10 rounded-xl border border-emerald-500/30 p-4 sm:p-5 shadow-sm">
          <div className="text-[11px] sm:text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-semibold mb-1">
            Sudah Dibayar
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatRupiah(totalPaid)}
          </div>
        </div>
        <div className="bg-red-500/10 rounded-xl border border-red-500/30 p-4 sm:p-5 shadow-sm">
          <div className="text-[11px] sm:text-xs text-red-600 dark:text-red-400 uppercase tracking-widest font-semibold mb-1">
            Sisa Tagihan
          </div>
          <div className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">
            {formatRupiah(remaining)}
          </div>
        </div>
      </div>

      {/* Form Pembayaran */}
      <div className="bg-brand-secondary rounded-xl border border-brand-border p-4 sm:p-6 mb-6 sm:mb-8 shadow-sm w-full">
        <h3 className="text-xs sm:text-sm font-bold text-brand-text uppercase tracking-widest mb-4 sm:mb-6 flex items-center gap-2 border-b border-brand-border pb-3">
          <CreditCard size={16} className="text-brand-accent shrink-0" />
          <span>Proses Pembayaran</span>
        </h3>

        {invoice.status === 'paid' ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-6 sm:p-8 rounded-xl flex flex-col items-center justify-center text-center">
            <CheckCircle2 size={44} className="text-emerald-500 dark:text-emerald-400 mb-2 sm:mb-3" />
            <p className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400">Lunas</p>
            <p className="text-xs sm:text-sm text-emerald-700/80 dark:text-emerald-300/80 mt-1">
              Tagihan ini sudah dibayar sepenuhnya.
            </p>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6 w-full">
            {/* 1. Tipe Pembayaran */}
            <div>
              <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-2">
                1. Pilih Tipe Pembayaran
              </label>
              <div className="flex gap-2.5 sm:gap-3 w-full">
                <button
                  type="button"
                  onClick={() => handleTypeChange('full')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-3 px-3 text-xs sm:text-sm font-semibold rounded-xl border transition ${
                    paymentType === 'full'
                      ? 'bg-brand-accent/15 border-brand-accent text-brand-accent shadow-sm'
                      : 'bg-brand-primary border-brand-border text-brand-text-muted hover:text-brand-text'
                  }`}
                >
                  <Landmark size={15} className="shrink-0" /> Lunas (Full)
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('dp')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-3 px-3 text-xs sm:text-sm font-semibold rounded-xl border transition ${
                    paymentType === 'dp'
                      ? 'bg-brand-accent/15 border-brand-accent text-brand-accent shadow-sm'
                      : 'bg-brand-primary border-brand-border text-brand-text-muted hover:text-brand-text'
                  }`}
                >
                  <CreditCard size={15} className="shrink-0" /> DP / Cicilan
                </button>
              </div>
            </div>

            {/* 2. Nominal */}
            <div>
              <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1.5">
                2. Nominal Bayar (Rp)
              </label>
              <input
                type="number"
                min="1"
                max={remaining}
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                readOnly={paymentType === 'full'}
                placeholder={`Maksimal ${remaining}`}
                className={`w-full border rounded-xl px-3.5 py-2.5 sm:py-3 text-base sm:text-sm font-semibold focus:outline-none transition shadow-sm ${
                  paymentType === 'full'
                    ? 'bg-brand-muted/50 border-brand-border text-brand-text-muted cursor-not-allowed'
                    : 'bg-brand-primary border-brand-border text-brand-text focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/30'
                }`}
              />
              {paymentType === 'full' && (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                  *Nominal otomatis terisi sesuai sisa tagihan.
                </p>
              )}
            </div>

            {/* 3. Metode */}
            <div>
              <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-2">
                3. Pilih Metode Pembayaran
              </label>
              <div className="flex gap-2 p-1 bg-brand-primary rounded-xl border border-brand-border shadow-sm w-full">
                <button
                  type="button"
                  onClick={() => setPayMethod('manual')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-3 px-2 text-xs sm:text-sm font-semibold rounded-lg transition ${
                    payMethod === 'manual'
                      ? 'bg-brand-secondary text-brand-text shadow-sm'
                      : 'text-brand-text-muted hover:text-brand-text'
                  }`}
                >
                  <UploadCloud size={15} className="shrink-0" /> Transfer Manual
                </button>
                <button
                  type="button"
                  onClick={() => setPayMethod('qris')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-3 px-2 text-xs sm:text-sm font-semibold rounded-lg transition ${
                    payMethod === 'qris'
                      ? 'bg-brand-secondary text-brand-text shadow-sm'
                      : 'text-brand-text-muted hover:text-brand-text'
                  }`}
                >
                  <QrCode size={15} className="shrink-0" /> QRIS / E-Wallet
                </button>
              </div>
            </div>

            {/* 4. Form Manual */}
            {payMethod === 'manual' && (
              <form
                onSubmit={handleManualSubmit}
                className="space-y-4 animate-in fade-in duration-300 pt-1"
              >
                <div>
                  <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1.5">
                    Upload Bukti Transfer
                  </label>
                  <div className="relative border border-brand-border rounded-xl px-3.5 py-2.5 sm:py-3 flex items-center gap-2 hover:bg-brand-primary/30 transition cursor-pointer shadow-sm bg-brand-primary/40 w-full">
                    <UploadCloud size={18} className="text-brand-text-muted shrink-0" />
                    <span className="text-xs sm:text-sm text-brand-text-muted truncate">
                      {payFile ? payFile.name : 'Pilih file (JPG/PNG/PDF)'}
                    </span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setPayFile(e.target.files[0])}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-brand-accent text-brand-primary px-6 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm transition"
                  >
                    {submitting ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <Save size={16} />
                    )}
                    {submitting ? 'Memproses...' : 'Simpan Pembayaran'}
                  </button>
                </div>
              </form>
            )}

            {/* 4. QRIS */}
            {payMethod === 'qris' && (
              <div className="flex flex-col items-center justify-center p-4 sm:p-6 border border-brand-border rounded-xl bg-brand-primary/40 animate-in fade-in duration-300">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=QRIS-INV-${invoice.invoice_number}-${payAmount}`}
                  alt="QRIS Code"
                  className="w-36 h-36 sm:w-40 sm:h-40 mb-3 sm:mb-4 rounded-xl border-4 border-white shadow-lg"
                />
                <p className="text-xs sm:text-sm font-bold text-brand-text mb-1 text-center">
                  Scan QRIS untuk Membayar
                </p>
                <p className="text-[11px] sm:text-xs text-brand-text-muted mb-4 sm:mb-6 text-center max-w-xs">
                  Nominal:{' '}
                  <strong className="text-brand-accent">
                    {formatRupiah(payAmount)}
                  </strong>
                  . Buka m-banking atau e-wallet, lalu scan QR code.
                </p>
                <button
                  type="button"
                  onClick={handleQrisSubmit}
                  disabled={submitting}
                  className="w-full bg-blue-600 text-white py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 transition shadow-md"
                >
                  {submitting ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}
                  {submitting ? 'Memverifikasi...' : 'Simulasi Pembayaran Lunas'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Preview Struk */}
      <div className="border-t border-brand-border pt-6 sm:pt-8">
        <h2 className="text-base sm:text-lg font-bold text-brand-text mb-3 sm:mb-4 flex items-center gap-2">
          <Receipt size={18} className="text-brand-accent shrink-0" />
          <span>Preview Struk Tagihan</span>
        </h2>

        <div className="bg-white text-black p-4 sm:p-8 rounded-xl shadow-xl border border-gray-300 max-w-md mx-auto font-mono relative overflow-hidden text-xs">
          <div className="absolute top-0 left-0 right-0 h-2 bg-[radial-gradient(circle,transparent,transparent_50%,#f3f4f6_50%,#f3f4f6_100%)] bg-[length:10px_10px]" />

          <div className="text-center mb-4 sm:mb-6 pt-2 sm:pt-4">
            <h2 className="text-lg sm:text-xl font-bold uppercase tracking-widest">
              TEKNA.ID
            </h2>
            <p className="text-[11px] text-gray-500 mt-0.5">Solusi Digital Terbaik</p>
            <p className="text-[11px] text-gray-500">
              Jl. Teknologi No. 123, Jakarta
            </p>
          </div>

          <div className="text-[11px] sm:text-xs space-y-1 border-t border-b border-dashed border-gray-300 py-2.5 sm:py-3 mb-4">
            <div className="flex justify-between">
              <span>No. Invoice:</span>{' '}
              <span className="font-bold">{invoice.invoice_number}</span>
            </div>
            <div className="flex justify-between">
              <span>Tanggal:</span> <span>{formatDate(invoice.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span>Customer:</span> <span className="truncate max-w-[160px]">{customerName}</span>
            </div>
            <div className="flex justify-between">
              <span>PIC:</span> <span className="truncate max-w-[160px]">{picName}</span>
            </div>
          </div>

          {/* Rincian Layanan */}
          <div className="mb-4">
            <div className="flex justify-between text-[11px] sm:text-xs font-bold border-b border-gray-300 pb-1 mb-2">
              <span>Item</span>
              <span>Total</span>
            </div>
            {services.map((svc) => (
              <div key={svc.id} className="flex justify-between text-[11px] sm:text-xs mb-1.5 gap-2">
                <div className="flex-1 min-w-0">
                  <div className="truncate">{svc.service_name_snapshot}</div>
                  <div className="text-[10px] text-gray-500">
                    {svc.quantity} x {formatRupiah(svc.price_deal)}
                  </div>
                </div>
                <div className="text-right shrink-0">{formatRupiah(svc.subtotal)}</div>
              </div>
            ))}
          </div>

          {/* Ringkasan */}
          <div className="text-[11px] sm:text-xs space-y-1 border-t border-dashed border-gray-300 pt-3 mb-4">
            <div className="flex justify-between">
              <span>Subtotal</span>{' '}
              <span>{formatRupiah(invoice.orders?.subtotal)}</span>
            </div>
            {Number(invoice.orders?.discount) > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Diskon</span>{' '}
                <span>-{formatRupiah(invoice.orders?.discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Pajak</span> <span>{formatRupiah(invoice.orders?.tax)}</span>
            </div>
            <div className="flex justify-between font-bold text-xs sm:text-sm pt-2 border-t border-gray-300 mt-2">
              <span>Grand Total</span> <span>{formatRupiah(grandTotal)}</span>
            </div>
            <div className="flex justify-between text-emerald-600 font-bold">
              <span>Sudah Dibayar</span> <span>{formatRupiah(totalPaid)}</span>
            </div>
            <div className="flex justify-between text-red-600 font-bold text-xs sm:text-sm">
              <span>Sisa Tagihan</span> <span>{formatRupiah(remaining)}</span>
            </div>
          </div>

          <div className="text-center text-[10px] text-gray-500 border-t border-dashed border-gray-300 pt-3">
            <p>Terima kasih atas kepercayaan Anda.</p>
            <p>Barang/Jasa yang sudah dibeli tidak dapat dikembalikan.</p>
          </div>
        </div>
      </div>

      {/* Modal Email (Responsif Mobile) */}
      {emailOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-[100] p-3 sm:p-4">
          <div className="bg-brand-secondary rounded-2xl shadow-2xl border border-brand-border w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-brand-border flex items-center justify-between shrink-0">
              <h2 className="text-base sm:text-lg font-bold text-brand-text">
                Kirim Invoice ke Email
              </h2>
              <button
                type="button"
                onClick={() => setEmailOpen(false)}
                className="text-brand-text-muted hover:text-brand-accent text-2xl leading-none p-1"
              >
                ×
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4 overflow-y-auto flex-1">
              <p className="text-xs sm:text-sm text-brand-text-muted">
                Pilih tujuan pengiriman email:
              </p>

              <label className="flex items-center gap-3 p-3 border border-brand-border rounded-xl cursor-pointer hover:bg-brand-primary/30 transition select-none">
                <input
                  type="checkbox"
                  checked={sendToCustomer}
                  onChange={(e) => setSendToCustomer(e.target.checked)}
                  className="w-4 h-4 rounded border-brand-border text-brand-accent focus:ring-0 shrink-0"
                />
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-semibold text-brand-text truncate">
                    Customer Utama
                  </div>
                  <div className="text-xs text-brand-text-muted truncate">
                    {invoice.customers?.email || 'Email tidak tersedia'}
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-brand-border rounded-xl cursor-pointer hover:bg-brand-primary/30 transition select-none">
                <input
                  type="checkbox"
                  checked={sendToPic}
                  onChange={(e) => setSendToPic(e.target.checked)}
                  className="w-4 h-4 rounded border-brand-border text-brand-accent focus:ring-0 shrink-0"
                />
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-semibold text-brand-text truncate">
                    PIC Customer
                  </div>
                  <div className="text-xs text-brand-text-muted truncate">
                    {invoice.orders?.pic_email_snapshot || 'Email tidak tersedia'}
                  </div>
                </div>
              </label>
            </div>

            <div className="px-5 py-4 border-t border-brand-border flex flex-col-reverse sm:flex-row justify-end gap-2 shrink-0 bg-brand-secondary">
              <button
                type="button"
                onClick={() => setEmailOpen(false)}
                className="w-full sm:w-auto text-center bg-brand-muted text-brand-text px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSendEmail}
                disabled={
                  sendingEmail || (!sendToCustomer && !sendToPic)
                }
                className="w-full sm:w-auto justify-center bg-brand-accent text-brand-primary px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 disabled:opacity-50 transition shadow-sm"
              >
                {sendingEmail ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Mail size={14} />
                )}
                {sendingEmail ? 'Mengirim...' : 'Kirim Email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </RoleLayout>
  );
}