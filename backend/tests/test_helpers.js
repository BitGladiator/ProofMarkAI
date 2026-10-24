import { Readable, Duplex } from 'stream';

process.env.APP_ENV = 'test';
process.env.NODE_ENV = 'test';

class DummySocket extends Duplex {
  constructor() {
    super();
    this.remoteAddress = '127.0.0.1';
  }
  _read() {}
  _write(chunk, encoding, callback) {
    callback();
  }
}

export function createTestClient(app) {
  function makeRequest(method, path, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const lowerHeaders = {};
      for (const [k, v] of Object.entries(headers)) {
        lowerHeaders[k.toLowerCase()] = v;
      }

      let payload = '';
      if (body !== null && body !== undefined) {
        payload = typeof body === 'string' ? body : JSON.stringify(body);
        if (!lowerHeaders['content-type']) {
          lowerHeaders['content-type'] = 'application/json';
        }
        lowerHeaders['content-length'] = Buffer.byteLength(payload).toString();
      }

      const socket = new DummySocket();

      const req = new Readable({
        read() {
          if (payload) {
            this.push(payload);
          }
          this.push(null);
        }
      });

      req.method = method;
      req.url = path;
      req.headers = lowerHeaders;
      req.socket = socket;
      req.connection = socket;

      const resHeaders = {};
      let statusCode = 200;
      const chunks = [];

      const res = {
        setHeader(key, value) {
          resHeaders[key.toLowerCase()] = value;
          return this;
        },
        getHeader(key) {
          return resHeaders[key.toLowerCase()];
        },
        writeHead(code, headers = {}) {
          statusCode = code;
          for (const [k, v] of Object.entries(headers)) {
            resHeaders[k.toLowerCase()] = v;
          }
          return this;
        },
        status(code) {
          statusCode = code;
          return this;
        },
        write(chunk) {
          if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          return true;
        },
        end(chunk) {
          if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          const text = Buffer.concat(chunks).toString('utf-8');
          let jsonBody = null;
          try {
            jsonBody = JSON.parse(text);
          } catch {
            jsonBody = null;
          }
          resolve({
            status: statusCode,
            statusCode,
            headers: resHeaders,
            text,
            body: jsonBody
          });
        }
      };

      try {
        app.handle(req, res, (err) => {
          if (err) reject(err);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  return {
    get: (path, headers) => makeRequest('GET', path, null, headers),
    post: (path, body, headers) => makeRequest('POST', path, body, headers)
  };
}
