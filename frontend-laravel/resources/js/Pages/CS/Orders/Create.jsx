import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
  ArrowLeft, RefreshCw, Save, ChevronDown, Check,
  User, UserCircle, Briefcase, Users, Package, Percent,
  AlertCircle, CheckCircle2, Calendar, FileText, Info
} from 'lucide-react';

const formatRupiah = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID');

function CustomSelect({ label, value, options, onChange, placeholder, disabled, icon: Icon, error, onDisabledClick }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((o) => String(o.value) === String(value));

  return (
    <div className={`relative ${isOpen ? 'z-40' : 'z-10'}`}>
      <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <button
        type="button"
        onClick={() => {
          if (disabled) {
            if (onDisabledClick) onDisabledClick();
          } else {
            setIsOpen(!isOpen);
          }
        }}
        className={`w-full flex items-center justify-between bg-brand-primary border rounded-xl px-3.5 py-2.5 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition-all shadow-sm ${
          disabled
            ? 'opacity-60 cursor-pointer bg-brand-primary/40'
            : 'cursor-pointer hover:border-brand-accent/50'
        } ${error ? 'border-red-500' : 'border-brand-border'}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {Icon && <Icon size={14} className="text-brand-text-muted shrink-0" />}
          <span className={`truncate ${!selectedOption ? 'text-brand-text-muted/60' : 'font-medium text-brand-text'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown
          size={16}
          className={`text-brand-text-muted transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-brand-accent' : ''
          }`}
        />
      </button>

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute z-40 top-full left-0 right-0 mt-1.5 p-1 bg-brand-primary border border-brand-border rounded-xl shadow-2xl max-h-56 overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition ${
                !value ? 'bg-brand-accent/15 text-brand-accent font-medium' : 'text-brand-text hover:bg-brand-border/40'
              }`}
            >
              <span>{placeholder}</span>
              {!value && <Check size={14} className="text-brand-accent" />}
            </button>
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                disabled={opt.disabled}
                onClick={() => {
                  if (opt.disabled) return;
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition ${
                  opt.disabled
                    ? 'opacity-40 cursor-not-allowed bg-transparent text-brand-text-muted'
                    : String(value) === String(opt.value)
                    ? 'bg-brand-accent/15 text-brand-accent font-medium'
                    : 'text-brand-text hover:bg-brand-border/40'
                }`}
              >
                <div className="flex flex-col min-w-0 pr-2">
                  <span className="truncate">{opt.label}</span>
                  {opt.subtext && <span className="text-[10px] text-brand-text-muted truncate">{opt.subtext}</span>}
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                  {opt.badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${opt.badgeClassName || 'bg-brand-accent/10 text-brand-accent'}`}>
                      {opt.badge}
                    </span>
                  )}
                  {String(value) === String(opt.value) && <Check size={14} className="text-brand-accent shrink-0" />}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const getRequiredJobKeywords = (svcNames) => {
  if (!svcNames || svcNames.length === 0) return [];
  const text = svcNames.join(' ').toLowerCase();
  const keywords = [];

  if (text.includes('ui/ux') || text.includes('ui') || text.includes('ux')) {
    keywords.push('ui/ux', 'ui', 'ux');
  }
  if (text.includes('logo') || text.includes('branding') || text.includes('grafis') || text.includes('graphic')) {
    keywords.push('graphic', 'grafis', 'desain', 'designer', 'logo');
  }
  if (text.includes('website') || text.includes('web') || text.includes('landing') || text.includes('company profile') || text.includes('commerce')) {
    keywords.push('frontend', 'backend', 'full-stack', 'web');
  }
  if (text.includes('aplikasi') || text.includes('android') || text.includes('ios') || text.includes('mobile')) {
    keywords.push('frontend', 'backend', 'full-stack', 'mobile');
  }
  if (text.includes('maintenance') || text.includes('pemeliharaan')) {
    keywords.push('devops', 'backend', 'frontend', 'full-stack', 'qa');
  }
  if (keywords.length === 0 && (text.includes('desain') || text.includes('design'))) {
    keywords.push('design', 'desain', 'ui', 'ux', 'graphic');
  }
  return [...new Set(keywords)];
};

const computeDefaultAssignments = (team, keywords) => {
  if (!team || !team.team_members) return {};
  const assignments = {};

  const hasPrimaryMatch = keywords.length > 0 && team.team_members.some((tm) => {
    const primary = tm.users?.user_jobs?.find((uj) => uj.is_primary) || tm.users?.user_jobs?.[0];
    return primary && keywords.some((k) => (primary.jobs?.name || '').toLowerCase().includes(k));
  });

  team.team_members.forEach((tm) => {
    const userJobs = tm.users?.user_jobs || [];
    const primaryJob = userJobs.find((uj) => uj.is_primary) || userJobs[0];
    const primaryMatches = primaryJob && keywords.some((k) => (primaryJob.jobs?.name || '').toLowerCase().includes(k));
    const secondaryMatch = userJobs.find((uj) => keywords.some((k) => (uj.jobs?.name || '').toLowerCase().includes(k)));

    let isAssigned = true;
    let chosenJobId = primaryJob ? String(primaryJob.job_id) : '';

    if (keywords.length > 0) {
      if (primaryMatches) {
        isAssigned = true;
        chosenJobId = String(primaryJob.job_id);
      } else if (!hasPrimaryMatch && secondaryMatch) {
        isAssigned = true;
        chosenJobId = String(secondaryMatch.job_id);
      } else {
        isAssigned = false;
        chosenJobId = secondaryMatch ? String(secondaryMatch.job_id) : (primaryJob ? String(primaryJob.job_id) : '');
      }
    }

    assignments[tm.id] = {
      team_member_id: tm.id,
      job_id: chosenJobId,
      is_assigned: isAssigned,
      is_lead: false,
      phase_order: 1,
      start_date: '',
      end_date: '',
    };
  });

  return assignments;
};

export default function SalesOrderCreate() {
  const page = usePage();
  const authUser = page.props.auth?.user;

  const [options, setOptions] = useState({
    customers: [],
    services: [],
    sales: [],
    teams: [],
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    customer_id: '',
    pic_id: '',
    sales_id: authUser?.id ? String(authUser.id) : '',
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

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    Promise.all([
      fetch('/api/v1/orders/options/customers').then((r) => r.json()),
      fetch('/api/v1/orders/options/services').then((r) => r.json()),
      fetch('/api/v1/orders/options/sales').then((r) => r.json()),
      fetch('/api/v1/orders/options/teams').then((r) => r.json()),
    ])
      .then(([customers, services, sales, teams]) => {
        const rawSales = sales.data || [];
        if (authUser?.id && !rawSales.some((s) => Number(s.id) === Number(authUser.id))) {
          rawSales.unshift({ id: String(authUser.id), name: `${authUser.name} (You)` });
        }

        setOptions({
          customers: customers.data || [],
          services: services.data || [],
          sales: rawSales,
          teams: teams.data || [],
        });

        if (authUser?.id) {
          setForm((prev) => ({
            ...prev,
            sales_id: prev.sales_id || String(authUser.id),
          }));
        }

        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load order options', err);
        showToast('error', 'Failed to load options from server');
        setLoading(false);
      });
  }, []);

  const price = Number(form.price_deal) || 0;
  const subtotal = price * form.quantity;
  const discountAmount = form.discount_type === 'percent' ? (subtotal * form.discount) / 100 : Number(form.discount);
  const taxAmount = ((subtotal - discountAmount) * form.tax_rate) / 100;
  const grandTotal = Math.max(0, subtotal - discountAmount + taxAmount);

  const handleCustomerChange = (val) => {
    const cust = options.customers.find((c) => String(c.id) === String(val));
    const pics = cust?.customer_pics || [];
    const defaultPic = pics.find((p) => p.is_primary) || pics[0];

    setForm((prev) => ({
      ...prev,
      customer_id: val,
      pic_id: defaultPic ? String(defaultPic.id) : '',
    }));
  };

  const handleServiceChange = (val) => {
    const selectedService = options.services.find((s) => String(s.id) === String(val));
    const svcNames = selectedService ? [selectedService.name] : [];
    const newKeywords = getRequiredJobKeywords(svcNames);

    setForm((prev) => {
      let nextTeamId = prev.team_id;
      let nextAssignments = prev.assignments;

      if (nextTeamId) {
        const currentTeam = options.teams.find((t) => String(t.id) === String(nextTeamId));
        const memberJobs = currentTeam?.team_members?.flatMap((tm) => tm.users?.user_jobs?.map((uj) => uj.jobs?.name) || []) || [];
        const isTeamValid = newKeywords.length === 0 || memberJobs.some((jn) => newKeywords.some((k) => jn.toLowerCase().includes(k)));

        if (!isTeamValid) {
          nextTeamId = '';
          nextAssignments = {};
        } else if (currentTeam) {
          nextAssignments = computeDefaultAssignments(currentTeam, newKeywords);
        }
      }

      return {
        ...prev,
        service_id: val,
        price_deal: selectedService ? selectedService.default_price : prev.price_deal,
        team_id: nextTeamId,
        assignments: nextAssignments,
      };
    });
  };

  const currentCustomer = options.customers.find((c) => String(c.id) === String(form.customer_id));
  const customerPics = currentCustomer?.customer_pics || [];

  const selectedService = options.services.find((s) => String(s.id) === String(form.service_id));
  const requiredKeywords = getRequiredJobKeywords(selectedService ? [selectedService.name] : []);

  const teamOptions = options.teams.map((t) => {
    const memberJobs = t.team_members?.flatMap((tm) => tm.users?.user_jobs?.map((uj) => uj.jobs?.name) || []) || [];
    const uniqueJobs = [...new Set(memberJobs)];

    let hasMatch = true;
    let badge = null;
    let badgeClassName = '';

    if (requiredKeywords.length > 0) {
      hasMatch = memberJobs.some((jn) => requiredKeywords.some((k) => jn.toLowerCase().includes(k)));
      if (hasMatch) {
        badge = 'Cocok';
        badgeClassName = 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30';
      } else {
        badge = 'Keahlian Tidak Ada';
        badgeClassName = 'bg-red-500/15 text-red-400 border border-red-500/30';
      }
    }

    return {
      value: t.id,
      label: t.name,
      subtext: uniqueJobs.length > 0 ? `Keahlian: ${uniqueJobs.join(', ')}` : 'Belum ada anggota',
      disabled: requiredKeywords.length > 0 && !hasMatch,
      badge: badge,
      badgeClassName: badgeClassName,
    };
  });

  const handleTeamChange = (val) => {
    setForm((prev) => {
      const selectedTeam = options.teams.find((t) => String(t.id) === String(val));
      const curService = options.services.find((s) => String(s.id) === String(prev.service_id));
      const svcNames = curService ? [curService.name] : [];
      const keywords = getRequiredJobKeywords(svcNames);

      return {
        ...prev,
        team_id: val,
        assignments: selectedTeam ? computeDefaultAssignments(selectedTeam, keywords) : {},
      };
    });
  };

  const handleAssignmentChange = (teamMemberId, field, value) => {
    setForm((prev) => ({
      ...prev,
      assignments: {
        ...prev.assignments,
        [teamMemberId]: {
          ...prev.assignments[teamMemberId],
          [field]: value,
        },
      },
    }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    const newErrors = {};
    if (!form.customer_id) newErrors.customer_id = 'Please select a customer';
    if (!form.service_id) newErrors.service_id = 'Please select a service / package';
    if (!form.price_deal || Number(form.price_deal) < 0) newErrors.price_deal = 'Valid deal price is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast('error', 'Please fill in all required fields');
      return;
    }

    const assignmentsArray = Object.values(form.assignments)
      .filter((a) => a.is_assigned && a.job_id)
      .map((a) => ({
        team_member_id: Number(a.team_member_id),
        job_id: Number(a.job_id),
        is_lead: Boolean(a.is_lead),
        phase_order: Number(a.phase_order || 1),
        start_date: a.start_date || null,
        end_date: a.end_date || null,
      }));

    if (form.team_id && assignmentsArray.length === 0) {
      showToast('error', 'Pilih minimal satu anggota tim untuk ditugaskan pada proyek ini.');
      return;
    }

    setSubmitting(true);
    setErrors({});

    const payload = {
      customer_id: form.customer_id,
      pic_id: form.pic_id || null,
      sales_id: form.sales_id || null,
      team_id: form.team_id || null,
      service_id: form.service_id,
      services: [{
        service_id: Number(form.service_id),
        price_deal: Number(form.price_deal),
        quantity: Number(form.quantity)
      }],
      price_deal: Number(form.price_deal),
      quantity: Number(form.quantity),
      discount_type: form.discount_type,
      discount: Number(form.discount),
      tax_rate: Number(form.tax_rate),
      start_date_project: form.start_date_project || null,
      end_date_project: form.end_date_project || null,
      notes: form.notes || null,
      assignments: assignmentsArray,
    };

    try {
      const res = await fetch('/api/v1/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.errors) setErrors(data.errors);
        showToast('error', data.message || 'Failed to create order');
      } else {
        showToast('success', 'Order created successfully! Invoice automatically generated.');
        setTimeout(() => {
          router.visit('/cs/orders');
        }, 800);
      }
    } catch {
      showToast('error', 'Failed to communicate with server');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <RoleLayout>
        <Head title="Create Order — Customer Service" />
        <div className="p-12 text-center text-brand-text-muted">
          <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-brand-accent" />
          Loading order form...
        </div>
      </RoleLayout>
    );
  }

  return (
    <RoleLayout>
      <Head title="Create Order — Customer Service" />

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
              : 'bg-red-500/15 border-red-500/40 text-red-400'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <Link
          href="/cs/orders"
          className="inline-flex items-center gap-2 text-sm text-brand-text-muted hover:text-brand-accent transition mb-3"
        >
          <ArrowLeft size={16} /> Back to Orders
        </Link>
        <h1 className="text-2xl font-bold text-brand-text">Create New Order</h1>
        <p className="text-sm text-brand-text-muted mt-1">
          An invoice will be automatically generated upon order submission.
        </p>
      </div>

      <div className="bg-brand-secondary rounded-lg border border-brand-border p-6 w-full">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* CUSTOMER & PIC */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CustomSelect
              label="Customer *"
              placeholder="— Select Customer —"
              value={form.customer_id}
              options={options.customers.map((c) => ({ value: c.id, label: c.name }))}
              onChange={handleCustomerChange}
              icon={User}
              error={errors.customer_id}
            />

            <div>
              <CustomSelect
                label="Customer PIC (Contact Person)"
                placeholder={
                  !form.customer_id
                    ? '— Select Customer First —'
                    : customerPics.length === 0
                    ? '— No PIC Contact Registered —'
                    : '— Select Customer PIC —'
                }
                value={form.pic_id}
                options={customerPics.map((p) => ({
                  value: p.id,
                  label: `${p.name}${p.position ? ` (${p.position})` : ''}${p.is_primary ? ' ★ Primary' : ''}`,
                }))}
                onChange={(val) => setForm((prev) => ({ ...prev, pic_id: val }))}
                disabled={!form.customer_id}
                onDisabledClick={() => showToast('error', 'Please select a Customer first to choose their PIC contact.')}
                icon={UserCircle}
              />
              {form.customer_id && customerPics.length === 0 && (
                <p className="text-xs text-amber-500/90 mt-1 flex items-center gap-1">
                  <Info size={12} /> No PIC contact registered for this customer. Order can proceed without PIC.
                </p>
              )}
            </div>
          </div>

          {/* SALES & TEAM */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CustomSelect
              label="Sales PIC"
              placeholder="— Select Sales PIC —"
              value={form.sales_id}
              options={options.sales.map((s) => ({ value: s.id, label: s.name }))}
              onChange={(val) => setForm((prev) => ({ ...prev, sales_id: val }))}
              icon={Briefcase}
            />
            <CustomSelect
              label="Assigned Team"
              placeholder="— Select Working Team —"
              value={form.team_id}
              options={teamOptions}
              onChange={handleTeamChange}
              icon={Users}
            />
          </div>

          {/* SERVICE, PRICE DEAL, & QTY */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-2">
              <CustomSelect
                label="Service / Package *"
                placeholder="— Select Service —"
                value={form.service_id}
                options={options.services.map((s) => ({ value: s.id, label: s.name }))}
                onChange={handleServiceChange}
                icon={Package}
                error={errors.service_id}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-1.5">
                Deal Price (Rp) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={form.price_deal}
                onChange={(e) => setForm((prev) => ({ ...prev, price_deal: e.target.value }))}
                className={`w-full bg-brand-primary border rounded-xl px-3.5 py-2.5 text-sm text-brand-text shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition-all ${
                  errors.price_deal ? 'border-red-500' : 'border-brand-border'
                }`}
                placeholder="0"
                required
              />
              {errors.price_deal && <p className="text-xs text-red-500 mt-1">{errors.price_deal}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-1.5">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                value={form.quantity}
                onChange={(e) => setForm((prev) => ({ ...prev, quantity: Math.max(1, Number(e.target.value)) }))}
                className="w-full bg-brand-primary border border-brand-border rounded-xl px-3.5 py-2.5 text-sm text-brand-text shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition-all"
              />
            </div>
          </div>

          {/* DISCOUNT & TAX */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-brand-primary/20 p-5 rounded-xl border border-brand-border">
            <CustomSelect
              label="Discount Type"
              placeholder="— Select Type —"
              value={form.discount_type}
              options={[
                { value: 'fixed', label: 'Fixed Amount (Rp)' },
                { value: 'percent', label: 'Percentage (%)' },
              ]}
              onChange={(val) => setForm((prev) => ({ ...prev, discount_type: val }))}
              icon={Percent}
            />
            <div>
              <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-1.5">
                Discount Value
              </label>
              <input
                type="number"
                min="0"
                value={form.discount}
                onChange={(e) => setForm((prev) => ({ ...prev, discount: Math.max(0, Number(e.target.value)) }))}
                className="w-full bg-brand-primary border border-brand-border rounded-xl px-3.5 py-2.5 text-sm text-brand-text shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-1.5">
                Tax / VAT (%)
              </label>
              <input
                type="number"
                min="0"
                value={form.tax_rate}
                onChange={(e) => setForm((prev) => ({ ...prev, tax_rate: Math.max(0, Number(e.target.value)) }))}
                className="w-full bg-brand-primary border border-brand-border rounded-xl px-3.5 py-2.5 text-sm text-brand-text shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition-all"
              />
            </div>
          </div>

          {/* PROJECT TIMELINE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar size={13} /> Project Start Date
              </label>
              <input
                type="date"
                value={form.start_date_project}
                onChange={(e) => setForm((prev) => ({ ...prev, start_date_project: e.target.value }))}
                className="w-full bg-brand-primary border border-brand-border rounded-xl px-3.5 py-2.5 text-sm text-brand-text shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar size={13} /> Project Target Completion
              </label>
              <input
                type="date"
                value={form.end_date_project}
                onChange={(e) => setForm((prev) => ({ ...prev, end_date_project: e.target.value }))}
                className="w-full bg-brand-primary border border-brand-border rounded-xl px-3.5 py-2.5 text-sm text-brand-text shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition-all"
              />
            </div>
          </div>

          {/* TEAM MEMBERS ASSIGNMENT */}
          {form.team_id && Object.keys(form.assignments).length > 0 && (
            <div className="pt-4 border-t border-brand-border">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div>
                  <label className="block text-xs font-semibold text-brand-text-muted uppercase">
                    Atur Posisi & Fase Anggota Tim
                  </label>
                  <p className="text-xs text-brand-text-muted mt-0.5">
                    Pilih anggota tim yang ditugaskan untuk pengerjaan proyek ini.
                  </p>
                </div>
                <div className="text-xs text-brand-text-muted">
                  Ditugaskan: <span className="font-semibold text-brand-accent">
                    {Object.values(form.assignments).filter((a) => a.is_assigned).length}
                  </span> dari {Object.keys(form.assignments).length} anggota
                </div>
              </div>

              <div className="space-y-4">
                {options.teams
                  .find((t) => String(t.id) === String(form.team_id))
                  ?.team_members?.map((tm) => {
                    const assign = form.assignments[tm.id] || {};
                    const userJobs = tm.users?.user_jobs || [];
                    const isAssigned = Boolean(assign.is_assigned);

                    return (
                      <div
                        key={tm.id}
                        className={`border p-4 rounded-xl space-y-3 transition-all ${
                          isAssigned
                            ? 'bg-brand-primary/40 border-brand-border'
                            : 'bg-brand-primary/10 border-dashed border-brand-border/40 opacity-60'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-brand-border/40 pb-2">
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={isAssigned}
                                onChange={(e) => handleAssignmentChange(tm.id, 'is_assigned', e.target.checked)}
                                className="w-4 h-4 rounded border-brand-border text-brand-accent focus:ring-brand-accent cursor-pointer"
                              />
                              <span className={`text-sm font-semibold flex items-center gap-2 ${isAssigned ? 'text-brand-text' : 'text-brand-text-muted'}`}>
                                <User size={16} className={isAssigned ? 'text-brand-accent' : 'text-brand-text-muted'} />
                                {tm.users?.name}
                              </span>
                            </label>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                isAssigned
                                  ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                                  : 'bg-gray-500/15 text-gray-400 border border-gray-500/30'
                              }`}
                            >
                              {isAssigned ? 'Ditugaskan' : 'Tidak Ditugaskan'}
                            </span>
                          </div>

                          {isAssigned && (
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={assign.is_lead || false}
                                onChange={(e) => handleAssignmentChange(tm.id, 'is_lead', e.target.checked)}
                                className="w-4 h-4 rounded border-brand-border text-amber-500 focus:ring-amber-500 cursor-pointer"
                              />
                              <span className="text-xs font-semibold text-brand-text-muted">Lead Tim</span>
                            </label>
                          )}
                        </div>

                        {isAssigned ? (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                            <div>
                              <CustomSelect
                                label="Posisi / Job *"
                                placeholder="— Pilih Job —"
                                value={assign.job_id || ''}
                                options={userJobs.map((uj) => ({ value: uj.job_id, label: uj.jobs?.name }))}
                                onChange={(val) => handleAssignmentChange(tm.id, 'job_id', val)}
                                disabled={userJobs.length === 0}
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-brand-text-muted uppercase mb-1.5">
                                Urutan Pengerjaan
                              </label>
                              <select
                                value={assign.phase_order || 1}
                                onChange={(e) => handleAssignmentChange(tm.id, 'phase_order', Number(e.target.value))}
                                className="w-full bg-brand-primary border border-brand-border rounded-xl px-3 py-2 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
                              >
                                <option value={1}>Fase 1 (Mulai Pertama)</option>
                                <option value={2}>Fase 2 (Setelah Fase 1 Selesai)</option>
                                <option value={3}>Fase 3 (Setelah Fase 2 Selesai)</option>
                                <option value={4}>Fase 4 (Setelah Fase 3 Selesai)</option>
                                <option value={5}>Fase 5 (Setelah Fase 4 Selesai)</option>
                              </select>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs font-semibold text-brand-text-muted uppercase mb-1.5">
                                  Tgl Mulai
                                </label>
                                <input
                                  type="date"
                                  value={assign.start_date || ''}
                                  onChange={(e) => handleAssignmentChange(tm.id, 'start_date', e.target.value)}
                                  className="w-full bg-brand-primary border border-brand-border rounded-xl px-2.5 py-2 text-xs text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-brand-text-muted uppercase mb-1.5">
                                  Deadline
                                </label>
                                <input
                                  type="date"
                                  value={assign.end_date || ''}
                                  onChange={(e) => handleAssignmentChange(tm.id, 'end_date', e.target.value)}
                                  className="w-full bg-brand-primary border border-brand-border rounded-xl px-2.5 py-2 text-xs text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-brand-text-muted italic py-1">
                            Anggota ini tidak diikutsertakan dalam pengerjaan order ini. Centang "Tugaskan" di atas jika ingin menyertakannya.
                          </p>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* NOTES & SUMMARY */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-brand-border">
            <div>
              <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <FileText size={13} /> Additional Notes / Requirements
              </label>
              <textarea
                rows={5}
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Enter client brief, project requirements, delivery instructions..."
                className="w-full bg-brand-primary border border-brand-border rounded-xl px-3.5 py-2.5 text-sm text-brand-text shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition-all resize-none placeholder:text-brand-text-muted/60"
              />
            </div>
            <div className="bg-brand-primary/40 p-6 rounded-xl border border-brand-border space-y-3 flex flex-col justify-center">
              <div className="flex justify-between text-sm text-brand-text-muted">
                <span>Subtotal</span>
                <span>{formatRupiah(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-red-500">
                <span>Discount</span>
                <span>-{formatRupiah(discountAmount)}</span>
              </div>
              <div className="flex justify-between text-sm text-brand-text-muted">
                <span>Tax ({form.tax_rate}%)</span>
                <span>+{formatRupiah(taxAmount)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-brand-accent pt-3 border-t border-brand-border mt-2">
                <span>Grand Total</span>
                <span>{formatRupiah(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex justify-end gap-3 pt-6 border-t border-brand-border">
            <Link
              href="/cs/orders"
              className="bg-brand-muted text-brand-text px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-border transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="bg-brand-accent text-brand-primary px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition disabled:opacity-50 shadow-sm"
            >
              {submitting ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
              {submitting ? 'Submitting...' : 'Save & Generate Invoice'}
            </button>
          </div>
        </form>
      </div>
    </RoleLayout>
  );
}
