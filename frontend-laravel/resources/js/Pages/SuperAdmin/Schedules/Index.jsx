import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head, Link } from '@inertiajs/react';
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon,
  RefreshCw, Clock, AlertCircle
} from 'lucide-react';

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const EVENT_ROW_H = 20;
const EVENT_ROW_GAP = 2;
const HEADER_PAD_TOP = 28;
const CELL_PAD = 4;

// ✅ FUNGSI UNTUK MENDAPATKAN BASE PATH (super-admin, admin, atau sales)
function getBasePath() {
  // Jika URL saat ini '/super-admin/schedules', hasilnya '/super-admin'
  return window.location.pathname.replace(/\/schedules.*$/, '');
}

const getStatusBlockColor = (status) => {
  switch (status) {
    case 'pending':     return 'bg-amber-500 text-white border-amber-600 hover:bg-amber-600';
    case 'in_progress': return 'bg-blue-500 text-white border-blue-600 hover:bg-blue-600';
    case 'completed':   return 'bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600';
    case 'cancelled':   return 'bg-red-500 text-white border-red-600 hover:bg-red-600';
    default:            return 'bg-gray-500 text-white border-gray-600 hover:bg-gray-600';
  }
};

const formatDateShort = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export default function SchedulesCalendar() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  // ✅ AMBIL BASE PATH UNTUK LINK
  const basePath = getBasePath();

  const load = () => {
    setLoading(true);
    setError('');
    fetch('/api/v1/schedules')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setOrders(d.data || []);
        else setError(d.message || 'Gagal ambil data');
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  };

  useEffect(() => { load(); }, []);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  const upcomingDeadlines = orders
    .filter(o => o.end_date_project && o.status !== 'completed' && o.status !== 'cancelled')
    .sort((a, b) => new Date(a.end_date_project) - new Date(b.end_date_project))
    .slice(0, 5);

  const generateCalendarData = () => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();

    const weeks = [];
    let currentWeek = Array(firstDay).fill(null);

    for (let i = 1; i <= daysInMonth; i++) {
      currentWeek.push(i);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null);
      weeks.push(currentWeek);
    }

    return weeks.map(week => {
      const validDates = week.filter(d => d !== null);
      if (validDates.length === 0) return { week, events: [], trackCount: 0 };

      const weekStartDate = new Date(currentYear, currentMonth, validDates[0]);
      weekStartDate.setHours(0,0,0,0);

      const weekEndDate = new Date(currentYear, currentMonth, validDates[validDates.length - 1]);
      weekEndDate.setHours(23,59,59,999);

      const weekEvents = orders.filter(order => {
        if (!order.start_date_project) return false;
        const start = new Date(order.start_date_project);
        const end = order.end_date_project ? new Date(order.end_date_project) : new Date(start);
        return start <= weekEndDate && end >= weekStartDate;
      }).map(order => {
        const orderStart = new Date(order.start_date_project);
        const orderEnd = order.end_date_project ? new Date(order.end_date_project) : new Date(orderStart);

        let startCol = 0;
        if (orderStart > weekStartDate) {
          for (let i = 0; i < 7; i++) {
            if (week[i] !== null) {
              const d = new Date(currentYear, currentMonth, week[i]);
              if (d >= new Date(orderStart.getFullYear(), orderStart.getMonth(), orderStart.getDate())) {
                startCol = i;
                break;
              }
            }
          }
        }

        let endCol = 6;
        if (orderEnd < weekEndDate) {
          for (let i = 6; i >= 0; i--) {
            if (week[i] !== null) {
              const d = new Date(currentYear, currentMonth, week[i]);
              if (d <= new Date(orderEnd.getFullYear(), orderEnd.getMonth(), orderEnd.getDate())) {
                endCol = i;
                break;
              }
            }
          }
        }

        return { ...order, startCol, endCol };
      });

      weekEvents.sort((a, b) => a.startCol - b.startCol || (b.endCol - b.startCol) - (a.endCol - a.startCol));
      const tracks = [];
      weekEvents.forEach(event => {
        let placed = false;
        for (let i = 0; i < tracks.length; i++) {
          const hasOverlap = tracks[i].some(e => !(event.endCol < e.startCol || event.startCol > e.endCol));
          if (!hasOverlap) {
            tracks[i].push(event);
            event.track = i;
            placed = true;
            break;
          }
        }
        if (!placed) {
          event.track = tracks.length;
          tracks.push([event]);
        }
      });

      return { week, events: weekEvents, trackCount: tracks.length };
    });
  };

  const calendarData = generateCalendarData();

  const getWeekMinHeight = (trackCount) => {
    const rows = Math.max(trackCount, 1);
    const eventsHeight = rows * EVENT_ROW_H + Math.max(rows - 1, 0) * EVENT_ROW_GAP;
    return Math.max(90, HEADER_PAD_TOP + CELL_PAD + eventsHeight + 2);
  };

  if (loading && orders.length === 0) {
    return (
      <RoleLayout>
        <Head title="Schedules" />
        <div className="p-12 text-center text-brand-text-muted">
          <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-brand-accent" />
          Memuat kalender...
        </div>
      </RoleLayout>
    );
  }

  return (
    <RoleLayout>
      <Head title="Schedules" />

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Jadwal Proyek</h1>
          <p className="text-sm text-brand-text-muted mt-1">Pantau rentang waktu pengerjaan order</p>
        </div>
        <button onClick={load} className="bg-brand-secondary border border-brand-border text-brand-text px-3 py-2 rounded-lg hover:bg-brand-muted flex items-center gap-2 text-sm transition shadow-sm w-fit">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3">
          <div className="bg-brand-secondary border border-brand-border rounded-xl shadow-sm w-full">
            <div className="p-4 border-b border-brand-border flex items-center justify-between bg-brand-muted/10">
              <h2 className="text-lg font-bold text-brand-text flex items-center gap-2">
                <CalendarIcon size={20} className="text-brand-accent" />
                {MONTHS[currentMonth]} {currentYear}
              </h2>
              <div className="flex gap-2 bg-brand-primary border border-brand-border rounded-lg p-1 shadow-sm">
                <button onClick={prevMonth} className="p-1.5 rounded-md hover:bg-brand-muted transition text-brand-text">
                  <ChevronLeft size={18} />
                </button>
                <button onClick={goToToday} className="px-3 py-1 text-xs font-semibold text-brand-text hover:bg-brand-muted rounded-md transition">
                  Hari Ini
                </button>
                <button onClick={nextMonth} className="p-1.5 rounded-md hover:bg-brand-muted transition text-brand-text">
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            <div className="w-full">
              <div className="grid grid-cols-7 bg-brand-secondary border-b border-brand-border">
                {DAYS.map((day) => (
                  <div key={day} className="py-2 text-center text-[11px] font-bold text-brand-text-muted uppercase tracking-widest border-r border-brand-border/30 last:border-0">
                    {day}
                  </div>
                ))}
              </div>

              <div className="bg-brand-secondary">
                {calendarData.map((weekData, wIdx) => {
                  const rows = Math.max(weekData.trackCount, 1);
                  const weekMinHeight = getWeekMinHeight(weekData.trackCount);

                  return (
                    <div
                      key={wIdx}
                      className="grid grid-cols-7 relative border-b border-brand-border/30 last:border-0"
                      style={{ minHeight: `${weekMinHeight}px` }}
                    >
                      {weekData.week.map((day, dIdx) => {
                        const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
                        const isWeekend = dIdx === 0 || dIdx === 6;
                        return (
                          <div
                            key={dIdx}
                            className={`min-h-[90px] border-r border-brand-border/30 p-1 pb-4 ${
                              day === null ? 'bg-brand-muted/5' : (isWeekend ? 'bg-brand-muted/10' : 'bg-brand-secondary')
                            } ${isToday ? 'bg-brand-accent/5' : ''}`}
                          >
                            {day && (
                              <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-bold ${
                                isToday ? 'bg-brand-accent text-brand-primary' : 'text-brand-text-muted'
                              }`}>
                                {day}
                              </span>
                            )}
                          </div>
                        );
                      })}

                      <div
                        className="absolute inset-0 grid grid-cols-7 pointer-events-none p-1 pt-7 gap-y-0.5"
                        style={{ gridTemplateRows: `repeat(${rows}, ${EVENT_ROW_H}px)` }}
                      >
                        {weekData.events.map(event => {
                          const colorClass = getStatusBlockColor(event.status);
                          return (
                            <div
                              key={event.id}
                              style={{
                                gridColumn: `${event.startCol + 1} / ${event.endCol + 2}`,
                                gridRow: `${event.track + 1}`,
                              }}
                              className="pointer-events-auto px-0.5"
                            >
                              {/* ✅ LINK DINAMIS MENGGUNAKAN basePath */}
                              <Link
                                href={`${basePath}/orders/${event.id}`}
                                className={`block w-full h-full px-1.5 text-[10px] leading-[18px] font-medium rounded shadow-sm truncate ${colorClass}`}
                                title={`${event.order_number} - ${event.customer_name_snapshot}`}
                              >
                                {event.order_number}
                              </Link>
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-1 space-y-4">
          <div className="bg-brand-secondary border border-brand-border rounded-xl shadow-sm overflow-hidden flex flex-col h-full max-h-[600px]">
            <div className="p-4 border-b border-brand-border bg-brand-muted/10 flex items-center gap-2">
              <Clock size={18} className="text-brand-accent" />
              <h2 className="text-sm font-bold text-brand-text uppercase tracking-widest">Deadline Terdekat</h2>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-3">
              {upcomingDeadlines.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle size={32} className="mx-auto mb-2 text-brand-text-muted/40" />
                  <p className="text-sm text-brand-text-muted">Tidak ada deadline aktif.</p>
                </div>
              ) : (
                upcomingDeadlines.map(order => {
                  const daysLeft = Math.ceil((new Date(order.end_date_project) - today) / (1000 * 60 * 60 * 24));
                  const isOverdue = daysLeft < 0;

                  return (
                    /* ✅ LINK DINAMIS MENGGUNAKAN basePath */
                    <Link
                      key={order.id}
                      href={`${basePath}/orders/${order.id}`}
                      className="block bg-brand-primary/40 border border-brand-border rounded-lg p-3 hover:border-brand-accent/50 transition group"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div className="font-mono text-xs font-bold text-brand-text group-hover:text-brand-accent transition">{order.order_number}</div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isOverdue ? 'bg-red-500/20 text-red-600' :
                          daysLeft <= 3 ? 'bg-amber-500/20 text-amber-600' :
                          'bg-emerald-500/20 text-emerald-600'
                        }`}>
                          {isOverdue ? 'Lewat' : `${daysLeft} Hari`}
                        </span>
                      </div>
                      <div className="text-xs text-brand-text-muted truncate mb-2">{order.customer_name_snapshot}</div>
                      <div className="text-[11px] text-brand-text-muted flex items-center gap-1">
                        <Clock size={10} /> Selesai: {formatDateShort(order.end_date_project)}
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>
    </RoleLayout>
  );
}