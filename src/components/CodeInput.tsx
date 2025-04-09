import React, { useState } from 'react';
import { FiSearch } from 'react-icons/fi';

interface CodeInputProps {
  onSubmit: (code: string) => void;
  isLoading: boolean;
}

const CodeInput: React.FC<CodeInputProps> = ({ onSubmit, isLoading }) => {
  const [code, setCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim() && !isLoading) {
      onSubmit(code.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-2 mb-6">
      <label htmlFor="code-input" className="text-sm font-medium text-gray-700">
        이전 대화 코드 입력
      </label>
      <div className="flex">
        <input
          id="code-input"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="SSY-YYYYMMDD-HHMMSS 형식"
          className="flex-grow p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !code.trim()}
          className={`px-4 py-2 flex items-center justify-center rounded-r-md ${
            isLoading || !code.trim()
              ? 'bg-gray-300 text-gray-500'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          <FiSearch className="mr-2" />
          불러오기
        </button>
      </div>
    </form>
  );
};

export default CodeInput; 