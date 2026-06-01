import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { FileText, Search, Download, ChevronRight, Dog, Heart, X } from 'lucide-react'

function fmtDate(d) { return d ? format(parseISO(d), 'dd/MM/yyyy') : '—' }

const STATUS_LABELS = {
  vivo: 'Vivo', fallecido: 'Fallecido', extraviado: 'Extraviado', recuperado: 'Recuperado',
}
const LOCATION_LABELS = {
  refugio: 'Refugio canino', hogar_definitivo: 'Hogar definitivo',
  bionodo: 'Bionodo', provisorio: 'Provisorio',
}

function generateCertificate(animal, adoptions) {
  const lastAdoption = adoptions?.[0]
  const today = format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es })
  const statusText = animal.location === 'hogar_definitivo'
    ? `El animal ha sido dado en adopción el día ${fmtDate(lastAdoption?.adoption_date)} al/la Sr./Sra. ${lastAdoption?.adopter_name || '—'}.`
    : animal.animal_status === 'fallecido'
      ? `El animal falleció y fue dado de baja del registro activo del refugio.`
      : `El animal se encuentra actualmente alojado en: ${LOCATION_LABELS[animal.location] || animal.location || 'Refugio canino'}.`

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
  <title>Certificado - ${animal.name}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Georgia', serif; font-size: 13px; color: #1a1a1a; background: white; }
    .page { max-width: 720px; margin: 0 auto; padding: 48px 56px; min-height: 100vh; }
    .header { text-align: center; margin-bottom: 32px; border-bottom: 3px double #1a3a2a; padding-bottom: 24px; }
    .shield { font-size: 64px; line-height: 1; margin-bottom: 12px; }
    .municipality { font-size: 18px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #1a3a2a; }
    .department { font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #555; margin-top: 4px; }
    .cert-title { margin: 28px 0 20px; text-align: center; }
    .cert-title h2 { font-size: 20px; text-transform: uppercase; letter-spacing: 3px; color: #1a3a2a; border: 2px solid #1a3a2a; display: inline-block; padding: 8px 32px; }
    .cert-number { text-align: center; font-size: 11px; color: #888; margin-bottom: 28px; }
    .body-text { font-size: 14px; line-height: 1.9; text-align: justify; margin-bottom: 24px; }
    .body-text strong { color: #1a3a2a; }
    .data-box { background: #f9f7f4; border: 1px solid #e0dbd0; border-radius: 6px; padding: 20px 24px; margin: 20px 0; }
    .data-box h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 12px; font-family: Arial, sans-serif; }
    .data-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 32px; }
    .data-item { font-size: 12px; font-family: Arial, sans-serif; }
    .data-label { color: #888; font-size: 10px; text-transform: uppercase; }
    .data-value { font-weight: 600; color: #1a1a1a; }
    .health-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 16px 20px; margin: 16px 0; font-family: Arial, sans-serif; font-size: 12px; }
    .adoption-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 16px 20px; margin: 16px 0; font-family: Arial, sans-serif; font-size: 12px; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 56px; }
    .sig-line { border-top: 1px solid #333; padding-top: 8px; text-align: center; font-size: 11px; color: #555; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #ddd; display: flex; justify-content: space-between; font-size: 10px; color: #aaa; font-family: Arial, sans-serif; }
    @media print { @page { margin: 1.5cm; size: A4; } }
  </style></head><body>
  <div class="page">
    <div class="header">
      <div class="shield">🏛️</div>
      <div class="municipality">Municipalidad de Villa Allende</div>
      <div class="department">Dirección de Zoonosis · Provincia de Córdoba</div>
    </div>

    <div class="cert-title">
      <h2>Certificado de Registro Animal</h2>
    </div>
    <div class="cert-number">N° de reconocimiento: ${animal.recognition_number || animal.registration_number || 'S/N'} &nbsp;·&nbsp; Emitido: ${today}</div>

    <div class="body-text">
      La <strong>Dirección de Zoonosis de la Municipalidad de Villa Allende</strong>, en ejercicio de sus funciones,
      <strong>CERTIFICA</strong> que el animal identificado a continuación se encuentra debidamente registrado
      en el padrón oficial de animales del municipio, con los datos que a continuación se detallan:
    </div>

    <div class="data-box">
      <h3>Identificación del animal</h3>
      <div class="data-grid">
        <div class="data-item"><div class="data-label">Nombre</div><div class="data-value">${animal.name}</div></div>
        <div class="data-item"><div class="data-label">Especie / Raza</div><div class="data-value capitalize">${animal.species}${animal.breed ? ' — ' + animal.breed : ''}</div></div>
        <div class="data-item"><div class="data-label">Sexo</div><div class="data-value capitalize">${animal.sex || '—'}</div></div>
        <div class="data-item"><div class="data-label">Color / Pelaje</div><div class="data-value">${[animal.color, animal.coat].filter(Boolean).join(' · ') || '—'}</div></div>
        ${animal.birth_date ? `<div class="data-item"><div class="data-label">Fecha de nacimiento</div><div class="data-value">${fmtDate(animal.birth_date)}</div></div>` : ''}
        ${animal.estimated_age_years ? `<div class="data-item"><div class="data-label">Edad estimada</div><div class="data-value">~${animal.estimated_age_years} años</div></div>` : ''}
        ${animal.estimated_age_months ? `<div class="data-item"><div class="data-label">Edad estimada</div><div class="data-value">~${animal.estimated_age_months} meses</div></div>` : ''}
        ${animal.chip_number ? `<div class="data-item"><div class="data-label">N° de chip</div><div class="data-value">${animal.chip_number}</div></div>` : ''}
        ${animal.tattoo_number ? `<div class="data-item"><div class="data-label">N° de tatuaje</div><div class="data-value">${animal.tattoo_number}</div></div>` : ''}
        <div class="data-item"><div class="data-label">Fecha de ingreso</div><div class="data-value">${fmtDate(animal.entry_date)}</div></div>
        <div class="data-item"><div class="data-label">Estado</div><div class="data-value">${STATUS_LABELS[animal.animal_status] || '—'}</div></div>
      </div>
    </div>

    <div class="health-box">
      <strong>Estado sanitario:</strong>
      Animal ${animal.is_neutered ? `<strong>castrado/a</strong> (fecha: ${fmtDate(animal.neutering_date)})` : '<strong>no castrado/a</strong>'}.
      ${animal.notes ? `<br><em>Observaciones: ${animal.notes}</em>` : ''}
    </div>

    ${lastAdoption ? `<div class="adoption-box">
      <strong>Adopción registrada:</strong>
      Adoptado/a por <strong>${lastAdoption.adopter_name}</strong> el ${fmtDate(lastAdoption.adoption_date)}.
      ${lastAdoption.adopter_address ? `Domicilio: ${lastAdoption.adopter_address}.` : ''}
      ${lastAdoption.adopter_phone ? `Teléfono: ${lastAdoption.adopter_phone}.` : ''}
    </div>` : ''}

    <div class="body-text" style="margin-top:20px;">
      ${statusText}
      El presente certificado es emitido a solicitud de parte interesada y tiene validez en el ámbito del
      municipio de Villa Allende, Provincia de Córdoba, República Argentina.
    </div>

    <div class="signatures">
      <div class="sig-line">
        Firma y sello<br>Director/a de Zoonosis
      </div>
      <div class="sig-line">
        Firma y sello<br>Intendencia Municipal
      </div>
    </div>

    <div class="footer">
      <span>Municipalidad de Villa Allende · Zoonosis · zoonosis-villa-allende.vercel.app</span>
      <span>Emitido el ${today}</span>
    </div>
  </div>
  <script>window.onload = () => window.print()</script>
  </body></html>`

  const win = window.open('', '_blank')
  win.document.write(html)
  win.document.close()
}

export default function Informes() {
  const [animals, setAnimals] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('todos')
  const [search, setSearch] = useState('')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const { data } = await supabase
      .from('animals')
      .select('*, adoptions(adopter_name, adopter_address, adopter_phone, adoption_date)')
      .eq('is_active', true)
      .order('name')
    setAnimals(data || [])
    setLoading(false)
  }

  const filtered = animals.filter(a => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      a.name?.toLowerCase().includes(q) ||
      (a.recognition_number || '').toLowerCase().includes(q) ||
      (a.breed || '').toLowerCase().includes(q)

    const matchFilter =
      filter === 'todos' ? true :
      filter === 'vivos' ? (a.animal_status === 'vivo' || !a.animal_status) && a.location !== 'hogar_definitivo' :
      filter === 'adoptados' ? a.location === 'hogar_definitivo' :
      filter === 'fallecidos' ? a.animal_status === 'fallecido' :
      filter === 'sin_adoptar' ? a.location !== 'hogar_definitivo' && a.animal_status !== 'fallecido' :
      true

    return matchSearch && matchFilter
  })

  const counts = {
    todos: animals.length,
    vivos: animals.filter(a => (a.animal_status === 'vivo' || !a.animal_status) && a.location !== 'hogar_definitivo').length,
    adoptados: animals.filter(a => a.location === 'hogar_definitivo').length,
    fallecidos: animals.filter(a => a.animal_status === 'fallecido').length,
    sin_adoptar: animals.filter(a => a.location !== 'hogar_definitivo' && a.animal_status !== 'fallecido').length,
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Informes y certificados</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} animales</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { key: 'vivos', label: 'En refugio / activos', color: 'border-green-400', text: 'text-green-700' },
          { key: 'sin_adoptar', label: 'Disponibles para adopción', color: 'border-amber-400', text: 'text-amber-700' },
          { key: 'adoptados', label: 'Adoptados', color: 'border-blue-400', text: 'text-blue-700' },
          { key: 'fallecidos', label: 'Fallecidos', color: 'border-gray-400', text: 'text-gray-500' },
        ].map(({ key, label, color, text }) => (
          <div key={key} className={`card p-4 border-l-4 ${color} cursor-pointer hover:shadow-md transition-shadow`} onClick={() => setFilter(key)}>
            <p className={`text-xs font-semibold uppercase tracking-wide ${text} mb-1`}>{label}</p>
            <p className="text-2xl font-bold text-gray-900">{counts[key]}</p>
          </div>
        ))}
      </div>

      {/* Filters + search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, raza, N° reconocimiento..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
        <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1 self-start flex-shrink-0">
          {[
            ['todos', 'Todos'],
            ['vivos', 'Activos'],
            ['adoptados', 'Adoptados'],
            ['fallecidos', 'Fallecidos'],
            ['sin_adoptar', 'Sin adoptar'],
          ].map(([v, l]) => (
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
      </div>

      {/* Animal list */}
      {loading ? (
        <div className="card p-10 text-center text-gray-400">Cargando...</div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <FileText size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No se encontraron animales</p>
        </div>
      ) : (
        <div className="card divide-y divide-gray-100">
          {filtered.map(a => {
            const lastAdoption = a.adoptions?.[a.adoptions.length - 1]
            const isAdopted = a.location === 'hogar_definitivo'
            const isDead = a.animal_status === 'fallecido'
            return (
              <div key={a.id} className={`px-5 py-4 flex items-center gap-4 ${isDead ? 'opacity-60' : ''}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-lg
                  ${a.species === 'perro' ? 'bg-blue-50' : a.species === 'gato' ? 'bg-purple-50' : 'bg-gray-50'}`}>
                  {a.species === 'perro' ? '🐕' : a.species === 'gato' ? '🐈' : '🐾'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">{a.name}</span>
                    {a.recognition_number && <span className="badge-gray font-mono text-xs">{a.recognition_number}</span>}
                    {isAdopted && <span className="badge-blue">Adoptado</span>}
                    {isDead && <span className="badge-gray">Fallecido</span>}
                    {a.is_neutered && <span className="badge-green">Castrado/a</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {a.breed || 'Sin raza'}
                    {a.location && ` · ${LOCATION_LABELS[a.location] || a.location}`}
                    {isAdopted && lastAdoption && ` · ${lastAdoption.adopter_name}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => generateCertificate(a, a.adoptions)}
                    className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                    title="Emitir certificado oficial"
                  >
                    <FileText size={13} />
                    Certificado
                  </button>
                  <Link
                    to={`/animales/${a.id}`}
                    className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
                  >
                    Ver ficha <ChevronRight size={13} />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
