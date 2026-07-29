import { Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function Layout({ children }) {
  const { isTrainer, signOut, profile } = useAuth()

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', minHeight: '100vh', background: '#F7F8FA' }}>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <span style={styles.logo}>Legion CRM</span>
          {isTrainer && (
            <nav style={styles.nav}>
              <Link to="/" style={styles.navLink}>Головна</Link>
              <Link to="/clients" style={styles.navLink}>Клієнти</Link>
            </nav>
          )}
          <div style={styles.spacer} />
          <span style={styles.userName}>{profile?.full_name || ''}</span>
          <button style={styles.signOut} onClick={signOut}>Вийти</button>
        </div>
      </header>
      <main style={styles.main}>{children}</main>
    </div>
  )
}

const styles = {
  header: { background: '#1F4E78', color: '#fff', position: 'sticky', top: 0, zIndex: 10 },
  headerInner: { maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', padding: '12px 16px', gap: 20 },
  logo: { fontWeight: 700, fontSize: 17 },
  nav: { display: 'flex', gap: 14 },
  navLink: { color: '#D9E1F2', textDecoration: 'none', fontSize: 14 },
  spacer: { flex: 1 },
  userName: { fontSize: 13, color: '#D9E1F2' },
  signOut: { background: 'transparent', border: '1px solid #6a90b8', color: '#fff', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13 },
  main: { maxWidth: 900, margin: '0 auto', padding: 16 },
}
