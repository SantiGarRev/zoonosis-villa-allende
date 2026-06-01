import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Modal from '../components/Modal'
import { format, parseISO, differenceInDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { Bell, Plus, CheckCircle, Clock, AlertTriangle, Filter, X } from 'lucide-react'

const REMINDER_TYPES = ['Vacunación', 'Desparasitación', 'Control veterinario', 'Tratamiento', 'Cirugía', 'Otro']

function fmtDate(d) { return d ? format(parseISO(d), 'dd/MM/yyyy') : '—' }

function StatusBadge({ due_date, status }) {
  if (status === 'completado') return <span className="badge-green">Completado</span>
  if (status === 'cancelado') return <span className="badge-gray">Cancelado</span>
  const days = differenceInDays(parseISO(due_date), new Date())
  if (days < 0) return <span className="badge-red">Vencido ({Math.abs(days)}d)</span>
  if (days === 0) return <span className="badge-red">Hoy</span>
  if (days <= 3) return <span className="badge-yellow">En {days} días</span>
  if (days <= 7) return <span className="badge-yellow">En {days} días</span>
  return <span className="badge-blue">En {days} días</span>
}

export default function Recordatorios() {
  const { user } = useAuth()
  const [reminders, setReminders] = useState([])
  const [animals, setAnimals] = useState([])
  const [unneuteredAnimals, setUnneuteredAnimals] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pendiente') // pendiente|completado|todos|castracion
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ animal_id: '', type: 'Vacunación', due_date: '', title: '', description: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [remRes, animRes, unneutRes] = await Promise.all([
      supabase.from('reminders').select('*, animals(name, species)').order('due_date', { ascending: true }),
      supabase.from('animals').select('id, name').eq('is_active', true).order('name'),
      supabase.from('animals')
        .select('id, name, species, location, animal_status')
        .eq('is_active', true)
        .eq('is_neutered', false)
        .neq('animal_status', 'fallecido')
        .order('name'),
    ])
    setReminders(remRes.data || [])
    setAnimals(animRes.data || [])
    setUnneuteredAnimals(unneutRes.data || [])
    setLoading(false)
  }

  async function createCastrationReminder(animal) {
    const due = new Date()
    due.setDate(due.getDate() + 30)
    await supabase.from('reminders').insert([{
      animal_id: animal.id,
      type: 'Cirugía',
      title: `Castración pendiente: ${animal.name}`,
      due_date: due.toISOString().split('T')[0],
      status: 'pendiente',
      created_by: (await supabase.auth.getUser()).data.user?.id,
    }])
    loadData()
  }

  async function markDone(id) {
    await supabase.from('reminders').update({ status: 'completado' }).eq('id', id)
    loadData()
  }

  async function deleteReminder(id) {
    if (!confirm('¿Eliminar recordatorio?')) return
    await supabase.from('reminders').delete().eq('id', id)
    loadData()
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('reminders').insert([{
      ...form,
      status: 'pendiente',
      created_by: user.id,
    }])
    setSaving(false)
    setModalOpen(false)
    setForm({ animal_id: '', type: 'Vacunación', due_date: '', title: '', description: '' })
    loadData()
  }

  const filtered = reminders.filter(r => {
    if (filter === 'pendiente') return r.status === 'pendiente'
    if (filter === 'completado') return r.status === 'completado'
    return true
  })

  const pending = reminders.filter(r => r.status === 'pendiente')
  const overdue = pending.filter(r => differenceInDays(parseISO(r.due_date), new Date()) < 0)
  const thisWeek = pending.filter(r => {
    const d = differenceInDays(parseISO(r.due_date), new Date())
    return d >= 0 && d <= 7
  })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recordatorios</h1>
          <p className="text-sm text-gray-500 mt-0.5">{pending.length} pendientes</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary">
          <Plus size={16} /> Nuevo
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={18} className="text-red-500" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{overdue.length}</p>
            <p className="text-xs text-gray-500">Vencidos</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Clock size={18} className="text-amber-500" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{thisWeek.length}</p>
            <p className="text-xs text-gray-500">Esta semana</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-forest-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <CheckCircle size={18} className="text-forest-700" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{reminders.filter(r => r.status === 'completado').length}</p>
            <p className="text-xs text-gray-500">Completados</p>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1 w-fit">
        {[['pendiente', 'Pendientes'], ['completado', 'Completados'], ['todos', 'Todos'], ['castracion', `Sin castrar (${unneuteredAnimals.length})`]].map(([v, l]) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              filter === v ? 'bg-forest-800 text-white' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="card p-10 text-center text-gray-400">Cargando...</div>
      ) : filter === 'castracion' ? (
        unneuteredAnimals.length === 0 ? (
          <div className="card p-10 text-center">
            <CheckCircle size={32} className="text-green-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">¡Todos los animales están castrados!</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">{unneuteredAnimals.length} animal{unneuteredAnimals.length !== 1 ? 'es' : ''} sin castrar. Podés crear un recordatorio para planificar la cirugía.</p>
            <div className="card divide-y divide-gray-100">
              {unneuteredAnimals.map(a => (
                <div key={a.id} className="px-5 py-4 flex items-center gap-4">
                  <div className="text-xl flex-shrink-0">
                    {a.species === 'perro' ? '🐕' : a.species === 'gato' ? '🐈' : '🐾'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to={`/animales/${a.id}`} className="font-medium text-sm text-gray-900 hover:text-forest-700">{a.name}</Link>
                    <p className="text-xs text-gray-500 capitalize">{a.location?.replace('_', ' ') || 'Sin ubicación'}</p>
                  </div>
                  <button
                    onClick={() => createCastrationReminder(a)}
                    className="btn-secondary text-xs py-1.5 px-3"
                  >
                    + Crear recordatorio
                  </button>
                </div>
              ))}
            </div>
          </div>
        )
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <Bell size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No hay recordatorios</p>
        </div>
      ) : (
        <div className="card divide-y divide-gray-100">
          {filtered.map(r => (
            <div key={r.id} className={`px-5 py-4 flex items-center gap-4 ${r.status === 'completado' ? 'opacity-60' : ''}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <StatusBadge due_date={r.due_date} status={r.status} />
                  <span className="badge-gray text-xs">{r.type}</span>
                  <span className="text-xs text-gray-400">{fmtDate(r.due_date)}</span>
                </div>
                <p className="font-medium text-sm text-gray-900">{r.title}</p>
                <Link to={`/animales/${r.animal_id}`} className="text-xs text-forest-700 hover:text-forest-900">
                  {r.animals?.name} ({r.animals?.species})
                </Link>
                {r.description && <p className="text-xs text-gray-500 mt-0.5">{r.description}</p>}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {r.status === 'pendiente' && (
                  <button
                    onClick={() => markDone(r.id)}
                    className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                    title="Marcar como completado"
                  >
                    <CheckCircle size={16} />
                  </button>
                )}
                <button
                  onClick={() => deleteReminder(r.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Reminder Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo recordatorio" size="md">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Animal *</label>
            <select className="input" required value={form.animal_id} onChange={e => setForm({ ...form, animal_id: e.target.value })}>
              <option value="">Seleccionar animal...</option>
              {animals.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Tipo *</label>
              <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                {REMINDER_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Fecha *</label>
              <input type="date" className="input" required value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Título *</label>
            <input type="text" className="input" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ej: Vacuna antirrábica anual" />
          </div>
          <div>
            <label className="label">Notas</label>
            <textarea className="input resize-none" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">{saving ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
