import { Ollama } from "ollama";

export interface OllamaStreamChunk {
    model: string;
    created_at: string;
    message: {
        role: "assistant" | "user" | "system";
        content: string;
    };
    done: boolean;
}

export const runOllama = async (prompt: string) => {
    const ollama = new Ollama({
        host: "http://localhost:11434",
    });

    const response = await ollama.chat({
        stream: true,
        model: "gemma3:1b",
        messages: [{ role: "user", content: prompt }]
    });
    return response;
};

export const runLlamaCPP = async function* (prompt: string, signal?: AbortSignal) {
    const API_URL = "http://localhost:12434/engines/v1/chat/completions";
    const MODEL = "hf.co/ggml-org/gemma-3-1b-it-GGUF";

    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            stream: true,
            model: MODEL,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: 200,
        }),
        signal
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API failed: ${response.status} ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
        throw new Error("Failed to get reader from response body");
    }

    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    try {
        while (true) {
            if (signal?.aborted) {
                break;
            }
            const { done, value } = await reader.read();
            if (done) {
                break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            // Keep the last partial line in the buffer
            buffer = lines.pop() || "";

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;
                if (trimmed === "data: [DONE]") continue;

                if (trimmed.startsWith("data: ")) {
                    const jsonStr = trimmed.slice(6);
                    try {
                        const parsed = JSON.parse(jsonStr);
                        const content = parsed.choices?.[0]?.delta?.content || "";
                        if (content) {
                            yield {
                                model: "llamacpp",
                                created_at: new Date().toISOString(),
                                message: {
                                    role: "assistant" as const,
                                    content: content,
                                },
                                done: false,
                            } as OllamaStreamChunk;
                        }
                    } catch (e) {
                        console.error("Error parsing chunk JSON:", jsonStr, e);
                    }
                }
            }
        }

        // Flush any remaining buffer
        if (buffer.trim()) {
            const trimmed = buffer.trim();
            if (trimmed !== "data: [DONE]" && trimmed.startsWith("data: ")) {
                const jsonStr = trimmed.slice(6);
                try {
                    const parsed = JSON.parse(jsonStr);
                    const content = parsed.choices?.[0]?.delta?.content || "";
                    if (content) {
                        yield {
                            model: "llamacpp",
                            created_at: new Date().toISOString(),
                            message: {
                                role: "assistant" as const,
                                content: content,
                            },
                            done: true,
                        } as OllamaStreamChunk;
                    }
                } catch (e) {
                    // ignore
                }
            }
        }
    } finally {
        reader.releaseLock();
    }
};
