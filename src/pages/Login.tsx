import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { Lock, ShieldAlert, Loader2 } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      
      // Save identity & token for API authorization
      sessionStorage.setItem('adminToken', idToken);
      sessionStorage.setItem('adminEmail', result.user.email || '');
      sessionStorage.setItem('adminAuth', 'true'); // Keep legacy compatibility if any

      navigate('/');
    } catch (err: any) {
      console.error('Login failed:', err);
      // Handle closed popup or auth issues
      if (err.code === 'auth/popup-closed-by-user') {
        setError('로그인 팝업창이 닫혔습니다. 다시 시도해 주세요.');
      } else {
        setError(err.message || '로그인 중 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 relative overflow-hidden">
      {/* Decorative Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-emerald-600/10 blur-3xl" />

      {/* Glassmorphic Login Box */}
      <div className="w-full max-w-md p-8 bg-slate-900/60 border border-slate-800/80 rounded-3xl shadow-2xl backdrop-blur-xl relative z-10 flex flex-col items-center space-y-8">
        
        {/* Shield Icon & Badge */}
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
          <Lock className="w-8 h-8" />
        </div>

        {/* Header Text */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Fulmi Admin Console</h1>
          <p className="text-slate-400 text-sm">풀미 서비스 관리자 인증 시스템</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="w-full p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 text-rose-300">
            <ShieldAlert className="w-5 h-5 shrink-0 text-rose-400" />
            <span className="text-xs font-semibold leading-relaxed">{error}</span>
          </div>
        )}

        {/* Google Login Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full h-12 flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-900 rounded-xl font-bold text-sm shadow-xl shadow-white/5 disabled:bg-slate-200 transition-all cursor-pointer"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-slate-600" />
          ) : (
            <>
              {/* Google Colored G Icon */}
              <svg className="w-5 h-5" viewBox="0 0 24 24" width="24" height="24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Google 계정으로 관리자 로그인</span>
            </>
          )}
        </button>

        {/* Footer info */}
        <span className="text-[10px] text-slate-500 font-medium tracking-wider text-center uppercase">
          authorized administrator access only
        </span>
      </div>
    </div>
  );
}
