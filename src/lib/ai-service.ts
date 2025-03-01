import type { ModelSettingsState } from '@/components/ModelSettings';
import { supabase } from '@/integrations/supabase/client';

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
      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('Session error:', sessionError || 'No active session');
        throw new Error('Authentication required');
      }
      
      // Call the Edge Function with the session token
      const { data, error } = await supabase.functions.invoke('llm/models', {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (error) {
        console.error('Function invoke error:', error);
        throw error;
      }
      
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
      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('Session error:', sessionError || 'No active session');
        throw new Error('Authentication required');
      }
      
      const { data, error } = await supabase.functions.invoke('llm/completion', {
        body: {
          prompt,
          modelId: settings.role === 'fact-checker' ? 'claude-3-sonnet' : settings.model,
          temperature: settings.temperature,
          maxTokens: settings.maxTokens
        },
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error('Completion function invoke error:', error);
        throw error;
      }

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
