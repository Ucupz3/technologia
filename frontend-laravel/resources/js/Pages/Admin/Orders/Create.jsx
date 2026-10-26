import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head, Link, router } from '@inertiajs/react';
import {
  ArrowLeft, RefreshCw, Save, ChevronDown, Check,
  User, UserCircle, Briefcase, Users, Package, Percent
} from 'lucide-react';

const formatRupiah = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID');

function CustomSelect({ label, value, options, onChange, placeholder, disabled, icon: Icon }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(o => String(o.value) === String(value));

  return (
    <div className="relative">
      <label className="block text-xs font-semibold text-brand-text-muted uppercase mb-1.5">{label}</label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-brand-primary border border-brand-border rounded-xl px-3.5 py-2.5 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex items-center gap-2 min-w-0">
          {Icon && <Icon size={14} className="text-brand-text-muted shrink-0" />}
          <span className={`truncate ${!selectedOption ? 'text-brand-text-muted/60' : ''}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown size={16} className={`text-brand-text-muted transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-brand-accent' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setIsOpen(false)} />
          <div className="absolute z-30 top-full left-0 right-0 mt-1.5 p-1 bg-brand-primary border border-brand-border rounded-xl shadow-xl max-h-56 overflow-y-auto">
            <button
              type="button"
              onClick={() => { onChange(''); setIsOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between ${!value ? 'bg-brand-accent/15 text-brand-accent font-medium' : 'text-brand-text hover:bg-brand-border/40'}`}
            >
              <span>{placeholder}</span>
              {!value && <Check size={14} className="text-brand-accent" />}
            </button>
            {options.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between ${String(value) === String(opt.value) ? 'bg-brand-accent/15 text-brand-accent font-medium' : 'text-brand-text hover:bg-brand-border/40'}`}
              >
                <span className="truncate">{opt.label}</span>
                {String(value) === String(opt.value) && <Check size={14} className="text-brand-accent" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminOrderCreate() {
  const [options, setOptions] = useState({
    customers: [],
    services: [],
    sales: [],
    teams: [],
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    customer_id: '',
    pic_id: '',
    sales_id: '',
    team_id: '',
    service_id: '',
    price_deal: '',
    quantity: 1,
    discount_type: 'fixed',
    discount: 0,
    tax_rate: 0,
    start_date_project: '',
    end_date_project: '',
    notes: '',
    assignments: {},
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/v1/orders/options/customers').then(r => r.json()),
      fetch('/api/v1/orders/options/services').then(r => r.json()),
      fetch('/api/v1/orders/options/sales').then(r => r.json()),
      fetch('/api/v1/orders/options/teams').then(r => r.json()),
    ])
      .then(([customers, services, sales, teams]) => {
        setOptions({
          customers: customers.data || [],
          services: services.data || [],
          sales: sales.data || [],
          teams: teams.data || [],
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const price = Number(form.price_deal) || 0;
  const subtotal = price * form.quantity;
  const discountAmount = form.discount_type === 'percent' ? (subtotal * form.discount) / 100 : Number(form.discount);
  const taxAmount = ((subtotal - discountAmount) * form.tax_rate) / 100;
  const grandTotal = subtotal - discountAmount + taxAmount;

  const handleCustomerChange = (val) => {
    setForm({ ...form, customer_id: val, pic_id: '' });
  };

  const handleServiceChange = (val) => {
    const selectedService = options.services.find(s => String(s.id) === String(val));
    setForm({
      ...form,
      service_id: val,
      price_deal: selectedService ? selectedService.default_price : ''
    });
  };

  const currentCustomer = options.customers.find(c => String(c.id) === String(form.customer_id));
  const customerPics = currentCustomer?.customer_pics || [];

  const handleTeamChange = (val) => {
    setForm(prev => {
      const newForm = { ...prev, team_id: val, assignments: {} };
      if (val) {
        const team = options.teams.find(t => String(t.id) === String(val));
        if (team && team.team_members) {
          team.team_members.forEach(tm => {
            const primaryJob = tm.users?.user_jobs?.find(uj => uj.is_primary) || tm.users?.user_jobs?.[0];
            newForm.assignments[tm.id] = {
              team_member_id: tm.id,
              job_id: primaryJob ? String(primaryJob.job_id) : '',
              is_lead: false
            };
          });
        }
      }
      return newForm;
    });
  };

  const handleAssignmentChange = (teamMemberId, field, value) => {
    setForm(prev => ({
      ...prev,
      assignments: {
        ...prev.assignments,
        [teamMemberId]: {
          ...prev.assignments[teamMemberId],
          [field]: value
        }
      }
    }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!form.customer_id) return setErrors({ customer_id: ['Customer wajib dipilih'] });
    if (!form.service_id) return setErrors({ service_id: ['Layanan wajib dipilih'] });
    if (!form.price_deal) return setErrors({ price_deal: ['Harga deal wajib diisi'] });

    setSubmitting(true);
    setErrors({});

    const assignmentsArray = Object.values(form.assignments).filter(a => a.job_id !== '');

    const payload = {
      customer_id: form.customer_id,
      pic_id: form.pic_id || null,
      sales_id: form.sales_id || null,
      team_id: form.team_id || null,
      service_id: form.service_id,
      price_deal: Number(form.price_deal),
      quantity: Number(form.quantity),
      discount_type: form.discount_type,
      discount: Number(form.discount),
      tax_rate: Number(form.tax_rate),
      start_date_project: form.start_date_project || null,
      end_date_project: form.end_date_project || null,
      notes: form.notes || null,
      assignments: assignmentsArray
    };

    try {
      const res = await fetch('/api/v1/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.errors) setErrors(data.errors);
        alert(data.message || 'Gagal menyimpan order');
      } else {
        router.visit('/admin/orders');
      }
    } catch {
      alert('Gagal menghubungi server');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <RoleLayout>
        <Head title="Buat Order — Admin" />
        <div className="p-12 text-center text-brand-text-muted">
          <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-brand-accent" />
          Memuat formulir...
        </div>
      </RoleLayout>
    );
  }

  return (
    <RoleLayout>
      <Head title="Buat Order Baru — Admin" />

      <div className="mb-6">
        <Link href="/admin/orders" className="inline-flex items-center gap-2 text-sm text-brand-text-muted hover:text-brand-accent transition mb-3">
          <ArrowLeft size={16} /> Kembali ke Orders
        </Link>
        <h1 className="text-2xl font-bold text-brand-text">Buat Order Baru</h1>
        <p className="text-sm text-brand-text-muted mt-1">Invoice akan otomatis dibuat setelah order tersimpan.</p>
      </div>

      <div className="bg-brand-secondary rounded-lg border border-brand-border p-6 w-full">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* CUSTOMER & PIC */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CustomSelect
              label="Customer *"
              placeholder="— Pilih Customer —"
              value={form.customer_id}
              options={options.customers.map(c => ({ value: c.id, label: c.name }))}
              onChange={handleCustomerChange}
              icon={User}
            />
            <CustomSelect
              label="PIC Customer"
              placeholder="— Pilih PIC —"
              value={form.pic_id}
              options={customerPics.map(p => ({ value: p.id, label: p.name }))}
              onChange={(val) => setForm({ ...form, pic_id: val })}
              disabled={!form.customer_id}
              icon={UserCircle}
            />
          </div>

          {/* SALES & TIM */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CustomSelect
              label="Sales PIC"
              placeholder="— Pilih Sales —"
              value={form.sales_id}
              options={options.sales.map(s => ({ value: s.id, label: s.name }))}
              onChange={(val) => setForm({ ...form, sales_id: val })}
              icon={Briefcase}
            />
            <CustomSelect
              label="Tim Pengerjaan"
              placeholder="— Pilih Tim —"
              value={form.team_id}
              options={options.teams.map(t => ({ value: t.id, label: t.name }))}
              onChange={handleTeamChange}
              icon={Users}
            />
          </div>

          {/* LAYANAN, HARGA DEAL, & QTY */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-2">
              <CustomSelect
                label="Layanan / Service *"
                placeholder="— Pilih Layanan —"
                value={form.service_id}
                options={options.services.map(s => ({ value: s.id, label: s.name }))}
                onChange={handleServiceChange}
                icon={Package}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-text-muted uppercase mb-1.5">Harga Deal (Rp) <span className="text-red-500">*</span></label>
              <input
                type="number"
                min="0"
                value={form.price_deal}
                onChange={(e) => setForm({ ...form, price_deal: e.target.value })}
                className={`w-full bg-brand-primary border rounded-xl px-3.5 py-2.5 text-sm text-brand-text shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition-all ${errors.price_deal ? 'border-red-500' : 'border-brand-border'}`}
                placeholder="0"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-text-muted uppercase mb-1.5">Quantity</label>
              <input
                type="number"
                min="1"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                className="w-full bg-brand-primary border border-brand-border rounded-xl px-3.5 py-2.5 text-sm text-brand-text shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition-all"
              />
            </div>
          </div>

          {/* DISKON & PAJAK */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-brand-primary/20 p-5 rounded-xl border border-brand-border">
            <CustomSelect
              label="Tipe Diskon"
              placeholder="— Pilih Tipe —"
              value={form.discount_type}
              options={[
                { value: 'fixed', label: 'Nominal (Rp)' },
                { value: 'percent', label: 'Persen (%)' }
              ]}
              onChange={(val) => setForm({ ...form, discount_type: val })}
              icon={Percent}
            />
            <div>
              <label className="block text-xs font-semibold text-brand-text-muted uppercase mb-1.5">Nilai Diskon</label>
              <input
                type="number"
                min="0"
                value={form.discount}
                onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })}
                className="w-full bg-brand-primary border border-brand-border rounded-xl px-3.5 py-2.5 text-sm text-brand-text shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-text-muted uppercase mb-1.5">Pajak / PPN (%)</label>
              <input
                type="number"
                min="0"
                value={form.tax_rate}
                onChange={(e) => setForm({ ...form, tax_rate: Number(e.target.value) })}
                className="w-full bg-brand-primary border border-brand-border rounded-xl px-3.5 py-2.5 text-sm text-brand-text shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition-all"
              />
            </div>
          </div>

          {/* TANGGAL PROYEK */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-brand-text-muted uppercase mb-1.5">Mulai Proyek</label>
              <input
                type="date"
                value={form.start_date_project}
                onChange={(e) => setForm({ ...form, start_date_project: e.target.value })}
                className="w-full bg-brand-primary border border-brand-border rounded-xl px-3.5 py-2.5 text-sm text-brand-text shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-text-muted uppercase mb-1.5">Selesai Proyek</label>
              <input
                type="date"
                value={form.end_date_project}
                onChange={(e) => setForm({ ...form, end_date_project: e.target.value })}
                className="w-full bg-brand-primary border border-brand-border rounded-xl px-3.5 py-2.5 text-sm text-brand-text shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition-all"
              />
            </div>
          </div>

          {/* LIST ANGGOTA TIM & JOB */}
          {form.team_id && Object.keys(form.assignments).length > 0 && (
            <div className="pt-4 border-t border-brand-border">
              <label className="block text-xs font-semibold text-brand-text-muted uppercase mb-3">Atur Posisi Anggota Tim</label>
              <div className="space-y-3">
                {options.teams.find(t => String(t.id) === String(form.team_id))?.team_members?.map((tm) => {
                  const assign = form.assignments[tm.id] || {};
                  const userJobs = tm.users?.user_jobs || [];
                  return (
                    <div key={tm.id} className="flex flex-col sm:flex-row sm:items-center gap-4 bg-brand-primary/40 border border-brand-border p-4 rounded-xl">
                      <div className="flex-1 min-w-0 font-medium text-brand-text">{tm.users?.name}</div>
                      <div className="w-full sm:w-64">
                        <CustomSelect
                          label="Posisi / Job"
                          placeholder="— Pilih Job —"
                          value={assign.job_id || ''}
                          options={userJobs.map(uj => ({ value: uj.job_id, label: uj.jobs?.name }))}
                          onChange={(val) => handleAssignmentChange(tm.id, 'job_id', val)}
                        />
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer sm:w-24 mt-4 sm:mt-0">
                        <input
                          type="checkbox"
                          checked={assign.is_lead || false}
                          onChange={(e) => handleAssignmentChange(tm.id, 'is_lead', e.target.checked)}
                          className="w-5 h-5 rounded border-brand-border text-amber-500 focus:ring-amber-500"
                        />
                        <span className="text-sm font-semibold text-brand-text-muted">Lead</span>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* CATATAN & RINGKASAN TOTAL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-brand-border">
            <div>
              <label className="block text-xs font-semibold text-brand-text-muted uppercase mb-1.5">Catatan Tambahan</label>
              <textarea
                rows={5}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Catatan..."
                className="w-full bg-brand-primary border border-brand-border rounded-xl px-3.5 py-2.5 text-sm text-brand-text shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition-all resize-none"
              />
            </div>
            <div className="bg-brand-primary/40 p-6 rounded-xl border border-brand-border space-y-3 flex flex-col justify-center">
              <div className="flex justify-between text-sm text-brand-text-muted">
                <span>Subtotal</span>
                <span>{formatRupiah(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-red-500">
                <span>Diskon</span>
                <span>-{formatRupiah(discountAmount)}</span>
              </div>
              <div className="flex justify-between text-sm text-brand-text-muted">
                <span>Pajak ({form.tax_rate}%)</span>
                <span>+{formatRupiah(taxAmount)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-brand-accent pt-3 border-t border-brand-border mt-2">
                <span>Grand Total</span>
                <span>{formatRupiah(grandTotal)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-brand-border">
            <Link href="/admin/orders" className="bg-brand-muted text-brand-text px-6 py-2.5 rounded-xl text-sm font-medium transition">
              Batal
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="bg-brand-accent text-brand-primary px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition disabled:opacity-50"
            >
              {submitting ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
              {submitting ? 'Menyimpan...' : 'Simpan & Buat Invoice'}
            </button>
          </div>
        </form>
      </div>
    </RoleLayout>
  );
}
