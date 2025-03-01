import { supabase } from '@/integrations/supabase/client';

export interface ModelInfo {
  id: string;
  provider: 'anthropic' | 'openai';
  name: string;
}

export interface ModelSettings {
  selectedModel: string;
  temperature: number;
  maxTokens: number;
  role: string;
}

export interface CompletionRequest {
  prompt: string;
  settings: ModelSettings;
  documents?: { name: string; content: string }[];
}

export interface CompletionResponse {
  text: string;
}

export class AIService {
  private supabaseClient = supabase;

  async getAvailableModels(): Promise<ModelInfo[]> {
    try {
      console.log('Fetching available models...');
      const response = await this.supabaseClient.functions.invoke('llm', {
        body: {
          action: 'models'
        }
      });

      if (response.error) {
        console.error('Error response from edge function:', response.error);
        throw new Error(response.error.message || 'Failed to fetch models');
      }

      const models = response.data;
      if (!Array.isArray(models)) {
        console.error('Invalid response format:', models);
        throw new Error('Invalid response format from server');
      }

      if (models.length === 0) {
        console.warn('No models returned from server');
      }

      return models;
    } catch (error) {
      console.error('Error fetching models:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch available models');
    }
  }

  async getCompletion({ prompt, settings, documents }: { 
    prompt: string; 
    settings: ModelSettings;
    documents?: { name: string; content: string }[];
  }): Promise<{ text: string }> {
    try {
      // Ensure modelId is set - use a default if undefined
      const modelId = settings.selectedModel || 'claude-3-sonnet-20240229';
      
      console.log('Sending completion request with:', {
        modelId,
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
        hasDocuments: !!documents,
        documentCount: documents?.length || 0
      });
      
      // Prepare the request body
      const requestBody = {
        action: 'complete',
        prompt,
        modelId,
        temperature: settings.temperature,
        maxTokens: settings.maxTokens
      };
      
      // Only add documents if they exist to avoid potential issues
      if (documents && documents.length > 0) {
        Object.assign(requestBody, { documents });
      }
      
      console.log('Request body:', JSON.stringify(requestBody).substring(0, 200) + '...');
      
      // Get the Supabase URL and key from the client
      const supabaseUrl = this.supabaseClient.functions.url;
      const supabaseKey = this.supabaseClient.supabaseKey;
      
      // Use direct fetch instead of the Supabase client
      const response = await fetch(`${supabaseUrl}/llm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response from edge function:', errorText);
        throw new Error(`Failed to get completion: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data || !data.content) {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response format from server');
      }

      return {
        text: data.content
      };
    } catch (error) {
      console.error('Error calling AI API:', error);
      throw error;
    }
  }
}

export const aiService = new AIService();
