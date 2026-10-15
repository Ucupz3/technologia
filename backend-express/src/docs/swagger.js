export const openapiSpecification = {
  openapi: '3.0.0',
  info: {
    title: 'Tekna ERP API Documentation',
    version: '1.5.0',
    description: 'REST API untuk Sistem ERP Manajemen Proyek Jasa IT Tekna (PRD v1.5). Mencakup modul multi-service order dengan deal price, penugasan tim per order, pelacakan progres dengan auto-sync, completion guard, serta order maintenance.',
    contact: {
      name: 'Tekna ERP Engineering Team',
    },
  },
  servers: [
    {
      url: 'http://localhost:4000',
      description: 'Local Development Server',
    },
  ],
  security: [
    {
      InternalTokenAuth: [],
    },
  ],
  components: {
    securitySchemes: {
      InternalTokenAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-Internal-Token',
        description: 'Token autentikasi internal antar-layanan Express dan proxy Laravel.',
      },
      UserHeaderAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-User-Id',
        description: 'ID pengguna aktif untuk otorisasi aksi approval / identifikasi staf pelaksana.',
      },
    },
  },
  paths: {
    '/health': {
      get: {
        summary: 'Health Check',
        tags: ['System'],
        security: [],
        responses: {
          200: {
            description: 'Layanan API berjalan normal',
          },
        },
      },
    },

    // ================= AUTH =================
    '/api/v1/auth/login': {
      post: {
        summary: 'Login User dengan Email & Password',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'superadmin@tekna.id' },
                  password: { type: 'string', example: 'password123' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Login berhasil (bila OTP aktif, OTP dikirim via email)' },
          401: { description: 'Kredensial tidak valid' },
        },
      },
    },
    '/api/v1/auth/send-otp': {
      post: {
        summary: 'Kirim Ulang Kode OTP ke Email',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', format: 'email' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Kode OTP 6 digit berhasil dikirim' },
        },
      },
    },
    '/api/v1/auth/verify-otp': {
      post: {
        summary: 'Verifikasi Kode OTP 6 Digit',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'otp'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  otp: { type: 'string', example: '123456' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'OTP valid, mengembalikan data session user' },
          400: { description: 'OTP salah atau sudah kedaluwarsa' },
        },
      },
    },
    '/api/v1/auth/me': {
      get: {
        summary: 'Ambil Profil Pengguna Aktif',
        tags: ['Authentication'],
        parameters: [
          { name: 'X-User-Id', in: 'header', required: false, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Data user login' },
        },
      },
    },

    // ================= ORDERS =================
    '/api/v1/orders': {
      get: {
        summary: 'Daftar Semua Order',
        tags: ['Orders'],
        parameters: [
          { name: 'search', in: 'query', required: false, schema: { type: 'string' }, description: 'Cari order_number atau nama customer' },
        ],
        responses: {
          200: { description: 'Daftar order beserta order_services dan parent_order' },
        },
      },
      post: {
        summary: 'Buat Order Baru (Multi-Service / Single Service)',
        tags: ['Orders'],
        description: 'Mendukung multi-service dengan deal_price custom per layanan yang disimpan ke tabel order_services, atau fallback single service_id.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['customer_id'],
                properties: {
                  customer_id: { type: 'integer', example: 1 },
                  pic_id: { type: 'integer', nullable: true, example: 2, description: 'ID PIC Customer dari tabel customer_pics' },
                  sales_id: { type: 'integer', nullable: true, example: 3, description: 'ID Sales / CS penanggung jawab' },
                  team_id: { type: 'integer', nullable: true, example: 1, description: 'ID Tim pelaksana' },
                  services: {
                    type: 'array',
                    description: 'Rincian multi-service pesanan',
                    items: {
                      type: 'object',
                      properties: {
                        service_id: { type: 'integer', nullable: true, example: 1 },
                        service_name: { type: 'string', example: 'Pembuatan Website Company Profile' },
                        price_deal: { type: 'number', example: 4500000, description: 'Harga deal kesepakatan' },
                        deal_price: { type: 'number', example: 4500000, description: 'Alias harga deal' },
                        quantity: { type: 'integer', default: 1, example: 1 },
                        is_custom: { type: 'boolean', default: false },
                        notes: { type: 'string', example: 'Diskon paket klien lama' },
                      },
                    },
                  },
                  discount_type: { type: 'string', enum: ['fixed', 'percent'], default: 'fixed' },
                  discount: { type: 'number', default: 0, example: 500000 },
                  tax_rate: { type: 'number', default: 0, example: 11 },
                  tax: { type: 'number', default: 0, example: 100000 },
                  start_date_project: { type: 'string', format: 'date', example: '2026-11-01' },
                  end_date_project: { type: 'string', format: 'date', example: '2026-12-01' },
                  notes: { type: 'string', example: 'Pengembangan Web ERP' },
                  parent_order_id: { type: 'integer', nullable: true, example: null, description: 'ID order induk untuk order perpanjangan / maintenance' },
                  order_parent_id: { type: 'integer', nullable: true, example: null, description: 'Alias parent_order_id' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Order berhasil dibuat dalam status pending' },
          422: { description: 'Validasi input gagal' },
        },
      },
    },
    '/api/v1/orders/{id}': {
      get: {
        summary: 'Detail Order Lengkap',
        tags: ['Orders'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Detail lengkap order termasuk order_services, assignments, dan riwayat invoice' },
          404: { description: 'Order tidak ditemukan' },
        },
      },
      put: {
        summary: 'Update Rincian Order (Hanya Draft / Pending)',
        tags: ['Orders'],
        description: 'Immutability Guard: Order yang sudah di-approve (in_progress), completed, atau cancelled dikunci dan akan ditolak (400 Bad Request).',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  customer_id: { type: 'integer' },
                  quantity: { type: 'integer' },
                  discount: { type: 'number' },
                  tax: { type: 'number' },
                  notes: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Order berhasil diupdate' },
          400: { description: 'Order yang sudah disetujui/berjalan tidak dapat diubah rinciannya' },
          404: { description: 'Order tidak ditemukan' },
        },
      },
      delete: {
        summary: 'Hapus Order (Soft Delete)',
        tags: ['Orders'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Order berhasil dihapus' },
          400: { description: 'Order masih memiliki data pembayaran terkait' },
        },
      },
    },
    '/api/v1/orders/{id}/approve': {
      post: {
        summary: 'Approve Order & Otomatisasi Penerbitan Invoice',
        tags: ['Orders'],
        description: 'Mengubah status order menjadi in_progress, mencatat approved_by dan approved_at, serta otomatis menerbitkan invoice (INV-YYYYMMDD-XXX) di tabel payments.',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  approved_by: { type: 'integer', example: 1, description: 'ID User Super Admin / Admin pembuat approval' },
                  due_date: { type: 'string', format: 'date', example: '2026-11-15' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Order berhasil di-approve dan invoice otomatis diterbitkan' },
          400: { description: 'Status order tidak dalam pending/draft' },
          403: { description: 'User pemanggil bukan Admin / Super Admin' },
        },
      },
    },
    '/api/v1/orders/{id}/complete': {
      patch: {
        summary: 'Selesaikan Order (Strict Completion Guard)',
        tags: ['Orders'],
        description: 'Menyelesaikan order menjadi status completed. Dilindungi guard ketat: order wajib memiliki minimal 1 penugasan tim pelaksana dan seluruh penugasan harus sudah completed (atau cancelled).',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Order berhasil diselesaikan' },
          409: { description: 'Konflik: Belum ada penugasan tim atau masih ada staf/modul yang belum selesai' },
        },
      },
    },
    '/api/v1/orders/{id}/status': {
      patch: {
        summary: 'Ubah Status Order Manual',
        tags: ['Orders'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: {
                    type: 'string',
                    enum: ['draft', 'pending', 'in_progress', 'completed', 'cancelled'],
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Status order berhasil diubah' },
          409: { description: 'Ditolak jika beralih ke completed tanpa menyelesaikan penugasan tim' },
        },
      },
    },
    '/api/v1/orders/{id}/maintenance': {
      post: {
        summary: 'Buat Order Maintenance Terhubung ke Order Induk',
        tags: ['Orders'],
        description: 'Membuat order baru dengan order_parent_id merujuk ke order induk. Order induk wajib sudah berstatus completed.',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  services: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        service_id: { type: 'integer' },
                        deal_price: { type: 'number' },
                        quantity: { type: 'integer' },
                        notes: { type: 'string' },
                      },
                    },
                  },
                  notes: { type: 'string', example: 'Maintenance bugfix & server monitoring periode Q1' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Order maintenance berhasil dibuat' },
          400: { description: 'Order induk belum berstatus completed' },
        },
      },
    },

    // ================= ASSIGNMENTS =================
    '/api/v1/orders/{orderId}/assignments': {
      get: {
        summary: 'Daftar Penugasan Tim pada Order',
        tags: ['Assignments'],
        parameters: [
          { name: 'orderId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Daftar anggota tim yang ditugaskan di order' },
        },
      },
      post: {
        summary: 'Tugaskan Anggota Tim ke Order (Project-Based)',
        tags: ['Assignments'],
        description: 'Menugaskan user (misal UI/UX Designer, Backend Dev) pada order berstatus in_progress.',
        parameters: [
          { name: 'orderId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  team_member_id: { type: 'integer', example: 1, description: 'ID anggota tim dari tabel team_members' },
                  job_id: { type: 'integer', example: 3, description: 'ID Job / Peran teknis dari tabel jobs' },
                  is_lead: { type: 'boolean', default: false, example: true, description: 'Apakah bertindak sebagai penanggung jawab tim (Lead)' },
                  user_id: { type: 'integer', example: 2, description: 'ID Pengguna (akan dipetakan ke team member)' },
                  role_in_order: { type: 'string', example: 'UI/UX Designer', description: 'Nama peran penugasan' },
                  module_name: { type: 'string', example: 'Halaman Dashboard & Checkout' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Penugasan tim berhasil dibuat' },
          400: { description: 'Order belum disetujui (in_progress)' },
        },
      },
    },
    '/api/v1/assignments/{id}': {
      get: {
        summary: 'Detail Penugasan Tim',
        tags: ['Assignments'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Detail penugasan dan riwayat progres' },
          404: { description: 'Penugasan tidak ditemukan' },
        },
      },
      delete: {
        summary: 'Hapus Penugasan Tim',
        tags: ['Assignments'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Penugasan berhasil dihapus' },
          400: { description: 'Penugasan sudah memiliki catatan progres pengerjaan' },
        },
      },
    },
    '/api/v1/assignments/{id}/status': {
      patch: {
        summary: 'Ubah Status Penugasan Tim Manual',
        tags: ['Assignments'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: {
                    type: 'string',
                    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Status penugasan berhasil diubah' },
          400: { description: 'Penugasan yang sudah completed tidak dapat dibatalkan kembali ke status sebelumnya' },
        },
      },
    },

    // ================= PROGRESS =================
    '/api/v1/orders/{orderId}/progress': {
      get: {
        summary: 'Riwayat Pelaporan Progres Pengerjaan Order',
        tags: ['Progress'],
        parameters: [
          { name: 'orderId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Daftar riwayat progres pengerjaan order' },
        },
      },
      post: {
        summary: 'Lapor / Tambah Progres Pengerjaan (Auto-Sync Assignment)',
        tags: ['Progress'],
        description: 'Developer melaporkan progres pengerjaan (0-100%). Jika assignment_id disertakan: progres > 0 meng-update assignment ke in_progress, dan progres = 100 meng-update assignment ke completed secara otomatis.',
        parameters: [
          { name: 'orderId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'progress_percentage'],
                properties: {
                  title: { type: 'string', example: 'Selesai slicing UI mockup Figma ke Tailwind' },
                  description: { type: 'string', example: 'Seluruh komponen halaman sudah responsif' },
                  progress_percentage: { type: 'integer', minimum: 0, maximum: 100, example: 100 },
                  assignment_id: { type: 'integer', example: 1 },
                  user_id: { type: 'integer', example: 3 },
                  notes: { type: 'string', example: 'Menunggu review dari PM' },
                  attachment_file: { type: 'string', nullable: true },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Progres berhasil dicatat dan status penugasan tim otomatis tersinkronisasi' },
        },
      },
    },
    '/api/v1/progress/{id}': {
      get: {
        summary: 'Detail Catatan Progres',
        tags: ['Progress'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Detail riwayat progres' },
        },
      },
      delete: {
        summary: 'Hapus Catatan Progres (Soft Delete)',
        tags: ['Progress'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Catatan progres berhasil dihapus' },
        },
      },
    },

    // ================= INVOICES =================
    '/api/v1/invoices': {
      get: {
        summary: 'Daftar Tagihan & Invoice',
        tags: ['Invoices'],
        parameters: [
          { name: 'search', in: 'query', required: false, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Daftar invoice tagihan' },
        },
      },
      post: {
        summary: 'Terbitkan Invoice Manual untuk Order',
        tags: ['Invoices'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['order_id'],
                properties: {
                  order_id: { type: 'integer', example: 1 },
                  due_date: { type: 'string', format: 'date', example: '2026-11-20' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Invoice berhasil diterbitkan' },
          409: { description: 'Order ini sudah memiliki invoice' },
        },
      },
    },
    '/api/v1/invoices/{id}': {
      get: {
        summary: 'Detail Invoice',
        tags: ['Invoices'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Detail invoice dan status pelunasan' },
        },
      },
    },
    '/api/v1/invoices/{id}/pay': {
      patch: {
        summary: 'Catat Pembayaran Invoice',
        tags: ['Invoices'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['amount'],
                properties: {
                  amount: { type: 'number', example: 5000000 },
                  paid_at: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Pembayaran invoice berhasil dicatat' },
        },
      },
    },

    // ================= PAYMENTS (ALIAS / BACKWARD COMPATIBILITY) =================
    '/api/v1/payments': {
      get: {
        summary: 'Daftar Tagihan & Invoice (Alias /api/v1/invoices)',
        tags: ['Invoices'],
        parameters: [
          { name: 'search', in: 'query', required: false, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Daftar invoice pembayaran' },
        },
      },
      post: {
        summary: 'Terbitkan Invoice Manual untuk Order (Alias)',
        tags: ['Invoices'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['order_id'],
                properties: {
                  order_id: { type: 'integer', example: 1 },
                  due_date: { type: 'string', format: 'date', example: '2026-11-20' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Invoice berhasil diterbitkan' },
          409: { description: 'Order ini sudah memiliki invoice' },
        },
      },
    },
    '/api/v1/payments/{id}': {
      get: {
        summary: 'Detail Invoice Pembayaran (Alias)',
        tags: ['Invoices'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Detail invoice dan status pelunasan' },
        },
      },
    },
    '/api/v1/payments/{id}/pay': {
      patch: {
        summary: 'Catat Pembayaran Invoice (Alias)',
        tags: ['Invoices'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['amount'],
                properties: {
                  amount: { type: 'number', example: 5000000 },
                  paid_at: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Pembayaran berhasil dicatat, status order dan payment terupdate' },
        },
      },
    },

    // ================= SERVICES =================
    '/api/v1/services': {
      get: {
        summary: 'Daftar Katalog Layanan Jasa IT',
        tags: ['Services'],
        responses: {
          200: { description: 'Daftar layanan jasa aktif' },
        },
      },
    },

    // ================= CUSTOMERS =================
    '/api/v1/customers': {
      get: {
        summary: 'Daftar Klien / Customer',
        tags: ['Customers'],
        responses: {
          200: { description: 'Daftar customer aktif' },
        },
      },
    },

    // ================= DASHBOARD =================
    '/api/v1/dashboard': {
      get: {
        summary: 'Ringkasan Metrik Dashboard ERP',
        tags: ['Dashboard'],
        responses: {
          200: { description: 'Metrik total order, invoice, revenue, dan status proyek aktif' },
        },
      },
    },
  },
};
