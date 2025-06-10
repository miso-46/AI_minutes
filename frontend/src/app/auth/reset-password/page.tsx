'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isValidSession, setIsValidSession] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    // URLパラメータまたはハッシュからトークンを取得
    const handleAuthTokens = async () => {
      // URLハッシュからトークンを取得（メールリンクから）
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const type = hashParams.get('type')

      if (accessToken && refreshToken && type === 'recovery') {
        try {
          // セッションを設定
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (error) {
            setMessage('無効なリセットリンクです。新しいリセットリンクを要求してください。')
          } else {
            setIsValidSession(true)
          }
        } catch (error) {
          setMessage('セッションの設定中にエラーが発生しました')
        }
      } else {
        // 既存のセッションを確認
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setIsValidSession(true)
        } else {
          setMessage('無効なリセットリンクです。新しいリセットリンクを要求してください。')
        }
      }
    }

    handleAuthTokens()
  }, [supabase.auth])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setMessage('パスワードが一致しません')
      return
    }

    if (password.length < 6) {
      setMessage('パスワードは6文字以上である必要があります')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        setMessage(error.message)
      } else {
        setIsSuccess(true)
        setMessage('パスワードが正常に更新されました')
        
        // 3秒後にダッシュボードにリダイレクト
        setTimeout(() => {
          router.push('/')
        }, 3000)
      }
    } catch (error) {
      setMessage('パスワード更新中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handleBackToLogin = () => {
    router.push('/login')
  }

  // 無効なセッションの場合
  if (!isValidSession && message) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-5">
        <div className="w-full max-w-md p-8 rounded-3xl bg-white shadow-2xl text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              リンクが無効です
            </h1>
            <p className="text-gray-600 text-sm">
              {message}
            </p>
          </div>
          
          <button
            onClick={handleBackToLogin}
            className="w-full py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition-colors duration-300"
          >
            ログインページに戻る
          </button>
        </div>
      </div>
    )
  }

  // 成功画面
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-5">
        <div className="w-full max-w-md p-8 rounded-3xl bg-white shadow-2xl text-center">
          <div className="mb-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              パスワード更新完了
            </h1>
            <p className="text-gray-600 text-sm">
              パスワードが正常に更新されました。<br />
              3秒後に遷移します...
            </p>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div className="bg-green-500 h-2 rounded-full w-full animate-pulse"></div>
          </div>
        </div>
      </div>
    )
  }

  // パスワードリセットフォーム
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-5 font-sans">
      <div className="w-full max-w-md p-8 rounded-3xl bg-white shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            新しいパスワードを設定
          </h1>
          <p className="text-gray-600 text-sm">
            新しいパスワードを入力して、アカウントのセキュリティを確保してください。
          </p>
        </div>

        {message && !isSuccess && (
          <div className="mb-6 p-4 rounded-xl text-sm bg-red-50 text-red-700 border border-red-200">
            {message}
          </div>
        )}

        <form onSubmit={handleResetPassword} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              新しいパスワード
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="新しいパスワードを入力（6文字以上）"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              パスワード確認
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="パスワードを再入力"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* パスワード要件表示 */}
          {password && (
            <div className="space-y-2">
              <div className={`flex items-center space-x-2 text-xs ${
                password.length >= 6 ? 'text-green-600' : 'text-gray-400'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  password.length >= 6 ? 'bg-green-500' : 'bg-gray-300'
                }`}></div>
                <span>6文字以上 {password.length >= 6 ? '✓' : `(${password.length}/6)`}</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password || !confirmPassword || password !== confirmPassword}
            className="w-full py-3.5 bg-orange-500 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 hover:bg-orange-600 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:shadow-md disabled:bg-orange-300 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                パスワードを更新
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={handleBackToLogin}
            className="text-blue-500 text-sm font-medium hover:text-blue-700 hover:underline transition-colors duration-200"
          >
            ログインページに戻る
          </button>
        </div>
      </div>
    </div>
  )
}