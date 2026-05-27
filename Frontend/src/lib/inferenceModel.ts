import { Ollama } from "ollama";
import { MOCK_CHUNKS_MODEL_B } from "./mockResponses";

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

export const runVLLM = async function* (_prompt: string, signal?: AbortSignal) {
    const delay = 60;

    for (let i = 0; i < MOCK_CHUNKS_MODEL_B.length; i++) {
        if (signal?.aborted) {
            break;
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
        if (signal?.aborted) {
            break;
        }
        yield {
            model: "mock-vllm",
            created_at: new Date().toISOString(),
            message: {
                role: "assistant" as const,
                content: MOCK_CHUNKS_MODEL_B[i],
            },
            done: i === MOCK_CHUNKS_MODEL_B.length - 1,
        } as OllamaStreamChunk;
    }
};
