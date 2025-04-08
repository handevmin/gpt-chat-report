'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Message, ChatHistory, ReportData } from '@/types';
import { generateReportCode } from '@/utils/report';
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import CodeInput from '@/components/CodeInput';
import ReportViewer from '@/components/ReportViewer';
import { FiSave } from 'react-icons/fi';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);
  const [reportCode, setReportCode] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showCodeSuccess, setShowCodeSuccess] = useState(false);
  const [shouldGenerateImage, setShouldGenerateImage] = useState(false);
  const [savedCode, setSavedCode] = useState<string | null>(null);

  // 메시지가 추가될 때마다 스크롤을 맨 아래로 이동
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // GPT에 메시지 전송 및 응답 처리
  const handleSendMessage = async (content: string) => {
    // 코드가 입력된 경우 기존 대화 불러오기
    if (content.match(/^EMV-\d{8}-\d{6}$/)) {
      handleCodeSubmit(content);
      return;
    }

    // 사용자 메시지 추가
    const userMessage: Message = { role: 'user', content };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // 채팅 API 호출 (리포트 이미지 URL이 있는 경우 함께 전송)
      const reportImageUrl = reportCode ? await getReportImageUrl(reportCode) : null;
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          messages: [...messages, userMessage],
          reportImageUrl
        }),
      });

      if (!response.ok) {
        throw new Error('API 호출 실패');
      }

      const data = await response.json();
      
      // AI 응답 추가
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message.content || '죄송합니다, 응답을 생성하는 데 문제가 발생했습니다.'
      };

      setMessages(prev => [...prev, assistantMessage]);

      // 리포트 생성 - 백그라운드에서 비동기적으로 처리
      const newReportCode = reportCode || generateReportCode();
      setReportCode(newReportCode);
      
      // 사용자 경험에 영향을 주지 않도록 리포트 API 호출을 비동기로 처리
      const updatedHistory: ChatHistory = {
        messages: [...messages, userMessage, assistantMessage],
        code: newReportCode
      };

      // 리포트 API 호출을 백그라운드에서 비동기적으로 처리 (await 없음)
      generateReportInBackground(updatedHistory);

    } catch (error) {
      console.error('메시지 처리 오류:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: '죄송합니다, 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // 백그라운드에서 리포트 생성 처리
  const generateReportInBackground = async (history: ChatHistory) => {
    try {
      // 리포트 API 호출
      const reportResponse = await fetch('/api/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ history }),
      });

      if (!reportResponse.ok) {
        console.error('리포트 API 호출 실패:', reportResponse.status);
        return;
      }

      const reportData = await reportResponse.json();
      setReport(reportData.report);
    } catch (error) {
      console.error('리포트 생성 백그라운드 처리 오류:', error);
      // 사용자 경험에 영향을 주지 않도록 오류 처리만 하고 계속 진행
    }
  };

  // 코드로 이전 대화 불러오기
  const handleCodeSubmit = async (code: string) => {
    setIsLoading(true);
    try {
      // Storage API 호출
      const response = await fetch(`/api/storage?code=${code}`);
      
      if (!response.ok) {
        throw new Error('이미지를 찾을 수 없습니다.');
      }
      
      const data = await response.json();
      
      // 코드가 유효한 경우 리포트 코드 설정
      setReportCode(code);
      setShowCodeSuccess(true);
      
      // 사용자에게 메시지 없이 코드 로드 성공 표시
      setMessages([]);
      
      // 성공 메시지 표시 후 3초 후 자동으로 사라짐
      setTimeout(() => {
        setShowCodeSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('코드 처리 오류:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: '유효하지 않은 코드입니다. 올바른 코드를 입력해 주세요.'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // 코드 발행 버튼 클릭 시 처리
  const handleGenerateCode = () => {
    // 메시지가 없으면 코드 발행 불가
    if (messages.length === 0) return;
    
    // 이미 코드가 있으면 해당 코드 사용, 없으면 새로 생성
    const code = reportCode || generateReportCode();
    setReportCode(code);
    setSavedCode(code); // 저장된 코드 표시용
    setShouldGenerateImage(true); // 이미지 생성 트리거
    
    setTimeout(() => {
      setSavedCode(null); // 저장 성공 메시지 3초 후 제거
    }, 3000);
  };

  // 리포트 이미지 URL 가져오기 함수
  const getReportImageUrl = async (code: string): Promise<string | null> => {
    try {
      const response = await fetch(`/api/storage?code=${code}`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('이미지 URL 가져오기 오류:', error);
      return null;
    }
  };

  // HTML을 이미지로 변환하고 Firebase에 업로드
  const handleImageGenerated = async (dataUrl: string, code: string) => {
    // shouldGenerateImage가 true일 때만 이미지 저장
    if (!shouldGenerateImage) return;
    
    try {
      // Storage API 호출
      const response = await fetch('/api/storage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dataUrl, code }),
      });

      if (!response.ok) {
        throw new Error('이미지 업로드 실패');
      }

      const data = await response.json();
      console.log('리포트 이미지 업로드 완료:', data.url);
      setShouldGenerateImage(false); // 이미지 생성 완료 후 플래그 리셋
    } catch (error) {
      console.error('리포트 이미지 처리 오류:', error);
      setShouldGenerateImage(false); // 오류 발생 시에도 플래그 리셋
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8">
      <div className="w-full max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-4 md:p-8">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">GPT 대화 리포트 생성기</h1>

          {/* 코드 입력 */}
          <CodeInput onSubmit={handleCodeSubmit} isLoading={isLoading} />

          {/* 코드 성공 메시지 */}
          {showCodeSuccess && (
            <div className="bg-green-100 text-green-700 p-3 rounded-md mb-4 text-center">
              코드를 성공적으로 불러왔습니다. 이전 대화를 이어서 진행하세요.
            </div>
          )}

          {/* 리포트 코드 표시 */}
          {reportCode && (
            <div className="bg-gray-100 p-4 mb-6 rounded-lg relative">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600 mb-1">대화 리포트 코드:</p>
                  <p className="font-mono text-lg font-semibold">{reportCode}</p>
                </div>
                <button 
                  onClick={handleGenerateCode}
                  className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 flex items-center"
                  disabled={messages.length === 0}
                >
                  <FiSave className="mr-2" />
                  코드 발행하기
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                코드 발행하기 버튼을 클릭하면 현재 대화를 저장하고 코드를 발급받을 수 있습니다.
              </p>
              
              {/* 저장 성공 메시지 */}
              {savedCode && (
                <div className="mt-2 p-2 bg-green-100 text-green-700 rounded-md text-sm">
                  코드 {savedCode}로 대화가 저장되었습니다.
                </div>
              )}
            </div>
          )}

          {/* 채팅 메시지 목록 */}
          <div className="bg-gray-50 p-4 rounded-lg h-[50vh] overflow-y-auto mb-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-20">
                <p>새로운 대화를 시작하거나 이전 대화 코드를 입력하세요.</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <ChatMessage key={index} message={message} />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 채팅 입력 */}
          <ChatInput 
            onSend={handleSendMessage} 
            isLoading={isLoading} 
            placeholder={isLoading ? "답변을 생성하는 중..." : "메시지를 입력하세요..."}
          />
        </div>
      </div>

      {/* 리포트 뷰어 (숨김 처리) */}
      {report && <ReportViewer report={report} onImageGenerated={handleImageGenerated} />}
    </main>
  );
}