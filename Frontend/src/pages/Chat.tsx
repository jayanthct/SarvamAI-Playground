import { useEffect, useCallback, useRef } from 'react';
import Textarea from '../components/Textarea';
import logo from '../../Assets/Images/logo.svg';
import ollama from '../../Assets/Images/ollama.svg';
import vllm from '../../Assets/Images/vllm.svg';
import homeIcon from '../../Assets/Icons/home.svg';
import { useChat } from '../context/ChatContext';
import { useNavigate } from 'react-router-dom';
import MessagesChat from '../components/MessagesChat';
import { runOllama, runVLLM } from '../lib/inferenceModel';

const Chat = () => {

  const navigate = useNavigate();

  const {
    prompt,
    setPrompt,
    isSubmitted,
    setIsSubmitted,
    messages,
    setMessages,
    currentInferencingEngine,
    setCurrentInferencingEngine,
    isStreaming,
    setIsStreaming,
    setTokenCount,
    setTokensPerSecond,
  } = useChat();

  const activeOllamaStreamRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const startStreaming = useCallback(async () => {
    const currentPrompt = prompt;
    if (!currentPrompt.trim()) return;

    setIsStreaming(true);
    setTokenCount(0);
    setTokensPerSecond(0);

    setMessages((prev) => [
      ...prev,
      { role: 'user', content: currentPrompt },
      { role: 'assistant', content: '' }
    ]);
    setPrompt('');

    const startTime = Date.now();
    let currentTokens = 0;

    abortControllerRef.current = new AbortController();

    try {
      if (currentInferencingEngine === 'ollama') {
        const stream = await runOllama(currentPrompt);
        if (!stream) {
          throw new Error("Could not establish connection to Ollama");
        }
        activeOllamaStreamRef.current = stream;

        for await (const chunk of stream) {
          const content = chunk.message.content;
          
          setMessages((prev) => {
            if (prev.length === 0) return prev;
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            if (updated[lastIdx].role === 'assistant') {
              updated[lastIdx] = {
                ...updated[lastIdx],
                content: updated[lastIdx].content + content
              };
            }
            return updated;
          });

          currentTokens += 1;
          setTokenCount(currentTokens);

          const elapsedSeconds = (Date.now() - startTime) / 1000;
          if (elapsedSeconds > 0) {
            setTokensPerSecond(Math.round(currentTokens / elapsedSeconds));
          }
        }
      } else {
        // vLLM Model Stream (simulated on frontend using unified iterator interface)
        const stream = runVLLM(currentPrompt, abortControllerRef.current.signal);
        
        for await (const chunk of stream) {
          const content = chunk.message.content;

          setMessages((prev) => {
            if (prev.length === 0) return prev;
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            if (updated[lastIdx].role === 'assistant') {
              updated[lastIdx] = {
                ...updated[lastIdx],
                content: updated[lastIdx].content + content
              };
            }
            return updated;
          });

          currentTokens += 1;
          setTokenCount(currentTokens);

          const elapsedSeconds = (Date.now() - startTime) / 1000;
          if (elapsedSeconds > 0) {
            setTokensPerSecond(Math.round(currentTokens / elapsedSeconds));
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError' || error.message?.includes('aborted')) {
        console.log("Stream aborted by user");
      } else {
        console.error("Stream failed:", error);
        setMessages((prev) => {
          if (prev.length === 0) return prev;
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (updated[lastIdx].role === 'assistant') {
            updated[lastIdx] = {
              ...updated[lastIdx],
              isError: true,
              content: updated[lastIdx].content + "\n\n[Inference error occurred. Please check if your Ollama server is running.]"
            };
          }
          return updated;
        });
      }
    } finally {
      setIsStreaming(false);
      activeOllamaStreamRef.current = null;
      abortControllerRef.current = null;
    }
  }, [prompt, setPrompt, currentInferencingEngine, setMessages, setIsStreaming, setTokenCount, setTokensPerSecond]);

  const handleStop = useCallback(() => {
    if (currentInferencingEngine === 'ollama') {
      activeOllamaStreamRef.current?.abort();
    } else {
      abortControllerRef.current?.abort();
    }
    setIsStreaming(false);
  }, [currentInferencingEngine, setIsStreaming]);

  const handleGoHome = useCallback(() => {
    navigate('/');
    setIsStreaming(false);
    setMessages([]);
    setPrompt('');
    if (currentInferencingEngine === 'ollama') {
      activeOllamaStreamRef.current?.abort();
    } else {
      abortControllerRef.current?.abort();
    }
  }, [setMessages, setPrompt, navigate, currentInferencingEngine, setIsStreaming]);

  useEffect(() => {
    if (isSubmitted) {
      startStreaming();
      setIsSubmitted(false);
    }
  }, [isSubmitted, startStreaming, setIsSubmitted]);

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
          <div style={{ padding: '0 16px' }}>
            <img src={currentInferencingEngine === 'vllm' ? vllm : ollama} alt="Model" className='w-20' />
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
            <fieldset className="flex justify-center items-center gap-2">
              <label
                style={{ padding: '16px 20px' }}
                htmlFor="ollama"
                aria-label="Select Ollama inferencing engine"
                className={`flex justify-center items-center rounded-md border-2 cursor-pointer transition-all duration-200 ${currentInferencingEngine === "ollama"
                  ? "border-[#899CF8] bg-[#899CF8]/6"
                  : "border-[#F0F0F0] bg-white"
                  }`}
              >
                <input
                  type="radio"
                  name="engineType"
                  id="ollama"
                  value="ollama"
                  checked={currentInferencingEngine === 'ollama'}
                  onChange={() => setCurrentInferencingEngine('ollama')}
                  className="hidden"
                />
                <img src={ollama} alt="Ollama" className="h-6 object-contain" />
              </label>

              <label
                style={{ padding: '16px 20px' }}
                htmlFor="vllm"
                aria-label="Select vLLM inferencing engine"
                className={`flex justify-center items-center rounded-md border-2 cursor-pointer transition-all duration-200 ${currentInferencingEngine === "vllm"
                  ? "border-[#899CF8] bg-[#899CF8]/6"
                  : "border-[#F0F0F0] bg-white"
                  }`}
              >
                <input
                  type="radio"
                  name="engineType"
                  id="vllm"
                  value="vllm"
                  checked={currentInferencingEngine === 'vllm'}
                  onChange={() => setCurrentInferencingEngine('vllm')}
                  className="hidden"
                />
                <img src={vllm} alt="vLLM" className="h-6 object-contain" />
              </label>
            </fieldset>
          </div>
        )
      }

      {
        messages?.length > 0 && (
          <MessagesChat />
        )
      }

      <div className="w-full max-w-3xl">
        <Textarea isStreaming={isStreaming} onStop={handleStop} />
      </div>
    </main >
  );
};

export default Chat;
