const http = require('http');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const dataPath = path.join(repoRoot, 'data.json');
const port = Number(process.env.BHAN_DATA_PORT || 8787);

function send(res, status, body, type = 'application/json') {
  res.writeHead(status, {
    'Content-Type': type + '; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, '');
  if (req.url === '/health') return send(res, 200, JSON.stringify({ ok: true, dataPath }));

  if (req.url === '/data' && req.method === 'GET') {
    try {
      return send(res, 200, fs.readFileSync(dataPath, 'utf8'));
    } catch (err) {
      return send(res, 500, JSON.stringify({ ok: false, error: String(err.message || err) }));
    }
  }

  if (req.url === '/data' && req.method === 'POST') {
    let raw = '';
    req.setEncoding('utf8');
    req.on('data', chunk => { raw += chunk; if (raw.length > 5_000_000) req.destroy(); });
    req.on('end', () => {
      try {
        const data = JSON.parse(raw);
        if (!Array.isArray(data.students) || !data.kpiData || !data.schedule) {
          return send(res, 400, JSON.stringify({ ok: false, error: 'bad data shape' }));
        }
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
        return send(res, 200, JSON.stringify({ ok: true, dataPath }));
      } catch (err) {
        return send(res, 400, JSON.stringify({ ok: false, error: String(err.message || err) }));
      }
    });
    return;
  }

  send(res, 404, JSON.stringify({ ok: false, error: 'not found' }));
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Bhan local data server listening on http://127.0.0.1:${port}`);
  console.log(`Data file: ${dataPath}`);
});
