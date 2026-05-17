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
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [prompt, setPrompt] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);

  return (
    <ChatContext.Provider value={{ prompt, setPrompt, isSubmitted, setIsSubmitted, messages, setMessages }}>
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
