import { formatarValor, formatarDataCurta, calcularValorParcela, STATUS_MAP } from '../api/pedidos'

const statusStyles = {
  falta_dda: { bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.3)', color: '#fca5a5', dot: '#ef4444' },
  aguardando_dda: { bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)', color: '#fcd34d', dot: '#f59e0b' },
  dda_lancado: { bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)', color: '#6ee7b7', dot: '#10b981' },
}

export default function DetailModal({ pedido, onClose }) {
  if (!pedido) return null

  const statusInfo = STATUS_MAP[pedido.status] || STATUS_MAP.falta_dda
  const style = statusStyles[pedido.status] || statusStyles.falta_dda
  const parcelaInfo = calcularValorParcela(pedido.valor, pedido.parcelamento)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay"
      style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div className="modal-content glass-card w-full max-w-md p-6 space-y-5 max-h-[90vh] overflow-y-auto"
        style={{ background: 'rgba(22, 29, 53, 0.97)', border: '1px solid rgba(99, 102, 241, 0.15)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
              style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(129, 140, 248, 0.2))' }}>
              📄
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Detalhes do Pedido</h3>
              <p className="text-xs text-dark-200">#{pedido.pedido_tiny}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-dark-200 hover:text-white hover:bg-dark-500 transition-all">
            ✕
          </button>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
          style={{ background: style.bg, border: `1px solid ${style.border}` }}>
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: style.dot }} />
          <span className="text-sm font-semibold" style={{ color: style.color }}>
            {statusInfo.label}
          </span>
        </div>

        {/* Atenção Badge */}
        {pedido.atencao === 1 && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
            style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
            <span className="text-lg">🛑</span>
            <span className="text-sm font-semibold" style={{ color: '#fca5a5' }}>
              Verificar com o Tanaka
            </span>
          </div>
        )}

        {/* Info Grid */}
        <div className="space-y-0">
          <InfoRow label="Nº Pedido Tiny" value={pedido.pedido_tiny} />
          <InfoRow label="Número da NF" value={pedido.numero_nf} />
          {pedido.digitos_boleto && (
            <InfoRow label="Dígitos do Boleto" value={`...${pedido.digitos_boleto}`} />
          )}
          <InfoRow label="Valor do Pedido" value={formatarValor(pedido.valor)} highlight />
          {pedido.data_vencimento && (
            <InfoRow label="Vencimento" value={
              new Date(pedido.data_vencimento + 'T12:00:00').toLocaleDateString('pt-BR')
            } />
          )}
          {pedido.parcelamento && (
            <InfoRow label="Parcelamento" value={`${pedido.parcelamento}x`} />
          )}
          {parcelaInfo && (
            <InfoRow label="Valor por Parcela" value={`${parcelaInfo.numero}x de ${formatarValor(parcelaInfo.valorDaParcela)}`} accent />
          )}
        </div>

        {/* Parcelas Individuais */}
        {pedido.parcelas && pedido.parcelas.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-base">📦</span>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Parcelas</h4>
            </div>
            <div className="space-y-1.5">
              {pedido.parcelas.map((parcela, idx) => (
                <div key={idx}
                  className="flex items-center justify-between bg-dark-900/50 px-4 py-3 rounded-xl border border-dark-500/40">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold text-accent bg-accent/15 border border-accent/20">
                      {parcela.numero_parcela}
                    </span>
                    <span className="text-xs font-semibold text-dark-100">
                      Parcela {parcela.numero_parcela}/{pedido.parcelamento}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    {parcela.digitos_boleto && (
                      <span className="text-dark-100 font-medium">
                        <span className="text-dark-300 mr-1">Boleto:</span>
                        ...{parcela.digitos_boleto}
                      </span>
                    )}
                    {parcela.data_vencimento && (
                      <span className="text-dark-100 font-medium">
                        <span className="text-dark-300 mr-1">Venc:</span>
                        {new Date(parcela.data_vencimento + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Observações */}
        {pedido.observacoes && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-base">📝</span>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Observações</h4>
            </div>
            <div className="bg-dark-900/50 px-4 py-3 rounded-xl border border-dark-500/40">
              <p className="text-sm text-dark-100 leading-relaxed whitespace-pre-wrap">
                {pedido.observacoes}
              </p>
            </div>
          </div>
        )}

        {/* Footer: Data de criação */}
        <div className="pt-2 border-t border-dark-600/60 flex items-center gap-2">
          <span className="text-xs text-dark-300">📅</span>
          <span className="text-xs text-dark-300">
            Criado em {formatarDataCurta(pedido.criado_em)}
          </span>
        </div>

        {/* Botão Fechar */}
        <button onClick={onClose}
          className="w-full py-3 rounded-xl text-sm font-medium text-dark-100 border border-dark-500 hover:border-dark-300 hover:text-white transition-all">
          Fechar
        </button>
      </div>
    </div>
  )
}

function InfoRow({ label, value, highlight, accent }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-dark-600/30">
      <span className="text-[11px] text-dark-200 uppercase tracking-wider font-medium">{label}</span>
      <span className={`text-sm font-semibold ${
        highlight ? 'text-white text-base font-extrabold' :
        accent ? 'text-accent' :
        'text-white'
      }`}>
        {value}
      </span>
    </div>
  )
}
