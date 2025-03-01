import { createClient } from '@supabase/supabase-js';
import type { ModelSettingsState } from '@/components/ModelSettings';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

export interface ModelInfo {
  id: string;
  provider: 'openai' | 'anthropic';
  name: string;
  maxTokens: number;
  inputPricePerToken: number;
  outputPricePerToken: number;
}

export interface CompletionRequest {
  prompt: string;
  settings: ModelSettingsState;
}

export interface CompletionResponse {
  text: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

class AIService {
  private models: ModelInfo[] = [];

  async getAvailableModels(): Promise<ModelInfo[]> {
    try {
      const { data, error } = await supabase.functions.invoke('llm/models');
      if (error) throw error;
      this.models = data.models;
      return this.models;
    } catch (error) {
      console.error('Error fetching models:', error);
      throw error;
    }
  }

  async getCompletion(request: CompletionRequest): Promise<CompletionResponse> {
    const { prompt, settings } = request;
    
    try {
      const { data, error } = await supabase.functions.invoke('llm/completion', {
        body: {
          prompt,
          modelId: settings.role === 'fact-checker' ? 'claude-3-sonnet' : settings.model,
          temperature: settings.temperature,
          maxTokens: settings.maxTokens
        }
      });

      if (error) throw error;

      return {
        text: data.content,
        usage: {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens
        }
      };
    } catch (error) {
      console.error('Error calling AI API:', error);
      throw error;
    }
  }
}

export const aiService = new AIService();
