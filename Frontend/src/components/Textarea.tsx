import { useCallback, useEffect, useRef, useState } from 'react';

import micIcon from '../../Assets/Icons/mic.svg';
import sendIcon from '../../Assets/Icons/send.svg';
import muteIcon from '../../Assets/Icons/mute.svg';
import { useChat } from '../context/ChatContext';

const MAX_HEIGHT = 144;

interface TextareaProps {
  isStreaming?: boolean;
  onStop?: () => void;
}

const Textarea = ({ isStreaming, onStop }: TextareaProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const initialTextRef = useRef<string>('');

  const { prompt, setPrompt, setIsSubmitted } = useChat();
  const [isListening, setIsListening] = useState(false);

  const hasPrompt = prompt.trim().length > 0;

  // Auto-resize textarea
  const handleInput = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
    el.style.overflowY = el.scrollHeight > MAX_HEIGHT ? 'auto' : 'hidden';
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const startListening = useCallback(async () => {
    const SpeechRecognitionAPI =
      window.SpeechRecognition ?? (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      alert('Your browser does not support built-in Speech Recognition.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const recognition: SpeechRecognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;

      // Snapshot current text before listening starts
      initialTextRef.current = prompt.trim();

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        const base = initialTextRef.current;
        setPrompt(base ? `${base} ${transcript}` : transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
        stream.getTracks().forEach((t) => t.stop());
      };

      recognition.onend = () => {
        setIsListening(false);
        stream.getTracks().forEach((t) => t.stop());
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    } catch {
      setIsListening(false);
    }
  }, [prompt]);

  const handleSend = useCallback(() => {
    if (!hasPrompt) return;
    setIsSubmitted(true);
  }, [hasPrompt, prompt, setIsSubmitted]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!isStreaming) handleSend();
      }
    },
    [handleSend, isStreaming]
  );

  // Cleanup recognition on unmount
  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isStreaming && onStop) {
        onStop();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isStreaming, onStop]);

  return (
    <div
      style={{
        padding: '12px 16px',
        boxShadow:
          '0 859px 240px 0 rgba(0,0,0,.00),0 550px 220px 0 rgba(0,0,0,.00),0 309px 185px 0 rgba(0,0,0,.01),0 137px 137px 0 rgba(0,0,0,.02),0 34px 76px 0 rgba(0,0,0,.02)',
      }}
      className="flex items-center gap-2 z-100 bg-white border border-[#dedede] rounded-[28px] transition-all focus-within:border-black focus-within:ring-2 focus-within:ring-black/10 focus-visible:ring-offset-10"
    >
      {isListening ? (
        <>
          <div className="flex items-center gap-4 flex-1 px-2 min-h-[24px] max-h-[144px]">
            <span className="text-sm text-(--primary-text)">Listening...</span>
            <div className="flex items-center gap-[3px] h-[24px]">
              {Array.from({ length: 24 }, (_, i) => (
                <span
                  key={i}
                  className="w-[3px] rounded-full bg-[#899CF8] animate-pulse"
                  style={{
                    height: `${10 + ((i * 7) % 18)}px`,
                    animationDelay: `${i * 0.05}s`,
                    animationDuration: '0.9s',
                  }}
                />
              ))}
            </div>
          </div>

          <button
            type="button"
            aria-label="Stop voice input"
            title="Stop voice input"
            onClick={stopListening}
            className="w-[36px] h-[36px] shrink-0 flex items-center justify-center rounded-full cursor-pointer opacity-80 hover:opacity-100 hover:bg-[#F0F0F0] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
          >
            <img src={muteIcon} alt="" aria-hidden="true" className="w-[18px] h-[18px]" />
          </button>
        </>
      ) : (
        <>
          <textarea
            disabled={isStreaming}
            ref={textareaRef}
            rows={1}
            value={prompt}
            placeholder="Ask Anything..."
            aria-label="Prompt input"
            aria-multiline="true"
            onChange={(e) => setPrompt(e.target.value)}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            className="flex-1 p-2 text-sm bg-transparent outline-none resize-none text-(--primary-text) placeholder-(--primary-text) leading-[24px] min-h-[24px] max-h-[144px] py-[6px] px-2 overflow-y-auto scrollbar-thin wrap-break-words"
          />

          <button
            type="button"
            aria-label={isStreaming ? 'Stop streaming' : hasPrompt ? 'Send message' : 'Start voice input'}
            title={isStreaming ? 'Stop streaming' : hasPrompt ? 'Send message' : 'Start voice input'}
            onClick={isStreaming ? onStop : hasPrompt ? handleSend : startListening}
            className={`w-[36px] h-[36px] shrink-0 flex items-center justify-center rounded-full cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 ${isStreaming ? 'bg-red-500 text-white' : hasPrompt ? 'bg-black text-white' : 'opacity-80 hover:opacity-100 hover:bg-[#F0F0F0]'}`}
          >
            {isStreaming ? (
              <div className="w-[14px] h-[14px] bg-white rounded-[2px]" />
            ) : (
              <img
                src={hasPrompt ? sendIcon : micIcon}
                alt="button"
                aria-hidden="true"
                className="w-[18px] h-[18px]"
              />
            )}
          </button>
        </>
      )}
    </div>
  );
};

export default Textarea;