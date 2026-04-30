import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { format, parseISO } from 'date-fns'
import { Heart, Search, ChevronRight, Printer } from 'lucide-react'

function fmtDate(d) { return d ? format(parseISO(d), 'dd/MM/yyyy') : '—' }

export default function Adopciones() {
  const [adoptions, setAdoptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { loadAdoptions() }, [])

  async function loadAdoptions() {
    setLoading(true)
    const { data } = await supabase
      .from('adoptions')
      .select(`
        id, adopter_name, adopter_address, adopter_phone, adoption_date, notes, created_at,
        animals ( id, name, species, breed, recognition_number, sex )
      `)
      .order('adoption_date', { ascending: false })
    setAdoptions(data || [])
    setLoading(false)
  }

  const filtered = adoptions.filter(a => {
    const q = search.toLowerCase()
    return (
      a.adopter_name?.toLowerCase().includes(q) ||
      a.animals?.name?.toLowerCase().includes(q) ||
      (a.adopter_phone || '').includes(q) ||
      (a.animals?.recognition_number || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Adopciones</h1>
          <p className="text-sm text-gray-500 mt-0.5">{adoptions.length} adopciones registradas</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por adoptante, animal o teléfono..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input pl-9"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="card p-10 text-center text-gray-400">Cargando...</div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <Heart size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No se encontraron adopciones</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(a => (
            <div key={a.id} className="card px-5 py-4 flex items-center gap-4">
              {/* Animal icon */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-lg
                ${a.animals?.species === 'perro' ? 'bg-blue-50' : a.animals?.species === 'gato' ? 'bg-purple-50' : 'bg-gray-50'}`}>
                {a.animals?.species === 'perro' ? '🐕' : a.animals?.species === 'gato' ? '🐈' : '🐾'}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900">{a.adopter_name}</span>
                  <span className="badge-blue">Adoptó a {a.animals?.name || '—'}</span>
                  <span className="text-xs text-gray-400">{fmtDate(a.adoption_date)}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {a.animals?.breed || 'Raza no especificada'}
                  {a.adopter_address && ` · ${a.adopter_address}`}
                  {a.adopter_phone && ` · ${a.adopter_phone}`}
                </p>
                {a.notes && <p className="text-xs text-gray-400 mt-0.5 truncate">{a.notes}</p>}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {a.animals?.id && (
                  <Link
                    to={`/animales/${a.animals.id}`}
                    className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
                    title="Ver ficha del animal"
                  >
                    Ver ficha <ChevronRight size={13} />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
