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

// 2. CORS configuration with explicit origins
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (
        config.FRONTEND_ORIGINS.includes('*') ||
        config.FRONTEND_ORIGINS.includes(origin)
      ) {
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

// 9. Startup when run directly
const isDirectRun =
  process.argv[1] &&
  fileURLToPath(import.meta.url).endsWith(process.argv[1].replace(/^.*\//, ''));

if (isDirectRun || process.env.RUN_STANDALONE === 'true') {
  app.listen(config.PORT, config.HOST, () => {
    logger.info(`ProofMark AI Backend running on http://${config.HOST}:${config.PORT}`);
    logger.info(`Interactive API docs available at http://${config.HOST}:${config.PORT}/docs`);
  });
}

export default app;
