import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [inviteToken, setInviteToken] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('invite')
    if (token) setInviteToken(token)
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (inviteToken) {
      const { error: signUpError } = await supabase.auth.signUp({ email, password })
      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }
      const { error: claimError } = await supabase.rpc('claim_client_invite', { token: inviteToken })
      if (claimError) {
        setError('Помилка запрошення: ' + claimError.message)
        setLoading(false)
        return
      }
      window.location.href = window.location.origin
      return
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('Невірний email або пароль')
    setLoading(false)
  }

  return (
    <div style={styles.wrap}>
      <form style={styles.card} onSubmit={handleSubmit}>
        <h1 style={styles.title}>Legion CRM</h1>
        <p style={styles.subtitle}>
          {inviteToken ? 'Створіть акаунт клієнта' : 'Увійдіть у свій акаунт'}
        </p>
        <input
          style={styles.input}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          style={styles.input}
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p style={styles.error}>{error}</p>}
        <button style={styles.button} type="submit" disabled={loading}>
          {loading ? 'Зачекайте...' : inviteToken ? 'Створити акаунт' : 'Увійти'}
        </button>
      </form>
    </div>
  )
}

const styles = {
  wrap: { display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#F2F2F2', fontFamily: 'Arial, sans-serif' },
  card: { background: '#fff', padding: 32, borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 12 },
  title: { color: '#1F4E78', margin: 0, fontSize: 24 },
  subtitle: { color: '#666', margin: '0 0 12px 0', fontSize: 14 },
  input: { padding: '12px 14px', borderRadius: 10, border: '1px solid #ddd', fontSize: 15 },
  button: { padding: '12px 14px', borderRadius: 10, border: 'none', background: '#1F4E78', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer' },
  error: { color: '#C00000', fontSize: 13, margin: 0 },
}