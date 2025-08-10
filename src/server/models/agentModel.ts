export interface AgentModel {
    sendMessage(input: string, sessionId: string): Promise<string>;
    setConfig(config: ModelConfig): void;
}

export interface ModelConfig {
    apiKey?: string;
    baseUrl?: string;
    modelName?: string;
}

