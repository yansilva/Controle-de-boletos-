const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { initDB } = require('./db');
const pedidosRoutes = require('./routes/pedidos');

// nosemgrep: express-check-csurf-middleware-usage
// API stateless consumida via JSON; não utiliza cookies de sessão vulneráveis a CSRF tradicional.
const app = express();
const PORT = 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Rotas
app.use('/api/pedidos', pedidosRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Tunnel URL - lê o link do Cloudflare do log
app.get('/api/tunnel-url', (req, res) => {
  const logPath = path.join(__dirname, '..', 'cloudflare.log');
  try {
    if (!fs.existsSync(logPath)) {
      return res.json({ url: null, message: 'Túnel não está ativo' });
    }
    const content = fs.readFileSync(logPath, 'utf-8');
    const match = content.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
    if (match) {
      return res.json({ url: match[0] });
    }
    return res.json({ url: null, message: 'Link ainda não foi gerado' });
  } catch (err) {
    return res.json({ url: null, message: 'Erro ao ler log do túnel' });
  }
});

// Iniciar servidor após inicializar o banco
async function start() {
  try {
    await initDB();
    console.log('✅ Banco de dados SQLite inicializado');

    app.listen(PORT, () => {
      console.log(`\n🚀 Servidor DDA rodando em http://localhost:${PORT}`);
      console.log(`📋 API disponível em http://localhost:${PORT}/api/pedidos\n`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar o servidor:', error);
    process.exit(1);
  }
}

start();
