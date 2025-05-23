import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Message } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages, reportImageUrl } = await req.json();
    
    // 최근 메시지만 사용하여 토큰 제한 완화
    const recentMessages = messages.length > 15 
      ? messages.slice(-15) 
      : messages;
    
    // 기본 메시지 구성
    const apiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: '당신은 도움이 되는 친절한 AI 어시스턴트입니다. 사용자의 질문에 명확하고 간결하게 답변해 주세요.'
      }
    ];
    
    // 리포트 이미지가 있는 경우 시스템 메시지와 이미지 메시지 분리
    if (reportImageUrl) {
      // 일반 시스템 메시지는 그대로 유지
      apiMessages[0] = {
        role: 'system',
        content: '당신은 도움이 되는 친절한 AI 어시스턴트입니다. 리포트 이미지를 보고 대화를 이어가세요.'
      };
      
      // 이미지는 user 역할로 별도 메시지 추가
      apiMessages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: '이것은 리포트 이미지입니다. 이 내용을 기반으로 대화해 주세요.'
          },
          {
            type: 'image_url',
            image_url: {
              url: reportImageUrl
            }
          }
        ]
      });
    }
    
    // 사용자 메시지 추가
    recentMessages.forEach((msg: Message) => {
      apiMessages.push({
        role: msg.role,
        content: msg.content
      });
    });
    
    console.log(`API 호출: 리포트 이미지 ${reportImageUrl ? '있음' : '없음'}, 메시지 ${apiMessages.length}개`);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: apiMessages,
      temperature: 0.7,
      max_tokens: 1500
    });
    
    const response = completion.choices[0].message;
    
    return NextResponse.json({ message: response });
  } catch (error: Error | unknown) {
    console.error('API 오류:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '요청 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// Edge Function으로 변경하여 타임아웃 문제 해결
export const config = {
  runtime: 'edge',
};