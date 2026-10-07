BigInt.prototype.toJSON = function () {
  return this.toString();
};

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { internalAuth } from './middlewares/internalAuth.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { usersRouter } from './routes/users.js';
import { servicesRouter } from './routes/services.js';
import { ordersRouter } from './routes/orders.js';
import { authRouter } from './routes/auth.js';
import { dashboardRouter } from './routes/dashboard.js';
import { rolesRouter } from './routes/roles.js';
import { categoriesRouter } from './routes/categories.js';
import { teamMembersRouter } from './routes/team-members.js';
import { customersRouter } from './routes/customers.js';
import { paymentsRouter } from './routes/payments.js';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'express-api',
    time: new Date().toISOString(),
  });
});

// Semua /api/* wajib token internal
app.use('/api', internalAuth);


app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/services', servicesRouter);
app.use('/api/v1/orders', ordersRouter);
app.use('/api/v1/roles', rolesRouter);
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1/service-categories', categoriesRouter);
app.use('/api/v1/team-members', teamMembersRouter);
app.use('/api/v1/customers', customersRouter);
app.use('/api/v1/payments', paymentsRouter);

// 404
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan' });
});

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`✅ Express API jalan di http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
});
