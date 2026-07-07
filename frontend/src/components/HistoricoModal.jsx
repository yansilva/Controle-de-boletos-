import { useState, useEffect } from 'react'
import { buscarHistorico, STATUS_MAP, formatarData } from '../api/pedidos'

const statusColors = {
  falta_dda: '#ef4444',
  aguardando_dda: '#f59e0b',
  dda_lancado: '#10b981',
}

export default function HistoricoModal({ pedido, onClose }) {
  const [historico, setHistorico] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (pedido) {
      loadHistorico()
    }
  }, [pedido])

  async function loadHistorico() {
    setLoading(true)
    try {
      const data = await buscarHistorico(pedido.id)
      setHistorico(data)
    } catch (err) {
      console.error('Erro ao carregar histórico:', err)
    } finally {
      setLoading(false)
    }
  }

  function getStatusLabel(status) {
    return STATUS_MAP[status]?.label || status
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay"
      style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div className="modal-content glass-card w-full max-w-md p-6"
        style={{ background: 'rgba(22, 29, 53, 0.95)', border: '1px solid rgba(99, 102, 241, 0.2)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
              style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(129, 140, 248, 0.2))' }}>
              📋
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Histórico</h3>
              <p className="text-xs text-dark-200">Pedido #{pedido?.pedido_tiny}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-dark-200 hover:text-white hover:bg-dark-500 transition-all">
            ✕
          </button>
        </div>

        {/* Timeline */}
        <div className="max-h-[400px] overflow-y-auto pr-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <span className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            </div>
          ) : historico.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-3xl mb-2 block opacity-30">📭</span>
              <p className="text-sm text-dark-300">Nenhum registro encontrado</p>
            </div>
          ) : (
            <div className="space-y-1">
              {historico.map((item, index) => (
                <div key={item.id} className="relative flex gap-4 py-3">
                  {/* Timeline line */}
                  {index < historico.length - 1 && (
                    <div className="absolute left-[11px] top-10 bottom-0 w-px"
                      style={{ background: 'rgba(40, 51, 82, 0.8)' }} />
                  )}

                  {/* Dot */}
                  <div className="relative z-10 flex-shrink-0 mt-1">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{
                        background: `${statusColors[item.status_novo]}20`,
                        border: `2px solid ${statusColors[item.status_novo]}`,
                        boxShadow: `0 0 8px ${statusColors[item.status_novo]}30`,
                      }}>
                      <div className="w-2 h-2 rounded-full"
                        style={{ background: statusColors[item.status_novo] }} />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.status_anterior ? (
                        <>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold"
                            style={{
                              background: `${statusColors[item.status_anterior]}15`,
                              color: statusColors[item.status_anterior],
                            }}>
                            {getStatusLabel(item.status_anterior)}
                          </span>
                          <span className="text-dark-300 text-xs">→</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold"
                            style={{
                              background: `${statusColors[item.status_novo]}15`,
                              color: statusColors[item.status_novo],
                            }}>
                            {getStatusLabel(item.status_novo)}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-dark-100">
                          Criado como{' '}
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold"
                            style={{
                              background: `${statusColors[item.status_novo]}15`,
                              color: statusColors[item.status_novo],
                            }}>
                            {getStatusLabel(item.status_novo)}
                          </span>
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-dark-300 mt-1">
                      {formatarData(item.alterado_em)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
