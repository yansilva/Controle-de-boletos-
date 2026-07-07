import { DragDropContext } from '@hello-pangea/dnd'
import KanbanColumn from './KanbanColumn'
import { COLUNAS_ORDER, atualizarStatus } from '../api/pedidos'

export default function KanbanBoard({ pedidos, onStatusChange, onAtencaoToggle, onEdit, onDelete, onHistorico, onView }) {
  // Agrupa pedidos por status e mantém ordenação por vencimento
  const colunas = {}
  COLUNAS_ORDER.forEach(status => {
    colunas[status] = pedidos
      .filter(p => p.status === status)
      .sort((a, b) => {
        const dataA = a.data_vencimento_efetiva || a.data_vencimento;
        const dataB = b.data_vencimento_efetiva || b.data_vencimento;
        // Sem data vai para o final
        if (!dataA && !dataB) return 0;
        if (!dataA) return 1;
        if (!dataB) return -1;
        return new Date(dataA) - new Date(dataB);
      })
  })

  async function handleDragEnd(result) {
    const { destination, source, draggableId } = result

    // Se não soltou em uma área válida, não faz nada
    if (!destination) return

    // Se soltou no mesmo lugar, não faz nada
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    const novoStatus = destination.droppableId
    const pedidoId = parseInt(draggableId)

    // Atualização otimista - chama callback imediatamente
    onStatusChange(pedidoId, novoStatus, source.droppableId, source.index, destination.droppableId, destination.index)

    try {
      await atualizarStatus(pedidoId, novoStatus)
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      // Reverter em caso de erro — recarrega lista
      onStatusChange(pedidoId, source.droppableId)
    }
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="w-full overflow-x-auto pb-3 px-1">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:min-w-[980px] xl:min-w-0" style={{ minHeight: '500px' }}>
          {COLUNAS_ORDER.map(statusKey => (
            <KanbanColumn
              key={statusKey}
              statusKey={statusKey}
              pedidos={colunas[statusKey]}
              onAtencaoToggle={onAtencaoToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              onHistorico={onHistorico}
              onView={onView}
            />
          ))}
        </div>
      </div>
    </DragDropContext>
  )
}
