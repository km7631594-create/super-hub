const express = require('express');
const cors = require('cors');
const path = require('path');
const { exec, spawn } = require('child_process');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

let notes = [];
let tasks = [];
const urlMap = {};
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

const uid = () => crypto.randomBytes(6).toString('hex');

app.get('/api/notes', (_req, res) => res.json(notes));
app.post('/api/notes', (req, res) => {
  const note = { id: uid(), title: req.body.title || 'Untitled', content: req.body.content || '', updatedAt: new Date().toISOString() };
  notes.unshift(note); res.json(note);
});
app.put('/api/notes/:id', (req, res) => {
  const idx = notes.findIndex(n => n.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  notes[idx] = { ...notes[idx], ...req.body, updatedAt: new Date().toISOString() };
  res.json(notes[idx]);
});
app.delete('/api/notes/:id', (req, res) => { notes = notes.filter(n => n.id !== req.params.id); res.json({ ok: true }); });

app.get('/api/tasks', (_req, res) => res.json(tasks));
app.post('/api/tasks', (req, res) => {
  const task = { id: uid(), title: req.body.title, status: req.body.status || 'todo' };
  tasks.unshift(task); res.json(task);
});
app.put('/api/tasks/:id', (req, res) => {
  const idx = tasks.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  tasks[idx] = { ...tasks[idx], ...req.body }; res.json(tasks[idx]);
});
app.delete('/api/tasks/:id', (req, res) => { tasks = tasks.filter(t => t.id !== req.params.id); res.json({ ok: true }); });

app.post('/api/execute/python', (req, res) => {
  if (!req.body.code) return res.status(400).json({ error: 'No code' });
  const filepath = path.join(tempDir, `py_${uid()}.py`);
  fs.writeFileSync(filepath, req.body.code);
  const proc = spawn('python3', [filepath], { timeout: 15000 });
  let out = '', err = '';
  proc.stdout.on('data', d => out += d.toString());
  proc.stderr.on('data', d => err += d.toString());
  proc.on('close', code => { try { fs.unlinkSync(filepath); } catch {} res.json({ output: out, error: err, exitCode: code }); });
  proc.on('error', e => { try { fs.unlinkSync(filepath); } catch {} res.json({ output: '', error: e.message, exitCode: -1 }); });
});

app.post('/api/execute/javascript', (req, res) => {
  if (!req.body.code) return res.status(400).json({ error: 'No code' });
  const filepath = path.join(tempDir, `js_${uid()}.js`);
  fs.writeFileSync(filepath, req.body.code);
  const proc = spawn('node', [filepath], { timeout: 15000 });
  let out = '', err = '';
  proc.stdout.on('data', d => out += d.toString());
  proc.stderr.on('data', d => err += d.toString());
  proc.on('close', code => { try { fs.unlinkSync(filepath); } catch {} res.json({ output: out, error: err, exitCode: code }); });
  proc.on('error', e => { try { fs.unlinkSync(filepath); } catch {} res.json({ output: '', error: e.message, exitCode: -1 }); });
});

app.post('/api/execute/shell', (req, res) => {
  if (!req.body.code) return res.status(400).json({ error: 'No code' });
  exec(req.body.code, { timeout: 10000 }, (error, stdout, stderr) => {
    res.json({ output: stdout || '', error: error ? error.message : (stderr || ''), exitCode: error ? (error.code || 1) : 0 });
  });
});

app.post('/api/shorten', (req, res) => {
  if (!req.body.url) return res.status(400).json({ error: 'URL required' });
  const code = crypto.randomBytes(4).toString('hex');
  urlMap[code] = req.body.url;
  res.json({ shortUrl: `/s/${code}`, code, originalUrl: req.body.url });
});
app.get('/s/:code', (req, res) => {
  const url = urlMap[req.params.code];
  if (url) return res.redirect(url);
  res.status(404).send('URL not found');
});

app.get('/api/weather', async (req, res) => {
  const city = req.query.city;
  if (!city) return res.status(400).json({ error: 'City required' });
  try {
    const response = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
    const data = await response.json();
    res.json(data);
  } catch (e) { res.status(500).json({ error: 'Weather fetch failed' }); }
});

app.post('/api/chat', async (req, res) => {
  const message = req.body.message || '';
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    try {
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ model: 'gpt-3.5-turbo', messages: [{ role: 'user', content: message }], max_tokens: 500 })
      });
      if (r.ok) { const d = await r.json(); return res.json({ reply: d.choices[0].message.content }); }
    } catch {}
  }
  const l = message.toLowerCase();
  let reply = `🤖