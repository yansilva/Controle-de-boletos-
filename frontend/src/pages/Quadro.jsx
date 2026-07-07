import { useState, useEffect, useCallback } from 'react'
import KanbanBoard from '../components/KanbanBoard'
import SearchBar from '../components/SearchBar'
import FilterBar from '../components/FilterBar'
import EditModal from '../components/EditModal'
import DetailModal from '../components/DetailModal'
import HistoricoModal from '../components/HistoricoModal'
import { listarPedidos, excluirPedido, atualizarAtencao, formatarValor } from '../api/pedidos'
import { Trash2, AlertCircle, CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'

export default function Quadro() {
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState({})
  const [editPedido, setEditPedido] = useState(null)
  const [viewPedido, setViewPedido] = useState(null)
  const [historicoPedido, setHistoricoPedido] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [toast, setToast] = useState(null)

  const loadPedidos = useCallback(async (extraFiltros = {}) => {
    try {
      const merged = { ...filtros, ...extraFiltros }
      const data = await listarPedidos(merged)
      setPedidos(data)
    } catch (err) {
      console.error('Erro ao carregar pedidos:', err)
    } finally {
      setLoading(false)
    }
  }, [filtros])

  useEffect(() => {
    loadPedidos()
    // Escutar evento global de novo pedido criado pelo modal no header
    const handler = () => loadPedidos()
    window.addEventListener('pedido-criado', handler)
    return () => window.removeEventListener('pedido-criado', handler)
  }, [loadPedidos])

  function handleStatusChange(pedidoId, novoStatus, sourceId, sourceIndex, destId, destIndex) {
    setPedidos(prev => {
      const newPedidos = [...prev]
      const itemIndex = newPedidos.findIndex(p => p.id === pedidoId)
      if (itemIndex === -1) return prev

      const item = { ...newPedidos[itemIndex], status: novoStatus }
      newPedidos.splice(itemIndex, 1)

      if (destIndex !== undefined) {
        const destGroup = newPedidos.filter(p => p.status === novoStatus)
        if (destIndex >= destGroup.length) {
          newPedidos.push(item)
        } else {
          const targetItem = destGroup[destIndex]
          const targetGlobalIndex = newPedidos.findIndex(p => p.id === targetItem.id)
          newPedidos.splice(targetGlobalIndex, 0, item)
        }
      } else {
        newPedidos.push(item)
      }

      return newPedidos
    })
  }

  async function handleAtencaoToggle(pedidoId, currentValue) {
    const novoValor = currentValue ? 0 : 1;
    setPedidos(prev => prev.map(p => p.id === pedidoId ? { ...p, atencao: novoValor } : p));
    try {
      await atualizarAtencao(pedidoId, novoValor === 1);
    } catch (error) {
      console.error('Erro ao atualizar atenção:', error);
      showToast('Erro ao atualizar atenção', 'error');
      setPedidos(prev => prev.map(p => p.id === pedidoId ? { ...p, atencao: currentValue } : p));
    }
  }

  function handleSearch(busca) {
    setFiltros(prev => ({ ...prev, busca }))
    loadPedidos({ busca })
  }

  function handleFilter(newFilters) {
    setFiltros(prev => ({ ...prev, ...newFilters }))
    loadPedidos(newFilters)
  }

  function handleClearFilters() {
    setFiltros({})
    loadPedidos({ data_inicio: '', data_fim: '', valor_min: '', valor_max: '', busca: '' })
  }

  async function handleDelete(pedido) {
    setDeleteConfirm(pedido)
  }

  async function confirmDelete() {
    if (!deleteConfirm) return
    try {
      await excluirPedido(deleteConfirm.id)
      setPedidos(prev => prev.filter(p => p.id !== deleteConfirm.id))
      showToast('Pedido excluído com sucesso', 'success')
    } catch (err) {
      showToast('Erro ao excluir pedido', 'error')
    } finally {
      setDeleteConfirm(null)
    }
  }

  function showToast(message, type) {
    setToast({ message, type })
    setTimeout(() => setToast(prev => prev ? { ...prev, exiting: true } : null), 2500)
    setTimeout(() => setToast(null), 2800)
  }

  const totalPedidos = pedidos.length
  const totalValor = pedidos.reduce((sum, p) => sum + (p.valor || 0), 0)
  
  return (
    <div className="space-y-6 animate-fade-in-up h-full flex flex-col">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-fade-in-up stagger-1">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Quadro Kanban</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Arraste os cards para atualizar o status dos pagamentos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="default" className="text-sm px-3 py-1.5 bg-[#171717]">
            {totalPedidos} Boletos
          </Badge>
          <Badge className="text-sm px-3 py-1.5 bg-[var(--color-accent-glow)] text-[var(--color-accent)] border-[var(--color-accent)]/20 shadow-[0_0_10px_rgba(124,58,237,0.2)]">
            Total: {formatarValor(totalValor)}
          </Badge>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 animate-fade-in-up stagger-2">
        <SearchBar onSearch={handleSearch} />
        <FilterBar onFilter={handleFilter} onClear={handleClearFilters} />
      </div>

      {/* Kanban Board Container */}
      <div className="flex-1 min-h-[500px] animate-fade-in-up stagger-3">
        {loading ? (
          <div className="flex items-center justify-center h-full min-h-[400px]">
            <Loader2 size={32} className="animate-spin text-[var(--color-accent)]" />
          </div>
        ) : (
          <KanbanBoard
            pedidos={pedidos}
            onStatusChange={handleStatusChange}
            onAtencaoToggle={handleAtencaoToggle}
            onEdit={setEditPedido}
            onDelete={handleDelete}
            onHistorico={setHistoricoPedido}
            onView={setViewPedido}
          />
        )}
      </div>

      {/* Modals */}
      {viewPedido && (
        <DetailModal
          pedido={viewPedido}
          onClose={() => setViewPedido(null)}
        />
      )}

      {/* Edit Modal */}
      {editPedido && (
        <EditModal
          pedido={editPedido}
          onClose={() => setEditPedido(null)}
          onSaved={() => loadPedidos()}
        />
      )}

      {/* Historico Modal */}
      {historicoPedido && (
        <HistoricoModal
          pedido={historicoPedido}
          onClose={() => setHistoricoPedido(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in-up"
          onClick={() => setDeleteConfirm(null)}>
          <Card className="w-full max-w-sm p-6 text-center border-[#EF4444]/30" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 bg-[#EF4444]/10 text-[#EF4444]">
              <Trash2 size={28} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Excluir Pedido?</h3>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">
              Tem certeza que deseja excluir o pedido <strong className="text-white">#{deleteConfirm.pedido_tiny}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setDeleteConfirm(null)}>
                Cancelar
              </Button>
              <Button className="flex-1 bg-[#EF4444] hover:bg-[#DC2626] shadow-[0_0_15px_rgba(239,68,68,0.3)]" onClick={confirmDelete}>
                Excluir
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Toast Animado */}
      {toast && (
        <div className={`fixed bottom-8 right-8 z-50 px-6 py-4 rounded-xl text-sm font-medium shadow-2xl flex items-center gap-3 border ${
          toast.type === 'success' 
            ? 'bg-[#064E3B] text-[#34D399] border-[#10B981]/30' 
            : 'bg-[#7F1D1D] text-[#FCA5A5] border-[#EF4444]/30'
        } ${toast.exiting ? 'animate-fade-out-down' : 'animate-fade-in-up'}`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          {toast.message}
        </div>
      )}
    </div>
  )
}
