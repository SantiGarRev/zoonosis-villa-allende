import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { format, differenceInDays, parseISO, isToday, isPast } from 'date-fns'
import { es } from 'date-fns/locale'
import { Dog, AlertTriangle, CheckCircle, Clock, DollarSign, Syringe, Activity } from 'lucide-react'

export default function Dashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({ animals: 0, dogs: 0, cats: 0, neutered: 0 })
  const [reminders, setReminders] = useState([])
  const [recentInterventions, setRecentInterventions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [animalsRes, remindersRes, interventionsRes] = await Promise.all([
      supabase.from('animals').select('id, species, is_neutered').eq('is_active', true),
      supabase.from('reminders')
        .select('*, animals(name, species)')
        .eq('status', 'pendiente')
        .lte('due_date', new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0])
        .order('due_date', { ascending: true })
        .limit(10),
      supabase.from('interventions')
        .select('*, animals(name)')
        .order('date', { ascending: false })
        .limit(5),
    ])

    const animals = animalsRes.data || []
    setStats({
      animals: animals.length,
      dogs: animals.filter(a => a.species === 'perro').length,
      cats: animals.filter(a => a.species === 'gato').length,
      neutered: animals.filter(a => a.is_neutered).length,
    })
    setReminders(remindersRes.data || [])
    setRecentInterventions(interventionsRes.data || [])
    setLoading(false)
  }

  function getReminderStatus(due_date) {
    const days = differenceInDays(parseISO(due_date), new Date())
    if (days < 0) return { label: `Vencido hace ${Math.abs(days)}d`, cls: 'badge-red', urgent: true }
    if (days === 0) return { label: 'Hoy', cls: 'badge-red', urgent: true }
    if (days <= 3) return { label: `En ${days} días`, cls: 'badge-yellow', urgent: true }
    if (days <= 7) return { label: `En ${days} días`, cls: 'badge-yellow', urgent: false }
    return { label: `En ${days} días`, cls: 'badge-blue', urgent: false }
  }

  const urgent = reminders.filter(r => {
    const days = differenceInDays(parseISO(r.due_date), new Date())
    return days <= 3
  })

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-400">Cargando...</p>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Hola, {profile?.full_name?.split(' ')[0] || 'bienvenido'} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-0.5 capitalize">
          {format(new Date(), "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
        </p>
      </div>

      {/* Urgent banner */}
      {urgent.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800 text-sm">
              {urgent.length} recordatorio{urgent.length !== 1 ? 's' : ''} urgente{urgent.length !== 1 ? 's' : ''}
            </p>
            <p className="text-amber-700 text-sm mt-0.5">
              {urgent.map(r => r.animals?.name).join(', ')} — revisá la sección de recordatorios.
            </p>
          </div>
          <Link to="/recordatorios" className="ml-auto text-amber-700 hover:text-amber-900 text-sm font-medium whitespace-nowrap">
            Ver →
          </Link>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total animales', value: stats.animals, icon: Dog, color: 'text-forest-700', bg: 'bg-forest-50' },
          { label: 'Perros', value: stats.dogs, icon: Dog, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Gatos', value: stats.cats, icon: Activity, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Castrados', value: stats.neutered, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-5">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon size={20} className={color} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Two columns */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Upcoming reminders */}
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Clock size={16} className="text-gray-400" />
              Próximos recordatorios
            </h2>
            <Link to="/recordatorios" className="text-xs text-forest-700 hover:text-forest-900 font-medium">
              Ver todos →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {reminders.length === 0 ? (
              <p className="px-5 py-6 text-sm text-gray-400 text-center">No hay recordatorios próximos</p>
            ) : reminders.slice(0, 6).map(r => {
              const { label, cls } = getReminderStatus(r.due_date)
              return (
                <div key={r.id} className="px-5 py-3 flex items-center gap-3">
                  <Syringe size={14} className="text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/animales/${r.animal_id}`}
                      className="text-sm font-medium text-gray-900 hover:text-forest-700 truncate block"
                    >
                      {r.animals?.name}
                    </Link>
                    <p className="text-xs text-gray-500 truncate">{r.title}</p>
                  </div>
                  <span className={cls}>{label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent interventions */}
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Activity size={16} className="text-gray-400" />
              Últimas intervenciones
            </h2>
            <Link to="/animales" className="text-xs text-forest-700 hover:text-forest-900 font-medium">
              Ver animales →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentInterventions.length === 0 ? (
              <p className="px-5 py-6 text-sm text-gray-400 text-center">Sin intervenciones registradas</p>
            ) : recentInterventions.map(i => (
              <div key={i.id} className="px-5 py-3 flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-xs">
                  {i.animals?.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/animales/${i.animal_id}`}
                    className="text-sm font-medium text-gray-900 hover:text-forest-700"
                  >
                    {i.animals?.name}
                  </Link>
                  <p className="text-xs text-gray-500 truncate">{i.title}</p>
                </div>
                <p className="text-xs text-gray-400 whitespace-nowrap">
                  {format(parseISO(i.date), 'd MMM', { locale: es })}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
