import { useState, useEffect } from 'react';
import { Terminal, Save, Loader2, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

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

type TabType = 'fastAnalysis' | 'aiFeedback' | 'todoItems' | 'monthlyReport';

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
  const [prompts, setPrompts] = useState<PromptsData | null>(null);
  const [editedText, setEditedText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load Prompts from DB
  const fetchPrompts = async () => {
    setIsLoading(true);
    setStatusMsg(null);
    try {
      const authKey = sessionStorage.getItem('adminAuth') === 'true' ? 'admin' : '';
      const response = await fetch(`${API_BASE}/api/admin/prompts`, {
        headers: {
          'x-admin-bypass': authKey, // Dev auth bypass using session flag
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

  useEffect(() => {
    fetchPrompts();
  }, []);

  // Update editor text when tab changes
  useEffect(() => {
    if (prompts) {
      setEditedText(prompts[activeTab].raw);
    }
  }, [activeTab, prompts]);

  // Save Prompt & Translate
  const handleSave = async () => {
    if (!prompts) return;
    setIsSaving(true);
    setStatusMsg(null);
    try {
      const authKey = sessionStorage.getItem('adminAuth') === 'true' ? 'admin' : '';
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
          'x-admin-bypass': authKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompts: updatedPrompts, targetKey: activeTab }),
      });

      if (!response.ok) {
        throw new Error('프롬프트 저장 및 번역 중 오류가 발생했습니다.');
      }

      const resData = await response.json();
      setPrompts(resData.prompts);
      setStatusMsg({ type: 'success', text: '프롬프트가 저장되었으며, 영문 시스템 지시문으로 자동 갱신되었습니다.' });
    } catch (err: any) {
      console.error(err);
      setStatusMsg({ type: 'error', text: err.message || '저장 및 번역 요청을 완료하지 못했습니다.' });
    } finally {
      setIsSaving(false);
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
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 mb-1">인공지능 시스템 프롬프트(지시문) 관리</h2>
          <p className="text-slate-500 text-sm">관리자는 한글로 규칙을 고치고, 백엔드에서는 토큰 절약을 위해 영어로 번역하여 전송합니다.</p>
        </div>
        <button 
          onClick={fetchPrompts}
          className="flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 text-sm font-semibold transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> 새로고침
        </button>
      </div>

      {/* Status Messages */}
      {statusMsg && (
        <div className={`p-4 rounded-xl flex items-start gap-3 border ${
          statusMsg.type === 'success' 
            ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
            : 'bg-rose-50 border-rose-100 text-rose-800'
        }`}>
          {statusMsg.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" /> : <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />}
          <span className="text-sm font-medium">{statusMsg.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto whitespace-nowrap scrollbar-hide">
        {(Object.keys(tabConfig) as TabType[]).map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setActiveTab(tabKey)}
            className={`px-5 py-3.5 font-bold text-sm border-b-2 transition-all ${
              activeTab === tabKey
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/20'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tabConfig[tabKey].label}
          </button>
        ))}
      </div>

      {/* Tab Content Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left: Input Textarea (Korean Prompt) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">관리자 설정용 지시문 (한글/영어 자유 양식)</span>
            <p className="text-slate-500 text-xs mt-1">{tabConfig[activeTab].desc}</p>
          </div>
          
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            className="w-full h-[450px] p-4 bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-700 font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/80 resize-none transition-all"
            placeholder="이곳에 한글 또는 영어로 AI 분석 지침을 작성해주세요..."
          />

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full h-12 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 disabled:bg-indigo-400 transition-all cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>영문 시스템 지시문으로 자동 번역 및 저장 중...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>저장 및 영문 변환 적용</span>
              </>
            )}
          </button>
        </div>

        {/* Right: Translated Preview Terminal (English) */}
        <div className="bg-slate-950 rounded-2xl border border-slate-900 shadow-xl p-6 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-400 tracking-wider">AUTO-TRANSLATED ENGLISH SYSTEM INSTRUCTION (READ-ONLY)</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">ACTIVE IN GEMINI</span>
          </div>

          <div className="flex-1 bg-slate-900/40 border border-slate-800/40 rounded-xl p-4 font-mono text-xs text-slate-300 leading-relaxed overflow-y-auto max-h-[500px] h-[500px] scrollbar-thin select-all">
            {currentPrompt?.translated ? (
              <pre className="whitespace-pre-wrap font-mono break-all">{currentPrompt.translated}</pre>
            ) : (
              <span className="text-slate-600 italic">영문으로 변환된 지시문이 여기에 표시됩니다. 왼쪽에서 저장 버튼을 누르면 자동으로 갱신됩니다.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
