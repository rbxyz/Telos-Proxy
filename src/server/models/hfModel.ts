import { env } from "~/env";
import type { AgentModel, ModelConfig } from "./agentModel";

export class HuggingFaceModel implements AgentModel {
    private config: ModelConfig;

    constructor(initialConfig?: ModelConfig) {
        this.config = initialConfig ?? {};
    }

    setConfig(config: ModelConfig): void {
        this.config = { ...this.config, ...config };
    }

    async sendMessage(input: string, sessionId: string): Promise<string> {
        const apiKey = this.config.apiKey ?? env.HF_API_KEY;
        const baseUrl = this.config.baseUrl ?? env.HF_BASE_URL ?? "https://api-inference.huggingface.co";
        const modelName = this.config.modelName ?? "google/flan-t5-base";

        const url = `${baseUrl}/models/${modelName}`;
        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
            },
            body: JSON.stringify({ inputs: input, parameters: { return_full_text: false }, options: { wait_for_model: true } }),
            // Small timeout pattern could be added with AbortController if needed
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`HF API error ${res.status}: ${text}`);
        }

        const data = (await res.json()) as unknown;
        // Different models may return different shapes; common text generation models return array of { generated_text }
        if (Array.isArray(data) && data.length > 0 && typeof data[0]?.generated_text === "string") {
            return data[0].generated_text as string;
        }
        // Fallback: try to stringify
        return typeof data === "string" ? data : JSON.stringify(data);
    }
}

