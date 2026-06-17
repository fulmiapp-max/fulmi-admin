import { useState, useEffect } from 'react';
import { Terminal, Save, Loader2, AlertCircle, CheckCircle, RefreshCw, History, RotateCcw } from 'lucide-react';

interface PromptDetail {
  raw: string;
  translated: string;
}

interface PromptsData {
  fastAnalysis: PromptDetail;
  aiFeedback: PromptDetail;
  todoItems: PromptDetail;
  monthlyReport: PromptDetail;
}

interface HistoryItem {
  id: string;
  env: 'prod' | 'dev';
  version: number;
  prompts: PromptsData;
  comment: string;
  updatedAt: string | Date;
  updatedBy: string;
}

type TabType = 'fastAnalysis' | 'aiFeedback' | 'todoItems' | 'monthlyReport';
type EnvType = 'prod' | 'dev';

const tabConfig: Record<TabType, { label: string; desc: string }> = {
  fastAnalysis: {
    label: '교정 및 일기 분석',
    desc: '일기 교정 규칙, 감정 목록, 활동 분석 범위 및 긍정도/에너지 측정 기준을 정의합니다.',
  },
  aiFeedback: {
    label: 'AI 심리 피드백',
    desc: '사용자의 마음을 위로하고 행동 조언을 던져주는 라이프 코치 페르소나 및 피드백 형식을 정의합니다.',
  },
  todoItems: {
    label: '내일의 투두 제안',
    desc: '당일 및 과거 일기 맥락을 분석하여 다음 날 실행할 세분화된 행동(Micro-task) 제안 규칙을 정합니다.',
  },
  monthlyReport: {
    label: '월간 분석 리포트',
    desc: '한 달 누적 통계 데이터를 해석하여 심리 상태 및 루틴 개선 제안서 작성 가이드를 정의합니다.',
  },
};

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function PromptManager() {
  const [activeTab, setActiveTab] = useState<TabType>('fastAnalysis');
  const [env, setEnv] = useState<EnvType>('prod');
  const [prompts, setPrompts] = useState<PromptsData | null>(null);
  const [editedText, setEditedText] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isRollingBack, setIsRollingBack] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 1. 특정 환경(env)의 프롬프트 정보 로드
  const fetchPrompts = async (targetEnv: EnvType = env) => {
    setIsLoading(true);
    setStatusMsg(null);
    try {
      const token = sessionStorage.getItem('adminToken') || '';
      const response = await fetch(`${API_BASE}/api/admin/prompts?env=${targetEnv}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('프롬프트를 불러오는데 실패했습니다.');
      }
      const data = await response.json();
      setPrompts(data.prompts);
      setEditedText(data.prompts[activeTab].raw);
    } catch (err: any) {
      console.error(err);
      setStatusMsg({ type: 'error', text: err.message || '네트워크 오류가 발생했습니다.' });
    } finally {
      setIsLoading(false);
    }
  };

  // 2. 특정 환경(env)의 버전 역사 로드
  const fetchHistory = async (targetEnv: EnvType = env) => {
    setIsHistoryLoading(true);
    try {
      const token = sessionStorage.getItem('adminToken') || '';
      const response = await fetch(`${API_BASE}/api/admin/prompts/history?env=${targetEnv}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error('Failed to fetch prompt history:', err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  // 탭 및 환경 전환 시 트리거
  useEffect(() => {
    fetchPrompts(env);
    fetchHistory(env);
  }, [env]);

  // 프롬프트 로드 완료 후 탭 변경 시 에디터 동기화
  useEffect(() => {
    if (prompts) {
      setEditedText(prompts[activeTab].raw);
    }
  }, [activeTab, prompts]);

  // 3. 프롬프트 저장 & 자동 번역
  const handleSave = async () => {
    if (!prompts) return;
    setIsSaving(true);
    setStatusMsg(null);
    try {
      const token = sessionStorage.getItem('adminToken') || '';
      const updatedPrompts = {
        ...prompts,
        [activeTab]: {
          ...prompts[activeTab],
          raw: editedText
        }
      };

      const response = await fetch(`${API_BASE}/api/admin/prompts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompts: updatedPrompts, 
          targetKey: activeTab,
          env,
          comment: comment.trim() || undefined
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || '프롬프트 저장 및 번역 중 오류가 발생했습니다.');
      }

      const resData = await response.json();
      setPrompts(resData.prompts);
      setComment(''); // 코멘트 비우기
      setStatusMsg({ type: 'success', text: `[${env.toUpperCase()} 환경] 프롬프트가 저장되었으며 영문 지시문으로 갱신되었습니다.` });
      fetchHistory(env); // 히스토리 새로고침
    } catch (err: any) {
      console.error(err);
      setStatusMsg({ type: 'error', text: err.message || '저장 및 번역 요청을 완료하지 못했습니다.' });
    } finally {
      setIsSaving(false);
    }
  };

  // 4. 특정 버전으로 롤백 실행
  const handleRollback = async (historyItem: HistoryItem) => {
    const confirmMsg = `정말 이 버전(V${historyItem.version})으로 롤백하시겠습니까?\n현재 ${env.toUpperCase()} 환경에 덮어씌워집니다.`;
    if (!window.confirm(confirmMsg)) return;

    setIsRollingBack(historyItem.id);
    setStatusMsg(null);
    try {
      const token = sessionStorage.getItem('adminToken') || '';
      const response = await fetch(`${API_BASE}/api/admin/prompts/rollback`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          env, 
          historyId: historyItem.id,
          comment: `버전 V${historyItem.version}에서 롤백 복구`
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || '롤백 처리 중 오류가 발생했습니다.');
      }

      const resData = await response.json();
      setPrompts(resData.prompts);
      setEditedText(resData.prompts[activeTab].raw);
      setStatusMsg({ type: 'success', text: `성공적으로 버전 V${historyItem.version}으로 롤백 복구되었습니다.` });
      fetchHistory(env);
    } catch (err: any) {
      console.error(err);
      setStatusMsg({ type: 'error', text: err.message || '롤백 요청을 완료하지 못했습니다.' });
    } finally {
      setIsRollingBack(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <span className="text-sm font-medium text-slate-500">데이터베이스에서 시스템 프롬프트를 불러오는 중...</span>
      </div>
    );
  }

  const currentPrompt = prompts ? prompts[activeTab] : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Top Banner & Refresh */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight flex items-center gap-2">
              <Terminal className="w-6 h-6 text-indigo-400" />
              인공지능 시스템 프롬프트 관리
            </h1>
            <p className="text-slate-400 text-xs md:text-sm max-w-xl">
              사용자 앱의 AI 규칙을 제어합니다. 한글 지시문을 고치면 백엔드에서 자동으로 영문 최적화 번역을 수행해 실서버 엔진에 적재합니다.
            </p>
          </div>
          <button 
            onClick={() => { fetchPrompts(); fetchHistory(); }}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 text-xs font-bold transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> 설정 동기화
          </button>
        </div>
      </div>

      {/* Global Status Message */}
      {statusMsg && (
        <div className={`p-4 rounded-2xl flex items-start gap-3 border ${
          statusMsg.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' 
            : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
        }`}>
          {statusMsg.type === 'success' ? (
            <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
          )}
          <span className="text-sm font-semibold">{statusMsg.text}</span>
        </div>
      )}

      {/* Env Toggle Tabs & Tab Config Selector */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-2">
        {/* Tab configuration selector */}
        <div className="flex overflow-x-auto whitespace-nowrap gap-1">
          {(Object.keys(tabConfig) as TabType[]).map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => setActiveTab(tabKey)}
              className={`px-4 py-2.5 font-bold text-xs md:text-sm border-b-2 transition-all cursor-pointer ${
                activeTab === tabKey
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50/10 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tabConfig[tabKey].label}
            </button>
          ))}
        </div>

        {/* Environment Toggle switch */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            onClick={() => setEnv('prod')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
              env === 'prod'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${env === 'prod' ? 'bg-emerald-400' : 'bg-slate-400'}`} />
            실서버 반영 (PROD)
          </button>
          <button
            onClick={() => setEnv('dev')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
              env === 'dev'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${env === 'dev' ? 'bg-amber-300' : 'bg-slate-400'}`} />
            로컬/개발용 (DEV)
          </button>
        </div>
      </div>

      {/* Main 3-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Column 1: Korean Source Input (5 / 12) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4 flex flex-col h-[650px]">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">한글 시스템 프롬프트 지침</span>
            <p className="text-slate-500 text-xs">{tabConfig[activeTab].desc}</p>
          </div>
          
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            className="w-full flex-1 p-4 bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-700 font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/80 resize-none transition-all"
            placeholder="이곳에 한글 또는 영어로 AI 분석 지침을 작성해주세요..."
          />

          <div className="space-y-3">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="이번 수정 사항 기록 (예: 이모지 개수 조절) - 생략 가능"
              className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-400"
            />

            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`w-full h-11 flex items-center justify-center gap-2 text-white rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer ${
                env === 'prod' 
                  ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/10' 
                  : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/10'
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>[ {env.toUpperCase()} ] 번역 및 반영 중...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>[ {env.toUpperCase()} ] 저장 및 변환 적용</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Column 2: Translated Read-Only Preview (4 / 12) */}
        <div className="lg:col-span-4 bg-slate-950 rounded-3xl border border-slate-900 shadow-xl p-6 flex flex-col h-[650px] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-400 tracking-wider">AUTO-TRANSLATED ENGLISH</span>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
              env === 'prod' 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            }`}>
              {env.toUpperCase()} ACTIVE
            </span>
          </div>

          <div className="flex-1 bg-slate-900/40 border border-slate-800/40 rounded-2xl p-4 font-mono text-xs text-slate-300 leading-relaxed overflow-y-auto select-all scrollbar-thin">
            {currentPrompt?.translated ? (
              <pre className="whitespace-pre-wrap font-mono break-all">{currentPrompt.translated}</pre>
            ) : (
              <span className="text-slate-600 italic">영문으로 변환된 지시문이 표시됩니다. 왼쪽에서 저장을 완료해 주세요.</span>
            )}
          </div>
        </div>

        {/* Column 3: Version Control Timeline History (3 / 12) */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 flex flex-col h-[650px] space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <History className="w-5 h-5 text-indigo-500 shrink-0" />
            <div>
              <h2 className="text-sm font-bold text-slate-800">버전 히스토리</h2>
              <p className="text-[10px] text-slate-400 leading-tight">선택한 환경의 이전 기록 및 롤백</p>
            </div>
          </div>

          {isHistoryLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              <span className="text-xs">기록 불러오는 중...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center text-xs text-slate-400 border border-dashed border-slate-150 rounded-2xl p-4">
              기록된 변경 이력이 없습니다.
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
              {history.map((item) => (
                <div 
                  key={item.id}
                  className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl space-y-2 relative group hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-bold">
                      V{item.version}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(item.updatedAt).toLocaleDateString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-slate-700 leading-snug break-words">
                    {item.comment || `${tabConfig[activeTab].label} 지시문 저장`}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 pt-2">
                    <span className="truncate max-w-[80px]" title={item.updatedBy}>
                      {item.updatedBy.split('@')[0]}
                    </span>
                    
                    <button
                      onClick={() => handleRollback(item)}
                      disabled={!!isRollingBack}
                      className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 disabled:text-slate-300 font-bold transition-all cursor-pointer"
                      title="이 버전으로 복구"
                    >
                      {isRollingBack === item.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <RotateCcw className="w-3 h-3" />
                      )}
                      롤백
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
