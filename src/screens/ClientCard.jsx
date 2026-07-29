import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import QuestionnaireForm from '../components/QuestionnaireForm'
import PhotoGallery from '../components/PhotoGallery'

const TABS = ['Огляд', 'Програма', 'Тренування', 'Харчування', 'Заміри', 'Анкета', 'Фото']

export default function ClientCard() {
  const { id } = useParams()
  const [client, setClient] = useState(null)
  const [tab, setTab] = useState('Огляд')
  const [lastMeasurement, setLastMeasurement] = useState(null)
  const [lastWorkout, setLastWorkout] = useState(null)

  useEffect(() => {
    load()
  }, [id])

  async function load() {
    const { data: c } = await supabase.from('clients').select('*').eq('id', id).single()
    setClient(c)
    const { data: m } = await supabase
      .from('measurements').select('*').eq('client_id', id)
      .order('log_date', { ascending: false }).limit(1).maybeSingle()
    setLastMeasurement(m)
    const { data: w } = await supabase
      .from('workout_logs').select('*, exercises(name)').eq('client_id', id)
      .order('log_date', { ascending: false }).limit(1).maybeSingle()
    setLastWorkout(w)
  }

  if (!client) return <p>Завантаження...</p>

  return (
    <div>
      <h1 style={{ color: '#1F4E78', marginBottom: 4 }}>{client.full_name}</h1>
      <p style={{ color: '#777', marginTop: 0 }}>{client.goal} · {client.program} · {client.status}</p>

      <div style={styles.tabRow}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{ ...styles.tabBtn, ...(tab === t ? styles.tabBtnActive : {}) }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Огляд' && (
        <Overview client={client} lastMeasurement={lastMeasurement} lastWorkout={lastWorkout} />
      )}
      {tab === 'Програма' && <ProgramTab clientId={id} />}
      {tab === 'Тренування' && <WorkoutTab clientId={id} />}
      {tab === 'Харчування' && <NutritionTab clientId={id} />}
      {tab === 'Заміри' && <MeasurementsTab clientId={id} onAdded={load} />}
      {tab === 'Анкета' && <QuestionnaireForm clientId={id} readOnly />}
      {tab === 'Фото' && <PhotoGallery clientId={id} />}
    </div>
  )
}

function Overview({ client, lastMeasurement, lastWorkout }) {
  return (
    <div style={styles.card}>
      <Row label="Телефон" value={client.phone} />
      <Row label="Telegram" value={client.telegram} />
      <Row label="Зріст" value={client.height_cm ? `${client.height_cm} см` : '—'} />
      <Row label="Наступний звіт" value={client.next_report_date || '—'} />
      <Row label="Вартість супроводу" value={client.price ? `${client.price} грн` : '—'} />
      <hr style={styles.hr} />
      <b>Останній замір</b>
      <Row label="Дата" value={lastMeasurement?.log_date || '—'} />
      <Row label="Вага" value={lastMeasurement?.weight_kg ? `${lastMeasurement.weight_kg} кг` : '—'} />
      <Row label="Талія" value={lastMeasurement?.waist_cm ? `${lastMeasurement.waist_cm} см` : '—'} />
      <hr style={styles.hr} />
      <b>Останнє тренування</b>
      <Row label="Дата" value={lastWorkout?.log_date || '—'} />
      <Row label="Вправа" value={lastWorkout?.exercises?.name || '—'} />
      <hr style={styles.hr} />
      <b>Нотатки тренера</b>
      <p style={{ color: '#444' }}>{client.trainer_comment || '—'}</p>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div style={styles.row}>
      <span style={styles.rowLabel}>{label}</span>
      <span style={styles.rowValue}>{value}</span>
    </div>
  )
}

function WorkoutTab({ clientId }) {
  const [logs, setLogs] = useState([])
  useEffect(() => { load() }, [clientId])
  async function load() {
    const { data } = await supabase
      .from('workout_logs').select('*, exercises(name)').eq('client_id', clientId)
      .order('log_date', { ascending: false }).limit(30)
    setLogs(data || [])
  }
  return (
    <div style={styles.card}>
      {logs.length === 0 && <p style={{ color: '#888' }}>Записів ще немає</p>}
      {logs.map((l) => (
        <div key={l.id} style={styles.logRow}>
          <span>{l.log_date} — {l.exercises?.name}</span>
          <span style={{ color: '#777' }}>{l.sets}×{l.reps} @ {l.weight_kg}кг {l.rir != null ? `RIR ${l.rir}` : ''}</span>
        </div>
      ))}
    </div>
  )
}

function NutritionTab({ clientId }) {
  const [logs, setLogs] = useState([])
  useEffect(() => { load() }, [clientId])
  async function load() {
    const { data } = await supabase
      .from('nutrition_logs').select('*, products(name, kcal_100g, protein_100g)').eq('client_id', clientId)
      .order('log_date', { ascending: false }).limit(30)
    setLogs(data || [])
  }
  return (
    <div style={styles.card}>
      {logs.length === 0 && <p style={{ color: '#888' }}>Записів ще немає</p>}
      {logs.map((l) => {
        const kcal = l.products ? Math.round((l.products.kcal_100g * l.weight_g) / 100) : null
        return (
          <div key={l.id} style={styles.logRow}>
            <span>{l.log_date} — {l.meal_type}: {l.products?.name} ({l.weight_g}г)</span>
            <span style={{ color: '#777' }}>{kcal != null ? `${kcal} ккал` : ''}</span>
          </div>
        )
      })}
    </div>
  )
}

function MeasurementsTab({ clientId, onAdded }) {
  const [logs, setLogs] = useState([])
  const [form, setForm] = useState({ weight_kg: '', waist_cm: '', chest_cm: '' })
  useEffect(() => { load() }, [clientId])
  async function load() {
    const { data } = await supabase
      .from('measurements').select('*').eq('client_id', clientId)
      .order('log_date', { ascending: false }).limit(30)
    setLogs(data || [])
  }
  async function addMeasurement(e) {
    e.preventDefault()
    await supabase.from('measurements').insert({
      client_id: clientId,
      weight_kg: form.weight_kg || null,
      waist_cm: form.waist_cm || null,
      chest_cm: form.chest_cm || null,
    })
    setForm({ weight_kg: '', waist_cm: '', chest_cm: '' })
    load()
    onAdded && onAdded()
  }
  return (
    <div>
      <form style={styles.card} onSubmit={addMeasurement}>
        <b>Новий замір</b>
        <div style={styles.formRow}>
          <input style={styles.input} placeholder="Вага, кг" value={form.weight_kg}
            onChange={(e) => setForm({ ...form, weight_kg: e.target.value })} />
          <input style={styles.input} placeholder="Талія, см" value={form.waist_cm}
            onChange={(e) => setForm({ ...form, waist_cm: e.target.value })} />
          <input style={styles.input} placeholder="Груди, см" value={form.chest_cm}
            onChange={(e) => setForm({ ...form, chest_cm: e.target.value })} />
        </div>
        <button style={styles.button} type="submit">Зберегти замір</button>
      </form>
      <div style={{ ...styles.card, marginTop: 12 }}>
        {logs.length === 0 && <p style={{ color: '#888' }}>Записів ще немає</p>}
        {logs.map((l) => (
          <div key={l.id} style={styles.logRow}>
            <span>{l.log_date}</span>
            <span style={{ color: '#777' }}>{l.weight_kg ?? '—'} кг · талія {l.waist_cm ?? '—'} см</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ProgramTab({ clientId }) {
  const [days, setDays] = useState([])
  const [exercises, setExercises] = useState([])
  const [newDayName, setNewDayName] = useState('')

  useEffect(() => { load() }, [clientId])

  async function load() {
    const { data: d } = await supabase
      .from('workout_programs')
      .select('*, workout_program_exercises(*, exercises(name))')
      .eq('client_id', clientId)
      .order('sort_order')
    setDays(d || [])
    const { data: ex } = await supabase.from('exercises').select('id,name').order('name')
    setExercises(ex || [])
  }

  async function addDay(e) {
    e.preventDefault()
    if (!newDayName.trim()) return
    await supabase.from('workout_programs').insert({
      client_id: clientId, day_name: newDayName, sort_order: days.length,
    })
    setNewDayName('')
    load()
  }

  async function addExerciseToDay(programId, exerciseId, sets, reps, weight, rir) {
    if (!exerciseId) return
    await supabase.from('workout_program_exercises').insert({
      program_id: programId, exercise_id: exerciseId,
      target_sets: sets || null, target_reps: reps || null,
      target_weight: weight || null, target_rir: rir || null,
    })
    load()
  }

  return (
    <div style={styles.card}>
      <form style={styles.formRow} onSubmit={addDay}>
        <input style={styles.input} placeholder="Назва дня (напр. Ноги)" value={newDayName}
          onChange={(e) => setNewDayName(e.target.value)} />
        <button style={styles.button} type="submit">+ Додати день</button>
      </form>

      {days.map((day) => (
        <DayBlock key={day.id} day={day} exercises={exercises} onAddExercise={addExerciseToDay} />
      ))}
      {days.length === 0 && <p style={{ color: '#888' }}>Програму ще не створено</p>}
    </div>
  )
}

function DayBlock({ day, exercises, onAddExercise }) {
  const [exId, setExId] = useState('')
  const [sets, setSets] = useState('')
  const [reps, setReps] = useState('')
  const [weight, setWeight] = useState('')
  const [rir, setRir] = useState('')

  function submit(e) {
    e.preventDefault()
    onAddExercise(day.id, exId, sets, reps, weight, rir)
    setExId(''); setSets(''); setReps(''); setWeight(''); setRir('')
  }

  return (
    <div style={{ borderTop: '1px solid #eee', paddingTop: 12, marginTop: 4 }}>
      <b>{day.day_name}</b>
      {day.workout_program_exercises.map((pe) => (
        <div key={pe.id} style={styles.logRow}>
          <span>{pe.exercises?.name}</span>
          <span style={{ color: '#777' }}>{pe.target_sets}×{pe.target_reps} · {pe.target_weight ?? '—'}кг · RIR {pe.target_rir ?? '—'}</span>
        </div>
      ))}
      <form style={styles.formRow} onSubmit={submit}>
        <select style={styles.input} value={exId} onChange={(e) => setExId(e.target.value)}>
          <option value="">Обрати вправу</option>
          {exercises.map((ex) => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
        </select>
        <input style={{ ...styles.input, maxWidth: 60 }} placeholder="сети" value={sets} onChange={(e) => setSets(e.target.value)} />
        <input style={{ ...styles.input, maxWidth: 70 }} placeholder="повт." value={reps} onChange={(e) => setReps(e.target.value)} />
        <input style={{ ...styles.input, maxWidth: 70 }} placeholder="вага" value={weight} onChange={(e) => setWeight(e.target.value)} />
        <input style={{ ...styles.input, maxWidth: 60 }} placeholder="RIR" value={rir} onChange={(e) => setRir(e.target.value)} />
        <button style={styles.button} type="submit">+</button>
      </form>
    </div>
  )
}

const styles = {
  tabRow: { display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' },
  tabBtn: { padding: '8px 14px', borderRadius: 20, border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontSize: 13 },
  tabBtnActive: { background: '#1F4E78', color: '#fff', borderColor: '#1F4E78' },
  card: { background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 6 },
  row: { display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f0f0f0' },
  rowLabel: { color: '#777', fontSize: 13 },
  rowValue: { fontWeight: 600, fontSize: 13 },
  hr: { border: 'none', borderTop: '1px solid #eee', margin: '8px 0' },
  logRow: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f5f5', fontSize: 13 },
  formRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  input: { flex: 1, minWidth: 100, padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14 },
  button: { padding: '10px 14px', borderRadius: 8, border: 'none', background: '#1F4E78', color: '#fff', cursor: 'pointer', fontWeight: 600, alignSelf: 'flex-start' },
}
