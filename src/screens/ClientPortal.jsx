import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import QuestionnaireForm from '../components/QuestionnaireForm'
import PhotoGallery from '../components/PhotoGallery'

export default function ClientPortal() {
  const { profile } = useAuth()
  const [client, setClient] = useState(null)
  const [program, setProgram] = useState([])
  const [tab, setTab] = useState('Сьогодні')

  useEffect(() => {
    load()
  }, [profile])

  async function load() {
    const { data: c } = await supabase.from('clients').select('*').eq('user_id', profile.id).single()
    setClient(c)
    if (c) {
      const { data: p } = await supabase
        .from('workout_programs')
        .select('*, workout_program_exercises(*, exercises(name))')
        .eq('client_id', c.id)
        .order('sort_order')
      setProgram(p || [])
    }
  }

  if (!client) return <p>Завантаження...</p>

  return (
    <div>
      <h1 style={{ color: '#1F4E78' }}>Привіт, {client.full_name.split(' ')[0]}!</h1>

      <div style={styles.tabRow}>
        {['Сьогодні', 'Харчування', 'Заміри', 'Самопочуття', 'Анкета', 'Фото'].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ ...styles.tabBtn, ...(tab === t ? styles.tabBtnActive : {}) }}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Сьогодні' && <TodayWorkout clientId={client.id} program={program} />}
      {tab === 'Харчування' && <LogNutrition clientId={client.id} />}
      {tab === 'Заміри' && <LogMeasurement clientId={client.id} />}
      {tab === 'Самопочуття' && <LogFeedback clientId={client.id} />}
      {tab === 'Анкета' && <QuestionnaireForm clientId={client.id} />}
      {tab === 'Фото' && <PhotoGallery clientId={client.id} />}
    </div>
  )
}

function TodayWorkout({ clientId, program }) {
  const [savedIds, setSavedIds] = useState({})

  async function logSet(progEx, actualWeight, actualReps) {
    await supabase.from('workout_logs').insert({
      client_id: clientId,
      exercise_id: progEx.exercise_id,
      weight_kg: actualWeight || progEx.target_weight,
      reps: actualReps || null,
      sets: progEx.target_sets,
    })
    setSavedIds((s) => ({ ...s, [progEx.id]: true }))
  }

  if (program.length === 0) return <p style={{ color: '#888' }}>Тренер ще не додав програму тренувань</p>

  return (
    <div style={styles.card}>
      {program.map((day) => (
        <div key={day.id} style={{ marginBottom: 16 }}>
          <b>{day.day_name}</b>
          {day.workout_program_exercises.map((pe) => (
            <ExerciseRow key={pe.id} pe={pe} saved={savedIds[pe.id]} onLog={logSet} />
          ))}
        </div>
      ))}
    </div>
  )
}

function ExerciseRow({ pe, saved, onLog }) {
  const [weight, setWeight] = useState(pe.target_weight || '')
  const [reps, setReps] = useState('')
  return (
    <div style={styles.exRow}>
      <div>
        <div style={{ fontWeight: 600 }}>{pe.exercises?.name}</div>
        <div style={{ color: '#777', fontSize: 12 }}>
          {pe.target_sets}×{pe.target_reps} · план {pe.target_weight ?? '—'} кг · RIR {pe.target_rir ?? '—'}
        </div>
      </div>
      <div style={styles.exInputs}>
        <input style={styles.smallInput} placeholder="кг" value={weight} onChange={(e) => setWeight(e.target.value)} />
        <input style={styles.smallInput} placeholder="повт." value={reps} onChange={(e) => setReps(e.target.value)} />
        <button style={styles.smallBtn} onClick={() => onLog(pe, weight, reps)} disabled={saved}>
          {saved ? '✓' : 'OK'}
        </button>
      </div>
    </div>
  )
}

function LogNutrition({ clientId }) {
  const [products, setProducts] = useState([])
  const [form, setForm] = useState({ meal_type: 'Завтрак', product_id: '', weight_g: '' })
  useEffect(() => {
    supabase.from('products').select('id,name').order('name').then(({ data }) => setProducts(data || []))
  }, [])
  async function submit(e) {
    e.preventDefault()
    if (!form.product_id || !form.weight_g) return
    await supabase.from('nutrition_logs').insert({
      client_id: clientId,
      meal_type: form.meal_type,
      product_id: form.product_id,
      weight_g: form.weight_g,
    })
    setForm({ ...form, product_id: '', weight_g: '' })
  }
  return (
    <form style={styles.card} onSubmit={submit}>
      <b>Додати прийом їжі</b>
      <select style={styles.input} value={form.meal_type} onChange={(e) => setForm({ ...form, meal_type: e.target.value })}>
        {['Завтрак', 'Обед', 'Ужин', 'Перекус'].map((m) => <option key={m} value={m}>{m}</option>)}
      </select>
      <select style={styles.input} value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })}>
        <option value="">Оберіть продукт</option>
        {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <input style={styles.input} placeholder="Вага, г" value={form.weight_g}
        onChange={(e) => setForm({ ...form, weight_g: e.target.value })} />
      <button style={styles.button} type="submit">Зберегти</button>
    </form>
  )
}

function LogMeasurement({ clientId }) {
  const [form, setForm] = useState({ weight_kg: '', waist_cm: '' })
  const [saved, setSaved] = useState(false)
  async function submit(e) {
    e.preventDefault()
    await supabase.from('measurements').insert({ client_id: clientId, ...form })
    setSaved(true)
  }
  return (
    <form style={styles.card} onSubmit={submit}>
      <b>Внести заміри</b>
      <input style={styles.input} placeholder="Вага, кг" value={form.weight_kg}
        onChange={(e) => setForm({ ...form, weight_kg: e.target.value })} />
      <input style={styles.input} placeholder="Талія, см" value={form.waist_cm}
        onChange={(e) => setForm({ ...form, waist_cm: e.target.value })} />
      <button style={styles.button} type="submit">Зберегти</button>
      {saved && <p style={{ color: '#548235' }}>Збережено ✓</p>}
    </form>
  )
}

function LogFeedback({ clientId }) {
  const [form, setForm] = useState({ wellbeing: '', energy_level: '', comment: '' })
  const [saved, setSaved] = useState(false)
  async function submit(e) {
    e.preventDefault()
    await supabase.from('workout_feedback').insert({ client_id: clientId, ...form })
    setSaved(true)
  }
  return (
    <form style={styles.card} onSubmit={submit}>
      <b>Як пройшла тренування?</b>
      <input style={styles.input} placeholder="Самопочуття" value={form.wellbeing}
        onChange={(e) => setForm({ ...form, wellbeing: e.target.value })} />
      <input style={styles.input} placeholder="Рівень енергії" value={form.energy_level}
        onChange={(e) => setForm({ ...form, energy_level: e.target.value })} />
      <textarea style={styles.input} placeholder="Коментар" value={form.comment}
        onChange={(e) => setForm({ ...form, comment: e.target.value })} />
      <button style={styles.button} type="submit">Зберегти</button>
      {saved && <p style={{ color: '#548235' }}>Збережено ✓</p>}
    </form>
  )
}

const styles = {
  tabRow: { display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' },
  tabBtn: { padding: '8px 14px', borderRadius: 20, border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontSize: 13 },
  tabBtnActive: { background: '#1F4E78', color: '#fff', borderColor: '#1F4E78' },
  card: { background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 10 },
  exRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f5f5f5' },
  exInputs: { display: 'flex', gap: 6 },
  smallInput: { width: 54, padding: '6px 8px', borderRadius: 6, border: '1px solid #ddd', fontSize: 13 },
  smallBtn: { padding: '6px 10px', borderRadius: 6, border: 'none', background: '#548235', color: '#fff', cursor: 'pointer', fontWeight: 700 },
  input: { padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14 },
  button: { padding: '10px 14px', borderRadius: 8, border: 'none', background: '#1F4E78', color: '#fff', cursor: 'pointer', fontWeight: 600, alignSelf: 'flex-start' },
}
