import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

interface MarkdownRendererProps {
    content: string;
}

const MarkdownRenderer = ({ content }: MarkdownRendererProps) => {
    return (
        <div className="markdown-content">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    code({ inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || "");
                        const language = match?.[1] || "text";

                        if (!inline) {
                            return (
                                <div className="my-3 overflow-hidden rounded-lg border border-gray-200">
                                    <div style={{ padding: '8px 12px' }} className="flex items-center justify-between bg-gray-100 text-xs text-gray-600">
                                        <span>{language}</span>
                                    </div>

                                    <SyntaxHighlighter
                                        style={oneLight}
                                        language={language}
                                        PreTag="div"
                                        customStyle={{
                                            margin: 0,
                                            padding: "16px",
                                            fontSize: "14px",
                                            background: "#ffffff",
                                        }}
                                        {...props}
                                    >
                                        {String(children).replace(/\n$/, "")}
                                    </SyntaxHighlighter>
                                </div>
                            );
                        }

                        return (
                            <code
                                style={{ padding: '4px 8px' }}
                                className="rounded bg-gray-100 text-sm"
                                {...props}
                            >
                                {children}
                            </code>
                        );
                    },
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};

export default MarkdownRenderer;