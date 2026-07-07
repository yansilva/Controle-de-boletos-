import { useState, useRef, useEffect, useCallback } from 'react'
import { criarPedido, STATUS_MAP, formatarValor, calcularValorParcela } from '../api/pedidos'
import { Input } from './ui/Input'
import { Button } from './ui/Button'
import { 
  FileText, Receipt, Hash, Calendar, 
  Layers, Package, AlertTriangle, Save, CheckCircle2, XCircle, AlertCircle, Barcode, X, Plus
} from 'lucide-react'

const statusOptions = [
  { value: 'falta_dda', label: 'Falta o DDA', color: '#EF4444', icon: AlertCircle },
  { value: 'aguardando_dda', label: 'DDA não aparece', color: '#F59E0B', icon: AlertTriangle },
  { value: 'dda_lancado', label: 'DDA Lançado', color: '#10B981', icon: CheckCircle2 },
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
  })
  const [parcelas, setParcelas] = useState([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [toast, setToast] = useState(null)

  const firstInputRef = useRef(null)
  const formRef = useRef(null)

  // Autofocus no campo Pedido Tiny ao abrir
  useEffect(() => {
    if (isOpen && !success) {
      setTimeout(() => {
        firstInputRef.current?.focus()
      }, 150)
    }
  }, [isOpen, success])

  // ESC fecha o modal
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  // Bloquear scroll do body
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Enter navega entre campos (não submeta o form)
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && e.target.type !== 'submit') {
      e.preventDefault()
      const formEl = formRef.current
      if (!formEl) return

      const focusable = Array.from(formEl.querySelectorAll(
        'input:not([type="checkbox"]):not([type="hidden"]), textarea, select, button[type="submit"]'
      )).filter(el => !el.disabled && el.offsetParent !== null)
      
      const idx = focusable.indexOf(e.target)
      if (idx >= 0 && idx < focusable.length - 1) {
        focusable[idx + 1].focus()
      } else if (idx === focusable.length - 1) {
        // Último campo — submeter
        formEl.requestSubmit()
      }
    }
  }, [])

  function resetForm() {
    setForm({ pedido_tiny: '', numero_nf: '', digitos_boleto: '', valor: '', data_vencimento: '', observacoes: '', num_parcelas: 1, status: 'falta_dda', atencao: false })
    setParcelas([])
    setSuccess(false)
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
    e.preventDefault()

    const valorNumerico = parseValor(form.valor)
    if (!form.pedido_tiny || !form.numero_nf || valorNumerico <= 0) {
      showToast('Preencha todos os campos corretamente', 'error')
      return
    }

    if (form.num_parcelas <= 1 && !form.digitos_boleto) {
      showToast('Preencha os dígitos do boleto', 'error')
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
      }

      await criarPedido(dadosEnvio)
      if (onPedidoCriado) onPedidoCriado()
      setSuccess(true)
    } catch (err) {
      showToast(err.message || 'Erro ao cadastrar pedido', 'error')
    } finally {
      setLoading(false)
    }
  }

  function handleNewPedido() {
    resetForm()
    setTimeout(() => firstInputRef.current?.focus(), 150)
  }

  function handleCloseModal() {
    resetForm()
    onClose()
  }

  function showToast(message, type) {
    setToast({ message, type })
    setTimeout(() => setToast(prev => prev ? { ...prev, exiting: true } : null), 2500)
    setTimeout(() => setToast(null), 2800)
  }

  if (!isOpen) return null

  const valorNumerico = parseValor(form.valor)
  const temParcelas = form.num_parcelas > 1
  const valorParcela = temParcelas && valorNumerico > 0 ? valorNumerico / form.num_parcelas : 0

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) handleCloseModal() }}
    >
      <div className="modal-content w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#171717] border border-[rgba(255,255,255,0.1)] rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.6)]">
        
        {/* Success State */}
        {success ? (
          <div className="p-10 flex flex-col items-center justify-center text-center space-y-6 animate-fade-in-up">
            <div className="w-20 h-20 rounded-full bg-[#10B981]/10 flex items-center justify-center border-2 border-[#10B981]/30">
              <CheckCircle2 size={40} className="text-[#10B981]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Pedido cadastrado!</h2>
              <p className="text-sm text-[var(--color-text-secondary)] mt-2">O boleto foi adicionado ao sistema com sucesso.</p>
            </div>
            <div className="flex gap-3 w-full max-w-xs">
              <Button variant="secondary" className="flex-1" onClick={handleCloseModal}>
                Fechar
              </Button>
              <Button className="flex-1 flex gap-2" onClick={handleNewPedido}>
                <Plus size={16} />
                Novo Pedido
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 pb-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#7C3AED]/20 to-[#8B5CF6]/10 border border-[#7C3AED]/20 text-[#8B5CF6]">
                  <FileText size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-white">Novo Pedido DDA</h2>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Preencha os dados do boleto</p>
                </div>
              </div>
              <button 
                onClick={handleCloseModal}
                className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:text-white hover:bg-[#262626] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form ref={formRef} onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="p-6 space-y-6">
              
              {/* Identificação */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-widest">Identificação</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-[var(--color-text-secondary)]">Nº Pedido Tiny</label>
                    <Input ref={firstInputRef} icon={Hash} name="pedido_tiny" value={form.pedido_tiny} onChange={handleChange} placeholder="Ex: 123456" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-[var(--color-text-secondary)]">Número da NF</label>
                    <Input icon={Receipt} name="numero_nf" value={form.numero_nf} onChange={handleChange} placeholder="Ex: 789012" />
                  </div>
                </div>
              </div>

              {/* Financeiro */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-widest">Financeiro</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-[var(--color-text-secondary)]">Valor</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#A1A1AA]">R$</span>
                      <input 
                        name="valor" 
                        value={form.valor} 
                        onChange={handleValorChange} 
                        placeholder="0,00"
                        className="w-full bg-[#111827] border border-[rgba(255,255,255,0.08)] rounded-xl h-12 text-sm text-white placeholder-[#A1A1AA] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/40 focus:border-[#7C3AED] hover:border-[rgba(255,255,255,0.15)]"
                        style={{ paddingLeft: '2.5rem', paddingRight: '1rem' }}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-[var(--color-text-secondary)]">Parcelas</label>
                    <Input icon={Layers} type="number" name="num_parcelas" min="1" max={MAX_PARCELAS} value={form.num_parcelas} onChange={handleNumParcelasChange} />
                  </div>
                  {!temParcelas && (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-[var(--color-text-secondary)]">Vencimento</label>
                      <Input icon={Calendar} type="date" name="data_vencimento" value={form.data_vencimento} onChange={handleChange} style={{ colorScheme: 'dark' }} />
                    </div>
                  )}
                </div>

                {!temParcelas && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-[var(--color-text-secondary)]">Últimos dígitos do boleto</label>
                    <Input icon={Barcode} name="digitos_boleto" value={form.digitos_boleto} onChange={handleChange} placeholder="Ex: 4567" />
                  </div>
                )}

                {temParcelas && valorNumerico > 0 && (
                  <p className="text-xs font-medium text-[var(--color-accent)] bg-[var(--color-accent-glow)] w-max px-3 py-1 rounded-full">
                    {form.num_parcelas} parcelas de {formatarValor(valorParcela)}
                  </p>
                )}
              </div>

              {/* Parcelas Dinâmicas */}
              {temParcelas && (
                <div className="space-y-3 bg-[#111827]/50 rounded-xl p-4 border border-[rgba(255,255,255,0.04)]">
                  <div className="flex items-center gap-2">
                    <Package className="text-[var(--color-text-secondary)]" size={16} />
                    <h3 className="text-xs font-semibold text-white">Parcelas</h3>
                  </div>
                  <div className="space-y-2">
                    {parcelas.map((parcela, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-[#171717] border border-[rgba(255,255,255,0.06)]">
                        <span className="w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold text-[var(--color-accent)] bg-[var(--color-accent-glow)] flex-shrink-0">
                          {idx + 1}
                        </span>
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <Input icon={Calendar} type="date" value={parcela.data_vencimento} onChange={(e) => handleParcelaChange(idx, 'data_vencimento', e.target.value)} style={{ colorScheme: 'dark' }} />
                          <Input icon={Barcode} value={parcela.digitos_boleto} onChange={(e) => handleParcelaChange(idx, 'digitos_boleto', e.target.value)} placeholder="Dígitos" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Observações */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[var(--color-text-secondary)]">Observações</label>
                <textarea
                  name="observacoes"
                  value={form.observacoes}
                  onChange={handleChange}
                  placeholder="Notas especiais sobre o pedido..."
                  className="w-full bg-[#111827] border border-[rgba(255,255,255,0.08)] rounded-xl p-3 text-sm text-white placeholder-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/40 focus:border-[#7C3AED] resize-none h-20 hover:border-[rgba(255,255,255,0.15)] transition-colors"
                />
              </div>

              {/* Atenção + Status */}
              <div className="bg-[#111827] border border-[rgba(255,255,255,0.06)] rounded-xl p-4 space-y-4">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center w-5 h-5 border border-[#EF4444]/40 rounded bg-[#171717] transition-colors group-hover:border-[#EF4444]">
                    <input type="checkbox" name="atencao" checked={form.atencao} onChange={handleChange} className="opacity-0 absolute w-full h-full cursor-pointer z-10" />
                    {form.atencao && <div className="w-3 h-3 bg-[#EF4444] rounded-sm shadow-[0_0_8px_rgba(239,68,68,0.6)]" />}
                  </div>
                  <span className="text-sm font-medium text-white flex items-center gap-2">
                    <AlertTriangle size={14} className={form.atencao ? 'text-[#EF4444]' : 'text-[#A1A1AA]'} />
                    Verificar com Tanaka
                  </span>
                </label>

                <div className="space-y-2">
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)]">Status Inicial</label>
                  <div className="flex gap-2">
                    {statusOptions.map(opt => {
                      const isActive = form.status === opt.value
                      const Icon = opt.icon
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setForm(prev => ({ ...prev, status: opt.value }))}
                          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 border ${
                            isActive 
                              ? 'bg-[var(--color-card)]'
                              : 'bg-[#171717]/50 border-transparent text-[#A1A1AA] hover:bg-[#262626]'
                          }`}
                          style={{
                            borderColor: isActive ? opt.color : 'transparent',
                            color: isActive ? opt.color : undefined,
                          }}
                        >
                          <Icon size={14} />
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex gap-3 pt-2">
                <Button variant="secondary" className="flex-1" type="button" onClick={handleCloseModal}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading} className="flex-1 flex gap-2">
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Salvar Pedido
                    </>
                  )}
                </Button>
              </div>
            </form>
          </>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-8 right-8 z-[200] px-6 py-4 rounded-xl text-sm font-medium shadow-2xl flex items-center gap-3 border ${
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
