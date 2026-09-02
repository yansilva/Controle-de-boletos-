import { useState, useRef, useEffect, useCallback } from 'react'
import { criarPedido, formatarValor } from '../api/pedidos'
import ProdutorAutocomplete from './ProdutorAutocomplete'
import { 
  FileText, FileDigit, Calendar, DollarSign, Layers, 
  AlertTriangle, Save, CheckCircle2, XCircle, X, Plus, Loader2 
} from 'lucide-react'

const statusOptions = [
  { value: 'falta_dda', label: 'Falta o DDA', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' },
  { value: 'aguardando_dda', label: 'Não aparece no Inter', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
  { value: 'dda_lancado', label: 'DDA Lançado', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
]

const MAX_PARCELAS = 12

export default function CadastroPedido({ isOpen, onClose, onPedidoCriado }) {
  const [form, setForm] = useState({
    pedido_tiny: '',
    numero_nf: '',
    digitos_boleto: '',
    valor: '',
    data_vencimento: '',
    observacoes: '',
    num_parcelas: 1,
    status: 'falta_dda',
    atencao: false,
    produtor: '',
  })
  const [parcelas, setParcelas] = useState([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const firstInputRef = useRef(null)

  useEffect(() => {
    if (isOpen && !success) {
      setTimeout(() => firstInputRef.current?.focus(), 150)
    }
  }, [isOpen, success])

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  function resetForm() {
    setForm({ pedido_tiny: '', numero_nf: '', digitos_boleto: '', valor: '', data_vencimento: '', observacoes: '', num_parcelas: 1, status: 'falta_dda', atencao: false, produtor: '' })
    setParcelas([])
    setSuccess(false)
    setError('')
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  function handleNumParcelasChange(e) {
    const num = Math.min(Math.max(parseInt(e.target.value) || 1, 1), MAX_PARCELAS)
    setForm(prev => ({ ...prev, num_parcelas: num }))

    if (num > 1) {
      setParcelas(prev => {
        const novasParcelas = []
        for (let i = 0; i < num; i++) {
          novasParcelas.push({
            numero_parcela: i + 1,
            digitos_boleto: prev[i]?.digitos_boleto || '',
            data_vencimento: prev[i]?.data_vencimento || '',
          })
        }
        return novasParcelas
      })
    } else {
      setParcelas([])
    }
  }

  function handleParcelaChange(index, field, value) {
    setParcelas(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  function handleValorChange(e) {
    let digits = e.target.value.replace(/\D/g, '')
    digits = digits.replace(/^0+/, '') || '0'
    digits = digits.padStart(3, '0')
    const cents = digits.slice(-2)
    let intPart = digits.slice(0, -2)
    intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    const formatted = `${intPart},${cents}`
    setForm(prev => ({ ...prev, valor: formatted }))
  }

  function parseValor(valorStr) {
    if (!valorStr) return 0
    let cleaned = valorStr.replace(/\./g, '').replace(',', '.')
    return parseFloat(cleaned) || 0
  }

  async function handleSubmit(e) {
    if (e) e.preventDefault()
    setError('')

    const valorNumerico = parseValor(form.valor)
    if (!form.pedido_tiny || !form.numero_nf || valorNumerico <= 0) {
      setError('Preencha os dados básicos corretamente.')
      return
    }

    if (form.num_parcelas <= 1 && !form.digitos_boleto) {
      setError('Preencha os dígitos do boleto.')
      return
    }

    setLoading(true)
    try {
      const dadosEnvio = {
        pedido_tiny: form.pedido_tiny,
        numero_nf: form.numero_nf,
        digitos_boleto: form.num_parcelas > 1 ? (parcelas[0]?.digitos_boleto || '') : form.digitos_boleto,
        valor: valorNumerico,
        data_vencimento: form.num_parcelas > 1 ? (parcelas[0]?.data_vencimento || '') : form.data_vencimento,
        observacoes: form.observacoes,
        parcelamento: form.num_parcelas > 1 ? String(form.num_parcelas) : '',
        status: form.status,
        atencao: form.atencao,
        parcelas: form.num_parcelas > 1 ? parcelas : [],
        produtor: form.produtor,
      }

      await criarPedido(dadosEnvio)
      if (onPedidoCriado) onPedidoCriado()
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Erro ao cadastrar pedido')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault()
      handleSubmit()
    }
  }

  function handleCloseModal() {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  const valorNumerico = parseValor(form.valor)
  const temParcelas = form.num_parcelas > 1
  const valorParcela = temParcelas && valorNumerico > 0 ? valorNumerico / form.num_parcelas : 0

  // Styles (same as EditModal)
  const inputClass = `w-full h-12 !pl-11 pr-4 rounded-xl text-[15px] text-white placeholder-[var(--color-text-secondary)]/50
    bg-[#09090B] border border-[rgba(255,255,255,0.08)] 
    focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-glow)] outline-none
    transition-all duration-180 hover:border-[rgba(255,255,255,0.15)]`
  
  const labelClass = "block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2"
  const sectionTitleClass = "text-sm font-bold text-white mb-4 pb-2 border-b border-[rgba(255,255,255,0.04)]"

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) handleCloseModal() }}>
      <div className="modal-content w-full max-w-3xl bg-[#171717] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] flex flex-col max-h-[90vh]"
        onKeyDown={handleKeyDown}>
        
        {success ? (
          <div className="p-16 flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-[#10B981]/10 flex items-center justify-center border-2 border-[#10B981]/30">
              <CheckCircle2 size={40} className="text-[#10B981]" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white tracking-tight">Pedido cadastrado!</h2>
              <p className="text-[15px] text-[var(--color-text-secondary)] mt-2">O boleto foi adicionado ao sistema com sucesso.</p>
            </div>
            <div className="flex gap-4 w-full max-w-sm mt-4">
              <button onClick={handleCloseModal}
                className="flex-1 py-3.5 rounded-xl text-[15px] font-semibold text-[var(--color-text-secondary)] border border-[rgba(255,255,255,0.08)] hover:text-white hover:bg-[rgba(255,255,255,0.04)] transition-all">
                Fechar
              </button>
              <button onClick={() => { resetForm(); setTimeout(() => firstInputRef.current?.focus(), 150) }}
                className="flex-1 py-3.5 rounded-xl text-[15px] font-bold text-white transition-all flex items-center justify-center gap-2
                  bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] shadow-[0_4px_15px_rgba(124,58,237,0.3)] hover:shadow-[0_6px_25px_rgba(124,58,237,0.5)]">
                <Plus size={18} />
                Novo Pedido
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Header Elegante */}
            <div className="px-8 pt-8 pb-6 border-b border-[rgba(255,255,255,0.06)] relative shrink-0">
              <button onClick={handleCloseModal}
                className="absolute top-6 right-6 w-10 h-10 rounded-xl flex items-center justify-center text-[var(--color-text-secondary)] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-all">
                <X size={20} />
              </button>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#10B981]/20 to-[#059669]/20 border border-[#10B981]/30 flex items-center justify-center text-[#34D399]">
                  <Plus size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Novo Pedido</h2>
                  <p className="text-[15px] text-[var(--color-text-secondary)] mt-0.5">Preencha os dados do boleto para registrar no sistema.</p>
                </div>
              </div>
            </div>

            {/* Formulário com Scroll */}
            <div className="p-8 overflow-y-auto space-y-8 flex-1">
              {error && (
                <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#FCA5A5] text-[15px] font-medium mb-6">
                  <AlertTriangle size={18} />
                  {error}
                </div>
              )}

              {/* Seção: Identificação */}
              <section>
                <h3 className={sectionTitleClass}>Identificação</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>Pedido Tiny</label>
                    <div className="relative">
                      <FileText size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
                      <input type="text" name="pedido_tiny" value={form.pedido_tiny} onChange={handleChange} ref={firstInputRef} className={inputClass} placeholder="Ex: 3676" />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Número NF</label>
                    <div className="relative">
                      <FileText size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
                      <input type="text" name="numero_nf" value={form.numero_nf} onChange={handleChange} className={inputClass} placeholder="Ex: 49464" />
                    </div>
                  </div>
                  {!temParcelas && (
                    <div>
                      <label className={labelClass}>Dígitos Boleto</label>
                      <div className="relative">
                        <FileDigit size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
                        <input type="text" name="digitos_boleto" value={form.digitos_boleto} onChange={handleChange} className={inputClass} placeholder="Ex: 33954" />
                      </div>
                    </div>
                  )}
                  <ProdutorAutocomplete
                    value={form.produtor}
                    onChange={(val) => setForm(prev => ({ ...prev, produtor: val }))}
                    inputClass={inputClass}
                    labelClass={labelClass}
                  />
                </div>
              </section>

              {/* Seção: Financeiro */}
              <section>
                <h3 className={sectionTitleClass}>Financeiro</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>Valor</label>
                    <div className="relative">
                      <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
                      <input type="text" name="valor" value={form.valor} onChange={handleValorChange} className={inputClass} placeholder="0,00" />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Nº de Parcelas</label>
                    <div className="relative">
                      <Layers size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
                      <input type="number" min="1" max={MAX_PARCELAS} value={form.num_parcelas} onChange={handleNumParcelasChange} className={`${inputClass} pr-4 pl-11`} />
                    </div>
                  </div>
                  {!temParcelas && (
                    <div>
                      <label className={labelClass}>Vencimento</label>
                      <div className="relative">
                        <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
                        <input type="date" name="data_vencimento" value={form.data_vencimento} onChange={handleChange} className={inputClass} style={{ colorScheme: 'dark' }} />
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Parcelas Dinâmicas */}
                {temParcelas && (
                  <div className="mt-6 p-6 rounded-2xl bg-[#09090B] border border-[rgba(255,255,255,0.04)]">
                    <div className="flex items-center justify-between mb-5">
                      <h4 className="text-[15px] font-bold text-white">Detalhamento das Parcelas</h4>
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[var(--color-accent-glow)] text-[var(--color-accent)] border border-[var(--color-accent)]/20">
                        {form.num_parcelas}x de {formatarValor(valorParcela)}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {parcelas.map((parcela, idx) => (
                        <div key={idx} className="flex flex-col md:flex-row gap-4 p-4 rounded-xl bg-[#171717] border border-[rgba(255,255,255,0.08)]">
                          <div className="flex items-center gap-3 md:w-32">
                            <span className="w-7 h-7 rounded-lg bg-[rgba(255,255,255,0.04)] flex items-center justify-center text-xs font-bold text-[var(--color-text-secondary)]">
                              {idx + 1}
                            </span>
                            <span className="text-sm font-semibold text-[var(--color-text-secondary)]">Parcela {idx + 1}</span>
                          </div>
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="relative">
                              <FileDigit size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
                              <input type="text" value={parcela.digitos_boleto} onChange={(e) => handleParcelaChange(idx, 'digitos_boleto', e.target.value)} placeholder="Dígitos do Boleto" className={`${inputClass} !h-10 !text-sm pl-9`} />
                            </div>
                            <div className="relative">
                              <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
                              <input type="date" value={parcela.data_vencimento} onChange={(e) => handleParcelaChange(idx, 'data_vencimento', e.target.value)} className={`${inputClass} !h-10 !text-sm pl-9`} style={{ colorScheme: 'dark' }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* Seção: Status (Cards UI) */}
              <section>
                <h3 className={sectionTitleClass}>Status Inicial</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {statusOptions.map(opt => {
                    const isActive = form.status === opt.value
                    return (
                      <button key={opt.value} type="button" onClick={() => setForm(prev => ({ ...prev, status: opt.value }))}
                        className={`flex flex-col gap-3 p-5 rounded-xl border text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#171717] focus:ring-[${opt.color}] ${
                          isActive 
                            ? `bg-[#09090B] border-[${opt.color}] shadow-[0_4px_20px_${opt.color}25] scale-[1.02]`
                            : `bg-[#09090B] border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.15)]`
                        }`}>
                        <div className="flex items-center justify-between w-full">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: opt.bg, color: opt.color }}>
                            <div className="w-3 h-3 rounded-full" style={{ background: opt.color }} />
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isActive ? `border-[${opt.color}]` : 'border-[rgba(255,255,255,0.1)]'}`}>
                            {isActive && <div className="w-2.5 h-2.5 rounded-full" style={{ background: opt.color }} />}
                          </div>
                        </div>
                        <span className={`text-[15px] font-bold ${isActive ? 'text-white' : 'text-[var(--color-text-secondary)]'}`}>{opt.label}</span>
                      </button>
                    )
                  })}
                </div>
              </section>

              {/* Seção: Informações Adicionais */}
              <section>
                <h3 className={sectionTitleClass}>Informações Adicionais</h3>
                <div className="space-y-6">
                  <div>
                    <label className={labelClass}>Observações</label>
                    <textarea name="observacoes" value={form.observacoes} onChange={handleChange}
                      placeholder="Descreva detalhes importantes..."
                      className={`w-full min-h-[120px] p-4 rounded-xl text-[15px] text-white placeholder-[var(--color-text-secondary)]/50
                        bg-[#09090B] border border-[rgba(255,255,255,0.08)] 
                        focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-glow)] outline-none
                        transition-all duration-180 hover:border-[rgba(255,255,255,0.15)] resize-y`} />
                  </div>

                  {/* Modern Switch UI for Tanaka */}
                  <div 
                    className="flex items-center justify-between p-5 rounded-xl bg-[#09090B] border border-[rgba(255,255,255,0.08)] cursor-pointer hover:border-[rgba(255,255,255,0.15)] transition-all group"
                    onClick={() => setForm(prev => ({ ...prev, atencao: !prev.atencao }))}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${form.atencao ? 'bg-[#EF4444]/15 text-[#EF4444]' : 'bg-[rgba(255,255,255,0.04)] text-[var(--color-text-secondary)]'}`}>
                        <AlertTriangle size={20} />
                      </div>
                      <div>
                        <h4 className="text-[15px] font-bold text-white group-hover:text-[var(--color-accent-hover)] transition-colors">Verificar com o Tanaka</h4>
                        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Sinaliza o pedido com um alerta vermelho no quadro Kanban</p>
                      </div>
                    </div>
                    {/* Custom Switch element */}
                    <div className={`relative w-[52px] h-7 rounded-full transition-colors duration-300 ${form.atencao ? 'bg-[#EF4444]' : 'bg-[rgba(255,255,255,0.1)]'}`}>
                      <div className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full shadow-sm transition-transform duration-300 ${form.atencao ? 'translate-x-6' : 'translate-x-0'}`} />
                    </div>
                  </div>
                </div>
              </section>

            </div>

            {/* Footer */}
            <div className="px-8 py-5 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-end gap-3 shrink-0">
              <button type="button" onClick={handleCloseModal}
                className="px-6 py-3 rounded-xl text-[15px] font-semibold text-[var(--color-text-secondary)] border border-[rgba(255,255,255,0.08)] hover:text-white hover:bg-[rgba(255,255,255,0.04)] transition-all">
                Cancelar
              </button>
              <button type="button" onClick={handleSubmit} disabled={loading}
                className="px-8 py-3 rounded-xl text-[15px] font-bold text-white transition-all flex items-center gap-2
                  bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] shadow-[0_4px_15px_rgba(124,58,237,0.3)] hover:shadow-[0_6px_25px_rgba(124,58,237,0.5)] disabled:opacity-50 disabled:shadow-none">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {loading ? 'Salvando...' : 'Salvar Pedido'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
