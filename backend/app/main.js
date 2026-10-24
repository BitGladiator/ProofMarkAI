import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import config from './core/config.js';
import logger from './core/logging.js';
import apiRouter from './routes/index.js';
import { AppError } from './utils/errors.js';

export const app = express();

// 1. Request correlation ID middleware
app.use((req, res, next) => {
  const requestId = req.headers['x-request-id'] || logger.generateRequestId();
  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  next();
});

// Helper to validate allowed CORS origins including wildcards and Vercel domains
function isAllowedOrigin(origin, allowedList) {
  if (!origin) return true;
  if (allowedList.includes('*')) return true;
  if (allowedList.includes(origin)) return true;

  try {
    const parsed = new URL(origin);
    // Allow any Vercel production or preview deployment URL
    if (parsed.hostname.endsWith('.vercel.app')) {
      return true;
    }
  } catch {
    // ignore URL parsing error
  }

  // Support wildcards like https://*.vercel.app or https://*.onrender.com
  for (const allowed of allowedList) {
    if (allowed.includes('*')) {
      const regex = new RegExp('^' + allowed.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
      if (regex.test(origin)) {
        return true;
      }
    }
  }

  return false;
}

// 2. CORS configuration with explicit origins and cloud deployment support
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (isAllowedOrigin(origin, config.FRONTEND_ORIGINS)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS origin '${origin}' is not permitted`));
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id']
  })
);

// 3. Body parsing with size limits
app.use(express.json({ limit: '2mb' }));

// 4. Request logging
app.use((req, res, next) => {
  logger.info(`Incoming ${req.method} ${req.url}`, {
    requestId: req.requestId,
    ip: req.ip
  });
  next();
});

// 5. Mount API routes
app.use('/api', apiRouter);

// 6. Interactive OpenAPI documentation at /docs
app.get('/docs', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ProofMark AI API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <style>
    body { margin: 0; background-color: #fafafa; }
    .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/api/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [SwaggerUIBundle.presets.apis]
      });
    };
  </script>
</body>
</html>`);
});

// OpenAPI schema spec
app.get('/api/openapi.json', (req, res) => {
  res.json({
    openapi: '3.0.3',
    info: {
      title: 'ProofMark AI Backend API',
      version: '1.0.0',
      description: 'Brand-governance assistant backend for deterministic and AI-powered draft content reviews.'
    },
    paths: {
      '/api/health': {
        get: {
          summary: 'Health Check',
          responses: {
            200: {
              description: 'Service operational',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'ok' },
                      service: { type: 'string', example: 'ProofMark AI Backend' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/review': {
        post: {
          summary: 'Review Draft Text',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['draft_text'],
                  properties: {
                    draft_text: {
                      type: 'string',
                      example: 'Our product is the best in the world for every consumer.'
                    },
                    brand_guidelines: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          text: { type: 'string' }
                        }
                      }
                    },
                    approved_terms: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          preferred: { type: 'string' },
                          avoid: { type: 'array', items: { type: 'string' } }
                        }
                      }
                    },
                    approved_facts: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          text: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Review successfully completed',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      findings: { type: 'array' },
                      review_summary: { type: 'string' },
                      needs_human_review: { type: 'boolean', example: true },
                      review_status: { type: 'object' }
                    }
                  }
                }
              }
            },
            422: { description: 'Validation error in request' },
            502: { description: 'Upstream AI provider error' },
            504: { description: 'Upstream AI provider timeout' }
          }
        }
      }
    }
  });
});

// 7. 404 handler for undefined endpoints
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.url}`
    }
  });
});

// 8. Global error handling middleware
app.use((err, req, res, next) => {
  // Syntax error from JSON body parser
  if (err instanceof SyntaxError && 'body' in err) {
    logger.warn('Malformed JSON request received', { requestId: req.requestId });
    return res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Malformed JSON payload in request body'
      }
    });
  }

  // AppError and known errors
  if (err instanceof AppError) {
    logger.warn(`Handled application error (${err.statusCode}): ${err.message}`, {
      code: err.code,
      requestId: req.requestId
    });
    return res.status(err.statusCode).json(err.toJSON());
  }

  // CORS rejection
  if (err.message && err.message.includes('CORS')) {
    logger.warn(`CORS rejected: ${err.message}`, { requestId: req.requestId });
    return res.status(403).json({
      error: {
        code: 'CORS_ERROR',
        message: err.message
      }
    });
  }

  // Unexpected internal errors
  logger.error(`Unhandled internal error: ${err.message}`, {
    stack: config.APP_ENV === 'development' ? err.stack : undefined,
    requestId: req.requestId
  });

  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected internal server error occurred'
    }
  });
});

// 9. Startup when run directly or in production container
const isDirectRun =
  Boolean(
    process.argv[1] &&
    (fileURLToPath(import.meta.url).endsWith(process.argv[1].replace(/^.*\//, '')) ||
      process.argv[1].endsWith('main.js') ||
      process.argv[1].endsWith('app/main.js'))
  ) ||
  process.env.RUN_STANDALONE === 'true' ||
  process.env.NODE_ENV === 'production';

if (isDirectRun) {
  app.listen(config.PORT, config.HOST, () => {
    logger.info(`ProofMark AI Backend running on http://${config.HOST}:${config.PORT}`);
    logger.info(`Interactive API docs available at http://${config.HOST}:${config.PORT}/docs`);
  });
}

export default app;
