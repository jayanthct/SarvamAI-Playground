
import { useState, useEffect } from 'react';
import logo from '../../Assets/Images/logo.svg';
import gemma2b from '../../Assets/Images/gemini.svg';
import gptoss20b from '../../Assets/Images/openai.svg';
import arrowDown from '../../Assets/Icons/arrow-down.svg';
import { useChat } from '../context/ChatContext';
import { type DiffToken } from '../lib/diffAlgorithm';

interface LLMResponseProps {
    modelName: string;
    chunks: string;
    delay?: number
    tokenCount: number;
    tokensPerSecond: number;
    error?: string;
}

const LLMResponse = ({ modelName, chunks, delay = 0, tokenCount, tokensPerSecond, error }: LLMResponseProps) => {
    const [isWaiting, setIsWaiting] = useState<boolean>(delay > 0);
    const { showDiff, diffResult } = useChat();

    useEffect(() => {
        if (delay > 0) {
            setIsWaiting(true);
            const timer = setTimeout(() => {
                setIsWaiting(false);
            }, delay);
            return () => clearTimeout(timer);
        } else {
            setIsWaiting(false);
        }
    }, [delay]);

    return (
        <div style={{ padding: '16px' }} className='relative w-1/2 h-full flex flex-col gap-3'>
            <div className='flex items-center justify-center gap-2 w-full'>
                <img src={modelName.toLowerCase().includes('gemma') ? gemma2b : gptoss20b} alt="Model" className='w-4 h-4' />
                <h2 className='font-secondary text-lg text-(--primary-text) mb-2'>{modelName}</h2>
            </div>
            {isWaiting ? (
                <div className="flex self-start justify-center gap-2 items-center">
                    <img className='w-6 h-6' src={logo} alt="logo" />
                    <p className='font-primary text-[12px] shiny-text'>Generating...</p>
                </div>
            ) : (
                <div className='flex-1 overflow-y-auto font-primary text-(--primary-text) whitespace-pre-wrap scrollbar-thin'>
                    {showDiff && diffResult ? (
                        diffResult.tokens.map((token: DiffToken, index: number) => {
                            const isLeft = modelName.toLowerCase().includes('gemma');
                            if (isLeft && token.type === 'added') return null;
                            if (!isLeft && token.type === 'removed') return null;

                            let colorClass = '';
                            if (token.type === 'added') colorClass = 'text-green-500 bg-green-500/10 px-0.5 rounded';
                            if (token.type === 'removed') colorClass = 'text-red-500 bg-red-500/10 px-0.5 rounded line-through';

                            return <span key={index} className={colorClass}>{token.word} </span>;
                        })
                    ) : (
                        chunks
                    )}
                    {error && (
                        <p role="alert" aria-live="assertive" className="font-primary text-red-500 text-[12px] bg-red-500/10 rounded text-center" style={{ margin: '2rem 0', padding: '0.8rem' }}>
                            {error}
                        </p>
                    )}
                </div>
            )}
            <p className="absolute bottom-4 right-4 text-xs text-(--secondary-text) font-primary flex gap-2 justify-center items-center">
                <span className='numeric flex gap-2 justify-center items-center'><img className='w-[12px]' src={arrowDown} alt="arrow-down" />{tokenCount} tokens</span> <span className='w-1 h-1 rounded-full bg-[#515C92]'></span> <span className='numeric'>{tokensPerSecond} tok/s</span>
            </p>
        </div>
    )
}

export default LLMResponse