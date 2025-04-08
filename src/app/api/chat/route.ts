import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Message } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages, reportImageUrl } = await req.json();
    
    // 기본 메시지 구성
    const apiMessages = [
      {
        role: 'system',
        content: '당신은 도움이 되는 친절한 AI 어시스턴트입니다. 사용자의 질문에 명확하고 정확하게 답변해 주세요.'
      }
    ];
    
    // 리포트 이미지가 있는 경우 시스템 메시지에 이미지 추가
    if (reportImageUrl) {
      apiMessages[0] = {
        role: 'system',
        content: [
          {
            type: 'text',
            text: '당신은 도움이 되는 친절한 AI 어시스턴트입니다. 다음 이미지는 이전 대화 내용을 담은 리포트입니다. 이 내용을 기반으로 대화를 이어가세요.'
          },
          {
            type: 'image_url',
            image_url: {
              url: reportImageUrl
            }
          }
        ]
      } as any;
    }
    
    // 사용자 메시지 추가
    messages.forEach((msg: Message) => {
      apiMessages.push({
        role: msg.role,
        content: msg.content
      });
    });
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: apiMessages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      temperature: 0.7,
      max_tokens: 1000
    });
    
    const response = completion.choices[0].message;
    
    return NextResponse.json({ message: response });
  } catch (error: Error | unknown) {
    console.error('API 오류:', error);
    return NextResponse.json(
      { error: '요청 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 