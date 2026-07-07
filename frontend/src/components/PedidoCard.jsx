import { formatarValor, formatarDataCurta, calcularValorParcela } from '../api/pedidos'
import { AlertCircle, History, Edit2, Trash2, Calendar, FileText, Receipt, Layers, AlertTriangle } from 'lucide-react'

export default function PedidoCard({ pedido, provided, isDragging, onAtencaoToggle, onEdit, onDelete, onHistorico, onView }) {
  function handleCardClick(e) {
    if (e.target.closest('button')) return
    if (onView) onView(pedido)
  }

  // Cor do vencimento baseada na urgência
  const getVencimentoColor = (dataEfetiva, status) => {
    if (!dataEfetiva) return 'text-[var(--color-text-secondary)]'
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const dataVenc = new Date(dataEfetiva + 'T00:00:00')
    const diffDias = Math.round((dataVenc - hoje) / (1000 * 60 * 60 * 24))
    
    if (diffDias < 0) return status === 'dda_lancado' ? 'text-[var(--color-text-secondary)]' : 'text-[#EF4444]'
    if (diffDias <= 3) return 'text-[#F59E0B]'
    return 'text-[var(--color-text-secondary)]'
  }

  const getVencimentoText = (dataEfetiva, status) => {
    if (!dataEfetiva) return ''
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const dataVenc = new Date(dataEfetiva + 'T00:00:00')
    const diffDias = Math.round((dataVenc - hoje) / (1000 * 60 * 60 * 24))
    
    const formattedDate = new Date(dataEfetiva + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    
    if (diffDias < 0) return status === 'dda_lancado' ? formattedDate : `${formattedDate} (vencido)`
    if (diffDias === 0) return 'Hoje'
    if (diffDias === 1) return 'Amanhã'
    if (diffDias <= 3) return `${formattedDate} (${diffDias}d)`
    return formattedDate
  }

  const vencimentoColor = getVencimentoColor(pedido.data_vencimento_efetiva || pedido.data_vencimento, pedido.status)

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      style={{
        ...provided.draggableProps.style,
      }}
      className="mb-4"
    >
      <div 
        onClick={handleCardClick}
        className={`group relative bg-[#171717] rounded-xl p-5 cursor-grab border transition-all duration-200
          ${isDragging 
            ? 'border-[var(--color-accent)] shadow-[0_16px_40px_rgba(0,0,0,0.6)] scale-[1.02] active:cursor-grabbing z-50' 
            : 'border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)] hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)]'
          }`}
      >
        {/* Atention Badge absolute */}
        {pedido.atencao === 1 && (
          <div className="absolute -top-2.5 -right-2.5 bg-[#EF4444] text-white p-1.5 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]">
            <AlertTriangle size={14} />
          </div>
        )}

        {/* Top row: Pedido Tiny + Actions */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#111827] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[var(--color-text-secondary)]">
              <FileText size={14} />
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Pedido</p>
              <p className="text-sm font-bold text-white group-hover:text-[var(--color-accent-hover)] transition-colors">#{pedido.pedido_tiny}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); onAtencaoToggle(pedido.id, pedido.atencao) }}
              className={`p-1.5 rounded-md transition-colors ${pedido.atencao ? 'bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/20' : 'text-[var(--color-text-secondary)] hover:bg-[#262626] hover:text-white'}`}
              title={pedido.atencao ? "Remover atenção" : "Sinalizar atenção"}
            >
              <AlertTriangle size={14} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onHistorico(pedido) }}
              className="p-1.5 rounded-md text-[var(--color-text-secondary)] hover:bg-[#262626] hover:text-white transition-colors"
              title="Histórico"
            >
              <History size={14} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(pedido) }}
              className="p-1.5 rounded-md text-[var(--color-text-secondary)] hover:bg-[#262626] hover:text-[#8B5CF6] transition-colors"
              title="Editar"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(pedido) }}
              className="p-1.5 rounded-md text-[var(--color-text-secondary)] hover:bg-[#EF4444]/10 hover:text-[#EF4444] transition-colors"
              title="Excluir"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Highlighted Value */}
        <div className="mb-4">
          <p className="text-2xl font-black text-white tracking-tight">
            {formatarValor(pedido.valor)}
          </p>
        </div>

        {/* Info grid */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-[var(--color-text-secondary)] font-medium">
              <Receipt size={12} />
              NF
            </span>
            <span className="font-semibold text-[var(--color-text-primary)]">{pedido.numero_nf}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-[var(--color-text-secondary)] font-medium">
              <Layers size={12} />
              Boleto
            </span>
            <span className="font-mono text-[var(--color-text-primary)] tracking-wide">...{pedido.digitos_boleto}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-[var(--color-text-secondary)] font-medium">
              <Calendar size={12} />
              {pedido.proxima_parcela ? `Parcela ${pedido.proxima_parcela}` : 'Vencimento'}
            </span>
            <span className={`font-bold ${vencimentoColor}`}>
              {getVencimentoText(pedido.data_vencimento_efetiva || pedido.data_vencimento, pedido.status)}
            </span>
          </div>
        </div>

        {/* Observações Mini */}
        {pedido.observacoes && (
          <div className="mt-4 pt-3 border-t border-[rgba(255,255,255,0.04)]">
            <p className="text-[10px] text-[var(--color-text-secondary)] line-clamp-1">
              <span className="font-semibold mr-1">Obs:</span>
              {pedido.observacoes}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
