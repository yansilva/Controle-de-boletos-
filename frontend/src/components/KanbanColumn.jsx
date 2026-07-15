import { Droppable, Draggable } from '@hello-pangea/dnd'
import PedidoCard from './PedidoCard'
import { STATUS_MAP } from '../api/pedidos'
import { AlertCircle, Clock, CheckCircle2, Inbox } from 'lucide-react'
import { Badge } from './ui/Badge'

const colorConfig = {
  red: {
    border: 'border-[#EF4444]/20',
    headerBg: 'bg-[#EF4444]/5',
    text: 'text-[#EF4444]',
    icon: AlertCircle,
    dropBg: 'bg-[#EF4444]/[0.02]',
  },
  yellow: {
    border: 'border-[#F59E0B]/20',
    headerBg: 'bg-[#F59E0B]/5',
    text: 'text-[#F59E0B]',
    icon: Clock,
    dropBg: 'bg-[#F59E0B]/[0.02]',
  },
  green: {
    border: 'border-[#10B981]/20',
    headerBg: 'bg-[#10B981]/5',
    text: 'text-[#10B981]',
    icon: CheckCircle2,
    dropBg: 'bg-[#10B981]/[0.02]',
  },
}

export default function KanbanColumn({ statusKey, pedidos, onAtencaoToggle, onEdit, onDelete, onHistorico, onView }) {
  const statusInfo = STATUS_MAP[statusKey] || { color: 'green', label: 'Desconhecido' }
  const colors = colorConfig[statusInfo.color] || colorConfig.green
  const Icon = colors.icon

  return (
    <div className={`flex flex-col w-full rounded-2xl h-full border ${colors.border} bg-[#111827] shadow-sm transition-colors`}>
      {/* Column Header */}
      <div className={`px-5 py-4 border-b ${colors.border} ${colors.headerBg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Icon size={18} className={colors.text} />
            <h3 className="text-sm font-semibold text-white tracking-tight">{statusInfo.label}</h3>
          </div>
          <Badge className={`px-2 py-0.5 rounded-md text-xs font-bold bg-[#171717] ${colors.text} border border-[rgba(255,255,255,0.08)]`}>
            {pedidos.length}
          </Badge>
        </div>
      </div>

      {/* Droppable Area */}
      <Droppable droppableId={statusKey}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 p-4 overflow-y-auto overflow-x-visible transition-colors duration-200 ${snapshot.isDraggingOver ? colors.dropBg : 'bg-transparent'}`}
            style={{ minHeight: '300px' }}
          >
            <div className="space-y-4">
              {pedidos.map((pedido, index) => (
                <Draggable key={pedido.id} draggableId={String(pedido.id)} index={index}>
                  {(provided, snapshot) => (
                    <PedidoCard
                      pedido={pedido}
                      provided={provided}
                      isDragging={snapshot.isDragging}
                      onAtencaoToggle={onAtencaoToggle}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onHistorico={onHistorico}
                      onView={onView}
                    />
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
            
            {pedidos.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center opacity-40">
                <Inbox size={32} className="mb-3 text-[var(--color-text-secondary)]" />
                <p className="text-xs font-medium text-[var(--color-text-secondary)]">Nenhum pedido</p>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  )
}
