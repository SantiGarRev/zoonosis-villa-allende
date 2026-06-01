import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { format, differenceInDays, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Dog, AlertTriangle, CheckCircle, Clock, DollarSign, Syringe, Activity, Heart, TrendingUp } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'

function fmtMoney(n) { return n != null ? `$${Math.round(n).toLocaleString('es-AR')}` : '$0' }

export default function Dashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({ animals: 0, dogs: 0, cats: 0, neutered: 0, adopted: 0, fallecidos: 0, en_refugio: 0 })
  const [costs, setCosts] = useState({ vacunas: 0, desparasitaciones: 0, estudios: 0, intervenciones: 0 })
  const [costByMonth, setCostByMonth] = useState([])
  const [reminders, setReminders] = useState([])
  const [recentInterventions, setRecentInterventions] = useState([])
  const [recentAdoptions, setRecentAdoptions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [animalsRes, remindersRes, interventionsRes, vacRes, dewRes, studRes, intRes, adoptRes] = await Promise.all([
      supabase.from('animals').select('id, species, is_neutered, location').eq('is_active', true),
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
      supabase.from('vaccinations').select('cost, date_applied'),
      supabase.from('dewormings').select('cost, date_applied'),
      supabase.from('medical_studies').select('cost, date'),
      supabase.from('interventions').select('cost, date'),
      supabase.from('adoptions')
        .select('id, adopter_name, adoption_date, animals(name, species)')
        .order('adoption_date', { ascending: false })
        .limit(4),
    ])

    const animals = animalsRes.data || []
    setStats({
      animals: animals.length,
      dogs: animals.filter(a => a.species === 'perro').length,
      cats: animals.filter(a => a.species === 'gato').length,
      neutered: animals.filter(a => a.is_neutered).length,
      adopted: animals.filter(a => a.location === 'hogar_definitivo').length,
      fallecidos: animals.filter(a => a.animal_status === 'fallecido').length,
      en_refugio: animals.filter(a => a.location === 'refugio' && a.animal_status !== 'fallecido').length,
    })

    // Aggregate costs
    const vacunas = (vacRes.data || []).reduce((s, r) => s + (r.cost || 0), 0)
    const desparasitaciones = (dewRes.data || []).reduce((s, r) => s + (r.cost || 0), 0)
    const estudios = (studRes.data || []).reduce((s, r) => s + (r.cost || 0), 0)
    const intervenciones = (intRes.data || []).reduce((s, r) => s + (r.cost || 0), 0)
    setCosts({ vacunas, desparasitaciones, estudios, intervenciones })

    // Monthly cost aggregation (last 6 months)
    const allCostRecords = [
      ...(vacRes.data || []).map(r => ({ cost: r.cost || 0, date: r.date_applied })),
      ...(dewRes.data || []).map(r => ({ cost: r.cost || 0, date: r.date_applied })),
      ...(studRes.data || []).map(r => ({ cost: r.cost || 0, date: r.date })),
      ...(intRes.data || []).map(r => ({ cost: r.cost || 0, date: r.date })),
    ].filter(r => r.date)

    const monthMap = {}
    allCostRecords.forEach(r => {
      const key = r.date.substring(0, 7) // "YYYY-MM"
      monthMap[key] = (monthMap[key] || 0) + r.cost
    })
    const sortedMonths = Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, total]) => ({
        mes: format(parseISO(`${month}-01`), 'MMM yy', { locale: es }),
        total: Math.round(total),
      }))
    setCostByMonth(sortedMonths)

    setReminders(remindersRes.data || [])
    setRecentInterventions(interventionsRes.data || [])
    setRecentAdoptions(adoptRes.data || [])
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

  const urgent = reminders.filter(r => differenceInDays(parseISO(r.due_date), new Date()) <= 3)
  const totalCost = costs.vacunas + costs.desparasitaciones + costs.estudios + costs.intervenciones

  const costBarData = [
    { name: 'Vacunas', valor: Math.round(costs.vacunas), color: '#15803d' },
    { name: 'Desparasit.', valor: Math.round(costs.desparasitaciones), color: '#d97706' },
    { name: 'Estudios', valor: Math.round(costs.estudios), color: '#9333ea' },
    { name: 'Consultas', valor: Math.round(costs.intervenciones), color: '#2563eb' },
  ]

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

      {/* Animal stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total activos', value: stats.animals, icon: Dog, color: 'text-forest-700', bg: 'bg-forest-50' },
          { label: 'Perros', value: stats.dogs, icon: Dog, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Gatos', value: stats.cats, icon: Activity, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Castrados', value: stats.neutered, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-4">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon size={18} className={color} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Estado breakdown */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4 border-l-4 border-green-400">
          <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">En refugio / activos</p>
          <p className="text-2xl font-bold text-gray-900">{stats.en_refugio}</p>
        </div>
        <div className="card p-4 border-l-4 border-blue-400">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Adoptados</p>
          <p className="text-2xl font-bold text-gray-900">{stats.adopted}</p>
        </div>
        <div className="card p-4 border-l-4 border-gray-400">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Fallecidos</p>
          <p className="text-2xl font-bold text-gray-900">{stats.fallecidos}</p>
        </div>
      </div>

      {/* Cost indicators */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
          <DollarSign size={14} /> Indicadores de gastos
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Vacunas', value: costs.vacunas, color: 'text-forest-700', bg: 'bg-forest-50', border: 'border-forest-100' },
            { label: 'Desparasitaciones', value: costs.desparasitaciones, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
            { label: 'Estudios médicos', value: costs.estudios, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
            { label: 'Intervenciones', value: costs.intervenciones, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
          ].map(({ label, value, color, bg, border }) => (
            <div key={label} className={`card p-4 border ${border}`}>
              <p className={`text-xs font-semibold uppercase tracking-wide ${color} mb-1`}>{label}</p>
              <p className="text-xl font-bold text-gray-900">{fmtMoney(value)}</p>
            </div>
          ))}
        </div>

        {/* Total + chart */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="card p-5 flex items-center justify-between bg-forest-800 text-white rounded-xl">
            <div>
              <p className="text-sm text-forest-200 font-medium">Gasto total acumulado</p>
              <p className="text-3xl font-bold mt-1">{fmtMoney(totalCost)}</p>
              <p className="text-xs text-forest-300 mt-1">Todos los animales · todas las categorías</p>
            </div>
            <TrendingUp size={40} className="text-forest-600 flex-shrink-0" />
          </div>

          {costBarData.some(d => d.valor > 0) && (
            <div className="card p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Por categoría</p>
              <div style={{ height: 120 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={costBarData} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip formatter={v => [fmtMoney(v), 'Gasto']} />
                    <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                      {costBarData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Monthly evolution */}
        {costByMonth.length > 1 && (
          <div className="card p-5 mt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Evolución mensual de gastos (últimos 6 meses)</p>
            <div style={{ height: 140 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={costByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                  <Tooltip formatter={v => [fmtMoney(v), 'Gasto']} />
                  <Bar dataKey="total" fill="#15803d" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Bottom grid */}
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
                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-gray-600">
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

      {/* Recent adoptions */}
      {recentAdoptions.length > 0 && (
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Heart size={16} className="text-pink-500" />
              Adopciones recientes
            </h2>
            <Link to="/adopciones" className="text-xs text-forest-700 hover:text-forest-900 font-medium">
              Ver todas →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentAdoptions.map(a => (
              <div key={a.id} className="px-5 py-3 flex items-center gap-3">
                <div className="text-lg flex-shrink-0">
                  {a.animals?.species === 'perro' ? '🐕' : a.animals?.species === 'gato' ? '🐈' : '🐾'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{a.animals?.name} <span className="font-normal text-gray-500">→ {a.adopter_name}</span></p>
                </div>
                <p className="text-xs text-gray-400 whitespace-nowrap">
                  {format(parseISO(a.adoption_date), 'd MMM', { locale: es })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
