import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { serverConfig } from './config';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import routes from './routes';

/**
 * Creates and configures the Express application with all middleware and routes.
 * 
 * This function sets up a complete Express.js application with security,
 * logging, rate limiting, CORS, and error handling middleware. The middleware
 * is applied in a specific order to ensure proper request processing.
 * 
 * Middleware Order:
 * 1. Security headers (Helmet)
 * 2. Rate limiting
 * 3. CORS configuration
 * 4. Body parsing
 * 5. Logging (Morgan)
 * 6. API routes
 * 7. Error handling (404 and general error handler)
 * 
 * @returns {Application} Configured Express application instance
 */
export const createApp = (): Application => {
  const app = express();

  // Security middleware
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: serverConfig.rateLimitWindowMs,
    max: serverConfig.rateLimitMaxRequests,
    message: {
      success: false,
      error: 'Too many requests from this IP, please try again later',
      timestamp: new Date().toISOString(),
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);

  // CORS configuration
  app.use(cors({
    origin: serverConfig.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Logging middleware
  if (serverConfig.environment === 'development') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined'));
  }

  // API routes
  app.use(`/api/${serverConfig.apiVersion}`, routes);

  // Error handling middleware (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};