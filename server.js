import express from 'express';
import { LowSync, MemorySync } from 'lowdb';
import { pathToFileURL } from 'node:url';

export function createApp() {
  const app = express();
  const db = new LowSync(new MemorySync(), { requests: [] });
  const clients = new Set();
  db.read();

  // Cho phép hai trang demo gọi từ domain/port khác nhau.
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });
  app.use(express.json({ limit: '16kb' }));

  app.get('/api/requests', (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json(db.data.requests);
  });

  app.get('/api/requests/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();
    res.write(': connected\n\n');
    clients.add(res);

    // Comment giữ kết nối mở, không phải item hay lịch sử sự kiện.
    const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 15000);
    res.on('close', () => {
      clearInterval(heartbeat);
      clients.delete(res);
    });
  });

  app.post('/api/requests', (req, res) => {
    const body = req.body;
    const errors = [];
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({ error: 'Body phải là JSON object.' });
    }
    for (const field of ['lat', 'lon']) {
      if (typeof body[field] !== 'number' || !Number.isFinite(body[field])) {
        errors.push(`${field} phải là number hữu hạn.`);
      }
    }
    for (const field of ['reason', 'name', 'phone']) {
      if (typeof body[field] !== 'string') errors.push(`${field} phải là string.`);
    }
    if (!['gun', 'fighting'].includes(body.type)) errors.push('type phải là gun hoặc fighting.');
    if (errors.length) return res.status(400).json({ error: 'Dữ liệu không hợp lệ.', details: errors });

    const { lat, lon, reason, name, phone, type } = body;
    const item = { lat, lon, reason, name, phone, type };
    db.data.requests.push(item);
    db.write();

    const event = `data: ${JSON.stringify(item)}\n\n`;
    for (const client of clients) {
      // Ngắt client quá chậm để không tích lũy bộ đệm vô hạn.
      if (!client.destroyed && !client.writableEnded && !client.write(event)) client.destroy();
    }
    res.status(201).json(item);
  });

  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'JSON không hợp lệ.' });
    }
    if (err.type === 'entity.too.large') {
      return res.status(413).json({ error: 'Body vượt quá 16 KB.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Lỗi server.' });
  });

  app.closeStreams = () => {
    for (const client of clients) client.end();
  };
  return app;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT || 3000);
  const app = createApp();
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`Police server đang chạy tại port ${server.address().port}`);
  });
  server.on('error', (error) => {
    console.error(`Không thể khởi động server: ${error.message}`);
    process.exitCode = 1;
  });
  const shutdown = () => {
    app.closeStreams();
    server.close();
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}
