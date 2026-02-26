import { Link, useNavigate } from '@tanstack/react-router'
import { MapPin, Truck, Tag, ClipboardList, Cpu, LogOut } from 'lucide-react'
import { useAuthStore } from '@/stores/auth'

const navItems = [
  { to: '/locations',     icon: MapPin,          label: '地點管理' },
  { to: '/vehicles',      icon: Truck,           label: '車輛管理' },
  { to: '/vehicle-types', icon: Tag,             label: '車輛類型' },
  { to: '/orders',        icon: ClipboardList,   label: '訂單管理' },
  { to: '/computes',      icon: Cpu,             label: '計算任務' },
] as const

export default function AppSidebar() {
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate({ to: '/login' })
  }

  return (
    <aside className="flex flex-col w-64 min-h-full bg-base-100 border-r border-base-300">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-base-300">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <MapPin className="w-4 h-4 text-primary-content" />
        </div>
        <div>
          <span className="font-bold text-base leading-none tracking-tight">skMove</span>
          <p className="text-[10px] text-base-content/40 mt-0.5">路線規劃管理</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3">
        <p className="text-[10px] font-semibold text-base-content/35 uppercase tracking-widest px-3 mb-2">
          管理
        </p>
        <ul className="menu p-0 gap-0.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <li key={to}>
              <Link
                to={to}
                activeProps={{ className: 'active' }}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout */}
      <div className="border-t border-base-300 px-3 py-3">
        <button
          className="btn btn-ghost btn-sm btn-block justify-start gap-2 text-base-content/60 hover:text-base-content"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          登出
        </button>
      </div>
    </aside>
  )
}
