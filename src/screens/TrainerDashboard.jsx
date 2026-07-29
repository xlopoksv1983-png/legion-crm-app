import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function TrainerDashboard() {
  const [stats, setStats] = useState(null)
  const [overdue, setOverdue] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const today = new Date().toISOString().slice(0, 10)

    const [{ count: active }, { count: paused }, { count: finished }, { data: overdueClients }] =
      await Promise.all([
        supabase.from('clients').select('*', { count: 'exact', head: true }).eq('status', 'Активный'),
        supabase.from('clients').select('*', { count: 'exact', head: true }).eq('status', 'Пауза'),
        supabase.from('clients').select('*', { count: 'exact', head: true }).eq('status', 'Закончил'),
        supabase
          .from('clients')
          .select('id, full_name, next_report_date')
          .eq('status', 'Активный')
          .lt('next_report_date', today)
          .order('next_report_date', { ascending: true }),
      ])

    setStats({ active, paused, finished })
    setOverdue(overdueClients || [])
    setLoading(false)
  }

  if (loading) return <p>Завантаження...</p>

  return (
    <div>
      <h1 style={{ color: '#1F4E78' }}>Головна</h1>
      <div style={styles.kpiRow}>
        <KpiCard label="Активні клієнти" value={stats.active} color="#1F4E78" />
        <KpiCard label="На паузі" value={stats.paused} color="#BF8F00" />
        <KpiCard label="Завершили" value={stats.finished} color="#808080" />
        <KpiCard label="Прострочено звітів" value={overdue.length} color="#C00000" />
      </div>

      <section style={{ marginTop: 24 }}>
        <h2 style={styles.sectionTitle}>🔴 Хто не відправив звіт</h2>
        {overdue.length === 0 && <p style={{ color: '#888' }}>Немає прострочених звітів</p>}
        <ul style={styles.list}>
          {overdue.map((c) => (
            <li key={c.id} style={styles.listItem}>
              <Link to={`/clients/${c.id}`} style={styles.listLink}>{c.full_name}</Link>
              <span style={styles.listMeta}>термін: {c.next_report_date}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function KpiCard({ label, value, color }) {
  return (
    <div style={styles.kpiCard}>
      <div style={{ ...styles.kpiValue, color }}>{value}</div>
      <div style={styles.kpiLabel}>{label}</div>
    </div>
  )
}

const styles = {
  kpiRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 },
  kpiCard: { background: '#fff', borderRadius: 12, padding: 16, textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  kpiValue: { fontSize: 30, fontWeight: 700 },
  kpiLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  sectionTitle: { fontSize: 16, color: '#333' },
  list: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 },
  listItem: { background: '#fff', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  listLink: { color: '#1F4E78', textDecoration: 'none', fontWeight: 600 },
  listMeta: { color: '#C00000', fontSize: 13 },
}
