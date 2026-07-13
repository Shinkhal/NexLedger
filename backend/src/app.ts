import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { morganMiddleware } from './utils/morgan.util';
import routes from './routes/index';
import { errorMiddleware } from './middlewares/error.middleware';
import { HealthService } from './services/health.service';
import { sendSuccess } from './utils/response.util';
import { getEnv } from './config/env.config';
import { apiLimiter } from './middlewares/rateLimiter.middleware';

const app: Express = express();

// Trust proxy (required for rate limiting behind reverse proxies like Render/Heroku)
app.set('trust proxy', 1);

// Root and health endpoints
app.get('/', (_req: Request, res: Response) => {
	return sendSuccess(
		res,
		{
			service: 'NexLedger Finance Dashboard Backend',
			status: 'running',
			docs: '/api/health',
		},
		'NexLedger API is running'
	);
});

app.get('/health', async (_req: Request, res: Response, next) => {
	try {
		const health = await HealthService.getStatus();
		return sendSuccess(res, health, 'System health status');
	} catch (error) {
		next(error);
	}
});

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: (() => {
      const origins = [getEnv.client.url()];
      const customOrigin = getEnv.cors.origin();
      if (customOrigin && customOrigin !== '*') origins.push(customOrigin);
      return origins;
    })(),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "QUERY", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Strip __v from all JSON responses and serialize ObjectId/Date properly
app.use((_req, res, next) => {
  res.json = function (body: unknown) {
    res.set("Content-Type", "application/json");
    res.send(
      JSON.stringify(body, (key, value) => {
        if (key === "__v" || key === "passwordHash" || key === "resetToken" || key === "resetTokenExpires") return undefined;
        if (value?.constructor?.name === "ObjectId") return String(value);
        if (value?.constructor?.name === "Date") return value.toISOString();
        if (value?.constructor?.name === "Decimal128") return Number(value);
        return value;
      })
    );
    return res;
  };
  next();
});

// General Middlewares
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP Request Logging (morgan → winston)
app.use(morganMiddleware);

// General API Rate Limiting
app.use('/api', apiLimiter);

// API Routes
app.use('/api', routes);

// Error Handling Middleware (must be after routes)
app.use(errorMiddleware);

export default app;
