const API_BASE = '/api/v1';

export const STATUS_OPTIONS = [
  { value: '', label: 'Semua status' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'Diproses' },
  { value: 'completed', label: 'Selesai' },
  { value: 'cancelled', label: 'Dibatalkan' },
];

export const PAYMENT_OPTIONS = [
  { value: '', label: 'Semua pembayaran' },
  { value: 'unpaid', label: 'Belum lunas' },
  { value: 'partial', label: 'Dibayar sebagian' },
  { value: 'paid', label: 'Lunas' },
];

export class ApiError extends Error {
  constructor(message, details = {}, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.details = details;
    this.status = status;
  }
}

async function request(path, { signal, ...options } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      signal,
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers,
      },
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError('Tidak dapat terhubung ke server. Periksa koneksi backend lalu coba lagi.');
  }

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : null;
  if (!response.ok || payload?.success === false) {
    const errors = payload?.errors || {};
    const details = Object.fromEntries(
      Object.entries(errors).map(([key, messages]) => [key, Array.isArray(messages) ? messages[0] : messages]),
    );
    throw new ApiError(
      payload?.message || `Permintaan gagal (HTTP ${response.status}).`,
      details,
      response.status,
    );
  }
  if (payload === null) throw new ApiError('Server mengirim respons yang tidak dapat dibaca.');
  return payload.data;
}

const money = (value) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`;

function dayLabel(date) {
  return new Intl.DateTimeFormat('id-ID', { weekday: 'short' }).format(new Date(`${date}T00:00:00`));
}

function dateLabel(date) {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    .format(new Date(`${date}T00:00:00`));
}

function dueLabel(date) {
  if (!date) return 'Belum ditentukan';
  const due = new Date(`${String(date).slice(0, 10)}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((due - today) / 86400000);
  if (days < 0) return `Terlambat ${Math.abs(days)} hari`;
  if (days === 0) return 'Hari ini';
  if (days === 1) return 'Besok';
  return dateLabel(String(date).slice(0, 10));
}

function isPastDue(date) {
  if (!date) return false;
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return String(date).slice(0, 10) < todayKey;
}

function mapSummary(data) {
  return {
    stats: {
      orderPending: data.stats?.pending_orders ?? 0,
      jadwalHariIni: data.stats?.today_schedules ?? 0,
      orderDeadline: data.stats?.today_deadlines ?? 0,
      paymentPending: data.stats?.pending_payments ?? 0,
    },
    chart: (data.weekly_orders || []).map(({ date, count }) => ({ label: dayLabel(date), value: count })),
    schedules: (data.schedules || []).map((schedule) => ({
      id: schedule.id,
      time: schedule.start_datetime
        ? new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
          .format(new Date(schedule.start_datetime))
        : 'Waktu belum ditentukan',
      status: schedule.status === 'in_progress' ? 'Proses' : 'Terjadwal',
      title: schedule.title,
      client: schedule.customer_name,
      team: schedule.team_name,
    })),
    invoices: (data.invoices || []).map((invoice) => ({
      id: invoice.id,
      no: invoice.invoice_number,
      client: invoice.customer_name,
      amount: money(invoice.amount_due),
      due: dueLabel(invoice.due_date),
      status: invoice.status === 'overdue' || isPastDue(invoice.due_date) ? 'Overdue' : 'Pending',
    })),
  };
}

const orderStatusLabel = {
  draft: 'Draft',
  pending: 'Pending',
  in_progress: 'Diproses',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

function mapOrder(order) {
  return {
    id: order.id,
    no: order.order_number,
    client: order.customer_name,
    service: order.service_name,
    value: money(order.grand_total),
    status: orderStatusLabel[order.status] || order.status,
    hasTeam: Boolean(order.team_id),
  };
}

const normalizedName = (value) => String(value || '').trim().toLocaleLowerCase('id-ID');

export const api = {
  async getSummary(signal) {
    return mapSummary(await request('/dashboard/admin', { signal }));
  },

  async getOrders(filters, signal) {
    const query = new URLSearchParams({
      search: filters.search || '',
      status: filters.status || '',
      payment: filters.payment || '',
      date: filters.date || '',
      page: String(filters.page || 1),
      limit: String(filters.limit || 10),
    });
    const result = await request(`/orders?${query}`, { signal });
    return {
      items: (result.items || []).map(mapOrder),
      total: result.total || 0,
      pages: result.pages || 1,
    };
  },

  async getCustomers(search, signal) {
    const query = new URLSearchParams({ search });
    const data = await request(`/customers?${query}`, { signal });
    return data.map((customer) => customer.name);
  },

  async getOrderOptions(signal) {
    const [customers, services, teams] = await Promise.all([
      request('/orders/options/customers', { signal }),
      request('/orders/options/services', { signal }),
      request('/orders/options/teams', { signal }),
    ]);
    return { customers, services, teams };
  },

  async createOrder(form, options) {
    const customer = options.customers.find((item) => normalizedName(item.name) === normalizedName(form.customer));
    const service = options.services.find((item) => normalizedName(item.name) === normalizedName(form.service));
    const team = form.team
      ? options.teams.find((item) => normalizedName(item.name) === normalizedName(form.team))
      : null;
    const details = {};
    if (!customer) details.customer = 'Pilih customer terdaftar dari daftar saran.';
    if (!service) details.service = 'Pilih layanan aktif dari daftar saran.';
    if (form.team && !team) details.team = 'Pilih tim aktif dari daftar saran.';
    if (Object.keys(details).length) {
      throw new ApiError('Data project harus dipilih dari data yang tersedia.', details, 422);
    }

    const scheduledAt = form.date
      ? `${form.date}T${form.time || '00:00'}:00`
      : null;
    return request('/orders', {
      method: 'POST',
      body: JSON.stringify({
        customer_id: customer.id,
        service_id: service.id,
        team_id: team?.id || null,
        price_deal: form.value === '' ? null : Number(form.value),
        quantity: 1,
        start_date_project: scheduledAt,
        notes: form.notes || null,
      }),
    });
  },

  async remindInvoice(invoiceId) {
    return request(`/invoices/${encodeURIComponent(invoiceId)}/send-email`, {
      method: 'POST',
      body: JSON.stringify({ send_to_customer: true, send_to_pic: false }),
    });
  },

  async remindAll(invoices) {
    const results = await Promise.allSettled(invoices.map((invoice) => this.remindInvoice(invoice.id)));
    const failed = results.filter((result) => result.status === 'rejected').length;
    if (failed) {
      throw new ApiError(`${results.length - failed} pengingat terkirim, ${failed} gagal.`);
    }
    return results.length;
  },
};
