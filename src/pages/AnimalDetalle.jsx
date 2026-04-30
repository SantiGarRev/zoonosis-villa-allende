import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Modal from '../components/Modal'
import {
  format, parseISO, differenceInYears, differenceInMonths, differenceInDays
} from 'date-fns'
import { es } from 'date-fns/locale'
import {
  ArrowLeft, Edit, Syringe, Bug, FlaskConical, Stethoscope,
  DollarSign, BarChart3, Plus, Trash2, AlertCircle, CheckCircle,
  Weight, Calendar, Hash, PawPrint, ClipboardList, TrendingUp, Heart, Printer
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'

const TABS = [
  { id: 'resumen',       label: 'Resumen',       icon: ClipboardList },
  { id: 'sanitario',     label: 'Sanitario',     icon: Syringe },
  { id: 'estudios',      label: 'Estudios',      icon: FlaskConical },
  { id: 'intervenciones',label: 'Intervenciones',icon: Stethoscope },
  { id: 'adopcion',      label: 'Adopción',      icon: Heart },
  { id: 'economico',     label: 'Económico',     icon: DollarSign },
  { id: 'estadisticas',  label: 'Estadísticas',  icon: BarChart3 },
]

const LOCATION_LABELS = {
  refugio: 'Refugio canino',
  hogar_definitivo: 'Hogar definitivo',
  bionodo: 'Bionodo',
  provisorio: 'Provisorio',
}
const STATUS_LABELS = {
  vivo: 'Vivo',
  fallecido: 'Fallecido',
  extraviado: 'Extraviado',
  recuperado: 'Recuperado por dueños',
}

const STUDY_TYPES = [
  'Análisis de sangre', 'Biopsia', 'Radiografía', 'Ecografía',
  'Urinálisis', 'Coprologico', 'Citología', 'Cirugía', 'Otro'
]
const INTERVENTION_TYPES = [
  'Consulta', 'Cirugía', 'Tratamiento', 'Emergencia', 'Seguimiento', 'Internación', 'Control', 'Otro'
]
const REMINDER_TYPES = [
  'Vacunación', 'Desparasitación', 'Control veterinario', 'Tratamiento', 'Cirugia', 'Otro'
]
const COLORS = ['#15803d', '#d97706', '#2563eb', '#9333ea', '#e11d48']

function fmtDate(d) { return d ? format(parseISO(d), 'dd/MM/yyyy') : '—' }
function fmtMoney(n) { return n != null ? `$${Number(n).toLocaleString('es-AR')}` : '—' }

function getAge(birth_date, estimated_age_years) {
  if (birth_date) {
    const years = differenceInYears(new Date(), parseISO(birth_date))
    const months = differenceInMonths(new Date(), parseISO(birth_date)) % 12
    return years > 0 ? `${years} año${years !== 1 ? 's' : ''} ${months > 0 ? `${months}m` : ''}` : `${months} meses`
  }
  if (estimated_age_years) return `~${estimated_age_years} años (estimado)`
  return 'No especificada'
}

function ReminderBadge({ due_date }) {
  const days = differenceInDays(parseISO(due_date), new Date())
  if (days < 0) return <span className="badge-red">Vencido</span>
  if (days === 0) return <span className="badge-red">Hoy</span>
  if (days <= 3) return <span className="badge-yellow">En {days}d</span>
  if (days <= 7) return <span className="badge-yellow">En {days}d</span>
  return <span className="badge-blue">En {days}d</span>
}

// ─── Sub-forms ─────────────────────────────────────────────
function VacunaForm({ onSave, onClose }) {
  const [f, setF] = useState({ vaccine_name: '', date_applied: '', next_due_date: '', batch_number: '', laboratory: '', dose: '', cost: '', notes: '' })
  const [saving, setSaving] = useState(false)
  return (
    <form onSubmit={async e => { e.preventDefault(); setSaving(true); await onSave(f); setSaving(false) }} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><label className="label">Vacuna *</label><input className="input" required value={f.vaccine_name} onChange={e => setF({...f, vaccine_name: e.target.value})} /></div>
        <div><label className="label">Fecha aplicación *</label><input type="date" className="input" required value={f.date_applied} onChange={e => setF({...f, date_applied: e.target.value})} /></div>
        <div><label className="label">Próxima dosis</label><input type="date" className="input" value={f.next_due_date} onChange={e => setF({...f, next_due_date: e.target.value})} /></div>
        <div><label className="label">Laboratorio</label><input className="input" value={f.laboratory} onChange={e => setF({...f, laboratory: e.target.value})} /></div>
        <div><label className="label">Lote</label><input className="input" value={f.batch_number} onChange={e => setF({...f, batch_number: e.target.value})} /></div>
        <div><label className="label">Dosis</label><input className="input" value={f.dose} onChange={e => setF({...f, dose: e.target.value})} /></div>
        <div><label className="label">Costo ($)</label><input type="number" step="0.01" className="input" value={f.cost} onChange={e => setF({...f, cost: e.target.value})} /></div>
        <div className="col-span-2"><label className="label">Notas</label><textarea className="input resize-none" rows={2} value={f.notes} onChange={e => setF({...f, notes: e.target.value})} /></div>
      </div>
      <div className="flex gap-3 pt-1"><button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button><button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">{saving ? 'Guardando...' : 'Guardar'}</button></div>
    </form>
  )
}

function DesparasitacionForm({ onSave, onClose }) {
  const [f, setF] = useState({ product_name: '', type: 'interna', date_applied: '', next_due_date: '', dose: '', cost: '', notes: '' })
  const [saving, setSaving] = useState(false)
  return (
    <form onSubmit={async e => { e.preventDefault(); setSaving(true); await onSave(f); setSaving(false) }} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><label className="label">Producto *</label><input className="input" required value={f.product_name} onChange={e => setF({...f, product_name: e.target.value})} /></div>
        <div><label className="label">Tipo *</label><select className="input" value={f.type} onChange={e => setF({...f, type: e.target.value})}><option value="interna">Interna</option><option value="externa">Externa</option><option value="ambas">Ambas</option></select></div>
        <div><label className="label">Dosis</label><input className="input" value={f.dose} onChange={e => setF({...f, dose: e.target.value})} /></div>
        <div><label className="label">Fecha aplicación *</label><input type="date" className="input" required value={f.date_applied} onChange={e => setF({...f, date_applied: e.target.value})} /></div>
        <div><label className="label">Próxima dosis</label><input type="date" className="input" value={f.next_due_date} onChange={e => setF({...f, next_due_date: e.target.value})} /></div>
        <div><label className="label">Costo ($)</label><input type="number" step="0.01" className="input" value={f.cost} onChange={e => setF({...f, cost: e.target.value})} /></div>
        <div className="col-span-2"><label className="label">Notas</label><textarea className="input resize-none" rows={2} value={f.notes} onChange={e => setF({...f, notes: e.target.value})} /></div>
      </div>
      <div className="flex gap-3 pt-1"><button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button><button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">{saving ? 'Guardando...' : 'Guardar'}</button></div>
    </form>
  )
}

function EstudioForm({ onSave, onClose }) {
  const [f, setF] = useState({ study_type: 'Análisis de sangre', title: '', date: '', description: '', result: '', cost: '', notes: '' })
  const [saving, setSaving] = useState(false)
  return (
    <form onSubmit={async e => { e.preventDefault(); setSaving(true); await onSave(f); setSaving(false) }} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Tipo de estudio *</label><select className="input" value={f.study_type} onChange={e => setF({...f, study_type: e.target.value})}>{STUDY_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
        <div><label className="label">Fecha *</label><input type="date" className="input" required value={f.date} onChange={e => setF({...f, date: e.target.value})} /></div>
        <div className="col-span-2"><label className="label">Título / Descripción breve *</label><input className="input" required value={f.title} onChange={e => setF({...f, title: e.target.value})} /></div>
        <div className="col-span-2"><label className="label">Descripción completa</label><textarea className="input resize-none" rows={2} value={f.description} onChange={e => setF({...f, description: e.target.value})} /></div>
        <div className="col-span-2"><label className="label">Resultado</label><textarea className="input resize-none" rows={2} value={f.result} onChange={e => setF({...f, result: e.target.value})} /></div>
        <div><label className="label">Costo ($)</label><input type="number" step="0.01" className="input" value={f.cost} onChange={e => setF({...f, cost: e.target.value})} /></div>
      </div>
      <div className="flex gap-3 pt-1"><button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button><button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">{saving ? 'Guardando...' : 'Guardar'}</button></div>
    </form>
  )
}

function IntervencionForm({ onSave, onClose }) {
  const [f, setF] = useState({ type: 'Consulta', title: '', date: '', description: '', diagnosis: '', treatment: '', medication: '', cost: '', follow_up_date: '', status: 'completado', notes: '' })
  const [saving, setSaving] = useState(false)
  return (
    <form onSubmit={async e => { e.preventDefault(); setSaving(true); await onSave(f); setSaving(false) }} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Tipo *</label><select className="input" value={f.type} onChange={e => setF({...f, type: e.target.value})}>{INTERVENTION_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
        <div><label className="label">Fecha *</label><input type="date" className="input" required value={f.date} onChange={e => setF({...f, date: e.target.value})} /></div>
        <div className="col-span-2"><label className="label">Título *</label><input className="input" required value={f.title} onChange={e => setF({...f, title: e.target.value})} /></div>
        <div className="col-span-2"><label className="label">Descripción</label><textarea className="input resize-none" rows={2} value={f.description} onChange={e => setF({...f, description: e.target.value})} /></div>
        <div className="col-span-2"><label className="label">Diagnóstico</label><input className="input" value={f.diagnosis} onChange={e => setF({...f, diagnosis: e.target.value})} /></div>
        <div className="col-span-2"><label className="label">Tratamiento indicado</label><input className="input" value={f.treatment} onChange={e => setF({...f, treatment: e.target.value})} /></div>
        <div className="col-span-2"><label className="label">Medicación</label><input className="input" value={f.medication} onChange={e => setF({...f, medication: e.target.value})} /></div>
        <div><label className="label">Costo ($)</label><input type="number" step="0.01" className="input" value={f.cost} onChange={e => setF({...f, cost: e.target.value})} /></div>
        <div><label className="label">Estado</label><select className="input" value={f.status} onChange={e => setF({...f, status: e.target.value})}><option value="completado">Completado</option><option value="activo">Activo/En curso</option><option value="cancelado">Cancelado</option></select></div>
        <div><label className="label">Fecha seguimiento</label><input type="date" className="input" value={f.follow_up_date} onChange={e => setF({...f, follow_up_date: e.target.value})} /></div>
        <div className="col-span-2"><label className="label">Notas</label><textarea className="input resize-none" rows={2} value={f.notes} onChange={e => setF({...f, notes: e.target.value})} /></div>
      </div>
      <div className="flex gap-3 pt-1"><button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button><button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">{saving ? 'Guardando...' : 'Guardar'}</button></div>
    </form>
  )
}

function WeightForm({ onSave, onClose }) {
  const [f, setF] = useState({ date: new Date().toISOString().split('T')[0], weight_kg: '', notes: '' })
  const [saving, setSaving] = useState(false)
  return (
    <form onSubmit={async e => { e.preventDefault(); setSaving(true); await onSave(f); setSaving(false) }} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Fecha *</label><input type="date" className="input" required value={f.date} onChange={e => setF({...f, date: e.target.value})} /></div>
        <div><label className="label">Peso (kg) *</label><input type="number" step="0.1" className="input" required value={f.weight_kg} onChange={e => setF({...f, weight_kg: e.target.value})} /></div>
        <div className="col-span-2"><label className="label">Notas</label><input className="input" value={f.notes} onChange={e => setF({...f, notes: e.target.value})} /></div>
      </div>
      <div className="flex gap-3 pt-1"><button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button><button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">{saving ? 'Guardando...' : 'Guardar'}</button></div>
    </form>
  )
}

// ─── MAIN COMPONENT ─────────────────────────────────────────
export default function AnimalDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [animal, setAnimal] = useState(null)
  const [tab, setTab] = useState('resumen')
  const [loading, setLoading] = useState(true)

  // Records
  const [vaccinations, setVaccinations] = useState([])
  const [dewormings, setDewormings] = useState([])
  const [studies, setStudies] = useState([])
  const [interventions, setInterventions] = useState([])
  const [reminders, setReminders] = useState([])
  const [weights, setWeights] = useState([])

  // Modals
  const [modal, setModal] = useState(null)
  const [adoptions, setAdoptions] = useState([])
  const [adoptionForm, setAdoptionForm] = useState({ adopter_name: '', adopter_address: '', adopter_phone: '', adoption_date: new Date().toISOString().split('T')[0], notes: '' })
  const [savingAdoption, setSavingAdoption] = useState(false)

  const loadAll = useCallback(async () => {
    const [animalRes, vacRes, dewRes, studRes, intRes, remRes, weightRes, adoptRes] = await Promise.all([
      supabase.from('animals').select('*').eq('id', id).single(),
      supabase.from('vaccinations').select('*').eq('animal_id', id).order('date_applied', { ascending: false }),
      supabase.from('dewormings').select('*').eq('animal_id', id).order('date_applied', { ascending: false }),
      supabase.from('medical_studies').select('*').eq('animal_id', id).order('date', { ascending: false }),
      supabase.from('interventions').select('*').eq('animal_id', id).order('date', { ascending: false }),
      supabase.from('reminders').select('*').eq('animal_id', id).order('due_date', { ascending: true }),
      supabase.from('weight_records').select('*').eq('animal_id', id).order('date', { ascending: true }),
      supabase.from('adoptions').select('*').eq('animal_id', id).order('adoption_date', { ascending: false }),
    ])
    setAnimal(animalRes.data)
    setVaccinations(vacRes.data || [])
    setDewormings(dewRes.data || [])
    setStudies(studRes.data || [])
    setInterventions(intRes.data || [])
    setReminders(remRes.data || [])
    setWeights(weightRes.data || [])
    setAdoptions(adoptRes.data || [])
    setLoading(false)
  }, [id])

  async function saveAdoption(e) {
    e.preventDefault()
    setSavingAdoption(true)
    await supabase.from('adoptions').insert([{ animal_id: id, ...adoptionForm, created_by: user.id }])
    await supabase.from('animals').update({ location: 'hogar_definitivo', animal_status: 'vivo' }).eq('id', id)
    setModal(null)
    loadAll()
    setSavingAdoption(false)
  }

  function generatePDF() {
    const a = animal
    const fmtD = d => d ? format(parseISO(d), 'dd/MM/yyyy') : '—'
    const fmtM = n => n != null ? `$${Number(n).toLocaleString('es-AR')}` : '—'
    const totalGasto = [...vaccinations, ...dewormings, ...studies, ...interventions].reduce((s, r) => s + (r.cost || 0), 0)
    const lastAdoption = adoptions[0]

    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
    <title>Ficha Médica - ${a.name}</title>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family: Arial, sans-serif; font-size: 12px; color: #1a1a1a; background: white; }
      .header { background: #1a3a2a; color: white; padding: 24px 32px; display: flex; justify-content: space-between; align-items: center; }
      .header h1 { font-size: 22px; font-weight: 700; }
      .header p { font-size: 11px; opacity: 0.8; margin-top: 4px; }
      .logo { font-size: 32px; }
      .body { padding: 24px 32px; }
      .section { margin-bottom: 20px; }
      .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #666; border-bottom: 1px solid #eee; padding-bottom: 6px; margin-bottom: 10px; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; }
      .field { margin-bottom: 4px; }
      .field-label { font-size: 10px; color: #888; }
      .field-value { font-size: 12px; font-weight: 500; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; }
      th { background: #f5f5f0; text-align: left; padding: 6px 8px; font-size: 10px; text-transform: uppercase; color: #666; border: 1px solid #e0e0e0; }
      td { padding: 6px 8px; border: 1px solid #e8e8e0; font-size: 11px; }
      tr:nth-child(even) td { background: #fafafa; }
      .adopcion-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px; }
      .total-box { background: #1a3a2a; color: white; padding: 12px 16px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; margin-top: 12px; }
      .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #eee; font-size: 10px; color: #aaa; display: flex; justify-content: space-between; }
      @media print { @page { margin: 1cm; } }
    </style></head><body>
    <div class="header">
      <div>
        <h1>Ficha Médica — ${a.name}</h1>
        <p>Municipalidad de Villa Allende · Zoonosis · Generado el ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
      </div>
      <div class="logo">🐾</div>
    </div>
    <div class="body">
      <div class="section">
        <div class="section-title">Datos del animal</div>
        <div class="grid">
          ${a.recognition_number ? `<div class="field"><div class="field-label">N° Reconocimiento</div><div class="field-value">${a.recognition_number}</div></div>` : ''}
          <div class="field"><div class="field-label">Nombre</div><div class="field-value">${a.name}</div></div>
          <div class="field"><div class="field-label">Especie</div><div class="field-value capitalize">${a.species}</div></div>
          <div class="field"><div class="field-label">Sexo</div><div class="field-value capitalize">${a.sex}</div></div>
          <div class="field"><div class="field-label">Raza</div><div class="field-value">${a.breed || '—'}</div></div>
          ${a.coat ? `<div class="field"><div class="field-label">Pelaje</div><div class="field-value">${a.coat}</div></div>` : ''}
          <div class="field"><div class="field-label">Edad estimada</div><div class="field-value">${a.estimated_age_years ? a.estimated_age_years + ' años' : fmtD(a.birth_date)}</div></div>
          <div class="field"><div class="field-label">Peso actual</div><div class="field-value">${a.current_weight_kg ? a.current_weight_kg + ' kg' : '—'}</div></div>
          <div class="field"><div class="field-label">Castrado/a</div><div class="field-value">${a.is_neutered ? 'Sí (' + fmtD(a.neutering_date) + ')' : 'No'}</div></div>
          ${a.chip_number ? `<div class="field"><div class="field-label">N° Chip</div><div class="field-value">${a.chip_number}</div></div>` : ''}
          ${a.tattoo_number ? `<div class="field"><div class="field-label">N° Tatuaje</div><div class="field-value">${a.tattoo_number}</div></div>` : ''}
          <div class="field"><div class="field-label">Fecha ingreso</div><div class="field-value">${fmtD(a.entry_date)}</div></div>
          <div class="field"><div class="field-label">Estado</div><div class="field-value">${STATUS_LABELS[a.animal_status] || a.animal_status || '—'}</div></div>
          <div class="field"><div class="field-label">Lugar</div><div class="field-value">${LOCATION_LABELS[a.location] || a.location || '—'}</div></div>
        </div>
        ${a.notes ? `<div style="margin-top:10px;padding:8px;background:#f9f9f7;border-radius:4px;font-size:11px;"><strong>Notas:</strong> ${a.notes}</div>` : ''}
      </div>

      ${lastAdoption ? `<div class="section">
        <div class="section-title">Datos de adopción</div>
        <div class="adopcion-box">
          <div class="grid">
            <div class="field"><div class="field-label">Adoptante</div><div class="field-value">${lastAdoption.adopter_name}</div></div>
            <div class="field"><div class="field-label">Fecha</div><div class="field-value">${fmtD(lastAdoption.adoption_date)}</div></div>
            ${lastAdoption.adopter_address ? `<div class="field"><div class="field-label">Dirección</div><div class="field-value">${lastAdoption.adopter_address}</div></div>` : ''}
            ${lastAdoption.adopter_phone ? `<div class="field"><div class="field-label">Teléfono</div><div class="field-value">${lastAdoption.adopter_phone}</div></div>` : ''}
          </div>
          ${lastAdoption.notes ? `<div style="margin-top:8px;font-size:11px;"><strong>Notas:</strong> ${lastAdoption.notes}</div>` : ''}
        </div>
      </div>` : ''}

      ${vaccinations.length > 0 ? `<div class="section">
        <div class="section-title">Vacunaciones (${vaccinations.length})</div>
        <table><thead><tr><th>Vacuna</th><th>Fecha aplicación</th><th>Próxima dosis</th><th>Laboratorio</th><th>Costo</th></tr></thead>
        <tbody>${vaccinations.map(v => `<tr><td>${v.vaccine_name}</td><td>${fmtD(v.date_applied)}</td><td>${fmtD(v.next_due_date)}</td><td>${v.laboratory || '—'}</td><td>${fmtM(v.cost)}</td></tr>`).join('')}</tbody></table>
      </div>` : ''}

      ${dewormings.length > 0 ? `<div class="section">
        <div class="section-title">Desparasitaciones (${dewormings.length})</div>
        <table><thead><tr><th>Producto</th><th>Tipo</th><th>Fecha</th><th>Próxima</th><th>Costo</th></tr></thead>
        <tbody>${dewormings.map(d => `<tr><td>${d.product_name}</td><td>${d.type}</td><td>${fmtD(d.date_applied)}</td><td>${fmtD(d.next_due_date)}</td><td>${fmtM(d.cost)}</td></tr>`).join('')}</tbody></table>
      </div>` : ''}

      ${interventions.length > 0 ? `<div class="section">
        <div class="section-title">Historia clínica — Intervenciones (${interventions.length})</div>
        <table><thead><tr><th>Fecha</th><th>Tipo</th><th>Título</th><th>Diagnóstico</th><th>Tratamiento</th><th>Costo</th></tr></thead>
        <tbody>${interventions.map(i => `<tr><td>${fmtD(i.date)}</td><td>${i.type}</td><td>${i.title}</td><td>${i.diagnosis || '—'}</td><td>${i.treatment || '—'}</td><td>${fmtM(i.cost)}</td></tr>`).join('')}</tbody></table>
      </div>` : ''}

      ${studies.length > 0 ? `<div class="section">
        <div class="section-title">Estudios médicos (${studies.length})</div>
        <table><thead><tr><th>Fecha</th><th>Tipo</th><th>Título</th><th>Resultado</th><th>Costo</th></tr></thead>
        <tbody>${studies.map(s => `<tr><td>${fmtD(s.date)}</td><td>${s.study_type}</td><td>${s.title}</td><td>${s.result || '—'}</td><td>${fmtM(s.cost)}</td></tr>`).join('')}</tbody></table>
      </div>` : ''}

      ${weights.length > 0 ? `<div class="section">
        <div class="section-title">Registro de peso</div>
        <table><thead><tr><th>Fecha</th><th>Peso</th><th>Notas</th></tr></thead>
        <tbody>${weights.map(w => `<tr><td>${fmtD(w.date)}</td><td>${w.weight_kg} kg</td><td>${w.notes || '—'}</td></tr>`).join('')}</tbody></table>
      </div>` : ''}

      <div class="total-box">
        <span style="font-weight:700;">Gasto total acumulado</span>
        <span style="font-size:16px;font-weight:700;">${fmtM(totalGasto)}</span>
      </div>

      <div class="footer">
        <span>Sistema Zoonosis · Municipalidad de Villa Allende</span>
        <span>${format(new Date(), 'dd/MM/yyyy HH:mm')}</span>
      </div>
    </div>
    <script>window.onload = () => window.print()</script>
    </body></html>`

    const win = window.open('', '_blank')
    win.document.write(html)
    win.document.close()
  }

  useEffect(() => { loadAll() }, [loadAll])

  // Save helpers
  async function saveVacuna(f) {
    const { error } = await supabase.from('vaccinations').insert([{
      animal_id: id, ...f,
      cost: f.cost ? parseFloat(f.cost) : 0,
      next_due_date: f.next_due_date || null,
      applied_by: user.id,
    }])
    if (!error && f.next_due_date) {
      await supabase.from('reminders').insert([{
        animal_id: id, type: 'Vacunación',
        title: `Vacuna: ${f.vaccine_name}`,
        due_date: f.next_due_date, status: 'pendiente', created_by: user.id,
      }])
    }
    setModal(null); loadAll()
  }

  async function saveDesparasitacion(f) {
    const { error } = await supabase.from('dewormings').insert([{
      animal_id: id, ...f,
      cost: f.cost ? parseFloat(f.cost) : 0,
      next_due_date: f.next_due_date || null,
      applied_by: user.id,
    }])
    if (!error && f.next_due_date) {
      await supabase.from('reminders').insert([{
        animal_id: id, type: 'Desparasitación',
        title: `Desparasitación: ${f.product_name}`,
        due_date: f.next_due_date, status: 'pendiente', created_by: user.id,
      }])
    }
    setModal(null); loadAll()
  }

  async function saveEstudio(f) {
    await supabase.from('medical_studies').insert([{
      animal_id: id, ...f,
      cost: f.cost ? parseFloat(f.cost) : 0,
      performed_by: user.id,
    }])
    setModal(null); loadAll()
  }

  async function saveIntervencion(f) {
    await supabase.from('interventions').insert([{
      animal_id: id, ...f,
      cost: f.cost ? parseFloat(f.cost) : 0,
      follow_up_date: f.follow_up_date || null,
      performed_by: user.id,
    }])
    if (f.follow_up_date) {
      await supabase.from('reminders').insert([{
        animal_id: id, type: 'Control veterinario',
        title: `Seguimiento: ${f.title}`,
        due_date: f.follow_up_date, status: 'pendiente', created_by: user.id,
      }])
    }
    setModal(null); loadAll()
  }

  async function savePeso(f) {
    await supabase.from('weight_records').insert([{
      animal_id: id, ...f,
      weight_kg: parseFloat(f.weight_kg), recorded_by: user.id,
    }])
    // Update current_weight_kg on animal
    await supabase.from('animals').update({ current_weight_kg: parseFloat(f.weight_kg) }).eq('id', id)
    setModal(null); loadAll()
  }

  async function markReminderDone(remId) {
    await supabase.from('reminders').update({ status: 'completado' }).eq('id', remId)
    loadAll()
  }

  async function deleteRecord(table, recordId) {
    if (!confirm('¿Eliminar este registro?')) return
    await supabase.from(table).delete().eq('id', recordId)
    loadAll()
  }

  // ── Economics ──
  const totalCosts = {
    vacunas: vaccinations.reduce((s, r) => s + (r.cost || 0), 0),
    desparasitaciones: dewormings.reduce((s, r) => s + (r.cost || 0), 0),
    estudios: studies.reduce((s, r) => s + (r.cost || 0), 0),
    intervenciones: interventions.reduce((s, r) => s + (r.cost || 0), 0),
  }
  const totalGlobal = Object.values(totalCosts).reduce((s, v) => s + v, 0)
  const costPieData = Object.entries(totalCosts)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: Math.round(value)
    }))

  // ── Stats ──
  const pendingReminders = reminders.filter(r => r.status === 'pendiente')
  const overdueReminders = pendingReminders.filter(r => differenceInDays(parseISO(r.due_date), new Date()) < 0)
  const nextVaccine = vaccinations.find(v => v.next_due_date)
  const nextDeworming = dewormings.find(d => d.next_due_date)
  const hasActiveIntervention = interventions.some(i => i.status === 'activo')

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-gray-400">Cargando ficha...</p></div>
  if (!animal) return (
    <div className="text-center py-16">
      <p className="text-gray-400 mb-4">Animal no encontrado</p>
      <Link to="/animales" className="btn-primary">← Volver</Link>
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Back + header */}
      <div className="flex items-start gap-4">
        <button onClick={() => navigate('/animales')} className="mt-1 p-1.5 rounded-lg hover:bg-gray-200 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{animal.name}</h1>
            {animal.recognition_number && <span className="badge-gray font-mono">{animal.recognition_number}</span>}
            <span className="badge-gray capitalize">{animal.species}</span>
            <span className="badge-gray capitalize">{animal.sex}</span>
            {animal.is_neutered && <span className="badge-green">Castrado/a</span>}
            {animal.animal_status === 'fallecido' && <span className="badge-red">Fallecido</span>}
            {animal.animal_status === 'extraviado' && <span className="badge-yellow">Extraviado</span>}
            {animal.location === 'hogar_definitivo' && <span className="badge-blue">Adoptado</span>}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {animal.breed || 'Sin raza'} · {getAge(animal.birth_date, animal.estimated_age_years)}
            {animal.location && ` · ${LOCATION_LABELS[animal.location] || animal.location}`}
            {animal.chip_number && ` · Chip: ${animal.chip_number}`}
          </p>
        </div>
        <button
          onClick={generatePDF}
          className="btn-secondary flex items-center gap-2 flex-shrink-0"
          title="Imprimir ficha médica"
        >
          <Printer size={16} />
          <span className="hidden sm:inline">Imprimir ficha</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-gray-200 pb-0">
        {TABS.map(({ id: tid, label, icon: Icon }) => (
          <button
            key={tid}
            onClick={() => setTab(tid)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm whitespace-nowrap transition-colors border-b-2 -mb-px ${
              tab === tid ? 'tab-active' : 'tab-inactive'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* ─── TAB: RESUMEN ─── */}
      {tab === 'resumen' && (
        <div className="space-y-4">
          {/* Quick alerts */}
          {overdueReminders.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 flex items-start gap-3">
              <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-800 text-sm">{overdueReminders.length} recordatorio{overdueReminders.length > 1 ? 's' : ''} vencido{overdueReminders.length > 1 ? 's' : ''}</p>
                <p className="text-red-700 text-sm">{overdueReminders.map(r => r.title).join(' · ')}</p>
              </div>
            </div>
          )}

          {/* Quick stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Consultas totales', value: interventions.length, icon: Stethoscope, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Vacunas aplicadas', value: vaccinations.length, icon: Syringe, color: 'text-forest-700', bg: 'bg-forest-50' },
              { label: 'Estudios', value: studies.length, icon: FlaskConical, color: 'text-purple-600', bg: 'bg-purple-50' },
              { label: 'Gasto total', value: fmtMoney(totalGlobal), icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="card p-4">
                <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-2`}>
                  <Icon size={16} className={color} />
                </div>
                <p className="text-xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Info card */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide text-gray-500">Información básica</h3>
              <dl className="space-y-2">
                {[
                  ['Especie', animal.species],
                  ['Sexo', animal.sex],
                  ['Raza', animal.breed || '—'],
                  ['Color', animal.color || '—'],
                  ['Pelaje', animal.coat || '—'],
                  ['Fecha nac.', fmtDate(animal.birth_date)],
                  ['Edad', getAge(animal.birth_date, animal.estimated_age_years)],
                  ['Peso actual', animal.current_weight_kg ? `${animal.current_weight_kg} kg` : '—'],
                  ['Estado', STATUS_LABELS[animal.animal_status] || animal.animal_status || '—'],
                  ['Ubicación', LOCATION_LABELS[animal.location] || animal.location || '—'],
                  ['Fecha ingreso', fmtDate(animal.entry_date)],
                  ['Fecha NexGard', fmtDate(animal.nextgard_date)],
                  ['N° Reconocimiento', animal.recognition_number || '—'],
                  ['N° Registro', animal.registration_number || '—'],
                  ['N° Chip', animal.chip_number || '—'],
                  ['N° Tatuaje', animal.tattoo_number || '—'],
                  ['Castrado/a', animal.is_neutered ? `Sí (${fmtDate(animal.neutering_date)})` : 'No'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm">
                    <dt className="text-gray-500">{k}</dt>
                    <dd className="font-medium text-gray-900 capitalize">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide text-gray-500">Estado sanitario</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Vacunas al día</span>
                  {nextVaccine?.next_due_date ? <ReminderBadge due_date={nextVaccine.next_due_date} /> : <span className="badge-gray">Sin fecha</span>}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Desparasitación</span>
                  {nextDeworming?.next_due_date ? <ReminderBadge due_date={nextDeworming.next_due_date} /> : <span className="badge-gray">Sin fecha</span>}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Trat. activo</span>
                  {hasActiveIntervention ? <span className="badge-yellow">Sí</span> : <span className="badge-green">No</span>}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Recordatorios pendientes</span>
                  <span className={pendingReminders.length > 0 ? 'badge-yellow' : 'badge-green'}>{pendingReminders.length}</span>
                </div>
              </div>

              {/* Upcoming reminders */}
              {pendingReminders.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Próximos</p>
                  <div className="space-y-2">
                    {pendingReminders.slice(0, 4).map(r => (
                      <div key={r.id} className="flex items-center gap-2">
                        <ReminderBadge due_date={r.due_date} />
                        <span className="text-xs text-gray-600 flex-1 truncate">{r.title}</span>
                        <button onClick={() => markReminderDone(r.id)} className="text-xs text-green-600 hover:text-green-800">✓</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {animal.notes && (
            <div className="card p-5">
              <h3 className="font-semibold text-gray-500 text-sm uppercase tracking-wide mb-2">Notas</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{animal.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB: SANITARIO ─── */}
      {tab === 'sanitario' && (
        <div className="space-y-5">
          {/* Vacunas */}
          <div className="card">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Syringe size={16} className="text-forest-700" /> Vacunaciones</h2>
              <button onClick={() => setModal('vacuna')} className="btn-primary"><Plus size={14} /> Agregar</button>
            </div>
            {vaccinations.length === 0 ? (
              <p className="px-5 py-6 text-sm text-gray-400 text-center">Sin vacunas registradas</p>
            ) : (
              <table className="data-table w-full">
                <thead><tr><th>Vacuna</th><th>Aplicada</th><th>Próxima dosis</th><th>Laboratorio</th><th>Costo</th><th></th></tr></thead>
                <tbody>
                  {vaccinations.map(v => (
                    <tr key={v.id}>
                      <td className="font-medium">{v.vaccine_name}</td>
                      <td>{fmtDate(v.date_applied)}</td>
                      <td>{v.next_due_date ? <><ReminderBadge due_date={v.next_due_date} /><span className="ml-2 text-xs text-gray-400">{fmtDate(v.next_due_date)}</span></> : '—'}</td>
                      <td className="text-gray-500">{v.laboratory || '—'}</td>
                      <td>{fmtMoney(v.cost)}</td>
                      <td><button onClick={() => deleteRecord('vaccinations', v.id)} className="p-1 text-gray-300 hover:text-red-500"><Trash2 size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Desparasitaciones */}
          <div className="card">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Bug size={16} className="text-amber-600" /> Desparasitaciones</h2>
              <button onClick={() => setModal('desparasitacion')} className="btn-primary"><Plus size={14} /> Agregar</button>
            </div>
            {dewormings.length === 0 ? (
              <p className="px-5 py-6 text-sm text-gray-400 text-center">Sin desparasitaciones registradas</p>
            ) : (
              <table className="data-table w-full">
                <thead><tr><th>Producto</th><th>Tipo</th><th>Aplicada</th><th>Próxima</th><th>Costo</th><th></th></tr></thead>
                <tbody>
                  {dewormings.map(d => (
                    <tr key={d.id}>
                      <td className="font-medium">{d.product_name}</td>
                      <td className="capitalize">{d.type}</td>
                      <td>{fmtDate(d.date_applied)}</td>
                      <td>{d.next_due_date ? <><ReminderBadge due_date={d.next_due_date} /><span className="ml-2 text-xs text-gray-400">{fmtDate(d.next_due_date)}</span></> : '—'}</td>
                      <td>{fmtMoney(d.cost)}</td>
                      <td><button onClick={() => deleteRecord('dewormings', d.id)} className="p-1 text-gray-300 hover:text-red-500"><Trash2 size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Peso */}
          <div className="card">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Weight size={16} className="text-blue-600" /> Registro de peso</h2>
              <button onClick={() => setModal('peso')} className="btn-primary"><Plus size={14} /> Registrar</button>
            </div>
            {weights.length === 0 ? (
              <p className="px-5 py-6 text-sm text-gray-400 text-center">Sin registros de peso</p>
            ) : (
              <div>
                <div className="px-5 pt-4 pb-2" style={{ height: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weights.map(w => ({ fecha: fmtDate(w.date), peso: w.weight_kg }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} unit=" kg" />
                      <Tooltip formatter={v => [`${v} kg`, 'Peso']} />
                      <Line type="monotone" dataKey="peso" stroke="#15803d" strokeWidth={2} dot={{ fill: '#15803d', r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <table className="data-table w-full">
                  <thead><tr><th>Fecha</th><th>Peso</th><th>Notas</th><th></th></tr></thead>
                  <tbody>
                    {[...weights].reverse().map(w => (
                      <tr key={w.id}>
                        <td>{fmtDate(w.date)}</td>
                        <td className="font-medium">{w.weight_kg} kg</td>
                        <td className="text-gray-500">{w.notes || '—'}</td>
                        <td><button onClick={() => deleteRecord('weight_records', w.id)} className="p-1 text-gray-300 hover:text-red-500"><Trash2 size={14} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB: ESTUDIOS ─── */}
      {tab === 'estudios' && (
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2"><FlaskConical size={16} className="text-purple-600" /> Estudios médicos</h2>
            <button onClick={() => setModal('estudio')} className="btn-primary"><Plus size={14} /> Agregar</button>
          </div>
          {studies.length === 0 ? (
            <p className="px-5 py-8 text-sm text-gray-400 text-center">Sin estudios registrados</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {studies.map(s => (
                <div key={s.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="badge-blue">{s.study_type}</span>
                        <span className="text-xs text-gray-400">{fmtDate(s.date)}</span>
                      </div>
                      <p className="font-medium text-sm text-gray-900">{s.title}</p>
                      {s.description && <p className="text-sm text-gray-600 mt-1">{s.description}</p>}
                      {s.result && <div className="mt-2 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-700"><span className="font-medium text-gray-500 text-xs uppercase">Resultado:</span> {s.result}</div>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-gray-900">{fmtMoney(s.cost)}</p>
                      <button onClick={() => deleteRecord('medical_studies', s.id)} className="mt-1 p-1 text-gray-300 hover:text-red-500"><Trash2 size={13} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB: INTERVENCIONES ─── */}
      {tab === 'intervenciones' && (
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Stethoscope size={16} className="text-blue-600" /> Intervenciones y consultas</h2>
            <button onClick={() => setModal('intervencion')} className="btn-primary"><Plus size={14} /> Agregar</button>
          </div>
          {interventions.length === 0 ? (
            <p className="px-5 py-8 text-sm text-gray-400 text-center">Sin intervenciones registradas</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {interventions.map(i => (
                <div key={i.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="badge-blue">{i.type}</span>
                        {i.status === 'activo' && <span className="badge-yellow">En curso</span>}
                        {i.status === 'cancelado' && <span className="badge-gray">Cancelado</span>}
                        <span className="text-xs text-gray-400">{fmtDate(i.date)}</span>
                      </div>
                      <p className="font-medium text-sm text-gray-900">{i.title}</p>
                      {i.description && <p className="text-sm text-gray-600 mt-1">{i.description}</p>}
                      {i.diagnosis && <p className="text-sm mt-1"><span className="font-medium text-gray-500">Diagnóstico:</span> {i.diagnosis}</p>}
                      {i.treatment && <p className="text-sm mt-0.5"><span className="font-medium text-gray-500">Tratamiento:</span> {i.treatment}</p>}
                      {i.medication && <p className="text-sm mt-0.5"><span className="font-medium text-gray-500">Medicación:</span> {i.medication}</p>}
                      {i.follow_up_date && <p className="text-sm mt-0.5 text-amber-600"><span className="font-medium">Seguimiento:</span> {fmtDate(i.follow_up_date)}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-gray-900">{fmtMoney(i.cost)}</p>
                      <button onClick={() => deleteRecord('interventions', i.id)} className="mt-1 p-1 text-gray-300 hover:text-red-500"><Trash2 size={13} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB: ADOPCIÓN ─── */}
      {tab === 'adopcion' && (
        <div className="space-y-5">
          {/* Status banner */}
          {animal.location === 'hogar_definitivo' ? (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 flex items-center gap-3">
              <Heart size={18} className="text-blue-500 flex-shrink-0" />
              <div>
                <p className="font-semibold text-blue-800 text-sm">Este animal fue adoptado</p>
                {adoptions[0] && <p className="text-blue-700 text-sm">Adoptado por {adoptions[0].adopter_name} el {fmtDate(adoptions[0].adoption_date)}</p>}
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Heart size={18} className="text-amber-500 flex-shrink-0" />
                <p className="text-amber-800 text-sm font-medium">Sin adopción registrada</p>
              </div>
              <button onClick={() => setModal('adopcion')} className="btn-primary flex-shrink-0">
                <Plus size={14} /> Registrar adopción
              </button>
            </div>
          )}

          {/* Adoption history */}
          {adoptions.length > 0 && (
            <div className="card">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Heart size={16} className="text-blue-600" /> Historial de adopciones</h2>
                <button onClick={() => setModal('adopcion')} className="btn-primary"><Plus size={14} /> Nueva</button>
              </div>
              <div className="divide-y divide-gray-100">
                {adoptions.map(ad => (
                  <div key={ad.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900">{ad.adopter_name}</span>
                          <span className="badge-blue">{fmtDate(ad.adoption_date)}</span>
                        </div>
                        {ad.adopter_address && <p className="text-sm text-gray-500">📍 {ad.adopter_address}</p>}
                        {ad.adopter_phone && <p className="text-sm text-gray-500">📞 {ad.adopter_phone}</p>}
                        {ad.notes && <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded-lg px-3 py-2">{ad.notes}</p>}
                      </div>
                      <button onClick={() => generatePDF()} className="btn-secondary flex items-center gap-1.5 flex-shrink-0 text-sm" title="Imprimir ficha de adopción">
                        <Printer size={14} /> Imprimir ficha
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {adoptions.length === 0 && animal.location !== 'hogar_definitivo' && (
            <div className="card p-10 text-center">
              <Heart size={32} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Registrá la adopción cuando el animal encuentre su hogar definitivo.</p>
              <p className="text-gray-400 text-xs mt-1">Se actualizará automáticamente el estado del animal.</p>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB: ECONÓMICO ─── */}
      {tab === 'economico' && (
        <div className="space-y-5">
          {/* Total cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Vacunas', value: totalCosts.vacunas, color: 'text-forest-700', bg: 'bg-forest-50' },
              { label: 'Desparasitaciones', value: totalCosts.desparasitaciones, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Estudios', value: totalCosts.estudios, color: 'text-purple-600', bg: 'bg-purple-50' },
              { label: 'Intervenciones', value: totalCosts.intervenciones, color: 'text-blue-600', bg: 'bg-blue-50' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className="card p-4">
                <p className={`text-xs font-semibold uppercase tracking-wide ${color} mb-1`}>{label}</p>
                <p className="text-xl font-bold text-gray-900">{fmtMoney(value)}</p>
              </div>
            ))}
          </div>

          <div className="card p-5 flex items-center justify-between">
            <span className="font-semibold text-gray-900">Gasto total acumulado</span>
            <span className="text-2xl font-bold text-forest-800">{fmtMoney(totalGlobal)}</span>
          </div>

          {/* Pie chart */}
          {costPieData.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Distribución por categoría</h3>
              <div className="flex items-center gap-6">
                <div style={{ width: 200, height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={costPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value">
                        {costPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={v => fmtMoney(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {costPieData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-gray-600">{d.name}</span>
                      <span className="font-medium text-gray-900 ml-auto">{fmtMoney(d.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Detail tables */}
          {[
            { title: 'Vacunas', data: vaccinations, cols: [['Vacuna', 'vaccine_name'], ['Fecha', 'date_applied'], ['Costo', 'cost']] },
            { title: 'Desparasitaciones', data: dewormings, cols: [['Producto', 'product_name'], ['Fecha', 'date_applied'], ['Costo', 'cost']] },
            { title: 'Estudios', data: studies, cols: [['Estudio', 'title'], ['Fecha', 'date'], ['Costo', 'cost']] },
            { title: 'Intervenciones', data: interventions, cols: [['Intervención', 'title'], ['Fecha', 'date'], ['Costo', 'cost']] },
          ].filter(s => s.data.length > 0).map(section => (
            <div key={section.title} className="card">
              <div className="px-5 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-sm text-gray-700">{section.title}</h3>
              </div>
              <table className="data-table w-full">
                <thead><tr>{section.cols.map(([h]) => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {section.data.map(row => (
                    <tr key={row.id}>
                      {section.cols.map(([, key]) => (
                        <td key={key}>{key === 'cost' ? fmtMoney(row[key]) : key.includes('date') ? fmtDate(row[key]) : row[key]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* ─── TAB: ESTADÍSTICAS ─── */}
      {tab === 'estadisticas' && (
        <div className="space-y-5">
          {/* Historial resumido */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: 'Total consultas', value: interventions.length },
              { label: 'Vacunas aplicadas', value: vaccinations.length },
              { label: 'Desparasitaciones', value: dewormings.length },
              { label: 'Estudios realizados', value: studies.length },
              { label: 'Cirugías / operaciones', value: interventions.filter(i => i.type === 'Cirugía').length },
              { label: 'Tratamientos activos', value: interventions.filter(i => i.status === 'activo').length },
            ].map(({ label, value }) => (
              <div key={label} className="card p-4 flex items-center justify-between">
                <span className="text-sm text-gray-600">{label}</span>
                <span className="text-xl font-bold text-forest-800">{value}</span>
              </div>
            ))}
          </div>

          {/* Frecuencia de atención */}
          {interventions.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><TrendingUp size={16} /> Frecuencia de atención</h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { label: 'Último mes', value: interventions.filter(i => differenceInDays(new Date(), parseISO(i.date)) <= 30).length },
                  { label: 'Últimos 6 meses', value: interventions.filter(i => differenceInDays(new Date(), parseISO(i.date)) <= 180).length },
                  { label: 'Último año', value: interventions.filter(i => differenceInDays(new Date(), parseISO(i.date)) <= 365).length },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-2xl font-bold text-forest-800">{value}</p>
                    <p className="text-xs text-gray-500 mt-1">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weight evolution */}
          {weights.length > 1 && (
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Weight size={16} /> Evolución de peso</h3>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weights.map(w => ({ fecha: fmtDate(w.date), peso: w.weight_kg }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="fecha" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} unit=" kg" domain={['auto', 'auto']} />
                    <Tooltip formatter={v => [`${v} kg`, 'Peso']} />
                    <Line type="monotone" dataKey="peso" stroke="#15803d" strokeWidth={2} dot={{ fill: '#15803d', r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Costs per type bar chart */}
          {totalGlobal > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><DollarSign size={16} /> Gasto por categoría</h3>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Vacunas', valor: Math.round(totalCosts.vacunas) },
                    { name: 'Desparasit.', valor: Math.round(totalCosts.desparasitaciones) },
                    { name: 'Estudios', valor: Math.round(totalCosts.estudios) },
                    { name: 'Intervenc.', valor: Math.round(totalCosts.intervenciones) },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={v => [fmtMoney(v), 'Gasto']} />
                    <Bar dataKey="valor" fill="#15803d" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Indicadores de complejidad */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Indicadores de complejidad</h3>
            <div className="space-y-2">
              {[
                { label: 'Alta demanda sanitaria', cond: interventions.length > 10, threshold: '> 10 intervenciones' },
                { label: 'Medicación crónica', cond: interventions.some(i => i.status === 'activo' && i.medication), threshold: 'Medicación activa' },
                { label: 'Múltiples cirugías', cond: interventions.filter(i => i.type === 'Cirugía').length >= 2, threshold: '≥ 2 cirugías' },
                { label: 'Estudios frecuentes', cond: studies.length > 5, threshold: '> 5 estudios' },
                { label: 'Gasto elevado', cond: totalGlobal > 50000, threshold: '> $50.000' },
              ].map(({ label, cond, threshold }) => (
                <div key={label} className="flex items-center gap-3 text-sm">
                  {cond ? <CheckCircle size={16} className="text-amber-500 flex-shrink-0" /> : <div className="w-4 h-4 rounded-full border-2 border-gray-200 flex-shrink-0" />}
                  <span className={cond ? 'text-gray-900 font-medium' : 'text-gray-400'}>{label}</span>
                  <span className="text-xs text-gray-400 ml-auto">{threshold}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reproductive info */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Datos reproductivos e identificación</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Especie', animal.species],
                ['Sexo', animal.sex],
                ['Castrado/a', animal.is_neutered ? 'Sí' : 'No'],
                ['Fecha castración', fmtDate(animal.neutering_date)],
                ['N° tatuaje', animal.tattoo_number || '—'],
                ['Edad', getAge(animal.birth_date, animal.estimated_age_years)],
              ].map(([k, v]) => (
                <div key={k} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400">{k}</p>
                  <p className="font-medium text-gray-900 capitalize mt-0.5">{v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODALS ─── */}
      <Modal open={modal === 'vacuna'} onClose={() => setModal(null)} title="Registrar vacuna" size="md">
        <VacunaForm onSave={saveVacuna} onClose={() => setModal(null)} />
      </Modal>
      <Modal open={modal === 'desparasitacion'} onClose={() => setModal(null)} title="Registrar desparasitación" size="md">
        <DesparasitacionForm onSave={saveDesparasitacion} onClose={() => setModal(null)} />
      </Modal>
      <Modal open={modal === 'estudio'} onClose={() => setModal(null)} title="Registrar estudio médico" size="md">
        <EstudioForm onSave={saveEstudio} onClose={() => setModal(null)} />
      </Modal>
      <Modal open={modal === 'intervencion'} onClose={() => setModal(null)} title="Registrar intervención" size="lg">
        <IntervencionForm onSave={saveIntervencion} onClose={() => setModal(null)} />
      </Modal>
      <Modal open={modal === 'peso'} onClose={() => setModal(null)} title="Registrar peso" size="sm">
        <WeightForm onSave={savePeso} onClose={() => setModal(null)} />
      </Modal>

      <Modal open={modal === 'adopcion'} onClose={() => setModal(null)} title="Registrar adopción" size="md">
        <form onSubmit={saveAdoption} className="space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm text-blue-800">
            Al registrar la adopción, el animal pasará automáticamente a <strong>Hogar definitivo</strong>.
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Nombre del adoptante *</label>
              <input
                type="text" className="input" required
                value={adoptionForm.adopter_name}
                onChange={e => setAdoptionForm({ ...adoptionForm, adopter_name: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <label className="label">Dirección</label>
              <input
                type="text" className="input"
                value={adoptionForm.adopter_address}
                onChange={e => setAdoptionForm({ ...adoptionForm, adopter_address: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Teléfono</label>
              <input
                type="text" className="input"
                value={adoptionForm.adopter_phone}
                onChange={e => setAdoptionForm({ ...adoptionForm, adopter_phone: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Fecha de adopción *</label>
              <input
                type="date" className="input" required
                value={adoptionForm.adoption_date}
                onChange={e => setAdoptionForm({ ...adoptionForm, adoption_date: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <label className="label">Notas</label>
              <textarea
                className="input resize-none" rows={3}
                value={adoptionForm.notes}
                onChange={e => setAdoptionForm({ ...adoptionForm, notes: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={savingAdoption} className="btn-primary flex-1 justify-center">
              {savingAdoption ? 'Guardando...' : '❤️ Confirmar adopción'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
