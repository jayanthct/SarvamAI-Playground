import { useEffect, useState, useCallback, useRef } from 'react';
import Textarea from '../components/Textarea';
import logo from '../../Assets/Images/logo.svg';
import ollama from '../../Assets/Images/ollama.svg';
import vllm from '../../Assets/Images/vllm.svg';
import homeIcon from '../../Assets/Icons/home.svg';
import { useChat } from '../context/ChatContext';
import { useNavigate } from 'react-router-dom';
import MessagesChat from '../components/MessagesChat';

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
  } = useChat();

  const abortRef = useRef<AbortController | null>(null);
  const startTimeRef = useRef<number>(0);

  const startStreaming = useCallback(async () => {
    setIsStreaming(true);

    setMessages([{ role: 'user', content: prompt }, { role: 'assistant', content: '' }]);

    abortRef.current = new AbortController();
    startTimeRef.current = Date.now();
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
    abortRef.current?.abort();
  }, [setMessages, setPrompt, navigate]);

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
