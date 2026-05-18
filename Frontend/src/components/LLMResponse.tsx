
import { useState, useEffect } from 'react';
import logo from '../../Assets/Images/logo.svg';
import gemma2b from '../../Assets/Images/gemini.svg';
import gptoss20b from '../../Assets/Images/openai.svg';

interface LLMResponseProps {
    modelName: string;
    chunks: string;
    delay?: number
}

const LLMResponse = ({ modelName, chunks, delay = 0 }: LLMResponseProps) => {
    const [isWaiting, setIsWaiting] = useState(delay > 0);

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
        <div style={{ padding: '16px' }} className='w-1/2 h-full flex flex-col gap-3'>
            <div className='flex items-center justify-center gap-2 w-full'>
                <img src={modelName.toLowerCase().includes('gemma') ? gemma2b : gptoss20b} alt="Model" className='w-4 h-4' />
                <h2 className='font-secondary text-lg text-(--primary-text) mb-2'>{modelName}</h2>
            </div>
            {isWaiting ? (
                <div className="flex self-start justify-center gap-2 items-center">
                    <img className='w-6 h-6' src={logo} alt="logo" />
                    <p className='font-primary text-[12px] text-(--primary-text)'>Generating...</p>
                </div>
            ) : (
                <div className='flex-1 overflow-y-auto font-primary text-(--primary-text) whitespace-pre-wrap scrollbar-thin'>
                    {chunks}
                </div>
            )}
        </div>
    )
}

export default LLMResponse