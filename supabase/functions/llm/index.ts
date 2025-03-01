import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
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
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      usage: data.usage,
    };
  }
}

// Anthropic Client
class AnthropicClient {
  private apiKey: string;
  private baseUrl = 'https://api.anthropic.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async listModels(): Promise<ModelInfo[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch Anthropic models: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Anthropic models response:', data);

      // Handle the actual response format where models are in data.data
      const models = data?.data || [];

      return models
        .filter((model: any) => model.type === 'model')
        .map((model: any) => {
          const id = model.id || '';
          const name = model.display_name || id.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ');

          // Get pricing based on model ID
          const pricing = {
            'claude-3-opus-20240229': { input: 0.00015, output: 0.00075 },
            'claude-3-sonnet-20240229': { input: 0.00003, output: 0.00015 },
            'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 }
          }[id] || { input: 0.0001, output: 0.0005 };

          return {
            id,
            name,
            provider: 'anthropic',
            maxTokens: 200000, // Current max for Claude 3
            inputPricePerToken: pricing.input,
            outputPricePerToken: pricing.output
          };
        })
        .filter(model => model.id && model.id.startsWith('claude-3')); // Only return Claude 3 models
    } catch (error) {
      console.error('Error fetching Anthropic models:', error);
      return []; // Return empty array if fetch fails
    }
  }

  async complete(params: any) {
    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: params.model,
        messages: [{ role: 'user', content: params.prompt }],
        temperature: params.temperature,
        max_tokens: params.maxTokens,
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.content[0].text,
      usage: {
        prompt_tokens: data.usage.input_tokens,
        completion_tokens: data.usage.output_tokens,
        total_tokens: data.usage.input_tokens + data.usage.output_tokens,
      },
    };
  }
}

// Initialize clients
const openaiClient = new OpenAIClient(Deno.env.get('OPENAI_API_KEY') || '');
const anthropicClient = new AnthropicClient(Deno.env.get('ANTHROPIC_API_KEY') || '');

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      } 
    });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();

    console.log(`Processing request for path: ${path}`);
    
    // Log headers for debugging
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));

    // Get the JWT token from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No Authorization header found');
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: 'No Authorization header found' }),
        { 
          status: 401, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify authentication
    try {
      const { data: { user }, error } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));
      
      if (error || !user) {
        console.error('Authentication error:', error);
        return new Response(
          JSON.stringify({ error: 'Unauthorized', details: error?.message || 'Invalid token' }),
          { 
            status: 401, 
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            } 
          }
        );
      }
      
      console.log(`Authenticated user: ${user.id}`);
    } catch (authError) {
      console.error('Exception during authentication:', authError);
      return new Response(
        JSON.stringify({ error: 'Authentication Error', details: authError.message }),
        { 
          status: 401, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
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
    console.error('Error processing request:', error);
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
    // Add system prompt for document context
    const systemPrompt = `\n\nHuman: You are an AI assistant helping with Earth Science papers. If I mention any loaded documents in the context, use that information to provide more relevant and specific answers. Here's my request:\n\n${prompt}\n\nAssistant: `;
    
    response = await anthropicClient.complete({
      prompt: systemPrompt,
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
