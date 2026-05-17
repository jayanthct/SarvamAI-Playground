import {
    MOCK_CHUNKS_MODEL_A,
    MOCK_CHUNKS_MODEL_B,
    buildSSEChunk,
    buildDoneChunk,
} from './mockResponses';

const DELAY_MS = 60;

const CHUNKS_MAP: Record<string, string[]> = {
    'gemma-2b': MOCK_CHUNKS_MODEL_A,
    'gpt-oss-20b': MOCK_CHUNKS_MODEL_B,
};

export function mockFetch(modelName: string): Response {
    const chunks = CHUNKS_MAP[modelName] ?? MOCK_CHUNKS_MODEL_A;
    let index = 0;

    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();

            for (const token of chunks) {
                await new Promise((res) => setTimeout(res, DELAY_MS));
                const sseChunk = buildSSEChunk(token, index++, modelName);
                controller.enqueue(encoder.encode(sseChunk));
            }

            controller.enqueue(encoder.encode(buildDoneChunk()));
            controller.close();
        },
    });

    return new Response(stream, {
        headers: { 'Content-Type': 'text/event-stream' },
    });
}