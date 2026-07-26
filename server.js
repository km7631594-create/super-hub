// ZERO CLONE - AI Workspace v3
const express = require('express');
const cors = require('cors');
const path = require('path');
const { exec, spawn } = require('child_process');
const fs = require('fs');
const crypto = require('crypto');
const app = express();
app.use(cors());app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));
let notes = [], tasks = [], files = {}, urlMap = {};
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
const uid = () => crypto.randomBytes(6).toString('hex');
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
// NOTES
app.get('/api/notes', (_e, r) => r.json(notes));
app.post('/api/notes', (q, r) => { const n = { id: uid(), title: q.body.title || 'Untitled', content: q.body.content || '', updatedAt: new Date().toISOString() }; notes.unshift(n); r.json(n); });
app.put('/api/notes/:id', (q, r) => { const i = notes.findIndex(n => n.id === q.params.id); if (i===-1) return r.status(404).json({e: 'Not found'}); notes[i] = { ...notes[i], ...q.body, updatedAt: new Date().toISOString() }; r.json(notes[i]); });
app.delete('/api/notes/:id', (q, r) => { notes = notes.filter(n => n.id !== q.params.id); r.json({ ok: true }); });
// TASKS
app.get('/api/tasks', (_e, r) => r.json(tasks));
app.post('/api/tasks', (q, r) => { const t = { id: uid(), title: q.body.title, status: q.body.status || 'todo', priority: q.body.priority || 'medium', createdAt: new Date().toISOString() }; tasks.unshift(t); r.json(t); });
app.put('/api/tasks/:id', (q, r) => { const i = tasks.findIndex(t => t.id === q.params.id); if (i===-1) return r.status(404).json({e: 'Not found'}); tasks[i] = { ...tasks[i], ...q.body }; r.json(tasks[i]); });
app.delete('/api/tasks/:id', (q, r) => { tasks = tasks.filter(t => t.id !== q.params.id); r.json({ ok: true }); });
// FILES 
app.get('/api/files', (q, r) => { const dir = q.query.dir || '/'; r.json(Object.entries(files).filter(([p]) => p.startsWith(dir)).map(([p, f]) => ({ path: p, updatedAt: f.updatedAt, size: f.content.length }))); });
app.get('/api/files/read', (q, r) => { const fp = q.query.path; if (!fp || !files[fp]) return r.status(404).json({e: 'File not found'}); r.json({ path: fp, content: files[fp].content, updatedAt: files[fp].updatedAt }); });
app.post('/api/files/write', (q, r) => { const { path: fp, content } = q.body; if (!fp) return r.status(400).json({e: 'Path required'}); files[fp] = { content: content || '', updatedAt: new Date().toISOString() }; r.json({ ok: true, path: fp }); });
app.delete('/api/files/delete', (q, r) => { delete files[q.body.path]; r.json({ ok: true }); });
app.post('/api/files/search', (q, r) => { const qu = (q.body.query || '').toLowerCase(); r.json(Object.entries(files).filter(([p, f]) => p.toLowerCase().includes(qu) || f.content.toLowerCase().includes(qu)).map(([p, f]) => ({ path: p, preview: f.content.slice(0, 200) }))); });
// CODE EXEC
app.post('/api/execute/python', async (q, r) => { if (!q.body.code) return r.status(400).json({e: 'No code'}); const fn = path.join(tempDir, 'py_'+uid()+'.py'); fs.writeFileSync(fn, q.body.code); const p = spawn('python3', [fn], { timeout: 15000 }); let out='',err=''; p.stdout.on('data', d=>out+=d.toString()); p.stderr.on('data', d=>err+=d.toString()); p.on('close', c=>{try{fs.unlinkSync(fn)}catch{}r.json({output:out,error:err,exitCode:c})}); p.on('error', e=>{try{fs.unlinkSync(fn)}catch{}r.json({output:'',error:e.message,exitCode:-1})}); });
app.post('/api/execute/javascript', async (q, r) => { if (!q.body.code) return r.status(400).json({e: 'No code'}); const fn = path.join(tempDir, 'js_'+uid()+'.js'); fs.writeFileSync(fn, q.body.code); const p = spawn('node', [fn], { timeout: 15000 }); let out='',err=''; p.stdout.on('data', d=>out+=d.toString()); p.stderr.on('data', d=>err+=d.toString()); p.on('close', c=>{try{fs.unlinkSync(fn)}catch{}r.json({output:out,error:err,exitCode:c})}); p.on('error', e=>{try{fs.unlinkSync(fn)}catch{}r.json({output:'',error:e.message,exitCode:-1})}); });
app.post('/api/execute/shell', (q, r) => { if (!q.body.code) return r.status(400).json({e: 'No code'}); exec(q.body.code, { timeout: 10000 }, (error, stdout, stderr) => { r.json({ output: stdout || '', error: error ? error.message : (stderr || ''), exitCode: error ? error.code || 1 : 0 }); }); });
// URL SHORTENER
app.post('/api/shorten', (q, r) => { const code = crypto.randomBytes(4).toString('hex'); urlMap[code] = q.body.url; r.json({ shortUrl: '/s/'+code, code, originalUrl: q.body.url }); });
app.get('/s/:code', (q, r) => { const u = urlMap[q.params.code]; if(u)return r.redirect(u); r.status(404).send('URL not found'); });
// Weather
app.get('/api/weather', async (q, r) => { const city = q.query.city; if (!city) return r.status(400).json({e: 'City required'}); try { const res = await fetch('https://wttr.in/'+encodeURIComponent(city)+'?format=j1'); r.json(await res.json()); } catch (e) { r.status(500).json({e: e.message}); } });
// Image Gen (Free Pollinations)
app.get('/api/image/generate', (q, r) => { const prompt = q.query.prompt || 'a beautiful sunset', seed = Math.floor(Math.random()*999999); r.json({ url: 'https://image.pollinations.ai/prompt/'+encodeURIComponent(prompt)+'?seed='+seed+'&width=768&height=768&nologo=true', prompt, seed }); });
// GROQ AI CHAT
app.post('/api/chat', async (q, r) => {
  const { message, messages, systemPrompt } = q.body;
  if (!GROQ_API_KEY) return r.json({ reply: 'Demo mode - GROQ_API_KEY not set in Render env.\n\nYou said: "'+message+'"\n\nI can help with: Code execution, Notes, Tasks, Files, Weather, Calculator, URLs, Passwords, Images, Markdown!\n\nSet GROQ_API_KEY in Render Dashboard for real AI power!', model: 'demo', provider: 'local' });
  try {
    const msgs = [];
    if (systemPrompt) msgs.push({ role: 'system', content: systemPrompt });
    msgs.push(...(messages || [{ role: 'user', content: message }]));
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer '+GROQ_API_KEY },
      body: JSON.stringify({ model: GROQ_MODEL, messages: msgs, max_tokens: 2048, temperature: 0.7 })
    });
    const d = await res.json();
    if (d.error) throw new Error(d.error.message);
    r.json({ reply: d.choices[0].message.content, model: GROQ_MODEL, provider: 'groq' });
  } catch (e) {
    console.error('Groq:', e.message);
    r.json({ reply: 'Groq error: '+e.message+'\n\nYou asked: "'+message+'"\n\nCheck your API key or try again!', model: 'fallback', provider: 'local' });
  }
});
// SPA
app.get('*', (q, r) => r.sendFile(path.join(__dirname, 'public', 'index.html')));
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log('ZERO_CLONE_V3 READY:' + PORT);
  console.log('Groq: ' + (GROQ_API_KEY ? 'CONFIGURED' : 'NOT SET'));
  exec('python3 --version', (e, o) => console.log('Python: ' + (e ? 'NOT' : o.trim())));
  console.log('Node: ' + process.version);
});
