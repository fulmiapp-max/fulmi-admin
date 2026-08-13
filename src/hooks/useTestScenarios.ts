import { useState, useEffect } from 'react';
import type { PromptTestScenario } from '../lib/promptSimulator';

const SCENARIOS_STORAGE_KEY = 'fulmi_admin_prompt_test_scenarios_v5';

const rawData = [
  {
    "id": "1",
    "category": "[복합주제] 직장 스트레스 및 폭식 (평일 저에너지)",
    "user_input.diary_text": "오늘 팀장님한테 엄청 깨졌다. 기획안 다시 쓰라는데 진짜 다 때려치고 싶다. 너무 스트레스 받고 힘들어서 퇴근길에 떡볶이랑 맥주 사서 폭식했다. 내일은 제발 무사히 넘어갔으면 좋겠다.",
    "user_state.energy_score": 10,
    "user_state.yesterday_energy_score": 60,
    "target_context.current_time": "2026년 8월 6일 (목)",
    "target_context.target_time": "2026년 8월 7일 (금)"
  },
  {
    "id": "2",
    "category": "[단일주제] 프로젝트 성공에 대한 성취감 (평일 고에너지)",
    "user_input.diary_text": "3개월간 준비한 신규 기능 배포가 마침내 끝났다! 사용자 반응도 예상보다 훨씬 좋아서 팀원들이랑 소소하게 회식했다. 성취감이 엄청나다. 이 에너지를 이어가서 내일은 미뤄뒀던 개인 프로젝트 리팩토링도 시작해봐야겠다.",
    "user_state.energy_score": 90,
    "user_state.yesterday_energy_score": 75,
    "target_context.current_time": "2026년 8월 5일 (수)",
    "target_context.target_time": "2026년 8월 6일 (목)"
  },
  {
    "id": "3",
    "category": "[단일주제] 주말 안도감 및 완전한 휴식 (금요일 밤)",
    "user_input.diary_text": "드디어 금요일 퇴근! 일주일 동안 야근하느라 피로가 엄청 쌓였다. 집에 오자마자 침대에 누워서 유튜브만 몇 시간째 보는 중. 주말 동안은 일 생각 전혀 안 하고 집에서 완전 휴식을 취할 생각이다.",
    "user_state.energy_score": 35,
    "user_state.yesterday_energy_score": 25,
    "target_context.current_time": "2026년 8월 7일 (금)",
    "target_context.target_time": "2026년 8월 8일 (토)"
  },
  {
    "id": "4",
    "category": "[복합주제] 주말 충전 완료 & 월요병 걱정 (일요일 밤)",
    "user_input.diary_text": "주말 동안 오랜만에 친구들 만나서 맛있는 것도 먹고 수다 떨면서 힐링했다. 내일부터 다시 출근이라 조금 무섭지만, 저녁에 방 청소도 깔끔하게 해둬서 마음은 한결 편안하다. 내일 일찍 출근해서 차근차근 일 시작해야지.",
    "user_state.energy_score": 65,
    "user_state.yesterday_energy_score": 70,
    "target_context.current_time": "2026년 8월 9일 (일)",
    "target_context.target_time": "2026년 8월 10일 (월)"
  },
  {
    "id": "5",
    "category": "[복합주제] 자기개발 미루기로 인한 자책감 (목요일)",
    "user_input.diary_text": "퇴근하고 공부하려고 했는데 또 폰만 보다가 시간을 다 보내버렸다. 매번 계획만 세우고 실천을 안 하는 내 모습에 자괴감이 든다. 작심삼일도 못 가는 것 같다. 내일은 아주 작은 거라도 좋으니 꼭 실천해보고 싶다.",
    "user_state.energy_score": 30,
    "user_state.yesterday_energy_score": 45,
    "target_context.current_time": "2026년 8월 6일 (목)",
    "target_context.target_time": "2026년 8월 7일 (금)"
  },
  {
    "id": "6",
    "category": "[단일주제] 취준생 서류 탈락 우울감",
    "user_input.diary_text": "가고 싶었던 회사 서류 결과가 나왔는데 또 탈락이다. 몇 번째 탈락인지 이제 세지도 못하겠다. 스터디원들은 하나둘 합격해 나가는데 나만 제자리인 것 같아 하루 종일 방에서 불 꺼두고 누워있었다. 내일은 자소서 하나라도 수정해서 제출할 수 있을까.",
    "user_state.energy_score": 10,
    "user_state.yesterday_energy_score": 30,
    "target_context.current_time": "2026년 8월 4일 (화)",
    "target_context.target_time": "2026년 8월 5일 (수)"
  },
  {
    "id": "7",
    "category": "[단일주제] 카페 자영업자 매출 호조 성취감",
    "user_input.diary_text": "오늘 신메뉴 반응이 폭발적이어서 하루 종일 신나게 음료를 만들었다. 재료가 조기 소진돼서 일찍 마감하고 직원들이랑 맛있는 저녁도 먹었다. 몸은 힘들지만 노력한 만큼 성과가 나와서 보람차다. 내일은 부족했던 재료 미리 넉넉히 발주해둬야겠다.",
    "user_state.energy_score": 85,
    "user_state.yesterday_energy_score": 60,
    "target_context.current_time": "2026년 8월 5일 (수)",
    "target_context.target_time": "2026년 8월 6일 (목)"
  },
  {
    "id": "8",
    "category": "[복합주제] 주말 육아 체력 방전 및 임원 보고 압박",
    "user_input.diary_text": "주말 내내 애들이랑 키즈카페 가고 공원 돌아다니느라 체력이 완전히 방전됐다. 애들 재우고 나니 밤 11시인데, 내일 아침 임원 보고 자료가 계속 머릿속을 스쳐서 잠이 안 온다. 월요일 출근 생각만 하면 벌써 머리가 아프다.",
    "user_state.energy_score": 30,
    "user_state.yesterday_energy_score": 50,
    "target_context.current_time": "2026년 8월 9일 (일)",
    "target_context.target_time": "2026년 8월 10일 (월)"
  },
  {
    "id": "9",
    "category": "[단일주제] 신입 간호사 나이트 근무 직후 피로감",
    "user_input.diary_text": "나이트 근무 마치고 퇴근했는데 햇빛을 받으니까 정신이 멍하다. 병동 인력이 부족해서 계속 뛰어다녔더니 다리가 부어오르고 온몸이 쑤신다. 자고 일어나면 또 이브닝 출근이라니 까마득하다. 암막 커튼 치고 폭잠 자는 게 최우선이다.",
    "user_state.energy_score": 10,
    "user_state.yesterday_energy_score": 20,
    "target_context.current_time": "2026년 8월 7일 (금)",
    "target_context.target_time": "2026년 8월 8일 (토)"
  },
  {
    "id": "10",
    "category": "[단일주제] 건강 관리 성공 및 일상 루틴 유지",
    "user_input.diary_text": "요즘 자꾸 몸이 피곤해서 퇴근 후 오랜만에 러닝을 30분 동안 뛰었다. 땀 빼고 샤워하니까 상쾌하고 정신이 맑아지는 느낌이다. 영양제 챙겨먹고 일찍 자야지. 내일 아침에도 일찍 일어나서 스트레칭하고 출근하고 싶다.",
    "user_state.energy_score": 70,
    "user_state.yesterday_energy_score": 40,
    "target_context.current_time": "2026년 8월 10일 (월)",
    "target_context.target_time": "2026년 8월 11일 (화)"
  }
];

const DEFAULT_SCENARIOS: PromptTestScenario[] = rawData.map(item => {
  const { id, category, ...payload } = item;
  return {
    id: `default-${id}`,
    name: category,
    contextPayload: JSON.stringify(payload, null, 2),
    isActive: true,
  };
});

export function useTestScenarios() {
  const [scenarios, setScenarios] = useState<PromptTestScenario[]>(() => {
    const saved = localStorage.getItem(SCENARIOS_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) return parsed;
      } catch (e) {
        console.error("Failed to parse scenarios from local storage");
      }
    }
    return DEFAULT_SCENARIOS;
  });

  useEffect(() => {
    localStorage.setItem(SCENARIOS_STORAGE_KEY, JSON.stringify(scenarios));
  }, [scenarios]);

  const addScenario = (s: Omit<PromptTestScenario, 'id'>) => {
    const newScenario = { ...s, id: Math.random().toString(36).substring(7) };
    setScenarios([newScenario, ...scenarios]);
  };

  const updateScenario = (id: string, updates: Partial<PromptTestScenario>) => {
    setScenarios(scenarios.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteScenario = (id: string) => {
    setScenarios(scenarios.filter(s => s.id !== id));
  };

  const toggleScenarioActive = (id: string) => {
    setScenarios(scenarios.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s));
  };

  return { scenarios, addScenario, updateScenario, deleteScenario, toggleScenarioActive };
}
