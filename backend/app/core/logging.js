import crypto from 'crypto';

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

const currentLevel = (process.env.LOG_LEVEL || 'info').toLowerCase();
const currentLevelWeight = LOG_LEVELS[currentLevel] ?? LOG_LEVELS.info;

function sanitize(message) {
  if (typeof message === 'string') {
    return message.replace(/bearer\s+[a-zA-Z0-9_\-\.]+/gi, 'Bearer [REDACTED]')
                  .replace(/api[_-]?key["':\s]+[a-zA-Z0-9_\-\.]+/gi, 'apiKey: [REDACTED]');
  }
  return message;
}

function log(level, message, meta = {}) {
  if (LOG_LEVELS[level] < currentLevelWeight) {
    return;
  }
  const timestamp = new Date().toISOString();
  const entry = {
    timestamp,
    level: level.toUpperCase(),
    message: sanitize(message),
    ...meta
  };
  // Redact any accidental apiKey or authorization in meta
  if (entry.apiKey) entry.apiKey = '[REDACTED]';
  if (entry.token) entry.token = '[REDACTED]';
  if (entry.headers?.authorization) entry.headers.authorization = '[REDACTED]';

  const output = JSON.stringify(entry);
  if (level === 'error') {
    console.error(output);
  } else if (level === 'warn') {
    console.warn(output);
  } else {
    console.log(output);
  }
}

export const logger = {
  debug: (msg, meta) => log('debug', msg, meta),
  info: (msg, meta) => log('info', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  error: (msg, meta) => log('error', msg, meta),
  generateRequestId: () => crypto.randomUUID()
};

export default logger;
