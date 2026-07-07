const API_BASE = '/api/pedidos';

export async function listarPedidos(filtros = {}) {
  const params = new URLSearchParams();
  Object.entries(filtros).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value);
    }
  });
  const queryString = params.toString();
  const url = queryString ? `${API_BASE}?${queryString}` : API_BASE;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Erro ao listar pedidos');
  return res.json();
}

export async function buscarPedido(id) {
  const res = await fetch(`${API_BASE}/${id}`);
  if (!res.ok) throw new Error('Pedido não encontrado');
  return res.json();
}

export async function criarPedido(dados) {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Erro ao criar pedido');
  }
  return res.json();
}

export async function editarPedido(id, dados) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Erro ao editar pedido');
  }
  return res.json();
}

export async function atualizarStatus(id, status) {
  const res = await fetch(`${API_BASE}/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Erro ao atualizar status');
  }
  return res.json();
}

export async function atualizarAtencao(id, atencao) {
  const res = await fetch(`${API_BASE}/${id}/atencao`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ atencao }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Erro ao atualizar atenção');
  }
  return res.json();
}

export async function excluirPedido(id) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Erro ao excluir pedido');
  return res.json();
}

export async function buscarHistorico(id) {
  const res = await fetch(`${API_BASE}/${id}/historico`);
  if (!res.ok) throw new Error('Erro ao buscar histórico');
  return res.json();
}

// Helpers de formatação
export const STATUS_MAP = {
  falta_dda: { label: 'Falta o DDA', color: 'red' },
  aguardando_dda: { label: 'DDA ainda não aparece no inter', color: 'yellow' },
  dda_lancado: { label: 'DDA Lançado', color: 'green' },
};

export const COLUNAS_ORDER = ['falta_dda', 'aguardando_dda', 'dda_lancado'];

export function formatarValor(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

export function formatarData(dataStr) {
  if (!dataStr) return '';
  const data = new Date(dataStr);
  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatarDataCurta(dataStr) {
  if (!dataStr) return '';
  const data = new Date(dataStr);
  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function calcularValorParcela(valorTotal, parcelamentoStr) {
  if (!valorTotal || !parcelamentoStr) return null;
  
  let numParcelas = 1;

  // Suporte para formato numérico simples (ex: "3", 3)
  const numSimples = parseInt(parcelamentoStr, 10);
  if (!isNaN(numSimples) && numSimples > 1 && String(numSimples) === String(parcelamentoStr).trim()) {
    numParcelas = numSimples;
  } else {
    // Formato antigo: "1/3", "2/5", "3x"
    const matchFraction = parcelamentoStr.toString().match(/\/\s*(\d+)/);
    if (matchFraction && matchFraction[1]) {
      numParcelas = parseInt(matchFraction[1], 10);
    } else {
      const matchTimes = parcelamentoStr.toString().match(/^(\d+)/);
      if (matchTimes && matchTimes[1]) {
        numParcelas = parseInt(matchTimes[1], 10);
      }
    }
  }

  if (numParcelas > 1) {
    return {
      numero: numParcelas,
      valorDaParcela: valorTotal / numParcelas
    };
  }
  return null;
}
