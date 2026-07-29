import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const PHOTO_TYPES = ['Профиль', 'Прогресс']
const ANGLES = ['Перед', 'Бок', 'Спина', 'Позирование']

export default function PhotoGallery({ clientId }) {
  const [photos, setPhotos] = useState([])
  const [photoType, setPhotoType] = useState('Прогресс')
  const [angle, setAngle] = useState('Перед')
  const [uploading, setUploading] = useState(false)
  const [urls, setUrls] = useState({})

  useEffect(() => {
    load()
  }, [clientId])

  async function load() {
    const { data } = await supabase
      .from('photos').select('*').eq('client_id', clientId)
      .order('log_date', { ascending: false }).limit(20)
    setPhotos(data || [])
    const signed = {}
    for (const p of data || []) {
      const { data: s } = await supabase.storage.from('photos').createSignedUrl(p.storage_path, 3600)
      if (s) signed[p.id] = s.signedUrl
    }
    setUrls(signed)
  }

  async function handleUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const path = `${clientId}/${Date.now()}_${file.name}`
    const { error: upErr } = await supabase.storage.from('photos').upload(path, file)
    if (!upErr) {
      await supabase.from('photos').insert({
        client_id: clientId, photo_type: photoType, angle, storage_path: path,
      })
      load()
    }
    setUploading(false)
    e.target.value = ''
  }

  return (
    <div style={styles.card}>
      <b>Завантажити фото</b>
      <div style={styles.row}>
        <select style={styles.input} value={photoType} onChange={(e) => setPhotoType(e.target.value)}>
          {PHOTO_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        {photoType === 'Прогресс' && (
          <select style={styles.input} value={angle} onChange={(e) => setAngle(e.target.value)}>
            {ANGLES.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        )}
      </div>
      <label style={styles.uploadBtn}>
        {uploading ? 'Завантаження...' : '+ Обрати фото'}
        <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} style={{ display: 'none' }} />
      </label>

      <div style={styles.grid}>
        {photos.map((p) => (
          <div key={p.id} style={styles.thumbWrap}>
            {urls[p.id] && <img src={urls[p.id]} alt="" style={styles.thumb} />}
            <div style={styles.thumbCaption}>{p.log_date} · {p.photo_type}{p.angle ? ` · ${p.angle}` : ''}</div>
          </div>
        ))}
        {photos.length === 0 && <p style={{ color: '#888' }}>Фото ще немає</p>}
      </div>
    </div>
  )
}

const styles = {
  card: { background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 10 },
  row: { display: 'flex', gap: 8 },
  input: { flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14 },
  uploadBtn: { textAlign: 'center', padding: '10px 14px', borderRadius: 8, background: '#1F4E78', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 14 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 10, marginTop: 6 },
  thumbWrap: { display: 'flex', flexDirection: 'column', gap: 4 },
  thumb: { width: '100%', height: 130, objectFit: 'cover', borderRadius: 8, background: '#eee' },
  thumbCaption: { fontSize: 11, color: '#777', textAlign: 'center' },
}
