import { useEffect, useState, useCallback, useRef } from 'react';
import Textarea from '../components/Textarea';
import logo from '../../Assets/Images/logo.svg';
import { useChat } from '../context/ChatContext';
import { mockFetch } from '../lib/mockStream';
import LLMResponse from '../components/LLMResponse';
import { lcsDiff, type DiffToken } from '../lib/diffAlgorithm';

const Chat = () => {
  const { prompt, setPrompt, isSubmitted, setIsSubmitted, messages, setMessages, setShowDiff, showDiff, diffResult, setDiffResult } = useChat();

  const [isStreaming, setIsStreaming] = useState(false);
  const [tokenCount1, setTokenCount1] = useState(0);
  const [tokensPerSecond1, setTokensPerSecond1] = useState(0);
  const [tokenCount2, setTokenCount2] = useState(0);
  const [tokensPerSecond2, setTokensPerSecond2] = useState(0);
  const [chunks1, setChunks1] = useState('');
  const [chunks2, setChunks2] = useState('');

  const abortRef = useRef<AbortController | null>(null);
  const startTimeRef = useRef<number>(0);

  const startStreaming = useCallback(async () => {
    setTokenCount1(0);
    setTokensPerSecond1(0);
    setTokenCount2(0);
    setTokensPerSecond2(0);
    setIsStreaming(true);
    setChunks1('');
    setChunks2('');
    setShowDiff(false);
    setDiffResult(null);

    setMessages([{ role: 'user', content: prompt }, { role: 'assistant', content: '' }]);

    abortRef.current = new AbortController();
    startTimeRef.current = Date.now();

    const createStreamHandler = (modelName: string, setChunks: React.Dispatch<React.SetStateAction<string>>, setTokens: React.Dispatch<React.SetStateAction<number>>, setSpeed: React.Dispatch<React.SetStateAction<number>>) => async () => {
      let localTokenCount = 0;
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
                const speedModifier = modelName === 'gemma-2b' ? 1.4 : 0.85;
                const speed = elapsed > 0
                  ? Math.round((localTokenCount / elapsed) * speedModifier * 10) / 10
                  : 0;

                // Batch state updates together
                setTokens(localTokenCount);
                setSpeed(speed);
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
        createStreamHandler('gemma-2b', setChunks1, setTokenCount1, setTokensPerSecond1)(),
        createStreamHandler('gpt-oss-20b', setChunks2, setTokenCount2, setTokensPerSecond2)()
      ]);
    } catch (error) {
      console.error('Error during parallel streaming:', error);
    } finally {
      setIsStreaming(false);
      setPrompt('');
      setMessages([{ role: 'user', content: prompt }, { role: 'assistant', content: '' }]);
    }
  }, [prompt, setMessages, setPrompt]);

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  useEffect(() => {
    if (isSubmitted) {
      startStreaming();
      setIsSubmitted(false);
    }
  }, [isSubmitted, startStreaming, setIsSubmitted]);

  const handleClickofLCS = () => {
    console.log(chunks1, chunks2);
    console.log(typeof chunks1, typeof chunks2);

    const diff = lcsDiff(chunks1, chunks2);
    console.log(diff);
    setDiffResult(diff);
    setShowDiff(true);
  }

  return (
    <main className="grow flex flex-col items-center justify-center p-4 gap-6">

      <button onClick={handleClickofLCS} className='w-16 p-4 bg-blue-600'>ClickMe</button>

      {messages.length > 0 &&
        <div className='w-full flex justify-between items-center' style={{ padding: '0 10%' }}>
          <div className='flex flex-col'>
            <p className='font-secondary text-xl text-(--secondary-text)'>SarvamAI - Playground</p>
            <p className='font-primary text-(--primary-text)'>Frontend Intern Assignment</p>
          </div>
          <div className='w-fit self-end rounded-md border bg-[#F1F1F1] border-[#dedede]' style={{ padding: '12px', borderRadius: '12px 0 12px 12px' }}>
            <p className='font-primary text-(--primary-text)'>{messages?.[0].content}</p>
          </div>
        </div>
      }

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
            <LLMResponse modelName="gemma-2b" chunks={chunks1} delay={1639} tokenCount={tokenCount1} tokensPerSecond={tokensPerSecond1} />
            <LLMResponse modelName="gpt-oss-20b" chunks={chunks2} delay={1108} tokenCount={tokenCount2} tokensPerSecond={tokensPerSecond2} />
          </section>
        )
      }

      {showDiff && diffResult ? (
        <div className='flex gap-2 text-(--secondary-text) font-primary self-start w-full' style={{ padding: '0 10%' }}>
          <p className='flex gap-2 items-center'><span className='w-2 h-2 rounded-[2px] bg-red-500'></span>{'Removed: ' + diffResult.removed}</p>
          <p className='flex gap-2 items-center'><span className='w-2 h-2 rounded-[2px] bg-green-500'></span>{'Added: ' + diffResult.added}</p>
          <p className='flex gap-2 items-center'><span className='w-2 h-2 rounded-[2px] bg-yellow-500'></span>{'Edited: ' + diffResult.tokens.filter((token: DiffToken) => token.type === 'added' || token.type === 'removed').length}</p>
        </div>
      ) : null}

      <div className="w-full max-w-3xl">
        <Textarea isStreaming={isStreaming} onStop={handleStop} />
      </div>

    </main>
  );
};

export default Chat;
