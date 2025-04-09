import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { format } from 'date-fns';
import { ChatHistory, ReportData, Message } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 리콜키 코드 생성
function generateReportCode(): string {
  const prefix = 'SSY-';
  const date = format(new Date(), 'yyyyMMdd-HHmmss');
  return `${prefix}${date}`;
}

// 리콜키 텍스트에서 섹션 추출
function extractSection(text: string, sectionName: string): string {
  const regex = new RegExp(`${sectionName}[:\\s]+(.*?)(?=[\\d]+\\.|$)`, 's');
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}

export async function POST(req: Request) {
  try {
    const { history }: { history: ChatHistory } = await req.json();
    const code = history.code || generateReportCode();
    
    // 메시지가 너무 길면 최근 메시지만 사용 (토큰 제한 완화)
    const recentMessages = history.messages.length > 10 
      ? history.messages.slice(-10) 
      : history.messages;
    
    // OpenAI 메시지 형식으로 변환
    const apiMessages = [
      {
        role: 'system',
        content: `당신은 대화 내용을 분석하여 고차원 리포트를 생성하는 전문가입니다. 
        대화를 분석하고 아래 16가지 항목을 포함한 리포트를 생성해주세요:
        1. FLOW: 대화 흐름 요약
        2. CORE EXPRESSIONS: 핵심 표현
        3. EMOTIONAL SEQUENCE: 감정 변화 순서
        4. RESTORATION TRIGGER: 복원 트리거
        5. RETRIEVAL INSTRUCTION: 검색 지침
        6. CONTEXT TIMESTAMP: 컨텍스트 타임스탬프
        7. FEEDBACK SIGNAL: 피드백 신호
        8. RESPONSE STYLE SUGGESTION: 응답 스타일 제안
        9. USER STYLE INDICATOR: 사용자 스타일 표시
        10. NEXT MEMORY LABEL: 다음 메모리 레이블
        11. CONTINUATION CONTEXT: 이어서 진행할 컨텍스트
        12. CONTEXT VARIATION HINT: 컨텍스트 변형 힌트
        13. AI SELF-MODULATION TIP: AI 자체 조절 팁
        15. RESPONSE DIRECTION OPTIONS: 응답 방향 옵션
        16. REPORT GENERATED USING: 보고서 생성 방법
        
        각 항목은 간결하게 작성해주세요.`
      }
    ];
    
    // 기존 메시지를 OpenAI API 형식으로 변환
    recentMessages.forEach((msg: Message) => {
      apiMessages.push({
        role: msg.role,
        content: msg.content
      });
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // GPT-4o 대신 더 빠른 모델 사용
      messages: apiMessages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      temperature: 0.7,
      max_tokens: 1500 // 토큰 수 감소
    });

    const reportText = completion.choices[0].message.content || '';
    
    // 리콜키 텍스트 파싱
    const reportData: ReportData = {
      flow: extractSection(reportText, 'FLOW'),
      coreExpressions: extractSection(reportText, 'CORE EXPRESSIONS'),
      emotionalSequence: extractSection(reportText, 'EMOTIONAL SEQUENCE'),
      restorationTrigger: extractSection(reportText, 'RESTORATION TRIGGER'),
      retrievalInstruction: extractSection(reportText, 'RETRIEVAL INSTRUCTION'),
      contextTimestamp: extractSection(reportText, 'CONTEXT TIMESTAMP'),
      feedbackSignal: extractSection(reportText, 'FEEDBACK SIGNAL'),
      responseStyleSuggestion: extractSection(reportText, 'RESPONSE STYLE SUGGESTION'),
      userStyleIndicator: extractSection(reportText, 'USER STYLE INDICATOR'),
      nextMemoryLabel: extractSection(reportText, 'NEXT MEMORY LABEL'),
      continuationContext: extractSection(reportText, 'CONTINUATION CONTEXT'),
      contextVariationHint: extractSection(reportText, 'CONTEXT VARIATION HINT'),
      aiSelfModulationTip: extractSection(reportText, 'AI SELF-MODULATION TIP'),
      responseDirectionOptions: extractSection(reportText, 'RESPONSE DIRECTION OPTIONS'),
      reportGenerated: extractSection(reportText, 'REPORT GENERATED USING'),
      code: code
    };

    return NextResponse.json({ report: reportData });
  } catch (error: Error | unknown) {
    console.error('리콜키 생성 오류:', error);
    return NextResponse.json(
      { error: '리콜키 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 

// Edge Function으로 변경하여 더 긴 실행 시간 제공
export const config = {
  runtime: 'edge',
}; 