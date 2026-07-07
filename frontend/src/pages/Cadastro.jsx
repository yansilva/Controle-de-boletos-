import { useState, useEffect } from 'react'
import { listarPedidos, formatarValor, STATUS_MAP } from '../api/pedidos'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { 
  FileText, Activity, CheckCircle2, TrendingUp, AlertTriangle, 
  ChevronRight, Inbox, CalendarClock, DollarSign, BarChart3
} from 'lucide-react'

export default function Cadastro() {
  const [pedidos, setPedidos] = useState([])
  const [ultimosPedidos, setUltimosPedidos] = useState([])
  const [metricas, setMetricas] = useState({
    total: 0,
    valorAberto: 0,
    atrasados: 0,
    lancados: 0,
    vencemHoje: 0,
    totalFinanceiro: 0,
  })

  useEffect(() => {
    loadData()
    // Escutar evento global de novo pedido criado
    const handler = () => loadData()
    window.addEventListener('pedido-criado', handler)
    return () => window.removeEventListener('pedido-criado', handler)
  }, [])

  async function loadData() {
    try {
      const data = await listarPedidos()
      setPedidos(data)
      
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)

      let total = 0, valorAberto = 0, atrasados = 0, lancados = 0, vencemHoje = 0, totalFinanceiro = 0

      data.forEach(p => {
        total++
        totalFinanceiro += p.valor || 0
        if (p.status !== 'dda_lancado') valorAberto += p.valor
        if (p.status === 'falta_dda' || p.status === 'aguardando_dda') atrasados++
        if (p.status === 'dda_lancado') lancados++

        const venc = p.data_vencimento_efetiva || p.data_vencimento
        if (venc) {
          const dataVenc = new Date(venc + 'T00:00:00')
          if (dataVenc.getTime() === hoje.getTime() && p.status !== 'dda_lancado') {
            vencemHoje++
          }
        }
      })
      
      setMetricas({ total, valorAberto, atrasados, lancados, vencemHoje, totalFinanceiro })

      const ordenados = [...data].sort((a, b) => {
        const dataA = a.criado_em ? new Date(a.criado_em) : new Date(0)
        const dataB = b.criado_em ? new Date(b.criado_em) : new Date(0)
        return dataB - dataA
      })
      setUltimosPedidos(ordenados.slice(0, 10))
    } catch (err) {
      console.error('Erro ao carregar pedidos:', err)
    }
  }

  const getBadgeVariant = (statusId) => {
    switch (statusId) {
      case 'falta_dda': return 'red'
      case 'aguardando_dda': return 'yellow'
      case 'dda_lancado': return 'green'
      default: return 'default'
    }
  }

  // Dados para gráfico de barras por status
  const statusCounts = {
    falta_dda: pedidos.filter(p => p.status === 'falta_dda').length,
    aguardando_dda: pedidos.filter(p => p.status === 'aguardando_dda').length,
    dda_lancado: pedidos.filter(p => p.status === 'dda_lancado').length,
  }
  const maxCount = Math.max(...Object.values(statusCounts), 1)

  // Dados para mini chart de valores por semana (últimas 4 semanas)
  const weeklyData = (() => {
    const weeks = []
    const now = new Date()
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - (i * 7) - now.getDay())
      weekStart.setHours(0, 0, 0, 0)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 7)
      
      const count = pedidos.filter(p => {
        const d = p.criado_em ? new Date(p.criado_em) : null
        return d && d >= weekStart && d < weekEnd
      }).length

      const labels = ['4 sem', '3 sem', '2 sem', 'Esta sem']
      weeks.push({ label: labels[3 - i], count })
    }
    return weeks
  })()
  const maxWeekly = Math.max(...weeklyData.map(w => w.count), 1)

  // Boletos lançados por dia da semana
  const dayLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
  const dayData = (() => {
    const counts = [0, 0, 0, 0, 0, 0, 0]
    pedidos.filter(p => p.status === 'dda_lancado').forEach(p => {
      const d = p.criado_em ? new Date(p.criado_em) : null
      if (d) {
        const day = d.getDay()
        // JS: 0=Dom, 1=Seg... → remap: Seg=0
        counts[day === 0 ? 6 : day - 1]++
      }
    })
    return counts
  })()
  const maxDay = Math.max(...dayData, 1)

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Page Title */}
      <div className="animate-fade-in-up stagger-1">
        <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Visão geral financeira dos boletos DDA.
        </p>
      </div>

      {/* Metrics Row — 6 cards full width */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 animate-fade-in-up stagger-2">
        <MetricCard label="Pedidos" value={metricas.total} icon={FileText} />
        <MetricCard label="Valor Pendente" value={formatarValor(metricas.valorAberto)} icon={TrendingUp} color="warning" />
        <MetricCard label="Lançados" value={metricas.lancados} icon={CheckCircle2} color="success" />
        <MetricCard label="Atrasados" value={metricas.atrasados} icon={AlertTriangle} color="danger" />
        <MetricCard label="Vencem Hoje" value={metricas.vencemHoje} icon={CalendarClock} color={metricas.vencemHoje > 0 ? 'warning' : 'default'} />
        <MetricCard label="Total Financeiro" value={formatarValor(metricas.totalFinanceiro)} icon={DollarSign} color="accent" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fade-in-up stagger-3">
        {/* Pedidos por Status */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-[var(--color-text-secondary)]" />
            <h3 className="text-sm font-semibold text-white">Pedidos por Status</h3>
          </div>
          <div className="space-y-3">
            {[
              { key: 'falta_dda', label: 'Falta DDA', color: '#EF4444', count: statusCounts.falta_dda },
              { key: 'aguardando_dda', label: 'Não aparece', color: '#F59E0B', count: statusCounts.aguardando_dda },
              { key: 'dda_lancado', label: 'Lançados', color: '#10B981', count: statusCounts.dda_lancado },
            ].map(s => (
              <div key={s.key} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--color-text-secondary)] font-medium">{s.label}</span>
                  <span className="font-bold" style={{ color: s.color }}>{s.count}</span>
                </div>
                <div className="w-full h-2.5 bg-[#111827] rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ 
                      width: `${(s.count / maxCount) * 100}%`,
                      backgroundColor: s.color,
                      boxShadow: `0 0 8px ${s.color}40`,
                      minWidth: s.count > 0 ? '8px' : '0'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Pedidos por Semana */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-5">
            <Activity size={16} className="text-[var(--color-text-secondary)] flex-shrink-0" />
            <h3 className="text-sm font-semibold text-white">Cadastros por Semana</h3>
          </div>
          <div className="flex items-end gap-3" style={{ height: '140px' }}>
            {weeklyData.map((w, i) => (
              <div key={i} className="flex-1 flex flex-col items-center h-full">
                <span className="text-[10px] font-bold text-[var(--color-text-secondary)] mb-1">{w.count}</span>
                <div className="w-full flex-1 bg-[#111827] rounded-md overflow-hidden relative">
                  <div 
                    className="absolute bottom-0 w-full rounded-md transition-all duration-700 ease-out"
                    style={{ 
                      height: `${(w.count / maxWeekly) * 100}%`,
                      background: 'linear-gradient(to top, #7C3AED, #8B5CF6)',
                      minHeight: w.count > 0 ? '4px' : '0'
                    }}
                  />
                </div>
                <span className="text-[10px] text-[var(--color-text-secondary)] font-medium mt-2">{w.label}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Boletos Lançados por Dia */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-5">
            <CheckCircle2 size={16} className="text-[var(--color-text-secondary)] flex-shrink-0" />
            <h3 className="text-sm font-semibold text-white">Lançados por Dia</h3>
          </div>
          <div className="flex items-end gap-2" style={{ height: '140px' }}>
            {dayLabels.map((label, i) => (
              <div key={i} className="flex-1 flex flex-col items-center h-full">
                <span className="text-[10px] font-bold text-[var(--color-text-secondary)] mb-1">{dayData[i]}</span>
                <div className="w-full flex-1 bg-[#111827] rounded-md overflow-hidden relative">
                  <div 
                    className="absolute bottom-0 w-full rounded-md transition-all duration-700 ease-out"
                    style={{ 
                      height: `${(dayData[i] / maxDay) * 100}%`,
                      background: 'linear-gradient(to top, #10B981, #34D399)',
                      minHeight: dayData[i] > 0 ? '6px' : '0'
                    }}
                  />
                </div>
                <span className="text-[10px] text-[var(--color-text-secondary)] font-medium mt-2">{label}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Activity Table — Full Width */}
      <div className="space-y-4 animate-fade-in-up stagger-4">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-[var(--color-text-secondary)]" />
          <h2 className="text-base font-semibold text-white tracking-tight">Atividade Recente</h2>
        </div>
        
        <Card className="overflow-hidden">
          {ultimosPedidos.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.04)] bg-[rgba(255,255,255,0.02)]">
                    <th className="py-3.5 px-5 text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Pedido / NF</th>
                    <th className="py-3.5 px-5 text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider hidden sm:table-cell">Valor</th>
                    <th className="py-3.5 px-5 text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider hidden md:table-cell">Vencimento</th>
                    <th className="py-3.5 px-5 text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Status</th>
                    <th className="py-3.5 px-5 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {ultimosPedidos.map((pedido) => {
                    const statusInfo = STATUS_MAP[pedido.status] || { label: 'Desconhecido' }
                    const venc = pedido.data_vencimento_efetiva || pedido.data_vencimento
                    return (
                      <tr 
                        key={pedido.id} 
                        className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)] transition-colors group"
                      >
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#111827] border border-[rgba(255,255,255,0.06)] flex items-center justify-center text-[var(--color-text-secondary)] group-hover:text-white transition-colors">
                              <FileText size={14} />
                            </div>
                            <div>
                              <div className="font-medium text-white">#{pedido.pedido_tiny}</div>
                              <div className="text-xs text-[var(--color-text-secondary)]">NF: {pedido.numero_nf}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-5 font-medium hidden sm:table-cell">
                          {formatarValor(pedido.valor)}
                        </td>
                        <td className="py-3.5 px-5 text-xs text-[var(--color-text-secondary)] hidden md:table-cell">
                          {venc ? new Date(venc + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}
                        </td>
                        <td className="py-3.5 px-5">
                          <Badge variant={getBadgeVariant(pedido.status)}>
                            {statusInfo.label}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-5">
                          <ChevronRight size={14} className="text-[#52525B] group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-14 h-14 rounded-full bg-[rgba(255,255,255,0.04)] flex items-center justify-center mb-3">
                <Inbox size={24} className="text-[var(--color-text-secondary)]" />
              </div>
              <p className="text-white font-medium text-base">Nenhuma atividade</p>
              <p className="text-[var(--color-text-secondary)] text-sm mt-1">Clique em "+ Novo Pedido" para começar.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

// MetricCard Component
function MetricCard({ label, value, icon: Icon, color = 'default' }) {
  const colorMap = {
    default: 'text-white',
    success: 'text-[var(--color-success)]',
    warning: 'text-[var(--color-warning)]',
    danger: 'text-[var(--color-danger)]',
    accent: 'text-[var(--color-accent)]',
  }
  const valueColor = colorMap[color] || colorMap.default

  return (
    <Card className="p-4 flex flex-col justify-between h-[100px] group cursor-default hover:border-[rgba(255,255,255,0.12)] transition-all">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--color-text-secondary)]">{label}</span>
        <Icon size={15} className="text-[#52525B] group-hover:text-[var(--color-text-secondary)] transition-colors" />
      </div>
      <div className={`text-xl font-bold ${valueColor} tracking-tight`}>{value}</div>
    </Card>
  )
}
