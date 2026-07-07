const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');

let db = null;

async function initDB() {
  const SQL = await initSqlJs();

  // Carregar banco existente ou criar novo
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Criar tabelas se não existirem
  db.run(`
    CREATE TABLE IF NOT EXISTS pedidos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pedido_tiny TEXT NOT NULL,
      numero_nf TEXT NOT NULL,
      digitos_boleto TEXT NOT NULL,
      valor REAL NOT NULL,
      data_vencimento DATE,
      observacoes TEXT,
      status TEXT NOT NULL DEFAULT 'falta_dda',
      criado_em DATETIME DEFAULT (datetime('now', 'localtime')),
      atualizado_em DATETIME DEFAULT (datetime('now', 'localtime'))
    )
  `);

  // Migração: adicionar coluna data_vencimento se não existir
  try {
    db.run("ALTER TABLE pedidos ADD COLUMN data_vencimento DATE");
  } catch (e) {
    // Ignora se a coluna já existir
  }

  // Migração: adicionar coluna observacoes se não existir
  try {
    db.run("ALTER TABLE pedidos ADD COLUMN observacoes TEXT");
  } catch (e) {
    // Ignora se a coluna já existir
  }

  // Migração: adicionar coluna atencao se não existir
  try {
    db.run("ALTER TABLE pedidos ADD COLUMN atencao INTEGER DEFAULT 0");
  } catch (e) {
    // Ignora se a coluna já existir
  }

  // Migração: adicionar coluna parcelamento se não existir
  try {
    db.run("ALTER TABLE pedidos ADD COLUMN parcelamento TEXT");
  } catch (e) {
    // Ignora se a coluna já existir
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS pedido_historico (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pedido_id INTEGER NOT NULL,
      status_anterior TEXT,
      status_novo TEXT NOT NULL,
      alterado_em DATETIME DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
    )
  `);

  // Criar tabela de parcelas
  db.run(`
    CREATE TABLE IF NOT EXISTS pedido_parcelas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pedido_id INTEGER NOT NULL,
      numero_parcela INTEGER NOT NULL,
      digitos_boleto TEXT,
      data_vencimento DATE,
      FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
    )
  `);

  // Criar índices
  db.run('CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status)');
  db.run('CREATE INDEX IF NOT EXISTS idx_pedidos_criado_em ON pedidos(criado_em)');
  db.run('CREATE INDEX IF NOT EXISTS idx_historico_pedido_id ON pedido_historico(pedido_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_parcelas_pedido_id ON pedido_parcelas(pedido_id)');

  saveDB();

  return db;
}

function saveDB() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

function getDB() {
  return db;
}

module.exports = { initDB, getDB, saveDB };
