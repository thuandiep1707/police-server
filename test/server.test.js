import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { createApp } from '../server.js';

const sample = {
  lat: 0, lon: 0, reason: 'Cần hỗ trợ', name: 'Nguyễn Văn A', phone: '0900000000', type: 'gun'
};

async function setup(t) {
  const app = createApp();
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(async () => {
    app.closeStreams();
    const closed = once(server, 'close');
    server.close();
    server.closeAllConnections();
    await closed;
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  return {
    base,
    list: async () => (await fetch(`${base}/api/requests`)).json(),
    post: (body) => fetch(`${base}/api/requests`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    })
  };
}

async function connect(t, base) {
  const request = http.get(`${base}/api/requests/events`);
  const [response] = await once(request, 'response');
  const frames = [];
  let buffer = '';
  response.setEncoding('utf8');
  response.on('data', (chunk) => {
    buffer += chunk;
    let boundary;
    while ((boundary = buffer.indexOf('\n\n')) >= 0) {
      frames.push(buffer.slice(0, boundary));
      buffer = buffer.slice(boundary + 2);
    }
  });
  t.after(() => request.destroy());
  const waitUntil = async (predicate) => {
    const deadline = Date.now() + 2000;
    while (!predicate()) {
      if (Date.now() > deadline) throw new Error('Hết thời gian chờ SSE');
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  };
  await waitUntil(() => frames.includes(': connected'));
  return {
    response, request, frames, waitUntil,
    items: () => frames.filter((frame) => frame.startsWith('data: ')).map((frame) => JSON.parse(frame.slice(6)))
  };
}

test('GET/POST lưu khi chưa có SSE, validation và CORS', { timeout: 10000 }, async (t) => {
  const api = await setup(t);
  assert.deepEqual(await api.list(), []);
  const response = await api.post({ ...sample, ignored: 'không lưu' });
  assert.equal(response.status, 201);
  assert.equal(response.headers.get('access-control-allow-origin'), '*');
  assert.deepEqual(await response.json(), sample);
  const second = { ...sample, type: 'fighting' };
  assert.equal((await api.post(second)).status, 201);
  for (const invalid of [{}, { ...sample, lat: '0' }, { ...sample, phone: 123 }, { ...sample, type: 'other' }, []]) {
    assert.equal((await api.post(invalid)).status, 400);
  }
  const malformed = await fetch(`${api.base}/api/requests`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{'
  });
  assert.equal(malformed.status, 400);
  const oversized = await api.post({ ...sample, reason: 'x'.repeat(17000) });
  assert.equal(oversized.status, 413);
  assert.deepEqual(await api.list(), [sample, second]);
  const preflight = await fetch(`${api.base}/api/requests`, { method: 'OPTIONS' });
  assert.equal(preflight.status, 204);
});

test('SSE broadcast đúng item, không replay, không phát dữ liệu sai', { timeout: 10000 }, async (t) => {
  const api = await setup(t);
  await api.post(sample);
  const first = await connect(t, api.base);
  const second = await connect(t, api.base);
  assert.match(first.response.headers['content-type'], /text\/event-stream/);
  assert.equal(first.response.headers['x-accel-buffering'], 'no');
  const next = { ...sample, name: 'B', type: 'fighting' };
  assert.equal((await api.post(next)).status, 201);
  await Promise.all([first.waitUntil(() => first.items().length === 1), second.waitUntil(() => second.items().length === 1)]);
  assert.deepEqual(first.items(), [next]);
  assert.deepEqual(second.items(), [next]);
  assert.deepEqual(await api.list(), [sample, next]);
  await api.post({ ...sample, type: 'invalid' });
  await new Promise((resolve) => setTimeout(resolve, 100));
  assert.deepEqual(first.items(), [next]);
  first.request.destroy();
  const reconnect = await connect(t, api.base);
  const latest = { ...sample, name: 'C' };
  await api.post(latest);
  await reconnect.waitUntil(() => reconnect.items().length === 1);
  assert.deepEqual(reconnect.items(), [latest]);
});

test('Instance mới bắt đầu với danh sách rỗng', async (t) => {
  const first = await setup(t);
  await first.post(sample);
  const restarted = await setup(t);
  assert.deepEqual(await restarted.list(), []);
});
