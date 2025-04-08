import React, { useState, KeyboardEvent } from 'react';
import { FiSend } from 'react-icons/fi';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  isLoading,
  placeholder = '메시지를 입력하세요...'
}) => {
  const [input, setInput] = useState('');

  const handleSubmit = () => {
    const trimmedInput = input.trim();
    if (trimmedInput && !isLoading) {
      onSend(trimmedInput);
      setInput('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex items-center border border-gray-300 rounded-lg p-2 bg-white">
      <textarea
        className="flex-grow resize-none focus:outline-none h-10 py-2 px-3"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isLoading}
        rows={1}
      />
      <button
        onClick={handleSubmit}
        disabled={isLoading || !input.trim()}
        className={`p-2 rounded-full ${
          isLoading || !input.trim() ? 'text-gray-400' : 'text-blue-500 hover:bg-blue-50'
        }`}
      >
        <FiSend size={20} />
      </button>
    </div>
  );
};

export default ChatInput; 