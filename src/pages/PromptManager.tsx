import { useState, useEffect } from 'react';
import { Terminal, Save, Loader2, AlertCircle, CheckCircle, RefreshCw, History, Trash2 } from 'lucide-react';

interface PromptDetail {
  raw: string;
  translated: string;
}

interface PromptsData {
  fastAnalysis: PromptDetail;
  aiFeedback: PromptDetail;
  todoItems: PromptDetail;
  monthlyReport: PromptDetail;
  correctOnly: PromptDetail;
}

interface HistoryItem {
  id: string;
  env: 'prod' | 'dev';
  version: number;
  prompts: PromptsData;
  comment: string;
  updatedAt: string | Date;
  updatedBy: string;
  isActive?: boolean;
}

type TabType = 'fastAnalysis' | 'aiFeedback' | 'todoItems' | 'monthlyReport' | 'correctOnly';
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
  correctOnly: {
    label: '일기 맞춤법 교정',
    desc: '일기 작성/수정 시 제공되는 실시간 맞춤법 교정 및 이모지 자동 삽입 룰을 정의합니다.',
  },
};

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const formatDateTime = (dateStr: string | Date) => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString('ko-KR', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch (e) {
    return '';
  }
};

export default function PromptManager() {
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const [activeTab, setActiveTab] = useState<TabType>('fastAnalysis');
  const [env, setEnv] = useState<EnvType>('prod');
  const [prompts, setPrompts] = useState<PromptsData | null>(null);
  const [editedText, setEditedText] = useState<string>('');
  const [editedTranslatedText, setEditedTranslatedText] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [isActivating, setIsActivating] = useState<string | null>(null);
  const [isEditable, setIsEditable] = useState<boolean>(false);
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
          'Content-Type': 'application/json',
          ...(isLocalhost ? { 'x-admin-bypass': 'admin' } : {})
        }
      });
      if (!response.ok) {
        throw new Error('프롬프트를 불러오는데 실패했습니다.');
      }
      const data = await response.json();
      setPrompts(data.prompts);
      setEditedText(data.prompts?.[activeTab]?.raw || '');
      setEditedTranslatedText(data.prompts?.[activeTab]?.translated || '');
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
          'Content-Type': 'application/json',
          ...(isLocalhost ? { 'x-admin-bypass': 'admin' } : {})
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
    setSelectedHistoryId(null);
    setIsEditable(false);
    fetchPrompts(env);
    fetchHistory(env);
  }, [env]);

  // activeTab 또는 selectedHistoryId 변경 시 수정 모드 리셋
  useEffect(() => {
    setIsEditable(false);
  }, [activeTab, selectedHistoryId]);

  const selectedHistoryItem = selectedHistoryId ? history.find(h => h.id === selectedHistoryId) : null;

  // 프롬프트 로드 완료 후 탭 변경 및 히스토리 선택 시 에디터 동기화
  useEffect(() => {
    if (selectedHistoryItem) {
      setEditedText(selectedHistoryItem.prompts?.[activeTab]?.raw || '');
      setEditedTranslatedText(selectedHistoryItem.prompts?.[activeTab]?.translated || '');
    } else if (prompts) {
      setEditedText(prompts[activeTab]?.raw || '');
      setEditedTranslatedText(prompts[activeTab]?.translated || '');
    }
  }, [activeTab, prompts, selectedHistoryId, selectedHistoryItem]);

  // 3. 수동 영문 번역 트리거
  const handleTranslate = async () => {
    if (!editedText.trim()) {
      alert('번역할 한글 지시문을 입력해 주세요.');
      return;
    }
    setIsTranslating(true);
    setStatusMsg(null);
    try {
      const token = sessionStorage.getItem('adminToken') || '';
      const response = await fetch(`${API_BASE}/api/admin/prompts/translate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...(isLocalhost ? { 'x-admin-bypass': 'admin' } : {})
        },
        body: JSON.stringify({ text: editedText }),
      });

      if (!response.ok) {
        throw new Error('번역 처리 중 오류가 발생했습니다.');
      }

      const data = await response.json();
      setEditedTranslatedText(data.translated);
      setStatusMsg({ type: 'success', text: '영문 지시문 번역이 완료되었습니다.' });
    } catch (err: any) {
      console.error(err);
      setStatusMsg({ type: 'error', text: err.message || '번역 요청에 실패했습니다.' });
    } finally {
      setIsTranslating(false);
    }
  };

  // 4. 프롬프트 수정본 임시 저장 (히스토리 생성, 엔진 미반영)
  const handleSave = async () => {
    if (!prompts) return;

    if (isLocalhost && env === 'prod') {
      alert('로컬 개발 환경에서는 실서버(PROD) 저장을 수행할 수 없습니다.');
      return;
    }

    const confirmMsg = `정말 [${env.toUpperCase()} 환경]의 ${tabConfig[activeTab].label} 지시문 수정본을 임시 저장하시겠습니까?\n(이 저장은 새로운 히스토리를 기록하지만, 엔진에 바로 반영되지는 않습니다.)`;
    if (!window.confirm(confirmMsg)) return;

    setIsSaving(true);
    setStatusMsg(null);
    try {
      const token = sessionStorage.getItem('adminToken') || '';
      const response = await fetch(`${API_BASE}/api/admin/prompts/save-draft`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...(isLocalhost ? { 'x-admin-bypass': 'admin' } : {})
        },
        body: JSON.stringify({ 
          env,
          targetKey: activeTab,
          raw: editedText,
          translated: editedTranslatedText,
          comment: comment.trim() || undefined
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || '프롬프트 임시 저장 중 오류가 발생했습니다.');
      }

      setComment(''); // 코멘트 비우기
      setStatusMsg({ type: 'success', text: `[${env.toUpperCase()} 환경] 새로운 히스토리 버전이 성공적으로 저장되었습니다. (반영 대기 중)` });
      setSelectedHistoryId(null);
      await fetchHistory(env); // 히스토리 새로고침
      await fetchPrompts(env); // 프롬프트 최신화
    } catch (err: any) {
      console.error(err);
      setStatusMsg({ type: 'error', text: err.message || '저장 요청을 완료하지 못했습니다.' });
    } finally {
      setIsSaving(false);
    }
  };

  // 5. 특정 히스토리 버전을 서비스 엔진에 실시간 반영 (Deploy)
  const handleActivate = async (historyItem: HistoryItem) => {
    if (isLocalhost && env === 'prod') {
      alert('로컬 개발 환경에서는 실서버(PROD) 반영을 수행할 수 없습니다.');
      return;
    }

    const confirmMsg = `정말 버전 V${historyItem.version}을 [${env.toUpperCase()} 환경] 엔진에 실시간 반영(Deploy)하시겠습니까?\n이 작업은 즉시 캐시를 무효화하여 서비스에 실시간 적용됩니다.`;
    if (!window.confirm(confirmMsg)) return;

    setIsActivating(historyItem.id);
    setStatusMsg(null);
    try {
      const token = sessionStorage.getItem('adminToken') || '';
      const response = await fetch(`${API_BASE}/api/admin/prompts/activate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...(isLocalhost ? { 'x-admin-bypass': 'admin' } : {})
        },
        body: JSON.stringify({ 
          env, 
          historyId: historyItem.id
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || '실시간 반영 중 오류가 발생했습니다.');
      }

      const resData = await response.json();
      setPrompts(resData.prompts);
      setEditedText(resData.prompts[activeTab].raw);
      setEditedTranslatedText(resData.prompts[activeTab].translated || '');
      setStatusMsg({ type: 'success', text: `버전 V${historyItem.version}이 성공적으로 서비스 엔진에 반영되었습니다!` });
      await fetchHistory(env);
    } catch (err: any) {
      console.error(err);
      setStatusMsg({ type: 'error', text: err.message || '반영 요청을 완료하지 못했습니다.' });
    } finally {
      setIsActivating(null);
    }
  };

  // 6. 특정 버전 히스토리 삭제 (Active는 불가)
  const handleDeleteHistory = async (historyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('정말 이 히스토리 버전을 영구 삭제하시겠습니까?')) return;

    try {
      const token = sessionStorage.getItem('adminToken') || '';
      const response = await fetch(`${API_BASE}/api/admin/prompts/history/${historyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...(isLocalhost ? { 'x-admin-bypass': 'admin' } : {})
        }
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || '히스토리 삭제에 실패했습니다.');
      }

      if (selectedHistoryId === historyId) {
        setSelectedHistoryId(null);
      }
      setStatusMsg({ type: 'success', text: '히스토리 버전이 성공적으로 삭제되었습니다.' });
      fetchHistory(env);
    } catch (err: any) {
      console.error(err);
      setStatusMsg({ type: 'error', text: err.message || '삭제 요청을 완료하지 못했습니다.' });
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

  const isProdRestricted = isLocalhost && env === 'prod';
  const canEdit = isEditable;
  const readOnly = !isEditable;

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
            실서버용 (PROD)
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
            개발/로컬용 (DEV)
          </button>
        </div>
      </div>

      {/* Main 3-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Column 1: Korean Source Input (5 / 12) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4 flex flex-col h-[650px]">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">한글 시스템 프롬프트 지침</span>
              <p className="text-slate-500 text-xs">{tabConfig[activeTab].desc}</p>
            </div>
            
            <button
              onClick={handleTranslate}
              disabled={isTranslating || !canEdit}
              className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-xs font-bold transition-all shrink-0 ${
                !canEdit
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed shadow-none'
                  : 'bg-indigo-50 hover:bg-indigo-100 border-indigo-100 text-indigo-600 cursor-pointer'
              }`}
              title="한글 지침을 바탕으로 영문 지침을 자동 번역 생성합니다."
            >
              {isTranslating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              영어 번역
            </button>
          </div>

          {selectedHistoryId !== null ? (
            <div className="flex items-center justify-between px-3 py-2 bg-indigo-50/50 border border-indigo-100 rounded-xl text-indigo-700 text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-indigo-500" />
                버전 V{selectedHistoryItem?.version} {!isEditable ? '조회 중 (수정 불가)' : '편집 중 (수정 가능)'}
              </span>
              <div>
                {!isEditable ? (
                  <button
                    onClick={() => setIsEditable(true)}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-all shadow-sm"
                  >
                    수정하기
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsEditable(false);
                      if (selectedHistoryItem) {
                        setEditedText(selectedHistoryItem.prompts?.[activeTab]?.raw || '');
                        setEditedTranslatedText(selectedHistoryItem.prompts?.[activeTab]?.translated || '');
                      }
                    }}
                    className="px-2.5 py-1 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-all shadow-sm"
                  >
                    편집 취소
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between px-3 py-2 bg-emerald-50/50 border border-emerald-100 rounded-xl text-emerald-800 text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                현재 서비스 반영(Active) 버전 {!isEditable ? '조회 중 (수정 불가)' : '편집 중 (수정 가능)'}
              </span>
              <div>
                {!isEditable ? (
                  <button
                    onClick={() => setIsEditable(true)}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-all shadow-sm"
                  >
                    수정하기
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsEditable(false);
                      if (prompts) {
                        setEditedText(prompts[activeTab]?.raw || '');
                        setEditedTranslatedText(prompts[activeTab]?.translated || '');
                      }
                    }}
                    className="px-2.5 py-1 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-all shadow-sm"
                  >
                    편집 취소
                  </button>
                )}
              </div>
            </div>
          )}
          
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            readOnly={readOnly}
            className={`w-full flex-1 p-4 border rounded-2xl font-mono text-sm leading-relaxed focus:outline-none resize-none transition-all ${
              readOnly
                ? 'bg-slate-100/80 text-slate-500 border-slate-200 cursor-not-allowed'
                : 'bg-slate-50/50 border-slate-200 text-slate-700 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/80'
            }`}
            placeholder="이곳에 AI 한글 지침을 작성해주세요..."
          />
        </div>
 
        {/* Column 2: Editable English Prompt (4 / 12) */}
        <div className="lg:col-span-4 bg-slate-950 rounded-3xl border border-slate-900 shadow-xl p-6 flex flex-col h-[650px] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-400 tracking-wider">ENGLISH SYSTEM INSTRUCTION</span>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
              env === 'prod' 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            }`}>
              {env.toUpperCase()} EDITING
            </span>
          </div>

          <textarea
            value={editedTranslatedText}
            onChange={(e) => setEditedTranslatedText(e.target.value)}
            readOnly={readOnly}
            className={`w-full flex-1 p-4 border rounded-2xl font-mono text-xs leading-relaxed focus:outline-none resize-none transition-all ${
              readOnly
                ? 'bg-slate-900/60 border-slate-950 text-slate-500 cursor-not-allowed'
                : 'bg-slate-900 border-slate-800 text-slate-200 focus:ring-2 focus:ring-indigo-500/30'
            }`}
            placeholder="이곳에 영문 시스템 지침을 작성하거나 왼쪽의 [영어 번역] 버튼을 이용해 영어로 변환해주세요..."
          />

          <div className="space-y-3">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={!canEdit}
              placeholder={!canEdit ? "수정하기 버튼을 클릭해 지침을 수정한 후 기록할 수 있습니다" : "이번 수정 사항 기록 (예: 이모지 개수 조절) - 생략 가능"}
              className={`w-full h-10 px-3 border rounded-xl text-xs focus:outline-none focus:border-indigo-500 transition-all ${
                !canEdit
                  ? 'bg-slate-900/40 border-slate-950 text-slate-600 cursor-not-allowed'
                  : 'bg-slate-900 border-slate-800 text-slate-300 placeholder:text-slate-500'
              }`}
            />

            <button
              onClick={handleSave}
              disabled={isSaving || isProdRestricted || !canEdit}
              className={`w-full h-11 flex items-center justify-center gap-2 text-white rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer ${
                isProdRestricted || !canEdit
                  ? 'bg-slate-700 cursor-not-allowed shadow-none text-slate-500'
                  : env === 'prod' 
                    ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/10' 
                    : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/10'
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>[ {env.toUpperCase()} ] 임시 저장 중...</span>
                </>
              ) : isProdRestricted ? (
                <>
                  <AlertCircle className="w-4 h-4" />
                  <span>실서버 저장 불가 (로컬 제한)</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>[ {env.toUpperCase()} ] 새로운 버전으로 임시 저장</span>
                </>
              )}
            </button>
          </div>
        </div>
 
        {/* Column 3: Version Control Timeline History (3 / 12) */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 flex flex-col h-[650px] space-y-4">
          <div className="flex flex-col gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-500 shrink-0" />
              <div>
                <h2 className="text-sm font-bold text-slate-800">버전 히스토리</h2>
                <p className="text-[10px] text-slate-400 leading-tight">임시 저장 카드 및 엔진 반영</p>
              </div>
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
                  onClick={() => setSelectedHistoryId(item.id)}
                  className={`p-3 border rounded-xl space-y-2 relative group hover:border-indigo-400 transition-all cursor-pointer ${
                    item.id === selectedHistoryId 
                      ? 'bg-indigo-50/30 border-indigo-500 shadow-sm ring-1 ring-indigo-500/20' 
                      : 'bg-slate-50 border-slate-200/60 hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      {/* 1. 날짜/시간을 상단 타이틀로 크게 표시 (버전 배지 제거) */}
                      <span className="text-xs font-bold text-slate-800">
                        🗓️ {formatDateTime(item.updatedAt)}
                      </span>
                      
                      {/* 2. 상태 표시 통합 (Active/Draft) */}
                      <div>
                        {item.isActive ? (
                          <span className="px-2 py-0.5 bg-emerald-500 text-white rounded text-[8px] font-extrabold tracking-wide shrink-0">
                            반영 완료 (Active)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-400 text-white rounded text-[8px] font-extrabold tracking-wide shrink-0">
                            반영 대기 (Draft)
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {!item.isActive ? (
                      <button
                        onClick={(e) => handleDeleteHistory(item.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-rose-500 hover:bg-rose-50 rounded transition-all cursor-pointer"
                        title="이 버전 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="text-[9px] text-slate-400 italic">삭제 불가</span>
                    )}
                  </div>

                  <p className="text-xs font-semibold text-slate-700 leading-snug break-words pt-0.5">
                    {item.comment || `${tabConfig[activeTab].label} 지시문 저장`}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 pt-2">
                    <span className="truncate max-w-[120px] font-medium" title={`작성자: ${item.updatedBy}`}>
                      👤 {item.updatedBy.split('@')[0]}
                    </span>
                    
                    {/* 3. 하단 중복 텍스트 제거 및 반영하기 버튼만 표시 */}
                    {!item.isActive && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleActivate(item);
                        }}
                        disabled={!!isActivating || isProdRestricted}
                        className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 disabled:text-slate-300 font-bold transition-all cursor-pointer"
                        title={isProdRestricted ? "로컬 환경에서는 실서버 반영이 차단됩니다." : "이 버전을 실시간 서비스 엔진에 적재"}
                      >
                        {isActivating === item.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        서비스에 반영
                      </button>
                    )}
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
