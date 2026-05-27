import { useEffect, useRef } from "react";
import { useChat } from "../context/ChatContext";
import gemma2b from '../../Assets/Images/gemini.svg';
import arrowDown from '../../Assets/Icons/arrow-down.svg';
import logo from '../../Assets/Images/logo.svg';
import MarkdownRenderer from "./MarkdownRender";

const MessagesChat = () => {
    const { messages, tokenCount, tokensPerSecond } = useChat();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <section
            style={{ padding: '20px 24px' }}
            className="z-50 rounded-2xl bg-white border-[#dedede] border w-[80%] h-[60vh] flex flex-col"
        >
            <div className="flex-1 overflow-y-auto font-primary text-(--primary-text) whitespace-pre-wrap scrollbar-thin pr-1 flex flex-col gap-4">
                {messages.map((message, index) => {
                    if (message.role === 'user') {
                        return (
                            <div
                                key={index}
                                className="w-fit self-end rounded-md border bg-[#F1F1F1] border-[#dedede]"
                                style={{ padding: '12px', borderRadius: '12px 0 12px 12px' }}
                            >
                                <p className="font-primary text-(--primary-text) text-sm leading-relaxed">{message?.content}</p>
                            </div>
                        );
                    } else {
                        if (!message.content) {
                            return (
                                <div key={index} className="flex self-start justify-center gap-2 items-center">
                                    <img className='w-6 h-6' src={logo} alt="logo" />
                                    <p className='font-primary text-[12px] shiny-text'>Generating...</p>
                                </div>
                            );
                        }
                        return (
                            <div
                                key={index}
                                className={`w-[70%] self-start font-primary text-sm leading-relaxed ${message.isError
                                    ? "text-red-500 font-semibold"
                                    : "text-(--primary-text)"
                                    } markdown-content`}
                            >
                                <MarkdownRenderer content={message?.content || ""} />
                            </div>
                        );
                    }
                })}
                <div ref={messagesEndRef} />
            </div>
            <div className="relative flex w-full justify-between items-center">
                <div className="flex items-center gap-2">
                    <img className="w-4 h-4" src={gemma2b} alt="gemma2b" />
                    <span className="font-primary text-(--primary-text)">Gemma3:1B</span>
                </div>
                <p className="text-xs text-(--secondary-text) font-primary flex gap-2 justify-center items-center">
                    <span className='numeric flex gap-2 justify-center items-center'><img className='w-[12px]' src={arrowDown} alt="arrow-down" />{tokenCount} tokens</span> <span className='w-1 h-1 rounded-full bg-[#515C92]'></span> <span className='numeric'>{tokensPerSecond} tok/s</span>
                </p>
            </div>
        </section>
    );
};

export default MessagesChat;