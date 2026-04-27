import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password)
        if (error) throw error
      } else {
        const { error } = await signUp(email, password, fullName)
        if (error) throw error
        setSuccess('¡Cuenta creada! Revisá tu correo para confirmar.')
        setMode('login')
      }
    } catch (err) {
      const msgs = {
        'Invalid login credentials': 'Email o contraseña incorrectos.',
        'Email not confirmed': 'Confirmá tu email antes de ingresar.',
        'User already registered': 'Ya existe una cuenta con ese email.',
      }
      setError(msgs[err.message] || err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f5f0] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🐾</div>
          <h1 className="text-2xl font-bold text-forest-900">Zoonosis</h1>
          <p className="text-gray-500 text-sm mt-1">Municipalidad de Villa Allende</p>
        </div>

        {/* Card */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-5 text-lg">
            {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </h2>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="label">Nombre completo</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ej: Dr. Juan Pérez"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                />
              </div>
            )}
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Contraseña</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-forest-800 hover:bg-forest-900 text-white py-2.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
            >
              {loading ? 'Procesando...' : mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
              className="text-forest-700 hover:text-forest-900 text-sm"
            >
              {mode === 'login' ? '¿No tenés cuenta? Registrarte' : '¿Ya tenés cuenta? Ingresar'}
            </button>
          </div>
        </div>

        <p className="text-center text-gray-400 text-xs mt-6">
          Sistema de uso interno municipal
        </p>
      </div>
    </div>
  )
}
