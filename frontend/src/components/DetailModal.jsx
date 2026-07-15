import { useState, useEffect } from 'react'
import { formatarValor, formatarDataCurta, formatarData, calcularValorParcela, STATUS_MAP, buscarHistorico } from '../api/pedidos'
import { 
  X, Edit, FileText, Calendar, Hash, Receipt, Barcode, Layers, 
  Package, Clock, CheckCircle2, AlertTriangle, AlertCircle, DollarSign, Loader2 
} from 'lucide-react'

const statusOptions = {
  falta_dda: { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)', icon: AlertCircle },
  aguardando_dda: { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)', icon: AlertTriangle },
  dda_lancado: { color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)', icon: CheckCircle2 },
}

export default function DetailModal({ pedido, onClose, onEdit }) {
  const [historico, setHistorico] = useState([])
  const [loadingHistorico, setLoadingHistorico] = useState(true)

  useEffect(() => {
    if (pedido) {
      setLoadingHistorico(true)
      buscarHistorico(pedido.id)
        .then(data => setHistorico(data))
        .catch(err => console.error('Erro ao carregar histórico', err))
        .finally(() => setLoadingHistorico(false))
    }
  }, [pedido])

  // ESC fecha o modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!pedido) return null

  const statusInfo = STATUS_MAP[pedido.status] || STATUS_MAP.falta_dda
  const style = statusOptions[pedido.status] || statusOptions.falta_dda
  const StatusIcon = style.icon
  const parcelaInfo = calcularValorParcela(pedido.valor, pedido.parcelamento)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(10px)' }}
      onClick={onClose}>
      <div className="modal-content w-full max-w-[560px] bg-[#171717] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}>
        
        {/* Header - Resumo Rápido */}
        <div className="px-8 pt-8 pb-6 border-b border-[rgba(255,255,255,0.06)] relative shrink-0">
          <button onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 rounded-xl flex items-center justify-center text-[var(--color-text-secondary)] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-all">
            <X size={20} />
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-white">
              <FileText size={20} />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Pedido</p>
              <h2 className="text-xl font-bold text-white tracking-tight">#{pedido.pedido_tiny}</h2>
            </div>
            <div className="ml-2 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold text-xs border"
              style={{ background: style.bg, color: style.color, borderColor: `${style.color}30` }}>
              <StatusIcon size={14} />
              {statusInfo.label}
            </div>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <p className="text-[13px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">Valor do Pedido</p>
              <h1 className="text-4xl font-extrabold text-white tracking-tight">{formatarValor(pedido.valor)}</h1>
            </div>
            <div className="text-right">
              <p className="text-[13px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1 flex justify-end gap-1"><Calendar size={14} /> Vencimento</p>
              <p className="text-lg font-bold text-white">
                {(pedido.data_vencimento_efetiva || pedido.data_vencimento) ? new Date((pedido.data_vencimento_efetiva || pedido.data_vencimento) + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-8 overflow-y-auto flex-1 space-y-8">
          
          {/* Informações do Pedido */}
          <section>
            <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-4 pb-2 border-b border-[rgba(255,255,255,0.04)]">
              Informações do Pedido
            </h3>
            <div className="grid grid-cols-2 gap-y-5 gap-x-6">
              <InfoItem icon={Hash} label="Pedido Tiny" value={pedido.pedido_tiny} />
              <InfoItem icon={Receipt} label="Número da NF" value={pedido.numero_nf} />
              <InfoItem 
                icon={Barcode} 
                label="Boleto" 
                value={pedido.digitos_boleto ? `•••• ${pedido.digitos_boleto}` : '—'} 
              />
              <InfoItem 
                icon={Layers} 
                label="Parcelas" 
                value={pedido.parcelamento ? `${pedido.parcelamento}x` : '1'} 
              />
              <InfoItem 
                icon={Calendar} 
                label="Criado em" 
                value={formatarDataCurta(pedido.criado_em)} 
              />
              {parcelaInfo && (
                <InfoItem 
                  icon={DollarSign} 
                  label="Valor por Parcela" 
                  value={`${parcelaInfo.numero}x de ${formatarValor(parcelaInfo.valorDaParcela)}`} 
                  accent
                />
              )}
            </div>
          </section>

          {/* Atenção */}
          {pedido.atencao === 1 && (
            <div className="p-4 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-center gap-3">
              <AlertTriangle className="text-[#EF4444]" size={24} />
              <div>
                <h4 className="text-sm font-bold text-white">Atenção Necessária</h4>
                <p className="text-xs text-[#FCA5A5] mt-0.5">Verificar com o Tanaka</p>
              </div>
            </div>
          )}

          {/* Parcelas Individuais (Se houver) */}
          {pedido.parcelas && pedido.parcelas.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-4 pb-2 border-b border-[rgba(255,255,255,0.04)]">
                Detalhamento de Parcelas
              </h3>
              <div className="space-y-2">
                {pedido.parcelas.map((parcela, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)]">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded bg-[var(--color-accent-glow)] text-[var(--color-accent)] font-bold text-xs flex items-center justify-center">
                        {parcela.numero_parcela}
                      </span>
                      <span className="text-sm text-[var(--color-text-secondary)] font-medium">
                        Boleto: <strong className="text-white">•••• {parcela.digitos_boleto || '—'}</strong>
                      </span>
                    </div>
                    <span className="text-sm text-[var(--color-text-secondary)] font-medium flex items-center gap-1.5">
                      <Calendar size={14} />
                      <strong className="text-white">
                        {parcela.data_vencimento ? new Date(parcela.data_vencimento + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}
                      </strong>
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Observações */}
          {pedido.observacoes && (
            <section>
              <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-4 pb-2 border-b border-[rgba(255,255,255,0.04)]">
                Observações
              </h3>
              <div className="p-4 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)]">
                <p className="text-[15px] text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">
                  {pedido.observacoes}
                </p>
              </div>
            </section>
          )}

          {/* Histórico Inline */}
          <section>
            <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-4 pb-2 border-b border-[rgba(255,255,255,0.04)] flex items-center gap-2">
              <Clock size={14} /> Histórico Recente
            </h3>
            
            {loadingHistorico ? (
              <div className="flex justify-center py-6">
                <Loader2 size={24} className="animate-spin text-[var(--color-accent)]" />
              </div>
            ) : historico.length === 0 ? (
              <p className="text-sm text-[var(--color-text-secondary)] text-center py-4">Nenhum histórico encontrado.</p>
            ) : (
              <div className="space-y-4">
                {historico.slice(0, 3).map((item, idx) => {
                  const styleNovo = statusOptions[item.status_novo] || statusOptions.falta_dda
                  return (
                    <div key={item.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full mt-1.5" style={{ background: styleNovo.color, boxShadow: `0 0 8px ${styleNovo.color}60` }} />
                        {idx !== historico.slice(0, 3).length - 1 && (
                          <div className="w-px h-full bg-[rgba(255,255,255,0.1)] mt-1.5" />
                        )}
                      </div>
                      <div className="pb-2">
                        <div className="flex items-center gap-2 text-[13px] text-white">
                          <span className="font-semibold" style={{ color: styleNovo.color }}>
                            {STATUS_MAP[item.status_novo]?.label || item.status_novo}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                          {formatarData(item.alterado_em)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-end gap-3 shrink-0">
          <button onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-[14px] font-semibold text-[var(--color-text-secondary)] hover:text-white hover:bg-[rgba(255,255,255,0.04)] transition-all">
            Fechar
          </button>
          {onEdit && (
            <button onClick={onEdit}
              className="px-6 py-2.5 rounded-xl text-[14px] font-bold text-white transition-all flex items-center gap-2
                bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] shadow-[0_4px_15px_rgba(124,58,237,0.3)] hover:shadow-[0_6px_25px_rgba(124,58,237,0.5)]">
              <Edit size={16} />
              Editar Pedido
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoItem({ icon: Icon, label, value, accent }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-secondary)] mb-1">
        <Icon size={14} />
        {label}
      </div>
      <div className={`text-[15px] font-semibold ${accent ? 'text-[var(--color-accent)]' : 'text-white'}`}>
        {value}
      </div>
    </div>
  )
}
