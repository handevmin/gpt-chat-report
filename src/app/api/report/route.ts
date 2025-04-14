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
  const regex = new RegExp(`${sectionName}[:\\s—]+(.*?)(?=\\d+\\.|NOTE:|CONTEXT ID:|$)`, 's');
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

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: apiMessages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      temperature: 0.7,
      max_tokens: 1500 // 토큰 수 감소
    });

    const reportText = completion.choices[0].message.content || '';
    
    // 리콜키 텍스트 파싱
    const reportData: ReportData = {
      flow: extractSection(reportText, '1\\. FLOW'),
      coreExpressions: extractSection(reportText, '2\\. CORE EXPRESSIONS'),
      emotionalSequence: extractSection(reportText, '3\\. EMOTIONAL SEQUENCE'),
      restorationTrigger: extractSection(reportText, '4\\. RESTORATION TRIGGER'),
      retrievalInstruction: extractSection(reportText, '5\\. RETRIEVAL INSTRUCTION'),
      contextTimestamp: extractSection(reportText, '6\\. CONTEXT TIMESTAMP') || code,
      feedbackSignal: extractSection(reportText, '7\\. FEEDBACK SIGNAL'),
      responseStyleSuggestion: extractSection(reportText, '8\\. RESPONSE STYLE SUGGESTION'),
      userStyleIndicator: extractSection(reportText, '9\\. USER STYLE INDICATOR'),
      nextMemoryLabel: extractSection(reportText, '10\\. NEXT MEMORY LABEL'),
      continuationContext: extractSection(reportText, '11\\. CONTINUATION CONTEXT'),
      contextVariationHint: extractSection(reportText, '12\\. CONTEXT VARIATION HINT'),
      aiSelfModulationTip: extractSection(reportText, '13\\. AI SELF-MODULATION TIP'),
      responseDirectionOptions: extractSection(reportText, '14\\. RESPONSE DIRECTION OPTIONS'),
      reportGenerated: extractSection(reportText, '15\\. REPORT GENERATED USING'),
      note: extractSection(reportText, '16\\. NOTE'),
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