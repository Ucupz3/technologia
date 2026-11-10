// ============ PATCH BigInt SEBELUM APAPUN ============
BigInt.prototype.toJSON = function () {
  return this.toString();
};

// ============ LOAD ENV PALING AWAL ============
import dotenv from 'dotenv';
dotenv.config();

// ============ BARU IMPORT LAINNYA ============
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { internalAuth } from './middlewares/internalAuth.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { usersRouter } from './routes/users.js';
import { servicesRouter } from './routes/services.js';
import { ordersRouter } from './routes/orders.js';
import { authRouter } from './routes/auth.js';
import { dashboardRouter } from './routes/dashboard.js';
import { rolesRouter } from './routes/roles.js';
import { categoriesRouter } from './routes/categories.js';
import { teamsRouter } from './routes/teams.js';
import { teamMembersRouter } from './routes/team-members.js';
import { jobsRouter } from './routes/jobs.js';
import { customersRouter } from './routes/customers.js';
import { invoicesRouter, paymentsRouter } from './routes/invoices.js';
import { assignmentsRouter, orderAssignmentsRouter } from './routes/assignments.js';
import { schedulesRouter } from './routes/schedules.js';
import { progressRouter, orderProgressRouter } from './routes/progress.js';
import { developerDashboardRouter } from './routes/developer-dashboard.js';
import { developerTasksRouter } from './routes/developer-tasks.js';
import swaggerUi from 'swagger-ui-express';
import { openapiSpecification } from './docs/swagger.js';

const app = express();
const PORT = process.env.PORT || 4000;

// ============ MIDDLEWARE ============
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));

// ============ HEALTH ============
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'express-api',
    time: new Date().toISOString(),
  });
});

// ============ SWAGGER ============
app.get('/api/openapi.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(openapiSpecification);
});

app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(openapiSpecification, {
    swaggerOptions: { persistAuthorization: true },
    customSiteTitle: 'Tekna ERP API Documentation',
  })
);

// ============ AUTH INTERNAL ============
app.use('/api', internalAuth);

// ============ ROUTES ============
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/services', servicesRouter);
app.use('/api/v1/orders', ordersRouter);
app.use('/api/v1/roles', rolesRouter);
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1/service-categories', categoriesRouter);
app.use('/api/v1/teams', teamsRouter);
app.use('/api/v1/team-members', teamMembersRouter);
app.use('/api/v1/jobs', jobsRouter);
app.use('/api/v1/customers', customersRouter);
app.use('/api/v1/invoices', invoicesRouter);
app.use('/api/v1/payments', invoicesRouter);
app.use('/api/v1/assignments', assignmentsRouter);
app.use('/api/v1/orders/:orderId/assignments', orderAssignmentsRouter);
app.use('/api/v1/progress', progressRouter);
app.use('/api/v1/schedules', schedulesRouter);
app.use('/api/v1/orders/:orderId/progress', orderProgressRouter);
app.use('/api/v1/developer/dashboard', developerDashboardRouter);
app.use('/api/v1/developer/tasks', developerTasksRouter);

// ============ 404 ============
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan' });
});

// ============ ERROR HANDLER ============
app.use(errorHandler);

// ============ START ============
app.listen(PORT, () => {
  console.log(`✅ Express API jalan di http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
});