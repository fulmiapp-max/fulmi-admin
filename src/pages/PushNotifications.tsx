import { useState, useEffect } from 'react';
import { Bell, Send, Users, Mail, History, Loader2, Check, ShieldAlert } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface PushHistoryItem {
  id: string;
  title: string;
  body: string;
  target: string;
  sentAt: string;
  sentBy: string;
  successCount: number;
  failureCount: number;
  invalidTokensRemoved: number;
}

interface PushStats {
  totalTokens: number;
  userWithTokensCount: number;
}

export default function PushNotifications() {
  const [activeTab, setActiveTab] = useState<'manual' | 'auto'>('manual');
  
  // 수동 푸시 관련 상태
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState<'all' | 'individual'>('all');
  const [targetEmail, setTargetEmail] = useState('');
  
  // 자동 템플릿 관련 상태
  const [todoTitleKo, setTodoTitleKo] = useState('');
  const [todoBodyKo, setTodoBodyKo] = useState('');
  const [diaryTitleKo, setDiaryTitleKo] = useState('');
  const [diaryBodyKo, setDiaryBodyKo] = useState('');
  
  const [stats, setStats] = useState<PushStats>({ totalTokens: 0, userWithTokensCount: 0 });
  const [history, setHistory] = useState<PushHistoryItem[]>([]);
  
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [isTemplatesLoading, setIsTemplatesLoading] = useState(true);
  
  const [isSending, setIsSending] = useState(false);
  const [isTemplatesSaving, setIsTemplatesSaving] = useState(false);
  
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 1. 수신 통계 데이터 조회
  const fetchStats = async () => {
    setIsStatsLoading(true);
    try {
      const token = sessionStorage.getItem('adminToken') || '';
      const response = await fetch(`${API_BASE}/api/admin/push/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('수신 통계를 조회하는 데 실패했습니다.');
      const data = await response.json();
      setStats(data);
    } catch (error: any) {
      console.error(error);
    } finally {
      setIsStatsLoading(false);
    }
  };

  // 2. 발송 이력 데이터 조회
  const fetchHistory = async () => {
    setIsHistoryLoading(true);
    try {
      const token = sessionStorage.getItem('adminToken') || '';
      const response = await fetch(`${API_BASE}/api/admin/push/history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('발송 이력을 불러오는 데 실패했습니다.');
      const data = await response.json();
      setHistory(data);
    } catch (error: any) {
      console.error(error);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  // 3. 자동 푸시 템플릿 데이터 조회
  const fetchTemplates = async () => {
    setIsTemplatesLoading(true);
    try {
      const token = sessionStorage.getItem('adminToken') || '';
      const response = await fetch(`${API_BASE}/api/admin/push/auto-templates`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('자동 템플릿 설정을 가져오는 데 실패했습니다.');
      const data = await response.json();
      setTodoTitleKo(data.todo_reminder?.ko?.title || '');
      setTodoBodyKo(data.todo_reminder?.ko?.body || '');
      setDiaryTitleKo(data.diary_reminder?.ko?.title || '');
      setDiaryBodyKo(data.diary_reminder?.ko?.body || '');
    } catch (error: any) {
      console.error(error);
    } finally {
      setIsTemplatesLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchHistory();
    fetchTemplates();
  }, []);

  // 4. 푸시 알림 발송 핸들러
  const handleSendPush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    if (target === 'individual' && !targetEmail.trim()) return;

    setIsSending(true);
    setStatusMsg(null);

    try {
      const token = sessionStorage.getItem('adminToken') || '';
      const response = await fetch(`${API_BASE}/api/admin/push/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          target,
          targetEmail: target === 'individual' ? targetEmail.trim() : undefined
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '푸시 발송에 실패했습니다.');
      }

      setStatusMsg({ type: 'success', text: data.message || '푸시 알림이 성공적으로 전송되었습니다.' });
      
      setTitle('');
      setBody('');
      setTargetEmail('');
      
      fetchStats();
      fetchHistory();
    } catch (error: any) {
      console.error(error);
      setStatusMsg({ type: 'error', text: error.message || '네트워크 오류가 발생했습니다.' });
    } finally {
      setIsSending(false);
    }
  };

  // 5. 자동 푸시 템플릿 저장 핸들러
  const handleSaveTemplates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!todoTitleKo.trim() || !todoBodyKo.trim() || !diaryTitleKo.trim() || !diaryBodyKo.trim()) return;

    setIsTemplatesSaving(true);
    setStatusMsg(null);

    try {
      const token = sessionStorage.getItem('adminToken') || '';
      const response = await fetch(`${API_BASE}/api/admin/push/auto-templates`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          todo_reminder: {
            ko: {
              title: todoTitleKo.trim(),
              body: todoBodyKo.trim()
            }
          },
          diary_reminder: {
            ko: {
              title: diaryTitleKo.trim(),
              body: diaryBodyKo.trim()
            }
          }
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '설정 저장에 실패했습니다.');
      }

      setStatusMsg({ type: 'success', text: data.message || '설정이 정상적으로 저장되었습니다.' });
      fetchTemplates();
    } catch (error: any) {
      console.error(error);
      setStatusMsg({ type: 'error', text: error.message || '네트워크 오류가 발생했습니다.' });
    } finally {
      setIsTemplatesSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header Card */}
      <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-6 md:p-8 text-white border border-slate-800 shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -ml-16 -mb-16" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-500/20 border border-indigo-500/30 rounded-lg text-indigo-400">
                <Bell className="w-5 h-5" />
              </span>
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">푸시 알림 관리 콘솔</h1>
            </div>
            <p className="text-slate-400 text-xs md:text-sm max-w-xl">
              풀미 모바일 앱의 수동 알림 발송 및 매일 아침/밤 발송되는 다국어 자동 리마인더 템플릿 설정을 제어합니다.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { fetchStats(); fetchHistory(); fetchTemplates(); }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              새로고침
            </button>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-800 gap-6 text-sm font-bold px-1">
        <button
          onClick={() => { setStatusMsg(null); setActiveTab('manual'); }}
          className={`pb-3 relative transition-all cursor-pointer ${
            activeTab === 'manual' ? 'text-indigo-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          수동 푸시 발송
          {activeTab === 'manual' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
          )}
        </button>
        <button
          onClick={() => { setStatusMsg(null); setActiveTab('auto'); }}
          className={`pb-3 relative transition-all cursor-pointer ${
            activeTab === 'auto' ? 'text-indigo-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          자동 리마인더 템플릿 설정
          {activeTab === 'auto' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
          )}
        </button>
      </div>

      {/* Global Status Banner */}
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

      {/* Tab Content 1: Manual Push Send */}
      {activeTab === 'manual' && (
        <div className="space-y-6">
          {/* Grid: Send Form & Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Send Push Form (Left 2 cols) */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Send className="w-5 h-5 text-indigo-400" />
                신규 푸시 발송 메시지 작성
              </h2>

              <form onSubmit={handleSendPush} className="space-y-5">
                {/* Target Selection */}
                <div className="space-y-2">
                  <label className="text-slate-400 text-xs font-bold uppercase tracking-wider block">
                    수신 대상 지정
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-slate-300 text-sm font-medium cursor-pointer">
                      <input
                        type="radio"
                        name="target"
                        value="all"
                        checked={target === 'all'}
                        onChange={() => setTarget('all')}
                        className="w-4 h-4 accent-indigo-500 bg-slate-950 border-slate-800"
                      />
                      전체 사용자
                    </label>
                    <label className="flex items-center gap-2 text-slate-300 text-sm font-medium cursor-pointer">
                      <input
                        type="radio"
                        name="target"
                        value="individual"
                        checked={target === 'individual'}
                        onChange={() => setTarget('individual')}
                        className="w-4 h-4 accent-indigo-500 bg-slate-950 border-slate-800"
                      />
                      특정 사용자 (개별)
                    </label>
                  </div>
                </div>

                {/* Individual Email Input (Conditional) */}
                {target === 'individual' && (
                  <div className="space-y-1.5 transition-all duration-350">
                    <label className="text-slate-400 text-xs font-bold uppercase tracking-wider block">
                      수신인 구글/이메일 주소
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-600" />
                      <input
                        type="email"
                        required
                        placeholder="recipient@gmail.com"
                        value={targetEmail}
                        onChange={(e) => setTargetEmail(e.target.value)}
                        className="w-full h-11 pl-10 pr-4 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-700"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      입력한 이메일로 가입하여 푸시 알림을 동의한 사용자의 기기에만 메시지를 개별 발송합니다.
                    </p>
                  </div>
                )}

                {/* Push Title */}
                <div className="space-y-1.5">
                  <label className="text-slate-400 text-xs font-bold uppercase tracking-wider block">
                    알림 제목 (Title)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="예: 오늘의 일기를 잊지 마세요"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full h-11 px-3 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-700"
                  />
                </div>

                {/* Push Body */}
                <div className="space-y-1.5">
                  <label className="text-slate-400 text-xs font-bold uppercase tracking-wider block">
                    알림 내용 (Body)
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="사용자의 화면에 노출될 알림 본문 내용을 정성껏 입력해 주세요."
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="w-full p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-700 resize-none"
                  />
                </div>

                {/* Send Button */}
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSending || !title.trim() || !body.trim() || (target === 'individual' && !targetEmail.trim())}
                    className="px-6 h-11 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/30 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-950/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    푸시 알림 전송하기
                  </button>
                </div>
              </form>
            </div>

            {/* Stats Side Card (Right 1 col) */}
            <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl h-fit space-y-6">
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 border-b border-slate-800 pb-4">
                <Users className="w-5 h-5 text-emerald-400" />
                실시간 알림 수신 현황
              </h2>

              {isStatsLoading ? (
                <div className="py-10 flex flex-col items-center justify-center text-slate-500 space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                  <p className="text-xs">수신자 현황 조회 중...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 space-y-1">
                    <span className="text-slate-500 text-xs font-semibold">알림 대기 기기 수 (FCM 토큰)</span>
                    <p className="text-3xl font-extrabold text-emerald-400 tracking-tight">{stats.totalTokens}개</p>
                    <p className="text-[11px] text-slate-500">앱 설치 후 알림 승인에 도달한 총 누적 기기 수입니다.</p>
                  </div>

                  <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 space-y-1">
                    <span className="text-slate-500 text-xs font-semibold">수신 동의 사용자 수</span>
                    <p className="text-2xl font-bold text-indigo-400 tracking-tight">{stats.userWithTokensCount}명</p>
                    <p className="text-[11px] text-slate-500">최소 1개 이상의 알림 기기를 연동한 계정 수입니다.</p>
                  </div>

                  <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 text-xs text-amber-300/80 space-y-1.5">
                    <p className="font-bold">⚠️ 푸시 알림 발송 전 필수 확인</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>전체 유저 대상 발송 시 복구할 수 없으므로 오탈자를 철저히 검수해 주세요.</li>
                      <li>만료되거나 앱 삭제 상태의 불량 토큰은 전송 시 자동 감지되어 정리됩니다.</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Push History Section (Bottom Full-width) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-400" />
              최근 푸시 발송 이력 (감사 레코드)
            </h2>

            {isHistoryLoading ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-500 space-y-2">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <p className="text-sm">발송 역사 불러오는 중...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="py-20 text-center border border-dashed border-slate-800 rounded-2xl text-slate-500 text-sm">
                수동 푸시 발송 이력이 아직 존재하지 않습니다.
              </div>
            ) : (
              <div className="overflow-hidden border border-slate-800 rounded-2xl bg-slate-950/40">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider">
                        <th className="py-3.5 px-4">발송 일시</th>
                        <th className="py-3.5 px-4">알림 타겟</th>
                        <th className="py-3.5 px-4">알림 정보 (제목 및 본문)</th>
                        <th className="py-3.5 px-4 text-center">전송 통계 (성공/실패)</th>
                        <th className="py-3.5 px-4 text-right">발송자</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300 text-sm">
                      {history.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="py-3.5 px-4 font-medium text-slate-400 text-xs whitespace-nowrap">
                            {formatDate(item.sentAt)}
                          </td>
                          <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-md font-semibold ${
                              item.target.startsWith('전체') 
                                ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-300' 
                                : 'bg-amber-500/10 border border-amber-500/20 text-amber-300'
                            }`}>
                              {item.target}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 max-w-[300px] md:max-w-md">
                            <div className="space-y-0.5">
                              <p className="font-bold text-slate-100 truncate">{item.title}</p>
                              <p className="text-xs text-slate-400 truncate">{item.body}</p>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col items-center justify-center text-xs">
                              <div className="flex gap-2">
                                <span className="text-emerald-400 font-bold">성공: {item.successCount}</span>
                                <span className="text-slate-600">/</span>
                                <span className="text-rose-400 font-bold">실패: {item.failureCount}</span>
                              </div>
                              {item.invalidTokensRemoved > 0 && (
                                <span className="text-[10px] text-slate-500 mt-0.5">
                                  (만료 토큰 {item.invalidTokensRemoved}개 자동 정화 완료)
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right text-xs text-slate-400">
                            {item.sentBy}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content 2: Automatic Push Template Settings */}
      {activeTab === 'auto' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Templates Editor Form (Left 2 cols) */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Bell className="w-5 h-5 text-indigo-400" />
              자동 푸시 알림 리마인더 설정
            </h2>

            {isTemplatesLoading ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-500 space-y-2">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <p className="text-sm">템플릿 설정을 불러오는 중...</p>
              </div>
            ) : (
              <form onSubmit={handleSaveTemplates} className="space-y-6">
                {/* 1. Todo Reminder Section */}
                <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                    <h3 className="text-sm font-extrabold text-white">1. 오늘 미완료 할 일 리마인더 (매일 아침 9시 발송)</h3>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-slate-400 text-xs font-bold uppercase tracking-wider block">
                      알림 제목 (한국어)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="예: 오늘의 할 일 리마인더"
                      value={todoTitleKo}
                      onChange={(e) => setTodoTitleKo(e.target.value)}
                      className="w-full h-11 px-3 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-700"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 text-xs font-bold uppercase tracking-wider block">
                      알림 본문 (한국어)
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="예: 오늘도 활기찬 하루 시작해 볼까요? 아직 완료하지 않은 할 일이 남아있습니다."
                      value={todoBodyKo}
                      onChange={(e) => setTodoBodyKo(e.target.value)}
                      className="w-full p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-700 resize-none"
                    />
                  </div>
                </div>

                {/* 2. Diary Reminder Section */}
                <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3">
                    <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />
                    <h3 className="text-sm font-extrabold text-white">2. 오늘 일기 미작성 리마인더 (매일 밤 9시 발송)</h3>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-slate-400 text-xs font-bold uppercase tracking-wider block">
                      알림 제목 (한국어)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="예: 오늘의 일기 기록하기"
                      value={diaryTitleKo}
                      onChange={(e) => setDiaryTitleKo(e.target.value)}
                      className="w-full h-11 px-3 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-700"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 text-xs font-bold uppercase tracking-wider block">
                      알림 본문 (한국어)
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="예: 오늘 하루는 어떠셨나요? 오늘의 일기를 작성하고 소중한 하루를 기록해 보세요."
                      value={diaryBodyKo}
                      onChange={(e) => setDiaryBodyKo(e.target.value)}
                      className="w-full p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-700 resize-none"
                    />
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isTemplatesSaving || !todoTitleKo.trim() || !todoBodyKo.trim() || !diaryTitleKo.trim() || !diaryBodyKo.trim()}
                    className="px-6 h-11 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/30 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-950/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isTemplatesSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        AI 영어 자동 번역 및 설정 저장 중...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        설정 저장하기 (AI 번역 연동)
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* AI Translation Guide Card (Right 1 col) */}
          <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl h-fit space-y-6">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 border-b border-slate-800 pb-4">
              <Users className="w-5 h-5 text-indigo-400" />
              인공지능 자동 번역 시스템
            </h2>

            <div className="space-y-4 text-xs text-slate-300">
              <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-4 space-y-2">
                <p className="font-extrabold text-indigo-300">💡 1개 국어 기입으로 다국어 완비</p>
                <p className="leading-relaxed text-slate-400">
                  어드민 포털에서 **한국어**로만 알림 메시지를 자유롭고 편하게 작성해 주세요. 
                  저장 버튼을 클릭하는 순간 백엔드에서 **Gemini AI**가 기동하여, 동일한 의미의 영문 알림 메시지를 가장 자연스럽고 다정한 톤으로 자동 번역하여 데이터베이스에 함께 보관합니다.
                </p>
              </div>

              <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4 space-y-2">
                <p className="font-bold text-emerald-400">🌐 기기 설정 언어 자동 판별</p>
                <p className="leading-relaxed text-slate-400 font-medium">
                  회원의 개별 로컬 아침/밤 9시에 스케줄러가 자동으로 기동할 때, 사용자가 앱 설정에서 세팅한 기본 주 언어(한국어 혹은 영어)를 자동으로 식별하여 최적화된 맞춤 언어 알림을 송출합니다.
                </p>
              </div>

              <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 text-[11px] text-amber-300/80 space-y-1">
                <p className="font-bold">⚠️ 번역 처리 시간 안내</p>
                <p className="leading-relaxed">
                  저장 시 실시간으로 AI 번역이 실행되므로 약 2~3초의 소요 시간이 있을 수 있습니다. 진행 중에는 브라우저를 닫지 마시기 바랍니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
