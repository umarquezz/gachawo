'use client'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, Loader2, Gamepad2, ArrowLeft } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
          },
        })
        if (error) throw error
        alert('Conta criada com sucesso! Você já pode navegar.')
        router.push('/dashboard')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro na autenticação')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#040408]">
      <div className="w-full max-w-md">
        {/* Back link */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-white/40 hover:text-white transition mb-8 group"
        >
          <ArrowLeft size={16} />
          <span className="text-sm font-medium">Voltar para a loja</span>
        </Link>

        {/* Card */}
        <div className="bg-[#0c0c12] border border-white/5 rounded-xl p-8 shadow-2xl relative overflow-hidden">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <img src="/logo.png" alt="Gacha World" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">
                Gacha<span className="text-white/60"> World</span>
              </h1>
              <p className="text-[9px] text-white/20 uppercase tracking-[0.2em] font-bold">Acesso Seguro</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-2">
              {isSignUp ? 'Criar nova conta' : 'Acesse sua conta'}
            </h2>
            <p className="text-white/40 text-xs">
              {isSignUp 
                ? 'Preencha os dados para começar suas compras.' 
                : 'Entre para acessar seus produtos e pedidos.'}
            </p>
          </div>

          {error && (
            <div className="bg-red-500/5 border border-red-500/20 text-red-400 p-4 rounded-lg text-xs mb-6">
              {error}
            </div>
          )}

          {/* Social Login */}
          <button
            onClick={handleGoogleLogin}
            className="w-full bg-white text-black font-bold py-3.5 rounded-lg transition hover:bg-white/90 text-sm flex items-center justify-center gap-3 mb-6"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Entrar com Google
          </button>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest text-white/20 font-bold">
              <span className="bg-[#0c0c12] px-3">ou e-mail</span>
            </div>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="text-[10px] text-white/30 uppercase tracking-widest font-bold block mb-1.5 ml-1">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full bg-white/[0.02] border border-white/5 rounded-lg pl-11 pr-4 py-3 text-white text-sm focus:outline-none focus:border-white/20 focus:bg-white/[0.04] transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-white/30 uppercase tracking-widest font-bold block mb-1.5 ml-1">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/[0.02] border border-white/5 rounded-lg pl-11 pr-4 py-3 text-white text-sm focus:outline-none focus:border-white/20 focus:bg-white/[0.04] transition"
                  required
                  minLength={6}
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-3.5 rounded-lg transition disabled:opacity-50 text-sm flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                isSignUp ? 'Criar conta' : 'Acessar plataforma'
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs text-white/30 hover:text-white transition underline underline-offset-4"
            >
              {isSignUp ? 'Já tem uma conta? Entre aqui' : 'Não tem conta? Cadastre-se'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
