import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Modal from '../components/Modal'
import { Plus, Search, Dog, Cat, Filter, ChevronRight, AlertCircle } from 'lucide-react'

const SPECIES_OPTIONS = ['perro', 'gato', 'otro']
const SEX_OPTIONS = ['macho', 'hembra']

const emptyForm = {
  name: '', species: 'perro', sex: 'macho', breed: '', birth_date: '',
  estimated_age_years: '', color: '', registration_number: '', chip_number: '',
  tattoo_number: '', is_neutered: false, neutering_date: '', current_weight_kg: '', notes: ''
}

export default function Animales() {
  const { user } = useAuth()
  const [animals, setAnimals] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('todos') // todos|perro|gato|otro
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { loadAnimals() }, [])

  async function loadAnimals() {
    setLoading(true)
    const { data } = await supabase
      .from('animals')
      .select('id, name, species, sex, breed, is_neutered, registration_number, tattoo_number, current_weight_kg, is_active')
      .eq('is_active', true)
      .order('name')
    setAnimals(data || [])
    setLoading(false)
  }

  function openNew() {
    setForm(emptyForm)
    setError('')
    setModalOpen(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const payload = {
        ...form,
        birth_date: form.birth_date || null,
        neutering_date: form.neutering_date || null,
        estimated_age_years: form.estimated_age_years ? parseInt(form.estimated_age_years) : null,
        current_weight_kg: form.current_weight_kg ? parseFloat(form.current_weight_kg) : null,
        created_by: user.id,
        is_active: true,
      }
      const { error } = await supabase.from('animals').insert([payload])
      if (error) throw error
      setModalOpen(false)
      loadAnimals()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const filtered = animals.filter(a => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) ||
      (a.registration_number || '').toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'todos' || a.species === filter
    return matchSearch && matchFilter
  })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Animales</h1>
          <p className="text-sm text-gray-500 mt-0.5">{animals.length} registros activos</p>
        </div>
        <button onClick={openNew} className="btn-primary">
          <Plus size={16} />
          Nuevo animal
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o número..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
        <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1 self-start">
          {['todos', 'perro', 'gato', 'otro'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${
                filter === f ? 'bg-forest-800 text-white' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="card p-10 text-center text-gray-400">Cargando...</div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <Dog size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No se encontraron animales</p>
          <button onClick={openNew} className="mt-4 btn-primary mx-auto">
            <Plus size={14} /> Agregar animal
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(a => (
            <Link
              key={a.id}
              to={`/animales/${a.id}`}
              className="card px-5 py-4 flex items-center gap-4 hover:shadow-md transition-shadow group"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-lg
                ${a.species === 'perro' ? 'bg-blue-50' : a.species === 'gato' ? 'bg-purple-50' : 'bg-gray-50'}`}>
                {a.species === 'perro' ? '🐕' : a.species === 'gato' ? '🐈' : '🐾'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{a.name}</span>
                  {a.is_neutered && <span className="badge-green">Castrado/a</span>}
                  <span className="badge-gray capitalize">{a.sex}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {a.breed || 'Raza no especificada'}
                  {a.registration_number && ` · Reg: ${a.registration_number}`}
                  {a.tattoo_number && ` · Tatuaje: ${a.tattoo_number}`}
                  {a.current_weight_kg && ` · ${a.current_weight_kg} kg`}
                </p>
              </div>
              <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-500 flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}

      {/* New Animal Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo animal" size="lg">
        {error && (
          <div className="mb-4 flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg text-sm">
            <AlertCircle size={14} /> {error}
          </div>
        )}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Nombre *</label>
              <input type="text" className="input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Especie *</label>
              <select className="input" value={form.species} onChange={e => setForm({ ...form, species: e.target.value })}>
                {SPECIES_OPTIONS.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Sexo</label>
              <select className="input" value={form.sex} onChange={e => setForm({ ...form, sex: e.target.value })}>
                {SEX_OPTIONS.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Raza</label>
              <input type="text" className="input" value={form.breed} onChange={e => setForm({ ...form, breed: e.target.value })} />
            </div>
            <div>
              <label className="label">Color</label>
              <input type="text" className="input" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} />
            </div>
            <div>
              <label className="label">Fecha de nacimiento</label>
              <input type="date" className="input" value={form.birth_date} onChange={e => setForm({ ...form, birth_date: e.target.value })} />
            </div>
            <div>
              <label className="label">Edad estimada (años)</label>
              <input type="number" className="input" min="0" max="30" value={form.estimated_age_years} onChange={e => setForm({ ...form, estimated_age_years: e.target.value })} />
            </div>
            <div>
              <label className="label">N° de registro</label>
              <input type="text" className="input" value={form.registration_number} onChange={e => setForm({ ...form, registration_number: e.target.value })} />
            </div>
            <div>
              <label className="label">N° de chip</label>
              <input type="text" className="input" value={form.chip_number} onChange={e => setForm({ ...form, chip_number: e.target.value })} />
            </div>
            <div>
              <label className="label">N° tatuaje (castración)</label>
              <input type="text" className="input" value={form.tattoo_number} onChange={e => setForm({ ...form, tattoo_number: e.target.value })} />
            </div>
            <div>
              <label className="label">Peso actual (kg)</label>
              <input type="number" step="0.1" className="input" value={form.current_weight_kg} onChange={e => setForm({ ...form, current_weight_kg: e.target.value })} />
            </div>
            <div className="col-span-2 flex items-center gap-3">
              <input
                type="checkbox"
                id="neutered"
                checked={form.is_neutered}
                onChange={e => setForm({ ...form, is_neutered: e.target.checked })}
                className="rounded border-gray-300 text-forest-700 focus:ring-forest-700"
              />
              <label htmlFor="neutered" className="text-sm font-medium text-gray-700">Castrado/a</label>
              {form.is_neutered && (
                <input
                  type="date"
                  className="input flex-1"
                  placeholder="Fecha de castración"
                  value={form.neutering_date}
                  onChange={e => setForm({ ...form, neutering_date: e.target.value })}
                />
              )}
            </div>
            <div className="col-span-2">
              <label className="label">Notas</label>
              <textarea className="input resize-none" rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? 'Guardando...' : 'Guardar animal'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
