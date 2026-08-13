import React, { useState } from 'react';
import { Play, Plus, Trash2, Edit2, RefreshCw, AlertCircle } from 'lucide-react';
import { useTestScenarios } from '../hooks/useTestScenarios';
import { evaluateDraftPrompt } from '../lib/promptSimulator';
import type { SimulationResult, PromptTestScenario } from '../lib/promptSimulator';
import * as Diff from 'diff';

export default function PromptSimulator() {
  const { scenarios, addScenario, updateScenario, deleteScenario, toggleScenarioActive } = useTestScenarios();
  const [activeTab, setActiveTab] = useState<'simulation' | 'scenarios'>('simulation');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResults, setSimulationResults] = useState<{ averageScore: number; results: SimulationResult[]; finalSuggestion: any; originalPrompt?: string } | null>(null);
  
  const [draftPrompt, setDraftPrompt] = useState<string>('');
  const [promptType, setPromptType] = useState<string>('todoItems');

  // Scenario Form State
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<PromptTestScenario, 'id' | 'isActive'>>({
    name: '',
    contextPayload: ''
  });

  const handleRunSimulation = async () => {
    if (!draftPrompt.trim()) {
      alert("테스트할 프롬프트를 먼저 작성해주세요.");
      return;
    }
    setIsSimulating(true);
    setSimulationResults(null);
    try {
      const activeScenarios = scenarios.filter(s => s.isActive);
      if (activeScenarios.length === 0) {
        alert("활성화된 테스트 시나리오가 없습니다. 시나리오를 먼저 등록해주세요.");
        setIsSimulating(false);
        return;
      }
      
      const res = await evaluateDraftPrompt(draftPrompt, promptType, activeScenarios);
      setSimulationResults({ ...res, originalPrompt: draftPrompt });
    } catch (e) {
      alert("시뮬레이션 중 오류가 발생했습니다.");
      console.error(e);
    } finally {
      setIsSimulating(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', contextPayload: '' });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSaveScenario = () => {
    if (!formData.name || !formData.contextPayload) {
      alert("시나리오 이름과 입력 데이터(Context)는 필수입니다.");
      return;
    }
    if (editingId) {
      updateScenario(editingId, formData);
    } else {
      addScenario({ ...formData, isActive: true });
    }
    resetForm();
  };

  const handleEditScenario = (s: PromptTestScenario) => {
    setFormData({
      name: s.name,
      contextPayload: s.contextPayload
    });
    setEditingId(s.id);
    setIsAdding(true);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          🧪 프롬프트 연구소 (Simulator)
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          실제 서비스에 반영하기 전에 가상의 일기 데이터를 통해 프롬프트를 마음껏 테스트해보세요. (서버와 독립적으로 브라우저에서 안전하게 실행됩니다)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Prompt Input */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col h-[800px]">
          <h2 className="text-sm font-bold text-slate-700 mb-4">📝 테스트할 프롬프트 입력</h2>
          <textarea
            value={draftPrompt}
            onChange={(e) => setDraftPrompt(e.target.value)}
            className="w-full flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-all"
            placeholder="실제 프롬프트 관리 화면에서 테스트하고 싶은 지시문을 복사해서 이곳에 붙여넣어주세요..."
          />
          <button
            onClick={handleRunSimulation}
            disabled={isSimulating || scenarios.filter(s => s.isActive).length === 0}
            className="mt-4 w-full h-12 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-600/20"
          >
            {isSimulating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
            {isSimulating ? '테스트 진행 중...' : '시뮬레이션 시작'}
          </button>
        </div>

        {/* Right Column: Scenarios & Results */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[800px] overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('simulation')}
              className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'simulation' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              📊 시뮬레이션 결과
            </button>
            <button
              onClick={() => setActiveTab('scenarios')}
              className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'scenarios' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              ⚙️ 테스트 시나리오 관리 ({scenarios.length})
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
            {/* SIMULATION TAB */}
            {activeTab === 'simulation' && (
              <div className="space-y-6">
                {!simulationResults && !isSimulating && (
                  <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                    <AlertCircle className="w-12 h-12 mb-4 text-slate-300" />
                    <p>좌측에 프롬프트를 입력하고 시뮬레이션 시작 버튼을 눌러주세요.</p>
                  </div>
                )}
                {isSimulating && (
                  <div className="flex flex-col items-center justify-center h-64 text-indigo-500">
                    <RefreshCw className="w-12 h-12 mb-4 animate-spin" />
                    <p className="font-bold">AI가 시나리오별로 프롬프트를 꼼꼼히 평가하고 있습니다...</p>
                  </div>
                )}
                {simulationResults && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-slate-800 mb-1">AI 평가 종합 점수</h3>
                        <p className="text-sm text-slate-500">AI 판사(Gemini 2.5 Pro)가 평가한 평균 점수입니다.</p>
                      </div>
                      <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">
                        {simulationResults.averageScore} <span className="text-xl text-slate-400">/ 100</span>
                      </div>
                    </div>

                    {simulationResults.finalSuggestion && (
                      <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 mt-1 text-indigo-600" />
                          <div className="flex-1">
                            <h4 className="font-bold text-indigo-900 mb-2">프롬프트 엔지니어의 종합 피드백</h4>
                            <p className="text-sm text-indigo-800/80 mb-4 whitespace-pre-wrap leading-relaxed">
                              {simulationResults.finalSuggestion.overallFeedback}
                            </p>
                            <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-inner">
                              <h5 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">추천 패치 내용 (Diff)</h5>
                              <div className="text-sm font-mono text-slate-700 whitespace-pre-wrap leading-relaxed">
                                {Diff.diffWords(simulationResults.originalPrompt || '', simulationResults.finalSuggestion.suggestedPromptPatch).map((part, index) => (
                                  <span
                                    key={index}
                                    className={
                                      part.added ? 'bg-green-200 text-green-900 px-0.5 rounded font-bold' :
                                      part.removed ? 'bg-red-200 text-red-900 line-through px-0.5 rounded opacity-50' :
                                      'text-slate-600'
                                    }
                                  >
                                    {part.value}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <h3 className="font-bold text-slate-800 pt-4">케이스별 상세 분석</h3>
                    <div className="space-y-4">
                      {simulationResults.results.map((res, idx) => (
                        <div key={idx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                            <div>
                              <h4 className="font-bold text-slate-800 text-sm leading-tight mb-1">{res.scenario.name}</h4>
                            </div>
                            <span className="text-2xl font-bold text-indigo-600">{res.evaluation?.averageScore || 0}점</span>
                          </div>
                          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h5 className="text-xs font-bold text-slate-500 mb-2">입력 데이터 (Context)</h5>
                              <pre className="text-xs text-slate-700 bg-slate-100 p-3 rounded-lg leading-relaxed whitespace-pre-wrap">{res.scenario.contextPayload}</pre>
                            </div>
                            <div>
                              <h5 className="text-xs font-bold text-slate-500 mb-2">생성된 결과</h5>
                              <div className="text-sm text-slate-700 bg-slate-100 p-3 rounded-lg space-y-2">
                                {res.error ? (
                                  <p className="text-red-500">생성 실패: {res.error}</p>
                                ) : (
                                  <pre className="whitespace-pre-wrap text-xs font-mono">{JSON.stringify(res.generatedOutput, null, 2)}</pre>
                                )}
                              </div>
                            </div>
                            <div className="md:col-span-2">
                              <h5 className="text-xs font-bold text-slate-500 mb-2">AI 심사평 (종합 코멘트)</h5>
                              <p className="text-sm text-slate-700 bg-emerald-50 border border-emerald-100 p-3 rounded-lg leading-relaxed mb-4">
                                {res.evaluation?.feedback || '평가 결과가 없습니다.'}
                              </p>
                              
                              <h5 className="text-xs font-bold text-slate-500 mb-2">세부 지표별 점수 (100점 만점)</h5>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {res.evaluation?.scores && Object.entries({
                                  '구체성 (추상적X)': res.evaluation.scores.specificity,
                                  '맥락/감정 핏': res.evaluation.scores.contextFit,
                                  '타겟 요일 반영': res.evaluation.scores.dayOfWeekSuitability,
                                  '입력데이터 활용': res.evaluation.scores.inputDataUtilization,
                                  '내일 실행 적합성': res.evaluation.scores.tomorrowSuitability,
                                  '종결성 브레이크': res.evaluation.scores.closureBreak,
                                  '날짜 금지어 배제': res.evaluation.scores.forbiddenWords,
                                  '프롬프트 토큰 효율성': res.evaluation.scores.promptEfficiency,
                                }).map(([key, val]) => (
                                  <div key={key} className="bg-white p-2.5 rounded-xl border border-slate-200 flex flex-col gap-1 shadow-sm">
                                    <span className="text-[11px] font-bold text-slate-500">{key}</span>
                                    <div className="flex items-end justify-between">
                                      <span className={`text-lg font-extrabold ${val !== undefined && val < 80 ? 'text-rose-500' : 'text-indigo-600'}`}>{val || 0}</span>
                                      <span className="text-[10px] text-slate-400 font-medium mb-1">/ 100</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SCENARIOS TAB */}
            {activeTab === 'scenarios' && (
              <div className="space-y-6">
                {!isAdding ? (
                  <>
                    <div className="flex justify-end">
                      <button
                        onClick={() => setIsAdding(true)}
                        className="px-4 py-2 bg-slate-800 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-slate-700 transition-colors shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                        새 시나리오 추가
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {scenarios.map(s => (
                        <div key={s.id} className={`p-5 rounded-2xl border transition-all ${s.isActive ? 'bg-white border-indigo-200 shadow-sm' : 'bg-slate-50 border-slate-200 opacity-70'}`}>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <input 
                                type="checkbox" 
                                checked={s.isActive} 
                                onChange={() => toggleScenarioActive(s.id)}
                                className="w-4 h-4 text-indigo-600 rounded cursor-pointer mt-1 flex-shrink-0"
                              />
                              <h4 className="font-bold text-slate-800 text-sm leading-tight">{s.name}</h4>
                            </div>
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleEditScenario(s)} className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => deleteScenario(s.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <pre className="text-xs text-slate-600 line-clamp-4 mb-3 leading-relaxed whitespace-pre-wrap font-sans bg-slate-100 p-2 rounded-lg">
                            {s.contextPayload}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-bold text-lg text-slate-800">
                        {editingId ? '시나리오 수정' : '새 테스트 시나리오'}
                      </h3>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">시나리오 이름 (예: 아주 짧은 일기)</label>
                        <input 
                          type="text" 
                          value={formData.name} 
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                          placeholder="시나리오 특징을 적어주세요"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">입력 데이터 원본 (Context Payload)</label>
                        <textarea 
                          value={formData.contextPayload} 
                          onChange={(e) => setFormData({...formData, contextPayload: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 h-64 resize-none font-mono text-xs"
                          placeholder={`서버나 디버깅 툴에서 전달받는 원본 포맷을 그대로 복사해서 붙여넣으세요.
예시:
- user_input.diary_text : 오늘 일기 내용...
- user_state.energy_score : 10
...`}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-200">
                      <button onClick={resetForm} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors">
                        취소
                      </button>
                      <button onClick={handleSaveScenario} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-600/20 transition-all">
                        저장하기
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
