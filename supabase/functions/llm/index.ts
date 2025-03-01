import { serve } from 'https://deno.fresh.runtime.dev';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

interface ModelInfo {
  id: string;
  provider: 'openai' | 'anthropic';
  name: string;
  maxTokens: number;
  inputPricePerToken: number;
  outputPricePerToken: number;
}

interface CompletionRequest {
  prompt: string;
  modelId: string;
  temperature?: number;
  maxTokens?: number;
}

// Initialize clients
const openaiClient = new OpenAIClient(Deno.env.get('OPENAI_API_KEY') || '');
const anthropicClient = new AnthropicClient(Deno.env.get('ANTHROPIC_API_KEY') || '');

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    switch (path) {
      case 'models':
        return await handleGetModels(req);
      case 'completion':
        return await handleCompletion(req);
      default:
        throw new Error('Not Found');
    }
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        status: error.message === 'Unauthorized' ? 401 : 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});

async function handleGetModels(req: Request): Promise<Response> {
  const models: ModelInfo[] = [];

  // Fetch OpenAI models
  try {
    const openaiModels = await openaiClient.listModels();
    models.push(
      ...openaiModels.map((model) => ({
        id: model.id,
        provider: 'openai' as const,
        name: model.id,
        maxTokens: model.maxTokens,
        inputPricePerToken: model.inputPricePerToken,
        outputPricePerToken: model.outputPricePerToken,
      }))
    );
  } catch (error) {
    console.error('Error fetching OpenAI models:', error);
  }

  // Fetch Anthropic models
  try {
    const anthropicModels = await anthropicClient.listModels();
    models.push(
      ...anthropicModels.map((model) => ({
        id: model.id,
        provider: 'anthropic' as const,
        name: model.name,
        maxTokens: model.maxTokens,
        inputPricePerToken: model.inputPricePerToken,
        outputPricePerToken: model.outputPricePerToken,
      }))
    );
  } catch (error) {
    console.error('Error fetching Anthropic models:', error);
  }

  return new Response(
    JSON.stringify({ models }),
    {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    }
  );
}

async function handleCompletion(req: Request): Promise<Response> {
  const { prompt, modelId, temperature = 0.7, maxTokens = 2000 }: CompletionRequest = await req.json();

  if (!prompt || !modelId) {
    throw new Error('Missing required fields');
  }

  let response;
  if (modelId.startsWith('claude')) {
    response = await anthropicClient.complete({
      prompt,
      model: modelId,
      temperature,
      maxTokens,
    });
  } else {
    response = await openaiClient.complete({
      messages: [{ role: 'user', content: prompt }],
      model: modelId,
      temperature,
      max_tokens: maxTokens,
    });
  }

  return new Response(
    JSON.stringify(response),
    {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    }
  );
}

// OpenAI Client
class OpenAIClient {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async listModels() {
    const response = await fetch(`${this.baseUrl}/models`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data
      .filter((model: any) => 
        model.id.startsWith('gpt-') && 
        !model.id.includes('instruct')
      )
      .map((model: any) => ({
        id: model.id,
        maxTokens: model.id.includes('gpt-4') ? 8192 : 4096,
        inputPricePerToken: model.id.includes('gpt-4') ? 0.03 : 0.0015,
        outputPricePerToken: model.id.includes('gpt-4') ? 0.06 : 0.002,
      }));
  }

  async complete(params: any) {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    return response.json();
  }
}

// Anthropic Client
class AnthropicClient {
  private apiKey: string;
  private baseUrl = 'https://api.anthropic.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async listModels() {
    return [
      {
        id: 'claude-3-sonnet',
        name: 'Claude 3 Sonnet',
        maxTokens: 200000,
        inputPricePerToken: 0.0003,
        outputPricePerToken: 0.0015,
      },
      {
        id: 'claude-3-opus',
        name: 'Claude 3 Opus',
        maxTokens: 200000,
        inputPricePerToken: 0.0015,
        outputPricePerToken: 0.075,
      },
    ];
  }

  async complete(params: any) {
    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'anthropic-version': '2023-06-01',
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: params.model,
        messages: [{ role: 'user', content: params.prompt }],
        max_tokens: params.maxTokens,
        temperature: params.temperature,
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    return response.json();
  }
}
