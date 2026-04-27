import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Dog, Bell, LogOut, Menu, X, ChevronRight, User
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const navItems = [
  { to: '/',           icon: LayoutDashboard, label: 'Dashboard'     },
  { to: '/animales',   icon: Dog,             label: 'Animales'      },
  { to: '/recordatorios', icon: Bell,         label: 'Recordatorios' },
]

export default function Layout({ children }) {
  const [open, setOpen] = useState(false)
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  const Sidebar = ({ mobile = false }) => (
    <div className={`flex flex-col h-full bg-forest-900 text-white ${mobile ? '' : ''}`}>
      {/* Logo */}
      <div className="px-6 py-5 border-b border-forest-800">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🐾</span>
          <div>
            <p className="font-bold text-sm leading-tight">Zoonosis</p>
            <p className="text-forest-100/60 text-xs">Villa Allende</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-forest-700 text-white'
                  : 'text-forest-100/70 hover:bg-forest-800 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-forest-800">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-7 h-7 rounded-full bg-forest-700 flex items-center justify-center flex-shrink-0">
            <User size={14} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{profile?.full_name || 'Usuario'}</p>
            <p className="text-xs text-forest-100/50 truncate capitalize">{profile?.role || 'veterinario'}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-forest-100/70 hover:bg-forest-800 hover:text-white transition-colors w-full"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex w-56 flex-shrink-0 flex-col">
        <Sidebar />
      </div>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative w-56 flex-shrink-0">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200">
          <button onClick={() => setOpen(true)} className="p-1">
            <Menu size={20} />
          </button>
          <span className="font-semibold text-sm">Zoonosis · Villa Allende</span>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-[#f7f5f0]">
          <div className="p-4 md:p-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
