import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const STATUS_COLORS = {
  'Активный': '#548235',
  'Пауза': '#BF8F00',
  'Закончил': '#808080',
  'Архив': '#444',
}

export default function ClientList() {
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('clients').select('*').order('full_name')
    setClients(data || [])
    setLoading(false)
  }

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase()
    return (
      c.full_name?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q) ||
      c.telegram?.toLowerCase().includes(q)
    )
  })

  return (
    <div>
      <div style={styles.headerRow}>
        <h1 style={{ color: '#1F4E78', margin: 0 }}>Клієнти</h1>
        <button style={styles.addBtn} onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Скасувати' : '+ Новий клієнт'}
        </button>
      </div>

      {showForm && <NewClientForm onCreated={() => { setShowForm(false); load() }} />}

      <input
        style={styles.search}
        placeholder="Пошук за ім'ям, телефоном, Telegram..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {loading ? (
        <p>Завантаження...</p>
      ) : (
        <div style={styles.list}>
          {filtered.map((c) => (
            <Link to={`/clients/${c.id}`} key={c.id} style={styles.card}>
              <div>
                <div style={styles.name}>{c.full_name}</div>
                <div style={styles.meta}>{c.goal || '—'} · {c.program || '—'}</div>
              </div>
              <span style={{ ...styles.badge, background: STATUS_COLORS[c.status] || '#999' }}>
                {c.status}
              </span>
            </Link>
          ))}
          {filtered.length === 0 && <p style={{ color: '#888' }}>Клієнтів не знайдено</p>}
        </div>
      )}
    </div>
  )
}

function NewClientForm({ onCreated }) {
  const [form, setForm] = useState({
    full_name: '', phone: '', telegram: '', goal: 'Похудение', program: 'Full Body', status: 'Активный',
  })
  const [saving, setSaving] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!form.full_name.trim()) return
    setSaving(true)
    await supabase.from('clients').insert(form)
    setSaving(false)
    onCreated()
  }

  return (
    <form style={styles.formCard} onSubmit={submit}>
      <div style={styles.formGrid}>
        <input style={styles.input} placeholder="ПІБ *" value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
        <input style={styles.input} placeholder="Телефон" value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input style={styles.input} placeholder="Telegram" value={form.telegram}
          onChange={(e) => setForm({ ...form, telegram: e.target.value })} />
        <select style={styles.input} value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })}>
          {['Похудение', 'Набор массы', 'Рекомпозиция', 'Поддержание', 'Реабилитация'].map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <select style={styles.input} value={form.program} onChange={(e) => setForm({ ...form, program: e.target.value })}>
          {['Full Body', 'Верх / Низ', 'Push Pull Legs', 'Индивидуальная'].map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>
      <button style={styles.button} type="submit" disabled={saving}>
        {saving ? 'Збереження...' : 'Створити клієнта'}
      </button>
    </form>
  )
}

const styles = {
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  addBtn: { padding: '10px 16px', borderRadius: 10, border: 'none', background: '#548235', color: '#fff', fontWeight: 600, cursor: 'pointer' },
  formCard: { background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 },
  search: { width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: 10, border: '1px solid #ddd', fontSize: 15, marginBottom: 16 },
  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  card: { background: '#fff', borderRadius: 12, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textDecoration: 'none', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  name: { color: '#1F4E78', fontWeight: 700, fontSize: 15 },
  meta: { color: '#777', fontSize: 13, marginTop: 2 },
  badge: { color: '#fff', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20 },
  input: { padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14 },
  button: { padding: '10px 14px', borderRadius: 8, border: 'none', background: '#1F4E78', color: '#fff', cursor: 'pointer', fontWeight: 600, alignSelf: 'flex-start' },
}
