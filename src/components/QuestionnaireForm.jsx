import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const FIELDS = [
  ['Особисті дані', [
    ['city', 'Місто'],
    ['desired_weight_kg', 'Бажана вага, кг'],
  ]],
  ['Цілі', [
    ['desired_timeline', 'Бажані терміни'],
    ['priorities', 'Пріоритети'],
  ]],
  ['Медична інформація', [
    ['chronic_conditions', 'Хронічні захворювання'],
    ['injuries', 'Травми'],
    ['allergies', 'Алергії'],
    ['medications', 'Препарати, що приймаються'],
  ]],
  ['Спосіб життя', [
    ['profession', 'Професія'],
    ['activity_level', 'Рівень активності'],
    ['sleep_pattern', 'Режим сну'],
    ['water_l', 'Вода, л/день'],
  ]],
  ['Досвід тренувань', [
    ['training_experience', 'Тренувальний стаж'],
    ['favorite_exercises', 'Улюблені вправи'],
    ['home_equipment', 'Інвентар вдома'],
  ]],
  ['Харчування', [
    ['meals_per_day', 'Прийомів їжі на день'],
    ['food_preferences', 'Харчові вподобання'],
    ['food_allergies', 'Алергії на продукти'],
  ]],
]

export default function QuestionnaireForm({ clientId, readOnly = false }) {
  const [data, setData] = useState({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    load()
  }, [clientId])

  async function load() {
    const { data: q } = await supabase.from('questionnaires').select('*').eq('client_id', clientId).maybeSingle()
    setData(q || {})
  }

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('questionnaires').upsert({ client_id: clientId, ...data })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <form style={styles.card} onSubmit={save}>
      {FIELDS.map(([group, fields]) => (
        <div key={group}>
          <div style={styles.groupTitle}>{group}</div>
          <div style={styles.grid}>
            {fields.map(([key, label]) => (
              <div key={key} style={styles.field}>
                <label style={styles.label}>{label}</label>
                {readOnly ? (
                  <div style={styles.readValue}>{data[key] || '—'}</div>
                ) : (
                  <input
                    style={styles.input}
                    value={data[key] || ''}
                    onChange={(e) => setData({ ...data, [key]: e.target.value })}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      {!readOnly && (
        <button style={styles.button} type="submit" disabled={saving}>
          {saving ? 'Збереження...' : 'Зберегти анкету'}
        </button>
      )}
      {saved && <p style={{ color: '#548235', margin: 0 }}>Збережено ✓</p>}
    </form>
  )
}

const styles = {
  card: { background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 14 },
  groupTitle: { fontWeight: 700, color: '#1F4E78', fontSize: 13, marginBottom: 6, textTransform: 'uppercase' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 },
  field: { display: 'flex', flexDirection: 'column', gap: 4 },
  label: { fontSize: 12, color: '#777' },
  input: { padding: '8px 10px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13 },
  readValue: { padding: '8px 0', fontSize: 13, color: '#333' },
  button: { padding: '10px 14px', borderRadius: 8, border: 'none', background: '#1F4E78', color: '#fff', cursor: 'pointer', fontWeight: 600, alignSelf: 'flex-start' },
}
