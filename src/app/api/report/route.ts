import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { format } from 'date-fns';
import { ChatHistory, ReportData, Message } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 리콜키(Recall key) 코드 생성 함수
function generateReportCode(): string {
  const prefix = 'SSY-';
  const date = format(new Date(), 'yyyyMMdd-HHmmss');
  return `${prefix}${date}`;
}

// 리콜키 텍스트에서 섹션 추출
function extractSection(text: string, sectionName: string): string {
  // 엄격한 패턴에서 더 유연한 패턴으로 변경
  const regex = new RegExp(`${sectionName}[\\s]*[:\\-—–]*[\\s]*(.*?)(?=\\d+\\.[\\s]*[A-Z]|NOTE:|CONTEXT ID:|$)`, 's');
  const match = text.match(regex);
  
  // 디버깅을 위한 로그 추가
  console.log(`Extracting section ${sectionName}, match found: ${match !== null}`);
  
  if (match && match[1]) {
    const result = match[1].trim();
    console.log(`Section ${sectionName} content length: ${result.length}`);
    return result;
  }
  
  // 첫 번째 정규식이 실패한 경우 더 간단한 패턴으로 다시 시도
  console.log(`Trying simpler pattern for section ${sectionName}`);
  const simpleRegex = new RegExp(`${sectionName}[^\\n]*\\n+([\\s\\S]*?)(?=\\d+\\.|$)`, 's');
  const simpleMatch = text.match(simpleRegex);
  
  if (simpleMatch && simpleMatch[1]) {
    const result = simpleMatch[1].trim();
    console.log(`Simple pattern match found for ${sectionName}, length: ${result.length}`);
    return result;
  }
  
  return '';
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
        content: `[INSTRUCTION TO GPT SYSTEM]:

You are a memory report generator embedded in a multi-LLM interface.  
Based on the entire conversation with the user, automatically generate a structured recall report.  
This report must be optimized for OCR-based recognition by external language models such as Claude, Gemini, and LLaMA3.  
The user's language will vary, so detect and preserve the **user's original language** in the report contents.  
However, **all section titles must be in English** to ensure consistent OCR parsing.  

Ensure all sections are double-line spaced and clearly labeled to enhance OCR recognition.

Generate the following 16 sections, in this order:

1. FLOW — Full narrative: beginning → middle → emotional transition → summary  
2. CORE EXPRESSIONS — User's key phrases or emotional sentences  
3. EMOTIONAL SEQUENCE — Ordered list of emotional transitions  
4. RESTORATION TRIGGER — Simple resumption sentence + memory code (OCR-friendly)  
5. RETRIEVAL INSTRUCTION — How to resume this conversation with external LLMs  
6. CONTEXT TIMESTAMP — Timestamp of the session  
7. FEEDBACK SIGNAL — User's emotional responses, hesitations, or emphasis  
8. RESPONSE STYLE SUGGESTION — Tone suggestion for continuing the response  
9. USER STYLE INDICATOR — Markers showing user tone or pacing preference  
10. NEXT MEMORY LABEL — Label for the next flow or checkpoint  
11. CONTINUATION CONTEXT — What should follow this memory flow  
12. CONTEXT VARIATION HINT — Alternative direction suggestion (if any)  
13. AI SELF-MODULATION TIP — Tip for Claude/Gemini to adapt style and tone  
14. RESPONSE DIRECTION OPTIONS — 2~3 options for next response direction  
15. REPORT GENERATED USING — Indicate GPT-based RecallKey system  
16. NOTE — Instructions for Claude/Gemini on how to OCR and resume the memory

NOTE:  
This report is designed to be OCR-readable by external LLMs (Claude, Gemini, etc).  
It includes structured flow data and a restoration trigger.  
However, any conversations occurring outside this GPT chatbot will not be stored.  
To preserve your memory, return to this chatbot and input the provided memory code.

IMPORTANT: YOU MUST FORMAT YOUR ENTIRE RESPONSE EXACTLY AS SHOWN BELOW, INCLUDING ALL 16 NUMBERED SECTIONS:

1. FLOW:
[Your content for flow section]

2. CORE EXPRESSIONS:
[Your content for core expressions]

3. EMOTIONAL SEQUENCE:
[Your content for emotional sequence]

... and so on for all 16 sections ...

CONTEXT ID:  
${code}`
      }
    ];
    
    // 기존 메시지를 OpenAI API 형식으로 변환
    recentMessages.forEach((msg: Message) => {
      apiMessages.push({
        role: msg.role,
        content: msg.content
      });
    });

    // 디버깅: 메시지 개수 및 내용 로깅
    console.log(`API 호출: 총 ${apiMessages.length}개 메시지, 사용자 메시지 ${recentMessages.length}개`);
    
    // 첫 번째와 마지막 메시지 내용 확인 (민감 정보는 줄임)
    if (recentMessages.length > 0) {
      console.log(`첫 번째 메시지 (${recentMessages[0].role}): ${recentMessages[0].content.substring(0, 50)}...`);
      console.log(`마지막 메시지 (${recentMessages[recentMessages.length-1].role}): ${recentMessages[recentMessages.length-1].content.substring(0, 50)}...`);
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: apiMessages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      temperature: 0.2,
      max_tokens: 2500,
      frequency_penalty: 0.5,
      presence_penalty: 0.5
    });

    const reportText = completion.choices[0].message.content || '';
    
    // 디버깅: 전체 응답 텍스트 로깅 (처음 200자만)
    console.log(`OpenAI API 응답 (처음 200자): ${reportText.substring(0, 200)}...`);
    console.log(`응답 전체 길이: ${reportText.length} 문자`);
    
    // 응답에 필수 섹션이 포함되어 있는지 확인
    const containsFlowSection = reportText.includes('1. FLOW');
    const containsCoreSection = reportText.includes('2. CORE EXPRESSIONS');
    console.log(`응답에 섹션 포함: FLOW=${containsFlowSection}, CORE=${containsCoreSection}`);
    
    // 응답 텍스트 - 포맷이 적절하지 않은 경우, 응답 텍스트를 적절한 포맷으로 변환
    let formattedReportText = reportText;
    
    // 섹션이 누락된 경우 수동으로 포맷된 보고서 생성
    if (!containsFlowSection || !containsCoreSection) {
      console.warn('경고: API 응답이 올바른 형식이 아닙니다. 수동 템플릿 생성 중...');
      
      // 응답 텍스트에서 실제 대화 내용 추출 (첫 200자만 사용)
      const actualContent = reportText.substring(0, Math.min(reportText.length, 200)).trim();
      
      // 수동으로 템플릿 생성
      formattedReportText = `
1. FLOW:
${actualContent.length > 0 ? actualContent : '대화가 더 필요합니다.'}

2. CORE EXPRESSIONS:
사용자가 대화를 시작했습니다.

3. EMOTIONAL SEQUENCE:
대화가 진행 중입니다.

4. RESTORATION TRIGGER:
이전 대화를 계속합니다. (${code})

5. RETRIEVAL INSTRUCTION:
이 코드를 사용하여 대화를 복원하세요.

6. CONTEXT TIMESTAMP:
${code}

7. FEEDBACK SIGNAL:
사용자의 응답을 기다리는 중입니다.

8. RESPONSE STYLE SUGGESTION:
친절하고 정보를 제공하는 톤으로 응답합니다.

9. USER STYLE INDICATOR:
사용자는 간결한 정보를 선호합니다.

10. NEXT MEMORY LABEL:
현재 대화 계속

11. CONTINUATION CONTEXT:
사용자의 다음 질문에 답변할 준비가 되어 있습니다.

12. CONTEXT VARIATION HINT:
대화의 다음 방향에 유연하게 대응합니다.

13. AI SELF-MODULATION TIP:
사용자의 관심사에 맞춰 응답을 조정합니다.

14. RESPONSE DIRECTION OPTIONS:
추가 정보 제공 또는 질문에 응답

15. REPORT GENERATED USING:
RecallKey v1.0

16. NOTE:
이 리콜키는 대화의 연속성을 위해 설계되었습니다. 코드를 이용해 대화를 복원할 수 있습니다.
      `;
      
      console.log('수동 템플릿 생성 완료');
    }
    
    // 리콜키 텍스트 파싱 - 수정된 텍스트 사용
    const reportData: ReportData = {
      flow: extractSection(formattedReportText, '1\\. FLOW'),
      coreExpressions: extractSection(formattedReportText, '2\\. CORE EXPRESSIONS'),
      emotionalSequence: extractSection(formattedReportText, '3\\. EMOTIONAL SEQUENCE'),
      restorationTrigger: extractSection(formattedReportText, '4\\. RESTORATION TRIGGER'),
      retrievalInstruction: extractSection(formattedReportText, '5\\. RETRIEVAL INSTRUCTION'),
      contextTimestamp: extractSection(formattedReportText, '6\\. CONTEXT TIMESTAMP') || code,
      feedbackSignal: extractSection(formattedReportText, '7\\. FEEDBACK SIGNAL'),
      responseStyleSuggestion: extractSection(formattedReportText, '8\\. RESPONSE STYLE SUGGESTION'),
      userStyleIndicator: extractSection(formattedReportText, '9\\. USER STYLE INDICATOR'),
      nextMemoryLabel: extractSection(formattedReportText, '10\\. NEXT MEMORY LABEL'),
      continuationContext: extractSection(formattedReportText, '11\\. CONTINUATION CONTEXT'),
      contextVariationHint: extractSection(formattedReportText, '12\\. CONTEXT VARIATION HINT'),
      aiSelfModulationTip: extractSection(formattedReportText, '13\\. AI SELF-MODULATION TIP'),
      responseDirectionOptions: extractSection(formattedReportText, '14\\. RESPONSE DIRECTION OPTIONS'),
      reportGenerated: extractSection(formattedReportText, '15\\. REPORT GENERATED USING'),
      note: extractSection(formattedReportText, '16\\. NOTE'),
      code: code
    };

    // 최종 파싱 결과 검증 및 로깅
    const fieldsWithContent = Object.entries(reportData)
      .filter(([key, value]) => key !== 'code' && typeof value === 'string' && value.length > 0)
      .map(([key]) => key);
    
    console.log(`파싱 성공: ${fieldsWithContent.length}/16 필드에 콘텐츠 있음`);
    console.log(`콘텐츠가 있는 필드: ${fieldsWithContent.join(', ')}`);
    
    // 필수 필드에 콘텐츠가 없으면 경고 로그
    if (!reportData.flow || reportData.flow.length === 0) {
      console.warn('경고: FLOW 필드가 비어 있습니다.');
    }

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