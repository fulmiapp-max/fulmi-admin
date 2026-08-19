import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

export interface PromptTestScenario {
  id: string;
  name: string;
  contextPayload: string;
  isActive: boolean;
}

export interface SimulationResult {
  scenario: PromptTestScenario;
  generatedOutput: any;
  evaluation: {
    scores: {
      specificity: number;
      contextFit: number;
      dayOfWeekSuitability: number;
      inputDataUtilization: number;
      tomorrowSuitability: number;
      closureBreak: number;
      forbiddenWords: number;
      promptEfficiency: number;
    };
    averageScore: number;
    feedback: string;
  } | null;
  error?: string;
}

export async function evaluateDraftPrompt(
  draftPrompt: string,
  promptType: string,
  scenarios: PromptTestScenario[]
): Promise<{ averageScore: number; results: SimulationResult[]; finalSuggestion: any }> {

  const activeScenarios = scenarios.filter(s => s.isActive);
  
  const results: SimulationResult[] = await Promise.all(
    activeScenarios.map(async (scenario) => {
      let generatedOutputText = "";
      try {
        // 1. Generate To-Dos using the draftPrompt
        const activePrompt = draftPrompt.replace(/{todo_count}/g, '3');

        const exampleObjects = Array.from({ length: 3 }).map((_, i) => ({
          title: `todo${i + 1} title`,
          description: ""
        }));
        const jsonSchema = `Respond ONLY in the following JSON format:\n{\n  "todos": ${JSON.stringify(exampleObjects, null, 2)}\n}`;
        const finalPrompt = `${activePrompt}\n\n${jsonSchema}`;

        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash",
          systemInstruction: finalPrompt
        });

        const contextText = scenario.contextPayload;

        const generateResult = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: contextText }] }],
          generationConfig: { temperature: 0.7, responseMimeType: "application/json" }
        });

        const responseText = generateResult.response.text();
        generatedOutputText = responseText.replace(/```(?:json)?\n?|\n?```/g, '').trim();

        // 2. Evaluate with AI Judge
        const judgePrompt = `당신은 엄격하고 예리한 '프롬프트 및 결과물 평가자(AI Judge)'입니다.
목표: 주어진 사용자의 데이터(Context)와 생성된 To-Do 결과물(Output)을 보고, 현재의 프롬프트가 얼마나 잘 작동하는지 8가지 기준으로 각각 100점 만점으로 평가하세요.

[평가 기준]
1. 구체성 및 실천 가능성 (specificity): 추상적 표현 금지 제약을 지켰는가? ('몸과 마음 재정비', '휴식 취하기' 등 상투적 표현 금지, 반드시 구체적 수치/도구/행동 단위로 작성)
2. 일기 맥락 및 감정 핏 (contextFit): 일기의 내용과 감정에 어울리는 다정하고 공감되는 조언인가?
3. 타겟 요일 적합성 (dayOfWeekSuitability): To-Do가 수행될 요일(target_time)이 주말인지 평일인지 파악하고, 그 특성(주말이면 리프레시, 평일이면 업무/루틴)을 결과물에 적절히 반영했는가?
4. 입력 데이터 활용도 (inputDataUtilization): 입력된 모든 데이터(특히 오늘/어제 에너지 수치 등)를 무시하지 않고 잘 활용하여 행동 난이도와 개수를 조절했는가? (필요 없는 데이터라도 프롬프트 지시에 맞게 가공되었는지)
5. 내일 실행 적합성 (tomorrowSuitability): 투두가 내일(기상 직후~일과 중) 실천하기에 자연스러운가? 일기 작성 시점(주로 밤)의 후회나 상황에 대한 '즉각적인 대처(예: 지금 당장 폰 끄기, 당장 스트레칭하기)'를 내일의 할 일로 제안하는 시점 오류(시간적 어색함)가 발생하지 않았는가?
6. 종결성 브레이크 준수 (closureBreak): 이미 끝난 일회성 사건(시험/축제 종료, 면접 완료 등)에 대해 불필요하게 연장선상의 To-Do를 제안하지 않고, 새로운 흐름이나 휴식을 잘 제안했는가?
7. 날짜/시간 금지어 준수 (forbiddenWords): To-Do 제목 및 설명 전체에서 '오늘', '내일', '어제', '요일' 등 날짜나 시점을 지칭하는 어휘 사용을 완벽히 배제했는가? (포함되었으면 심각한 감점)
8. 프롬프트 토큰 효율성 및 지시 이행 (promptEfficiency): 프롬프트 원문이 불필요하게 길어 토큰을 낭비하지 않고 간결한가? 그리고 결과물이 그 지시를 군더더기 없이 정확히 따랐는가? (긴 프롬프트는 감점 요소)

[입력 데이터]
${contextText}

[생성된 To-Do 결과물]
${generatedOutputText}

반드시 아래 JSON 형식으로만 응답하세요:
{
  "scores": {
    "specificity": (0~100 사이의 숫자),
    "contextFit": (0~100 사이의 숫자),
    "dayOfWeekSuitability": (0~100 사이의 숫자),
    "inputDataUtilization": (0~100 사이의 숫자),
    "tomorrowSuitability": (0~100 사이의 숫자),
    "closureBreak": (0~100 사이의 숫자),
    "forbiddenWords": (0~100 사이의 숫자),
    "promptEfficiency": (0~100 사이의 숫자)
  },
  "averageScore": (위 8개 점수의 평균 점수 0~100),
  "feedback": "평가 코멘트 (왜 이 점수를 주었는지, 각 8가지 기준 측면에서의 강점과 약점 분석)"
}`;

        const judgeModel = genAI.getGenerativeModel({
          model: "gemini-2.5-flash",
        });

        const judgeResult = await judgeModel.generateContent({
          contents: [{ role: 'user', parts: [{ text: judgePrompt }] }],
          generationConfig: { temperature: 0.0, responseMimeType: "application/json" }
        });

        const judgeText = judgeResult.response.text().replace(/```(?:json)?\n?|\n?```/g, '').trim();
        const evaluation = JSON.parse(judgeText);

        return {
          scenario,
          generatedOutput: JSON.parse(generatedOutputText),
          evaluation
        };

      } catch (e) {
        console.error("Evaluation failed for scenario", scenario.id, e);
        return {
          scenario,
          generatedOutput: generatedOutputText ? generatedOutputText : null,
          evaluation: null,
          error: String(e)
        };
      }
    })
  );

  const validResults = results.filter(r => r.evaluation !== null);
  const totalScore = validResults.reduce((sum, r) => sum + (r.evaluation?.averageScore || 0), 0);
  const averageScore = validResults.length > 0 ? Math.round(totalScore / validResults.length) : 0;

  // 3. Final Overall Prompt Suggestion
  let finalSuggestion = null;
  if (validResults.length > 0) {
    try {
      const overallPrompt = `당신은 최고의 프롬프트 엔지니어입니다. 다음은 원본 프롬프트와 여러 테스트 케이스에 대한 결과/피드백입니다.

[원본 프롬프트 (Draft Prompt)]
${draftPrompt}

[평균 점수]
${averageScore} / 100

[테스트 결과 및 피드백 (JSON)]
${JSON.stringify(validResults.map(r => r.evaluation), null, 2)}

이 피드백들을 종합하여, 원본 프롬프트가 **8가지 평가 지표(구체성/추상적 표현 금지, 감정 핏, 요일 적합성, 데이터 활용도, 내일 실행 적합성, 종결성 브레이크 준수, 날짜 금지어 배제, 프롬프트 토큰 효율성)**를 완벽히 만족하도록 개선된 '새로운 완성형 프롬프트'를 작성해주세요.

[중요 제약사항]
0. **만약 평균 점수가 100점(만점)이라면, 원본 프롬프트가 이미 완벽한 상태입니다. 이 경우에는 절대 단 한 글자도 수정, 요약, 재배치하지 말고 원본 프롬프트를 100% 그대로 복사해서 반환하세요.**
1. 평균 점수가 100점 미만일 경우에만 기존의 훌륭한 디테일과 의도를 100% 보존하면서 개선을 진행합니다. **단, 프롬프트가 무한정 길어지는 것을 막기 위해, 비슷하거나 중복되는 제약 조건들은 본래의 뉘앙스와 디테일을 절대 잃지 않는 선에서 하나의 문장으로 세련되게 압축 및 병합(Merge)하여 전체 길이를 최대한 콤팩트하게 다이어트 시키세요.**
2. 프롬프트의 **순서와 논리적 구조(배치)는 AI가 가장 이해하기 쉬운 정석적인 마크다운 구조로 과감히 재배치 및 최적화** 하세요. (예: [ROLE/역할]은 맨 위로, [CONSTRAINTS/제약조건]은 중간, [OUTPUT FORMAT/출력형식]은 맨 아래로 배치)
3. 감점(오류)이 발생한 부분에 대해서만 핀포인트로 규칙을 덧붙이되, 기존 문맥에 자연스럽게 녹여내어 문장이 지저분하게 늘어나지 않게 하세요.
4. 응답의 "suggestedPromptPatch" 항목에는 일부 코드 조각이 아닌, 복사해서 바로 사용할 수 있는 **새로운 프롬프트 전체(Full Text)**를 작성해야 합니다.

응답 형식(JSON):
{
  "overallFeedback": "종합 평가 코멘트 (8가지 기준 측면에서 프롬프트의 문제점 분석 및 개선 방향)",
  "suggestedPromptPatch": "피드백이 반영되어 완전히 새롭게 작성된 프롬프트 전체 텍스트 (마크다운 포맷)"
}`;
      const finalJudgeModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const finalJudgeResult = await finalJudgeModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: overallPrompt }] }],
        generationConfig: { temperature: 0.4, responseMimeType: "application/json" }
      });
      finalSuggestion = JSON.parse(finalJudgeResult.response.text().replace(/```(?:json)?\n?|\n?```/g, '').trim());
    } catch (e) {
      console.error("Overall evaluation failed", e);
    }
  }

  return {
    averageScore,
    results,
    finalSuggestion
  };
}
