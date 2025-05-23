'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Message, ChatHistory, ReportData } from '@/types';
import { generateReportCode } from '@/utils/report';
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import CodeInput from '@/components/CodeInput';
import ReportViewer from '@/components/ReportViewer';
import { FiSave, FiCopy } from 'react-icons/fi';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);
  const [reportCode, setReportCode] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showCodeSuccess, setShowCodeSuccess] = useState(false);
  const [shouldGenerateImage, setShouldGenerateImage] = useState(false);
  const [savedCode, setSavedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  // 메시지가 추가될 때마다 스크롤을 맨 아래로 이동
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 메시지 전송 및 응답 처리
  const handleSendMessage = async (content: string) => {
    // 안내 메시지 닫기
    setShowIntro(false);
    
    // SSY 코드 형식 처리
    if (content.match(/^(SSY)-\d{8}-\d{6}$/)) {
      handleCodeSubmit(content);
      return;
    }

    // 사용자 메시지 추가
    const userMessage: Message = { role: 'user', content };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // 이미지 URL을 가져옵니다 (코드가 유효한 경우)
      let reportImageUrl = null;
      if (reportCode) {
        try {
          const response = await fetch(`/api/storage?code=${reportCode}`);
          if (response.ok) {
            const data = await response.json();
            reportImageUrl = data.imageUrl;
          }
        } catch (error) {
          console.error('리포트 이미지 URL 가져오기 오류:', error);
          // 이미지 URL을 가져오는 데 실패해도 계속 진행
        }
      }

      // 채팅 API 호출
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          messages: [...messages, userMessage],
          reportImageUrl: reportImageUrl  // 리포트 이미지 URL 포함
        }),
      });

      if (!response.ok) {
        throw new Error('API 호출 실패');
      }

      const data = await response.json();
      
      // 응답 추가
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message.content || '죄송합니다, 응답을 생성하는 데 문제가 발생했습니다.'
      };

      // 메시지 배열 업데이트
      const updatedMessages = [...messages, userMessage, assistantMessage];
      setMessages(updatedMessages);

      // 리콜키 생성 - 백그라운드에서 비동기적으로 처리
      const newReportCode = reportCode || generateReportCode();
      setReportCode(newReportCode);
      
      // 상태 업데이트 후 실제 메시지 목록을 전달하도록 수정
      const updatedHistory: ChatHistory = {
        messages: updatedMessages,
        code: newReportCode
      };

      console.log(`리포트 생성 요청: ${updatedMessages.length}개 메시지, 코드: ${newReportCode}`);

      // 리콜키 API 호출을 백그라운드에서 비동기적으로 처리
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

  // 백그라운드에서 리콜키 생성 처리
  const generateReportInBackground = async (history: ChatHistory) => {
    try {
      // 리콜키 API 호출
      const reportResponse = await fetch('/api/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ history }),
      });

      if (!reportResponse.ok) {
        console.error('리콜키 API 호출 실패:', reportResponse.status);
        // 사용자에게 리콜키 생성 실패 알림 추가
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: '리콜키 생성에 실패했습니다. 관리자에게 문의하거나 다시 시도해 주세요.'
          }
        ]);
        return;
      }

      const reportData = await reportResponse.json();
      
      // 응답 검증: 리포트 데이터가 올바르게 생성되었는지 확인
      if (!reportData.report || Object.keys(reportData.report).length === 0) {
        console.error('리콜키 응답 데이터 오류: 빈 리포트 객체');
        return;
      }
      
      // 디버깅: 첫 번째 필드가 비어있는지 확인
      const hasContent = reportData.report.flow && reportData.report.flow.length > 0;
      console.log(`리콜키 생성 완료, 내용 포함: ${hasContent}`);
      
      setReport(reportData.report);
    } catch (error) {
      console.error('리콜키 생성 백그라운드 처리 오류:', error);
      // 사용자 경험에 영향을 주지 않도록 오류 처리만 하고 계속 진행
    }
  };

  // 코드로 이전 대화 불러오기
  const handleCodeSubmit = async (code: string) => {
    setShowIntro(false);
    setIsLoading(true);
    try {
      // 유효한 SSY 코드 형식인지 확인
      if (!code.match(/^SSY-\d{8}-\d{6}$/)) {
        throw new Error('유효하지 않은 코드 형식입니다. SSY-YYYYMMDD-HHMMSS 형식이어야 합니다.');
      }
      
      // Storage API 호출 - 코드가 유효한지 확인하고 이미지 URL 받아오기
      const response = await fetch(`/api/storage?code=${code}`);
      
      if (!response.ok) {
        throw new Error('코드가 유효하지 않습니다.');
      }
      
      const data = await response.json();
      
      // 코드가 유효한 경우, 해당 이미지를 포함하여 초기 대화 시작
      setReportCode(code);
      setShowCodeSuccess(true);
      
      // 이미지 URL이 있다면 이를 사용하여 대화 시작
      if (data.imageUrl) {
        // 리콜키 이미지를 포함한 초기 메시지 추가
        setMessages([
          {
            role: 'system',
            content: `리콜키 코드 ${code}를 사용해 대화를 계속합니다.`
          },
          {
            role: 'assistant',
            content: `안녕하세요! 리콜키 코드 ${code}로 이전 대화 컨텍스트를 불러왔습니다. 대화를 계속할 수 있습니다.`
          }
        ]);
      } else {
        // 이미지 URL이 없는 경우 - 단순 코드만 설정
        setMessages([
          {
            role: 'assistant',
            content: `리콜키 코드 ${code}가 확인되었습니다. 대화를 시작할 수 있습니다.`
          }
        ]);
      }
      
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
          content: error instanceof Error ? error.message : '유효하지 않은 코드입니다. 올바른 코드를 입력해 주세요.'
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
    setShouldGenerateImage(true); // 이미지 생성 트리거
    
    // 코드를 바로 표시
    setSavedCode(code);
    setTimeout(() => {
      setSavedCode(null);
    }, 3000);
  };

  // 클립보드에 코드 복사
  const handleCopyCode = () => {
    if (reportCode) {
      navigator.clipboard.writeText(reportCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
      
      // 코드 사용 - 저장 성공 메시지에 표시
      setSavedCode(data.code);
      console.log('리콜키 이미지 업로드 완료:', data.code);
      setShouldGenerateImage(false); // 이미지 생성 완료 후 플래그 리셋
      
      setTimeout(() => {
        setSavedCode(null); // 저장 성공 메시지 3초 후 제거
      }, 3000);
    } catch (error) {
      console.error('리콜키 이미지 처리 오류:', error);
      setShouldGenerateImage(false); // 오류 발생 시에도 플래그 리셋
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8">
      <div className="w-full max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-4 md:p-8">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">AI 대화 기억 흐름 저장&복원</h1>

          {/* 코드 입력 */}
          <CodeInput onSubmit={handleCodeSubmit} isLoading={isLoading} />

          {/* 코드 성공 메시지 */}
          {showCodeSuccess && (
            <div className="bg-green-100 text-green-700 p-3 rounded-md mb-4 text-center">
              코드를 성공적으로 불러왔습니다. 이전 대화를 이어서 진행하세요.
            </div>
          )}

          {/* 리콜키 코드 표시 */}
          {reportCode && (
            <div className="bg-gray-100 p-4 mb-6 rounded-lg relative">
              <div className="flex justify-between items-center">
                <div className="flex-grow">
                  <p className="text-sm text-gray-600 mb-1">대화 리콜키 코드:</p>
                  <div className="flex items-center">
                    <p className="font-mono text-lg font-semibold">{reportCode}</p>
                    <button
                      onClick={handleCopyCode}
                      className="ml-2 p-1 text-gray-500 hover:text-blue-500"
                      title="코드 복사"
                    >
                      <FiCopy size={16} />
                    </button>
                    {copied && <span className="text-xs text-green-600 ml-2">복사됨!</span>}
                  </div>
                </div>
                <button 
                  onClick={handleGenerateCode}
                  className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 flex items-center ml-4"
                  disabled={messages.length === 0}
                >
                  <FiSave className="mr-2" />
                  코드 발행하기
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                코드 발행하기 버튼을 클릭하면 현재 대화를 저장하고 리콜키 코드를 발급받을 수 있습니다.
              </p>
              
              {/* 저장 성공 메시지 */}
              {savedCode && (
                <div className="mt-2 p-2 bg-green-100 text-green-700 rounded-md text-sm">
                  <span className="font-mono">{savedCode}</span> 코드로 대화가 저장되었습니다.
                </div>
              )}
            </div>
          )}

          {/* 채팅 메시지 목록 */}
          <div className="bg-gray-50 p-4 rounded-lg h-[50vh] overflow-y-auto mb-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-4">
                {showIntro ? (
                  <div className="p-4 border-l-4 border-blue-500 bg-blue-50 text-left">
                    <p className="text-sm">이 대화는 자동 저장되지 않습니다.복원 코드를 발급하면 언제든 흐름을 이어쓸 수 있습니다.</p>
                    <p className="text-sm mt-3">코드는 ■로그인 없이■ 복원되며, 링크, QR, 클립보드 복사, 텍스트 삽입 등 다양한 방식으로 공유할 수 있습니다.</p>
                    <p className="text-sm mt-3">Claude, GPT 등 외부 AI에는 OCR 이미지 리포트 또는 텍스트 요약을 통해 대화 흐름이 간접 전달될 수 있습니다.</p>
                    <p className="text-sm mt-3">※ 본 시스템은 특허 출원된 구조이며, GPT, Claude 등은 각 사의 등록 상표입니다.</p>

                  </div>
                ) : (
                  <p className="mt-16">새로운 대화를 시작하거나 이전 대화 코드를 입력하세요.</p>
                )}
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

      {/* 리콜키 뷰어 (숨김 처리) */}
      {report && <ReportViewer report={report} onImageGenerated={handleImageGenerated} />}
    </main>
  );
} 