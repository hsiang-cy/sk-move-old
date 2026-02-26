import { Menu } from 'lucide-react'
import AppSidebar from './AppSidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="drawer lg:drawer-open min-h-screen">
      <input id="app-drawer" type="checkbox" className="drawer-toggle" />

      <div className="drawer-content flex flex-col bg-base-200 min-h-screen">
        {/* Mobile topbar */}
        <header className="navbar bg-base-100 border-b border-base-300 lg:hidden px-4 min-h-14">
          <label htmlFor="app-drawer" className="btn btn-ghost btn-square btn-sm">
            <Menu className="w-5 h-5" />
          </label>
          <span className="font-bold text-base ml-2">skMove</span>
        </header>

        <main className="flex-1 p-6 max-w-screen-xl">
          {children}
        </main>
      </div>

      <div className="drawer-side z-40">
        <label htmlFor="app-drawer" className="drawer-overlay" aria-label="關閉選單" />
        <AppSidebar />
      </div>
    </div>
  )
}
