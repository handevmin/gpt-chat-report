import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Message } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    
    // OpenAI API 형식으로 변환
    const apiMessages = [
      {
        role: 'system',
        content: '당신은 도움이 되는 친절한 AI 어시스턴트입니다. 사용자의 질문에 명확하고 정확하게 답변해 주세요.'
      }
    ];
    
    // 기존 메시지를 API 형식으로 변환
    messages.forEach((msg: Message) => {
      apiMessages.push({
        role: msg.role,
        content: msg.content
      });
    });
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: apiMessages as any,
      temperature: 0.7,
      max_tokens: 1000
    });
    
    const response = completion.choices[0].message;
    
    return NextResponse.json({ message: response });
  } catch (error: any) {
    console.error('API 오류:', error);
    return NextResponse.json(
      { error: '요청 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 