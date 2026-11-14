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
          200: { description: 'Daftar layanan jasa aktif beserta kategori' },
        },
      },
      post: {
        summary: 'Tambah Layanan Jasa Baru',
        tags: ['Services'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['category_id', 'name'],
                properties: {
                  category_id: { type: 'integer', example: 1 },
                  name: { type: 'string', example: 'Maintenance Jaringan Fiber Optic' },
                  description: { type: 'string', example: 'Pemeliharaan dan audit berkala jaringan fiber optic' },
                  default_price: { type: 'number', example: 2500000 },
                  duration: { type: 'integer', example: 7, description: 'Estimasi durasi pengerjaan dalam hari' },
                  status: { type: 'string', enum: ['active', 'inactive'], default: 'active' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Layanan jasa berhasil dibuat' },
          404: { description: 'Kategori layanan tidak ditemukan' },
          422: { description: 'Validasi form gagal' },
        },
      },
    },
    '/api/v1/services/categories/options': {
      get: {
        summary: 'Daftar Pilihan Kategori Layanan untuk Dropdown',
        tags: ['Services'],
        responses: {
          200: { description: 'Daftar opsi kategori layanan aktif' },
        },
      },
    },
    '/api/v1/services/{id}': {
      get: {
        summary: 'Detail Layanan Jasa IT',
        tags: ['Services'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Detail lengkap data layanan jasa' },
          404: { description: 'Service tidak ditemukan' },
        },
      },
      put: {
        summary: 'Perbarui Data Layanan Jasa IT',
        tags: ['Services'],
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
                  category_id: { type: 'integer' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  default_price: { type: 'number' },
                  duration: { type: 'integer' },
                  status: { type: 'string', enum: ['active', 'inactive'] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Service berhasil diupdate' },
          404: { description: 'Service atau kategori tidak ditemukan' },
          422: { description: 'Validasi update gagal' },
        },
      },
      delete: {
        summary: 'Hapus Layanan Jasa (Soft Delete)',
        tags: ['Services'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Service berhasil dihapus' },
          404: { description: 'Service tidak ditemukan' },
        },
      },
    },

    // ================= CUSTOMERS =================
    '/api/v1/customers': {
      get: {
        summary: 'Daftar Klien / Customer',
        tags: ['Customers'],
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Cari berdasarkan nama, email, atau telepon' },
          { name: 'sales_id', in: 'query', schema: { type: 'integer' }, description: 'Filter berdasarkan penanggung jawab sales' },
        ],
        responses: {
          200: { description: 'Daftar customer aktif beserta info kontak dan sales terkait' },
        },
      },
      post: {
        summary: 'Tambah Klien / Customer Baru',
        tags: ['Customers'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email'],
                properties: {
                  name: { type: 'string', example: 'PT Teknologi Bangsa' },
                  email: { type: 'string', format: 'email', example: 'contact@teknobangsa.com' },
                  phone: { type: 'string', example: '081234567890' },
                  address: { type: 'string', example: 'Gedung Cyber 2 Lt. 10, Jakarta' },
                  notes: { type: 'string' },
                  sales_id: { type: 'integer', example: 4 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Customer baru berhasil ditambahkan' },
          409: { description: 'Email customer sudah terdaftar' },
          422: { description: 'Validasi form gagal' },
        },
      },
    },
    '/api/v1/customers/sales/options': {
      get: {
        summary: 'Daftar Opsi Staf Sales / Marketing untuk Dropdown',
        tags: ['Customers'],
        responses: {
          200: { description: 'Daftar staf tim sales yang aktif' },
        },
      },
    },
    '/api/v1/customers/{id}': {
      get: {
        summary: 'Detail Customer, Daftar PIC, dan Riwayat Order',
        tags: ['Customers'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Detail data customer, kontak person (PIC), dan riwayat pesanan' },
          404: { description: 'Customer tidak ditemukan' },
        },
      },
      put: {
        summary: 'Perbarui Data Customer',
        tags: ['Customers'],
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
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  phone: { type: 'string' },
                  address: { type: 'string' },
                  notes: { type: 'string' },
                  sales_id: { type: 'integer' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Data customer berhasil diperbarui' },
          404: { description: 'Customer tidak ditemukan' },
          409: { description: 'Email sudah digunakan customer lain' },
          422: { description: 'Validasi update gagal' },
        },
      },
      delete: {
        summary: 'Hapus Customer (Soft Delete)',
        tags: ['Customers'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Customer berhasil dihapus' },
          404: { description: 'Customer tidak ditemukan' },
        },
      },
    },
    '/api/v1/customers/{id}/pics': {
      post: {
        summary: 'Tambah Kontak Person (PIC) Baru untuk Customer',
        tags: ['Customers'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'ID Customer' },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', example: 'Budi Santoso' },
                  position: { type: 'string', example: 'IT Manager' },
                  email: { type: 'string', format: 'email', example: 'budi@teknobangsa.com' },
                  phone: { type: 'string', example: '081234567891' },
                  is_primary: { type: 'boolean', default: false },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'PIC customer berhasil ditambahkan' },
          404: { description: 'Customer tidak ditemukan' },
          422: { description: 'Validasi gagal' },
        },
      },
    },

    // ================= DASHBOARD =================
    '/api/v1/dashboard': {
      get: {
        summary: 'Ringkasan Metrik Dashboard ERP Umum',
        tags: ['Dashboard'],
        responses: {
          200: { description: 'Metrik total order, invoice, revenue, dan status proyek aktif' },
        },
      },
    },
    '/api/v1/dashboard/super-admin': {
      get: {
        summary: 'Metrik Eksekutif Dashboard Super Admin',
        tags: ['Dashboard'],
        responses: {
          200: { description: 'Statistik pengguna, order, revenue 30 hari, outstanding, top 5 services, log aktivitas, dan pesanan terbaru' },
        },
      },
    },
    '/api/v1/dashboard/admin': {
      get: {
        summary: 'Metrik Operasional Dashboard Admin',
        tags: ['Dashboard'],
        responses: {
          200: { description: 'Statistik customer, order, revenue 30 hari, outstanding, status proyek, dan top 5 services' },
        },
      },
    },

    // ================= SCHEDULES =================
    '/api/v1/schedules': {
      get: {
        summary: 'Daftar Kalender Jadwal Proyek & Alokasi Tim',
        tags: ['Schedules'],
        parameters: [
          { name: 'user_id', in: 'query', schema: { type: 'integer' }, description: 'Filter jadwal berdasarkan user ID' },
          { name: 'scope', in: 'query', schema: { type: 'string', enum: ['mine', 'all'] }, description: 'Cakupan penugasan' },
          { name: 'status', in: 'query', schema: { type: 'string' }, description: 'Filter status order' },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Cari nomor order atau customer' },
          { name: 'month', in: 'query', schema: { type: 'integer' }, description: 'Index bulan (0-11)' },
          { name: 'year', in: 'query', schema: { type: 'integer' }, description: 'Tahun kalender' },
        ],
        responses: {
          200: { description: 'Daftar jadwal proyek, tim, dan deteksi konflik jadwal' },
        },
      },
      post: {
        summary: 'Buat atau Perbarui Alokasi Jadwal Proyek/Maintenance',
        tags: ['Schedules'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['order_id'],
                properties: {
                  order_id: { type: 'integer', example: 1 },
                  team_id: { type: 'integer', example: 2 },
                  start_date_project: { type: 'string', format: 'date' },
                  end_date_project: { type: 'string', format: 'date' },
                  start_datetime: { type: 'string', format: 'date-time' },
                  end_datetime: { type: 'string', format: 'date-time' },
                  status: { type: 'string', example: 'in_progress' },
                  title: { type: 'string', example: 'Instalasi Jaringan Cabang' },
                  description: { type: 'string' },
                  notes: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Jadwal dan alokasi tim berhasil disimpan' },
          422: { description: 'Validasi form jadwal gagal' },
        },
      },
    },
    '/api/v1/schedules/{id}': {
      put: {
        summary: 'Update Jadwal Order atau Tiket Maintenance',
        tags: ['Schedules'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'ID order atau maintenance' },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  team_id: { type: 'integer' },
                  start_date_project: { type: 'string', format: 'date' },
                  end_date_project: { type: 'string', format: 'date' },
                  title: { type: 'string' },
                  description: { type: 'string' },
                  start_datetime: { type: 'string', format: 'date-time' },
                  end_datetime: { type: 'string', format: 'date-time' },
                  status: { type: 'string' },
                  notes: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Jadwal berhasil diperbarui' },
          404: { description: 'Jadwal tidak ditemukan' },
        },
      },
      delete: {
        summary: 'Hapus Jadwal Maintenance atau Reset Jadwal Proyek',
        tags: ['Schedules'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'ID order atau maintenance' },
        ],
        responses: {
          200: { description: 'Jadwal berhasil dihapus atau direset' },
          404: { description: 'Jadwal tidak ditemukan' },
        },
      },
    },
    '/api/v1/schedules/maintenances': {
      get: {
        summary: 'Daftar Tiket Jadwal Pemeliharaan & Maintenance',
        tags: ['Schedules'],
        responses: {
          200: { description: 'Daftar jadwal maintenance dan referensi order' },
        },
      },
    },
    '/api/v1/schedules/developer': {
      get: {
        summary: 'Jadwal Proyek Khusus Portal Developer',
        tags: ['Developer', 'Schedules'],
        parameters: [
          { name: 'user_id', in: 'query', schema: { type: 'integer' }, description: 'ID Developer aktif' },
          { name: 'scope', in: 'query', schema: { type: 'string', enum: ['mine', 'all'] }, description: 'Scope penugasan (tugas saya atau semua)' },
          { name: 'status', in: 'query', schema: { type: 'string' }, description: 'Filter status proyek' },
        ],
        responses: {
          200: { description: 'Ringkasan developer, statistik, daftar proyek tertugaskan, dan upcoming tasks' },
        },
      },
    },
    '/api/v1/schedules/developer/{userId}': {
      get: {
        summary: 'Jadwal Proyek Developer berdasarkan User ID URL Param',
        tags: ['Developer', 'Schedules'],
        parameters: [
          { name: 'userId', in: 'path', required: true, schema: { type: 'string' }, description: 'ID Developer' },
        ],
        responses: {
          200: { description: 'Ringkasan jadwal dan proyek developer terkait' },
        },
      },
    },

    // ================= DEVELOPER PORTAL =================
    '/api/v1/developer/dashboard': {
      get: {
        summary: 'Ringkasan Metrik Dashboard Developer',
        tags: ['Developer'],
        parameters: [
          { name: 'user_id', in: 'query', required: true, schema: { type: 'integer' }, description: 'ID Developer aktif' },
        ],
        responses: {
          200: { description: 'Statistik tugas developer, proyek aktif, dan timeline' },
          401: { description: 'User ID wajib disertakan' },
        },
      },
    },
    '/api/v1/developer/tasks': {
      get: {
        summary: 'Daftar Tugas & Fase Pengerjaan Developer',
        tags: ['Developer'],
        parameters: [
          { name: 'user_id', in: 'query', required: true, schema: { type: 'integer' }, description: 'ID Developer aktif' },
        ],
        responses: {
          200: { description: 'Daftar task berurutan sesuai fase, status lock, dan deadline' },
          401: { description: 'User ID tidak ditemukan' },
        },
      },
    },
    '/api/v1/developer/tasks/{id}': {
      put: {
        summary: 'Setor Progres atau Update Status Tugas Developer',
        tags: ['Developer'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'ID task progress atau assignment id' },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', enum: ['pending', 'in_progress', 'completed'] },
                  progress_percentage: { type: 'number', minimum: 0, maximum: 100 },
                  notes: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Progres tugas berhasil disimpan dan status order tersinkronisasi' },
          403: { description: 'Fase sebelumnya belum selesai 100% atau proyek sudah selesai' },
          404: { description: 'Tugas penugasan tidak ditemukan' },
        },
      },
    },
    '/api/v1/developer/maintenance': {
      get: {
        summary: 'Daftar Tiket Maintenance yang Ditugaskan ke Developer',
        tags: ['Developer'],
        parameters: [
          { name: 'user_id', in: 'query', schema: { type: 'integer' }, description: 'ID Developer aktif' },
        ],
        responses: {
          200: { description: 'Daftar tiket maintenance terkait order turunan developer' },
        },
      },
    },
    '/api/v1/developer/maintenance/{id}': {
      get: {
        summary: 'Detail Tiket Maintenance untuk Developer',
        tags: ['Developer'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'ID tiket maintenance' },
        ],
        responses: {
          200: { description: 'Detail lengkap maintenance, riwayat tim awal, dan status progres' },
          404: { description: 'Tiket maintenance tidak ditemukan' },
        },
      },
      put: {
        summary: 'Setor Catatan / Update Progres Perbaikan Maintenance oleh Developer',
        tags: ['Developer'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'ID tiket maintenance' },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', enum: ['in_progress', 'completed'] },
                  notes: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Catatan progres pemeliharaan berhasil disimpan' },
          404: { description: 'Tiket maintenance tidak ditemukan' },
        },
      },
    },
  },
};
