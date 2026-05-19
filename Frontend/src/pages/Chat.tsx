import { useEffect, useState, useCallback, useRef } from 'react';
import Textarea from '../components/Textarea';
import logo from '../../Assets/Images/logo.svg';
import homeIcon from '../../Assets/Icons/home.svg';
import { useChat } from '../context/ChatContext';
import { mockFetch } from '../lib/mockStream';
import LLMResponse from '../components/LLMResponse';
import { lcsDiff, type DiffToken } from '../lib/diffAlgorithm';
import { useNavigate } from 'react-router-dom';

const Chat = () => {

  const navigate = useNavigate();

  const { prompt, setPrompt, isSubmitted, setIsSubmitted, messages, setMessages, setShowDiff, showDiff, diffResult, setDiffResult } = useChat();

  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [tokenCount1, setTokenCount1] = useState<number>(0);
  const [tokensPerSecond1, setTokensPerSecond1] = useState<number>(0);
  const [tokenCount2, setTokenCount2] = useState<number>(0);
  const [tokensPerSecond2, setTokensPerSecond2] = useState<number>(0);
  const [chunks1, setChunks1] = useState<string>('');
  const [chunks2, setChunks2] = useState<string>('');

  const [error, setError] = useState<string>('');

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

  const handleGoHome = useCallback(() => {
    navigate('/');
    setIsStreaming(false);
    setMessages([]);
    setPrompt('');
    setChunks1('');
    setChunks2('');
    setTokenCount1(0);
    setTokenCount2(0);
    setTokensPerSecond1(0);
    setTokensPerSecond2(0);
    setShowDiff(false);
    setDiffResult(null);
    abortRef.current?.abort();
  }, [setMessages, setPrompt, setShowDiff, setDiffResult, navigate]);

  useEffect(() => {
    if (isSubmitted) {
      startStreaming();
      setIsSubmitted(false);
    }
  }, [isSubmitted, startStreaming, setIsSubmitted]);

  const handleClickLCS = () => {
    if (showDiff) {
      setShowDiff(false);
    } else {
      const diff = lcsDiff(chunks1, chunks2);
      setDiffResult(diff);
      setShowDiff(true);
    }
  }

  const handleModelTimeout = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
    setError('Model Timeout, Please Try Again Later');
  }, []);

  const handleNetworkDrop = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
    setError('Network Drop, Check the Internet and Try Again');
  }, []);

  return (
    <main className="grow flex flex-col items-center justify-center p-4 gap-6">

      {messages.length > 0 &&
        <div className='w-full flex justify-between items-center' style={{ padding: '0 10%' }}>
          <article className='flex justify-center items-center gap-3'>
            <button
              type="button"
              aria-label="Home"
              title="Home"
              onClick={handleGoHome}
              className={`w-[36px] h-[36px] shrink-0 flex items-center justify-center rounded-full cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2`}
            >
              <div className="w-[14px] h-[14px] bg-white rounded-[2px]" >
                <img
                  src={homeIcon}
                  alt="button"
                  aria-hidden="true"
                />
              </div>
            </button>
            <div className='flex flex-col w-full'>
              <p className='font-secondary text-xl text-(--secondary-text)'>SarvamAI - Playground</p>
              <p className='font-primary text-(--primary-text)'>Frontend Intern Assignment</p>
            </div>
          </article>
          <div className='flex gap-4'>
            <button
              type="button"
              aria-label="Network Drops"
              title="Network Drops"
              disabled={!isStreaming}
              onClick={handleNetworkDrop}
              style={{ padding: '6px 10px', borderRadius: '12px', background: 'linear-gradient(rgb(255, 255, 255) 0%, rgb(240, 241, 245) 100%)', boxShadow: 'rgba(30, 32, 51, 0.14) 0px 0px 0px 1px inset;' }}
              className='disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex justify-center items-center border border-(--primary-text) transition-all duration-350 ease-[cubic-bezier(0.2,0,0,1)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2'
            >
              Network Drops
            </button>
            <button
              type="button"
              aria-label="Model Timeout"
              title="Model Timeout"
              disabled={!isStreaming}
              onClick={handleModelTimeout}
              style={{ padding: '6px 10px', borderRadius: '12px', background: 'linear-gradient(rgb(255, 255, 255) 0%, rgb(240, 241, 245) 100%)', boxShadow: 'rgba(30, 32, 51, 0.14) 0px 0px 0px 1px inset;' }}
              className='disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex justify-center items-center border border-(--primary-text) transition-all duration-350 ease-[cubic-bezier(0.2,0,0,1)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2'
            >
              Model Timeout
            </button>
            <div className="flex items-center gap-3">
              <span className="font-primary text-[14px] text-(--secondary-text) font-medium" id="show-diff-label">
                Show Diff:
              </span>
              <button
                type="button"
                role="switch"
                disabled={isStreaming}
                aria-checked={showDiff}
                aria-labelledby="show-diff-label"
                onClick={handleClickLCS}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 ${showDiff ? 'bg-[#515C92]' : 'bg-gray-300'
                  }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${showDiff ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
              </button>
            </div>
          </div>
          <div className='w-fit self-end rounded-md border bg-[#F1F1F1] border-[#dedede]' style={{ padding: '12px', borderRadius: '12px 0 12px 12px' }}>
            <p className='font-primary text-(--primary-text)'>{messages?.[0].content}</p>
          </div>
        </div>
      }

      {
        messages.length === 0 && !isStreaming && (
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
        )
      }

      {
        messages?.length > 0 && (
          <section className='z-50 rounded-2xl overflow-clip bg-white border-[#dedede] border w-[80%] h-[60vh] flex divide-x divide-[#dedede]'>
            <LLMResponse modelName="gemma-2b" chunks={chunks1} delay={1639} tokenCount={tokenCount1} tokensPerSecond={tokensPerSecond1} error={error} />
            <LLMResponse modelName="gpt-oss-20b" chunks={chunks2} delay={1108} tokenCount={tokenCount2} tokensPerSecond={tokensPerSecond2} error={error} />
          </section>
        )
      }

      {
        showDiff && diffResult ? (
          <div className='flex gap-2 text-(--secondary-text) font-primary self-start w-full' style={{ padding: '0 10%' }}>
            <p className='flex gap-2 items-center'><span className='w-2 h-2 rounded-[2px] bg-red-500'></span>{'Removed: ' + diffResult.removed}</p>
            <p className='flex gap-2 items-center'><span className='w-2 h-2 rounded-[2px] bg-green-500'></span>{'Added: ' + diffResult.added}</p>
            <p className='flex gap-2 items-center'><span className='w-2 h-2 rounded-[2px] bg-yellow-500'></span>{'Edited: ' + diffResult.tokens.filter((token: DiffToken) => token.type === 'added' || token.type === 'removed').length}</p>
          </div>
        ) : null
      }

      <div className="w-full max-w-3xl">
        <Textarea isStreaming={isStreaming} onStop={handleStop} />
      </div>
    </main >
  );
};

export default Chat;
