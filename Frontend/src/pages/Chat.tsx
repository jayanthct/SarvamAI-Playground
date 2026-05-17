import { useEffect, useState, useCallback, useRef } from 'react';
import Textarea from '../components/Textarea';
import logo from '../../Assets/Images/logo.svg';
import { useChat } from '../context/ChatContext';
import { mockFetch } from '../lib/mockStream';

const Chat = () => {
  const { prompt, isSubmitted, setIsSubmitted } = useChat();

  const [isStreaming, setIsStreaming] = useState(false);
  const [output, setOutput] = useState('');
  const [tokenCount, setTokenCount] = useState(0);
  const [tokensPerSecond, setTokensPerSecond] = useState(0);

  const abortRef = useRef<AbortController | null>(null);
  const startTimeRef = useRef<number>(0);

  const startStreaming = useCallback(async () => {
    setOutput('');
    setTokenCount(0);
    setTokensPerSecond(0);
    setIsStreaming(true);

    abortRef.current = new AbortController();
    startTimeRef.current = Date.now();

    let localTokenCount = 0;
    let buffer = '';

    try {
      const response: Response = mockFetch('gemma-2b');
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) return;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done || abortRef.current.signal.aborted) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;

            const dataStr = trimmed.replace(/^data:\s*/, '');
            if (dataStr === '[DONE]') break;

            try {
              const parsed = JSON.parse(dataStr);
              const content: string = parsed.choices?.[0]?.delta?.content ?? '';
              if (!content) continue;

              localTokenCount++;

              const elapsed = (Date.now() - startTimeRef.current) / 1000;
              const speed = elapsed > 0
                ? Math.round((localTokenCount / elapsed) * 10) / 10
                : 0;

              // Batch state updates together
              setOutput(prev => prev + content);
              setTokenCount(localTokenCount);
              setTokensPerSecond(speed);

            } catch {
              // malformed chunk — skip
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Stream error:', err);
        }
      } finally {
        reader.releaseLock();
      }

    } catch (error) {
      console.error('Error during streaming:', error);
    } finally {
      setIsStreaming(false);
    }
  }, [prompt]);

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  useEffect(() => {
    if (isSubmitted) {
      startStreaming();
      setIsSubmitted(false);
    }
  }, [isSubmitted, startStreaming, setIsSubmitted]);

  return (
    <main className="grow flex flex-col items-center justify-center p-4 gap-6">

      {/* Logo + greeting — hide once streaming starts */}
      {!output && !isStreaming && (
        <div className="flex flex-col items-center gap-4">
          <img src={logo} alt="sarvam.ai" className="h-20" />
          <div className="flex flex-col justify-center items-center gap-1">
            <p className="font-secondary text-xl text-(--secondary-text)">
              Good Morning, Jayanth
            </p>
            <p className="font-primary text-(--primary-text)">
              What&apos;s on your Mind!
            </p>
          </div>
        </div>
      )}

      {/* {(output || isStreaming) && (
        <div className="w-full max-w-3xl flex flex-col gap-3">

        
      {isStreaming && (
        <div className="flex items-center gap-6 px-1 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>Tokens</span>
            <span className="font-mono font-semibold text-(--primary-text)">
              {tokenCount}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-400" />
            <span>Speed</span>
            <span className="font-mono font-semibold text-(--primary-text)">
              {tokensPerSecond} tok/s
            </span>
          </div>
          <button
            onClick={handleStop}
            className="ml-auto text-xs text-red-500 border border-red-200 rounded-full px-3 py-1 hover:bg-red-50 transition-all"
          >
            Stop
          </button>
        </div>
      )}

      <div className="font-primary text-(--primary-text) leading-relaxed whitespace-pre-wrap">
        {output}
        {isStreaming && (
          <span className="inline-block w-[2px] h-[14px] bg-orange-400 ml-[2px] align-middle animate-pulse" />
        )}
      </div>

      {!isStreaming && output && (
        <p className="text-xs text-gray-400 font-mono">
          {tokenCount} tokens · {tokensPerSecond} tok/s
        </p>
      )}

    </div>
  )
} */}

      {/* Input */}
      <div className="w-full max-w-3xl">
        <Textarea />
      </div>

    </main >
  );
};

export default Chat;
