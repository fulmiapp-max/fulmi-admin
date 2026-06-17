import { useState, useEffect } from 'react';
import { Settings, UserPlus, Trash2, Loader2, ShieldAlert, Check, Lock, UserCheck } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const MASTER_EMAIL = 'fulmi.app@gmail.com';

export default function SystemSettings() {
  const [adminEmails, setAdminEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // UX 개선: 개별 항목의 삭제 대기 상태 관리 (인라인 확인용)
  const [deletingEmail, setDeletingEmail] = useState<string | null>(null);

  const currentUserEmail = sessionStorage.getItem('adminEmail') || '';

  // 1. 관리자 이메일 목록 로드
  const fetchAdmins = async () => {
    setIsLoading(true);
    setStatusMsg(null);
    try {
      const token = sessionStorage.getItem('adminToken') || '';
      const response = await fetch(`${API_BASE}/api/admin/system/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '관리자 목록을 불러오는 데 실패했습니다.');
      }
      const data = await response.json();
      setAdminEmails(data.admins || []);
    } catch (err: any) {
      console.error(err);
      setStatusMsg({ type: 'error', text: err.message || '네트워크 오류가 발생했습니다.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  // 2. 신규 관리자 추가
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    setIsSubmitting(true);
    setStatusMsg(null);
    try {
      const token = sessionStorage.getItem('adminToken') || '';
      const response = await fetch(`${API_BASE}/api/admin/system/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: newEmail.trim() })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '관리자 추가에 실패했습니다.');
      }

      setStatusMsg({ type: 'success', text: data.message || '관리자가 정상적으로 추가되었습니다.' });
      setNewEmail('');
      fetchAdmins();
    } catch (err: any) {
      console.error(err);
      setStatusMsg({ type: 'error', text: err.message || '오류가 발생했습니다.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. 관리자 삭제 요청
  const handleDeleteAdmin = async (email: string) => {
    setStatusMsg(null);
    try {
      const token = sessionStorage.getItem('adminToken') || '';
      const response = await fetch(`${API_BASE}/api/admin/system/users/${encodeURIComponent(email)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '관리자 삭제에 실패했습니다.');
      }

      setStatusMsg({ type: 'success', text: data.message || '관리자가 삭제되었습니다.' });
      setDeletingEmail(null);
      fetchAdmins();
    } catch (err: any) {
      console.error(err);
      setStatusMsg({ type: 'error', text: err.message || '오류가 발생했습니다.' });
      setDeletingEmail(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Top Gradient Header */}
      <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-6 md:p-8 text-white border border-slate-800 shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -ml-16 -mb-16" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-500/20 border border-indigo-500/30 rounded-lg text-indigo-400">
                <Settings className="w-5 h-5" />
              </span>
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">시스템 및 권한 설정</h1>
            </div>
            <p className="text-slate-400 text-xs md:text-sm max-w-xl">
              풀미 서비스 관리자 콘솔의 접근 가능한 구글/이메일 계정을 실시간으로 추가하거나 삭제하여 권한을 제어합니다.
            </p>
          </div>
          <button
            onClick={fetchAdmins}
            disabled={isLoading}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800/50 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            목록 새로고침
          </button>
        </div>
      </div>

      {/* Global Status Feedback Banner */}
      {statusMsg && (
        <div className={`p-4 rounded-2xl flex items-start gap-3 border ${
          statusMsg.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' 
            : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
        }`}>
          {statusMsg.type === 'success' ? (
            <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          )}
          <span className="text-sm font-semibold">{statusMsg.text}</span>
        </div>
      )}

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Admin Users Table */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-400" />
              어드민 허용 계정 목록
            </h2>
            <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-400 rounded-full text-xs font-semibold">
              총 {adminEmails.length}개 계정
            </span>
          </div>

          {isLoading && adminEmails.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              <p className="text-sm">관리자 계정 목록을 조회하는 중...</p>
            </div>
          ) : adminEmails.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-slate-800 rounded-2xl text-slate-500 text-sm">
              허용된 관리자 계정이 존재하지 않습니다.
            </div>
          ) : (
            <div className="overflow-hidden border border-slate-800 rounded-2xl bg-slate-950/40">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <th className="py-3.5 px-4">이메일 주소</th>
                      <th className="py-3.5 px-4 text-center">권한 및 상태</th>
                      <th className="py-3.5 px-4 text-right">관리 작업</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300 text-sm">
                    {adminEmails.map((email) => {
                      const isMaster = email === MASTER_EMAIL;
                      const isSelf = email === currentUserEmail;
                      const isActionDisabled = isMaster || isSelf;

                      return (
                        <tr key={email} className="hover:bg-slate-900/40 transition-colors">
                          <td className="py-3.5 px-4 font-medium tracking-tight truncate max-w-[200px] md:max-w-none">
                            {email}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              {isMaster && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-md text-[10px] font-bold uppercase">
                                  <Lock className="w-2.5 h-2.5" /> 마스터
                                </span>
                              )}
                              {isSelf && (
                                <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-md text-[10px] font-bold">
                                  본인 계정
                                </span>
                              )}
                              {!isMaster && !isSelf && (
                                <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-400 rounded-md text-[10px] font-semibold">
                                  일반 관리자
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {deletingEmail === email ? (
                              <div className="flex items-center justify-end gap-2 text-xs">
                                <span className="text-rose-400 font-semibold shrink-0">삭제할까요?</span>
                                <button
                                  onClick={() => handleDeleteAdmin(email)}
                                  className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded font-bold transition-all cursor-pointer"
                                >
                                  확인
                                </button>
                                <button
                                  onClick={() => setDeletingEmail(null)}
                                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded font-semibold transition-all cursor-pointer"
                                >
                                  취소
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeletingEmail(email)}
                                disabled={isActionDisabled}
                                className="inline-flex items-center justify-center p-1.5 text-slate-500 hover:text-rose-400 disabled:text-slate-800 disabled:hover:text-slate-800 rounded-lg hover:bg-slate-850 transition-all disabled:cursor-not-allowed cursor-pointer"
                                title={
                                  isMaster 
                                    ? '마스터 계정은 삭제할 수 없습니다' 
                                    : isSelf 
                                      ? '본인 계정은 스스로 삭제할 수 없습니다' 
                                      : '계정 삭제'
                                }
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Add Admin Form */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-xl h-fit space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-400" />
              관리자 계정 초빙
            </h2>
            <p className="text-slate-400 text-xs leading-relaxed">
              추가하고 싶은 관리자의 구글/이메일 계정을 입력합니다. 등록된 즉시 해당 사용자는 어드민 로그인 권한을 획득합니다.
            </p>
          </div>

          <form onSubmit={handleAddAdmin} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="admin-email" className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                이메일 주소
              </label>
              <input
                id="admin-email"
                type="email"
                required
                placeholder="example@gmail.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full h-11 px-3 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !newEmail.trim()}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/30 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-950/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              관리자 추가
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
