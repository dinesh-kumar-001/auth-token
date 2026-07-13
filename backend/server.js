const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const app = express();

// ─── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((o) => o.trim())
  : ['https://auth-token-ye6w.vercel.app', 'http://localhost:3000'];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow server-to-server / curl with no Origin
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

// ─── BODY PARSER ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ─── SWAGGER ──────────────────────────────────────────────────────────────────
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MERN Authentication API',
      version: '1.0.0',
      description:
        'JWT-based authentication API: register, login, and fetch profile.\n\n' +
        'After **Login**, copy the token, click **Authorize** (🔒) and paste `Bearer <token>`.',
    },
    servers: [
      {
        url: process.env.API_URL || 'https://auth-token-update.onrender.com',
        description: 'Active Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ─── ROOT & HEALTH CHECK ──────────────────────────────────────────────────────
app.get('/', (_req, res) =>
  res.status(200).json({
    message: 'MERN Auth API is running.',
    docs: '/api-docs',
    health: '/health',
  })
);

app.get('/health', (_req, res) =>
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() })
);

// ─── ROUTES ───────────────────────────────────────────────────────────────────
app.use('/api', authRoutes);

// ─── 404 HANDLER ─────────────────────────────────────────────────────────────
app.use((_req, res) =>
  res.status(404).json({ message: 'Route not found.' })
);

// ─── GLOBAL ERROR HANDLER ────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err.message);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error.',
  });
});

// ─── DATABASE + SERVER START ──────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    const server = app.listen(PORT, '0.0.0.0', () =>
      console.log(`🚀 Server running on port ${PORT}`)
    );

    // Graceful shutdown
    const shutdown = (signal) => {
      console.log(`\n${signal} received – shutting down gracefully`);
      server.close(() => {
        mongoose.connection.close(false, () => {
          console.log('MongoDB connection closed.');
          process.exit(0);
        });
      });
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  })
  .catch((err) => {
    console.error('❌ DB connection failed:', err.message);
    process.exit(1);
  });

module.exports = app; // for serverless / testing