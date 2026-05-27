import { createContext, useContext, useState, type ReactNode } from 'react';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  isError?: boolean;
}

interface ChatContextType {
  prompt: string;
  setPrompt: (prompt: string) => void;
  isSubmitted: boolean;
  setIsSubmitted: (isSubmitted: boolean) => void;
  messages: Message[];
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  showDiff: boolean;
  setShowDiff: (showDiff: boolean) => void;
  diffResult: any;
  setDiffResult: (result: any) => void;
  currentInferencingEngine: 'ollama' | 'vllm';
  setCurrentInferencingEngine: (engine: 'ollama' | 'vllm') => void;
  isStreaming: boolean;
  setIsStreaming: (isStreaming: boolean) => void;
  tokenCount: number;
  setTokenCount: (tokenCount: number) => void;
  tokensPerSecond: number;
  setTokensPerSecond: (tokensPerSecond: number) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [prompt, setPrompt] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showDiff, setShowDiff] = useState<boolean>(false);
  const [diffResult, setDiffResult] = useState<any>(null);
  const [currentInferencingEngine, setCurrentInferencingEngine] = useState<'ollama' | 'vllm'>('ollama');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [tokenCount, setTokenCount] = useState<number>(0);
  const [tokensPerSecond, setTokensPerSecond] = useState<number>(0);

  return (
    <ChatContext.Provider
      value={{
        prompt,
        setPrompt,
        isSubmitted,
        setIsSubmitted,
        messages,
        setMessages,
        showDiff,
        setShowDiff,
        diffResult,
        setDiffResult,
        currentInferencingEngine,
        setCurrentInferencingEngine,
        isStreaming,
        setIsStreaming,
        tokenCount,
        setTokenCount,
        tokensPerSecond,
        setTokensPerSecond,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
