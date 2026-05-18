import { useEffect, useState, useCallback, useRef } from 'react';
import Textarea from '../components/Textarea';
import logo from '../../Assets/Images/logo.svg';
import { useChat } from '../context/ChatContext';
import { mockFetch } from '../lib/mockStream';
import arrowDown from '../../Assets/Icons/arrow-down.svg';
import LLMResponse from '../components/LLMResponse';

const Chat = () => {
  const { prompt, setPrompt, isSubmitted, setIsSubmitted, messages, setMessages } = useChat();

  const [isStreaming, setIsStreaming] = useState(false);
  const [tokenCount, setTokenCount] = useState(0);
  const [tokensPerSecond, setTokensPerSecond] = useState(0);
  const [chunks1, setChunks1] = useState('');
  const [chunks2, setChunks2] = useState('');

  const abortRef = useRef<AbortController | null>(null);
  const startTimeRef = useRef<number>(0);

  const startStreaming = useCallback(async () => {
    setTokenCount(0);
    setTokensPerSecond(0);
    setIsStreaming(true);
    setChunks1('');
    setChunks2('');

    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    abortRef.current = new AbortController();
    startTimeRef.current = Date.now();

    let localTokenCount = 0;

    const createStreamHandler = (modelName: string, setChunks: React.Dispatch<React.SetStateAction<string>>) => async () => {
      try {
        const response: Response = mockFetch(modelName);
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) return;

        try {
          let buffer = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done || abortRef.current?.signal.aborted) break;

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

                setChunks(prev => prev + content);

                localTokenCount++;
                const elapsed = (Date.now() - startTimeRef.current) / 1000;
                const speed = elapsed > 0
                  ? Math.round((localTokenCount / elapsed) * 10) / 10
                  : 0;

                // Batch state updates together
                setTokenCount(localTokenCount);
                setTokensPerSecond(speed);
              } catch {
                // Skip
              }
            }
          }
        } catch (err) {
          if (err instanceof Error && err.name !== 'AbortError') {
            console.error(`Stream error (${modelName}):`, err);
          }
        } finally {
          reader.releaseLock();
        }
      } catch (error) {
        console.error(`Error during fetching ${modelName}:`, error);
      }
    };

    try {
      await Promise.all([
        createStreamHandler('gemma-2b', setChunks1)(),
        createStreamHandler('gpt-oss-20b', setChunks2)()
      ]);
    } catch (error) {
      console.error('Error during parallel streaming:', error);
    } finally {
      setIsStreaming(false);
      setPrompt('');
    }
  }, [prompt, setMessages, setPrompt]);

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

      {messages.length === 0 && !isStreaming && (
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

      {
        messages?.length > 0 && (
          <section className='z-50 rounded-2xl overflow-clip bg-white border-[#dedede] border w-[80%] h-[60vh] flex divide-x divide-[#dedede]'>
            <LLMResponse modelName="gemma-2b" chunks={chunks1} delay={1639} />
            <LLMResponse modelName="gpt-oss-20b" chunks={chunks2} delay={1108} />
          </section>
        )
      }

      <div className="w-full max-w-3xl">
        <Textarea isStreaming={isStreaming} onStop={handleStop} />
      </div>
      {messages?.length > 0 && (
        <p className="text-sm text-(--secondary-text) font-primary flex gap-2 justify-center items-center">
          <span className='numeric flex gap-2 justify-center items-center'><img className='w-[12px]' src={arrowDown} alt="arrow-down" />{tokenCount} tokens</span> <span className='w-2 h-2 rounded-full bg-[#515C92]'></span> <span className='numeric'>{tokensPerSecond} tok/s</span>
        </p>
      )}
    </main>
  );
};

export default Chat;
