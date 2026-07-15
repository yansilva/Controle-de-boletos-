const express = require('express');
const router = express.Router();
const { getDB, saveDB } = require('../db');

const STATUSES_VALIDOS = ['falta_dda', 'aguardando_dda', 'dda_lancado', 'concluido'];

// Helper para converter resultado sql.js para array de objetos
function queryAll(sql, params = []) {
  const db = getDB();
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);

  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function queryOne(sql, params = []) {
  const results = queryAll(sql, params);
  return results.length > 0 ? results[0] : null;
}

function runSQL(sql, params = []) {
  const db = getDB();
  db.run(sql, params);
  // Captura o last_insert_rowid ANTES do saveDB, pois saveDB() reseta esse valor no sql.js
  const stmt = db.prepare('SELECT last_insert_rowid() as id');
  stmt.step();
  const lastId = stmt.getAsObject().id;
  stmt.free();
  saveDB();
  return lastId;
}

function getLastInsertId() {
  // Mantido por compatibilidade, mas prefira usar o retorno de runSQL()
  const db = getDB();
  const stmt = db.prepare('SELECT last_insert_rowid() as id');
  stmt.step();
  const lastId = stmt.getAsObject().id;
  stmt.free();
  return lastId;
}

// Helper para buscar parcelas de um pedido
function getParcelas(pedidoId) {
  return queryAll(
    'SELECT * FROM pedido_parcelas WHERE pedido_id = ? ORDER BY numero_parcela ASC',
    [pedidoId]
  );
}

// Helper para salvar parcelas de um pedido
function saveParcelas(pedidoId, parcelas) {
  // Deletar parcelas existentes
  runSQL('DELETE FROM pedido_parcelas WHERE pedido_id = ?', [pedidoId]);
  // Inserir novas parcelas
  if (parcelas && Array.isArray(parcelas)) {
    parcelas.forEach((p) => {
      runSQL(
        'INSERT INTO pedido_parcelas (pedido_id, numero_parcela, digitos_boleto, data_vencimento) VALUES (?, ?, ?, ?)',
        [pedidoId, p.numero_parcela, p.digitos_boleto || null, p.data_vencimento || null]
      );
    });
  }
}

// GET /api/pedidos — Listar todos com filtros opcionais
router.get('/', (req, res) => {
  try {
    // Mover pedidos vencidos para 'concluido' (ocultos do quadro, mas preservados no banco)
    runSQL(`
      UPDATE pedidos 
      SET status = 'concluido', atualizado_em = datetime('now', 'localtime')
      WHERE status = 'dda_lancado' 
        AND data_vencimento IS NOT NULL 
        AND data_vencimento != ''
        AND date(data_vencimento, '+1 day') < date('now', 'localtime')
    `);

    const { status, data_inicio, data_fim, valor_min, valor_max, busca } = req.query;

    let sql = "SELECT * FROM pedidos WHERE status != 'concluido'";
    const params = [];

    if (status && STATUSES_VALIDOS.includes(status)) {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (data_inicio) {
      sql += ' AND criado_em >= ?';
      params.push(data_inicio);
    }

    if (data_fim) {
      sql += ' AND criado_em <= ?';
      params.push(data_fim + ' 23:59:59');
    }

    if (valor_min) {
      sql += ' AND valor >= ?';
      params.push(parseFloat(valor_min));
    }

    if (valor_max) {
      sql += ' AND valor <= ?';
      params.push(parseFloat(valor_max));
    }

    if (busca) {
      sql += ' AND (pedido_tiny LIKE ? OR numero_nf LIKE ? OR digitos_boleto LIKE ?)';
      const termo = `%${busca}%`;
      params.push(termo, termo, termo);
    }

    // Ordenar por data de vencimento efetiva (mais próxima primeiro)
    // Para pedidos com parcelas, usa a próxima parcela a vencer
    // Pedidos sem data de vencimento ficam por último
    sql += ' ORDER BY CASE WHEN data_vencimento IS NULL OR data_vencimento = "" THEN 1 ELSE 0 END ASC, data_vencimento ASC, criado_em DESC';

    const pedidos = queryAll(sql, params);
    // Incluir parcelas em cada pedido
    const pedidosComParcelas = pedidos.map(p => {
      const parcelas = getParcelas(p.id);
      
      // Para pedidos com parcelas, calcular a próxima parcela a vencer
      let dataVencimentoEfetiva = p.data_vencimento;
      let proximaParcela = null;
      
      if (parcelas.length > 0) {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        
        // Encontra a próxima parcela a vencer (data >= hoje)
        const parcelasComData = parcelas
          .filter(parc => parc.data_vencimento)
          .sort((a, b) => new Date(a.data_vencimento) - new Date(b.data_vencimento));
        
        const proxima = parcelasComData.find(parc => {
          const dataParc = new Date(parc.data_vencimento + 'T00:00:00');
          return dataParc >= hoje;
        });
        
        if (proxima) {
          dataVencimentoEfetiva = proxima.data_vencimento;
          proximaParcela = proxima.numero_parcela;
        } else if (parcelasComData.length > 0) {
          // Se todas já venceram, usa a última
          const ultima = parcelasComData[parcelasComData.length - 1];
          dataVencimentoEfetiva = ultima.data_vencimento;
          proximaParcela = ultima.numero_parcela;
        }
      }
      
      return {
        ...p,
        parcelas,
        data_vencimento_efetiva: dataVencimentoEfetiva,
        proxima_parcela: proximaParcela,
      };
    });
    
    // Reordenar no JS levando em conta a data efetiva (com parcelas)
    pedidosComParcelas.sort((a, b) => {
      const dataA = a.data_vencimento_efetiva;
      const dataB = b.data_vencimento_efetiva;
      
      // Sem data vai para o final
      if (!dataA && !dataB) return 0;
      if (!dataA) return 1;
      if (!dataB) return -1;
      
      return new Date(dataA) - new Date(dataB);
    });
    
    res.json(pedidosComParcelas);
  } catch (error) {
    console.error('Erro ao listar pedidos:', error);
    res.status(500).json({ error: 'Erro ao listar pedidos' });
  }
});

// GET /api/pedidos/:id — Detalhe de um pedido
router.get('/:id', (req, res) => {
  try {
    const pedido = queryOne('SELECT * FROM pedidos WHERE id = ?', [Number(req.params.id)]);
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    pedido.parcelas = getParcelas(pedido.id);
    res.json(pedido);
  } catch (error) {
    console.error('Erro ao buscar pedido:', error);
    res.status(500).json({ error: 'Erro ao buscar pedido' });
  }
});

// GET /api/pedidos/:id/historico — Histórico de mudanças
router.get('/:id/historico', (req, res) => {
  try {
    const historico = queryAll(
      'SELECT * FROM pedido_historico WHERE pedido_id = ? ORDER BY alterado_em DESC',
      [Number(req.params.id)]
    );
    res.json(historico);
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
});

// POST /api/pedidos — Criar novo pedido
router.post('/', (req, res) => {
  try {
    const { pedido_tiny, numero_nf, digitos_boleto, valor, data_vencimento, observacoes, parcelamento, status, atencao, parcelas } = req.body;

    // Validação
    if (!pedido_tiny || !numero_nf || valor === undefined || valor === null) {
      return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos' });
    }

    const statusFinal = status && STATUSES_VALIDOS.includes(status) ? status : 'falta_dda';
    const atencaoFinal = atencao ? 1 : 0;

    const lastId = runSQL(
      `INSERT INTO pedidos (pedido_tiny, numero_nf, digitos_boleto, valor, data_vencimento, observacoes, parcelamento, status, atencao)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [pedido_tiny, numero_nf, digitos_boleto || null, parseFloat(valor), data_vencimento || null, observacoes || null, parcelamento || null, statusFinal, atencaoFinal]
    );

    // Salvar parcelas se existirem
    if (parcelas && Array.isArray(parcelas) && parcelas.length > 0) {
      saveParcelas(lastId, parcelas);
    }

    // Registrar no histórico
    runSQL(
      `INSERT INTO pedido_historico (pedido_id, status_anterior, status_novo)
       VALUES (?, NULL, ?)`,
      [lastId, statusFinal]
    );

    const novoPedido = queryOne('SELECT * FROM pedidos WHERE id = ?', [lastId]);
    novoPedido.parcelas = getParcelas(lastId);
    res.status(201).json(novoPedido);
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    res.status(500).json({ error: 'Erro ao criar pedido' });
  }
});

// PUT /api/pedidos/:id — Editar pedido completo
router.put('/:id', (req, res) => {
  try {
    const { pedido_tiny, numero_nf, digitos_boleto, valor, data_vencimento, observacoes, parcelamento, status, atencao, parcelas } = req.body;
    const id = Number(req.params.id);

    const pedidoAtual = queryOne('SELECT * FROM pedidos WHERE id = ?', [id]);
    if (!pedidoAtual) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    if (!pedido_tiny || !numero_nf || valor === undefined || valor === null) {
      return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos' });
    }

    const statusFinal = status && STATUSES_VALIDOS.includes(status) ? status : pedidoAtual.status;
    const atencaoFinal = atencao !== undefined ? (atencao ? 1 : 0) : pedidoAtual.atencao;

    runSQL(
      `UPDATE pedidos
       SET pedido_tiny = ?, numero_nf = ?, digitos_boleto = ?, valor = ?, data_vencimento = ?, observacoes = ?, parcelamento = ?, status = ?, atencao = ?, atualizado_em = datetime('now', 'localtime')
       WHERE id = ?`,
      [pedido_tiny, numero_nf, digitos_boleto || null, parseFloat(valor), data_vencimento || null, observacoes || null, parcelamento || null, statusFinal, atencaoFinal, id]
    );

    // Atualizar parcelas
    if (parcelas !== undefined) {
      saveParcelas(id, parcelas || []);
    }

    // Registrar mudança de status no histórico se mudou
    if (pedidoAtual.status !== statusFinal) {
      runSQL(
        `INSERT INTO pedido_historico (pedido_id, status_anterior, status_novo)
         VALUES (?, ?, ?)`,
        [id, pedidoAtual.status, statusFinal]
      );
    }

    const pedidoAtualizado = queryOne('SELECT * FROM pedidos WHERE id = ?', [id]);
    pedidoAtualizado.parcelas = getParcelas(id);
    res.json(pedidoAtualizado);
  } catch (error) {
    console.error('Erro ao editar pedido:', error);
    res.status(500).json({ error: 'Erro ao editar pedido' });
  }
});

// PATCH /api/pedidos/:id/status — Atualizar apenas o status (drag-and-drop)
router.patch('/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    const id = Number(req.params.id);

    if (!status || !STATUSES_VALIDOS.includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    const pedidoAtual = queryOne('SELECT * FROM pedidos WHERE id = ?', [id]);
    if (!pedidoAtual) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    if (pedidoAtual.status === status) {
      return res.json(pedidoAtual);
    }

    runSQL(
      `UPDATE pedidos SET status = ?, atualizado_em = datetime('now', 'localtime') WHERE id = ?`,
      [status, id]
    );

    // Registrar no histórico
    runSQL(
      `INSERT INTO pedido_historico (pedido_id, status_anterior, status_novo)
       VALUES (?, ?, ?)`,
      [id, pedidoAtual.status, status]
    );

    const pedidoAtualizado = queryOne('SELECT * FROM pedidos WHERE id = ?', [id]);
    res.json(pedidoAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({ error: 'Erro ao atualizar status' });
  }
});

// PATCH /api/pedidos/:id/atencao — Atualizar flag de atencao
router.patch('/:id/atencao', (req, res) => {
  try {
    const { atencao } = req.body;
    const id = Number(req.params.id);

    const pedidoAtual = queryOne('SELECT * FROM pedidos WHERE id = ?', [id]);
    if (!pedidoAtual) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    const novoValor = atencao ? 1 : 0;

    runSQL(
      `UPDATE pedidos SET atencao = ?, atualizado_em = datetime('now', 'localtime') WHERE id = ?`,
      [novoValor, id]
    );

    const pedidoAtualizado = queryOne('SELECT * FROM pedidos WHERE id = ?', [id]);
    res.json(pedidoAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar atencao:', error);
    res.status(500).json({ error: 'Erro ao atualizar atenção' });
  }
});

// DELETE /api/pedidos/:id — Excluir pedido
router.delete('/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const pedido = queryOne('SELECT * FROM pedidos WHERE id = ?', [id]);
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    // Deletar parcelas e histórico primeiro (sem FK cascade no sql.js)
    runSQL('DELETE FROM pedido_parcelas WHERE pedido_id = ?', [id]);
    runSQL('DELETE FROM pedido_historico WHERE pedido_id = ?', [id]);
    runSQL('DELETE FROM pedidos WHERE id = ?', [id]);

    res.json({ message: 'Pedido excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir pedido:', error);
    res.status(500).json({ error: 'Erro ao excluir pedido' });
  }
});

module.exports = router;
