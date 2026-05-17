export const MOCK_CHUNKS_MODEL_A = [
    "Transformer", " models", " on", " edge", " devices", " manage",
    " long", " contexts", " using", " standard", " attention", " mechanisms.",
    "\n\n",
    "The", " key", " challenge", " is", " that", " attention", " scales",
    " quadratically", " with", " sequence", " length,", " which", " becomes",
    " prohibitive", " on", " memory-constrained", " hardware.",
    "\n\n",
    "To", " address", " this,", " sliding", " window", " attention",
    " is", " commonly", " used", " to", " restrict", " each", " token's",
    " attention", " span", " to", " a", " fixed", " surrounding",
    " neighbourhood.", " KV-cache", " compression", " via", " INT8",
    " quantization", " further", " reduces", " memory", " footprint.",
];

export const MOCK_CHUNKS_MODEL_B = [
    "Transformer", " models", " on", " edge", " devices", " manage",
    " long", " contexts", " using", " optimised", " attention", " mechanisms.",
    "\n\n",
    "The", " key", " challenge", " is", " that", " attention", " scales",
    " as", " O(n²)", " with", " sequence", " length,", " which", " becomes",
    " prohibitive", " on", " memory-constrained", " hardware.",
    "\n\n",
    "To", " address", " this,", " sliding", " window", " attention",
    " constrains", " each", " token's", " attention", " span", " to",
    " a", " fixed", " nearby", " neighbourhood,", " reducing", " complexity",
    " to", " O(n·w).", " KV-cache", " quantization", " from", " FP16",
    " to", " INT4", " or", " INT8", " further", " reduces", " memory",
    " footprint", " by", " 2–4×.", " Grouped", " Query", " Attention",
    " (GQA)", " shares", " key-value", " heads", " across", " queries.",
];

export function buildSSEChunk(
    content: string,
    index: number,
    modelName: string
): string {
    const chunk = {
        id: `chatcmpl-mock-${Date.now()}`,
        object: "chat.completion.chunk",
        created: Date.now(),
        model: modelName,
        choices: [
            {
                index,
                delta: { content },
                finish_reason: null,
            },
        ],
    };
    return `data: ${JSON.stringify(chunk)}\n\n`;
}

export function buildDoneChunk(): string {
    return `data: [DONE]\n\n`;
}