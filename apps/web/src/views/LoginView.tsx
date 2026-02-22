import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { MapPin } from 'lucide-react'
import { useAuthStore } from '@/stores/auth'
import { authService } from '@/services/auth'
import MapBackground from '@/components/inspira/MapBackground'

export default function LoginView() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)

  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [peopleName, setPeopleName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [registerSuccess, setRegisterSuccess] = useState(false)

  function switchMode(next: 'login' | 'register') {
    setMode(next)
    setFormError(null)
    setRegisterSuccess(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setFormError(null)
    setRegisterSuccess(false)
    try {
      if (mode === 'login') {
        await login({ account, password })
        navigate({ to: '/locations' })
      } else {
        await authService.register({ account, email, password, people_name: peopleName })
        setRegisterSuccess(true)
        setMode('login')
        setEmail('')
        setPeopleName('')
      }
    } catch (e) {
      if (e instanceof Error) {
        if (e.message === 'Account not found' || e.message === 'Invalid password') {
          setFormError('帳號或密碼錯誤')
        } else {
          setFormError(e.message)
        }
      } else {
        setFormError(mode === 'login' ? '登入失敗，請稍後再試' : '註冊失敗，請稍後再試')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <MapBackground>
      <div className="relative z-10 w-full max-w-sm mx-4">
        <div className="card bg-base-100 shadow-xl border border-base-200">
          <div className="card-body px-8 py-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-sm">
                <MapPin className="w-5 h-5 text-primary-content" />
              </div>
              <div>
                <h1 className="text-xl font-bold leading-none tracking-tight">skMove</h1>
                <p className="text-xs text-base-content/40 mt-0.5">路線規劃管理系統</p>
              </div>
            </div>

            <h2 className="font-semibold text-base text-base-content/70 mb-4">
              {mode === 'login' ? '登入帳號' : '建立帳號'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-control">
                <label className="label pt-0">
                  <span className="label-text">帳號</span>
                </label>
                <input
                  type="text"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  placeholder="請輸入帳號"
                  className="input input-bordered w-full"
                  autoComplete="username"
                  required
                />
              </div>

              {mode === 'register' && (
                <>
                  <div className="form-control">
                    <label className="label pt-0">
                      <span className="label-text">電子郵件</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="請輸入電子郵件"
                      className="input input-bordered w-full"
                      autoComplete="email"
                      required
                    />
                  </div>

                  <div className="form-control">
                    <label className="label pt-0">
                      <span className="label-text">姓名</span>
                    </label>
                    <input
                      type="text"
                      value={peopleName}
                      onChange={(e) => setPeopleName(e.target.value)}
                      placeholder="請輸入姓名"
                      className="input input-bordered w-full"
                      autoComplete="name"
                      required
                    />
                  </div>
                </>
              )}

              <div className="form-control">
                <label className="label pt-0">
                  <span className="label-text">密碼</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="請輸入密碼"
                  className="input input-bordered w-full"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  required
                />
              </div>

              {registerSuccess && (
                <div className="alert alert-success py-2.5 text-sm">
                  <span>註冊成功！請使用帳號密碼登入</span>
                </div>
              )}

              {formError && (
                <div className="alert alert-error py-2.5 text-sm">
                  <span>{formError}</span>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-block mt-2"
                disabled={isLoading}
              >
                {isLoading && <span className="loading loading-spinner loading-xs" />}
                {isLoading
                  ? (mode === 'login' ? '登入中...' : '註冊中...')
                  : (mode === 'login' ? '登入' : '建立帳號')}
              </button>
            </form>

            <div className="text-center mt-4 text-sm text-base-content/50">
              {mode === 'login' ? (
                <>
                  還沒有帳號？{' '}
                  <button className="link link-primary" onClick={() => switchMode('register')}>
                    立即註冊
                  </button>
                </>
              ) : (
                <>
                  已有帳號？{' '}
                  <button className="link link-primary" onClick={() => switchMode('login')}>
                    返回登入
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </MapBackground>
  )
}
