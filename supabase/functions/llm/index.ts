import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

interface CompletionRequest {
  prompt: string;
  modelId: string;
  temperature?: number;
  maxTokens?: number;
  documents?: { name: string; content: string }[];
  systemMessage?: string;
}

interface ModelInfo {
  id: string;
  provider: 'anthropic' | 'openai';
  name: string;
}

// Simple Anthropic client
class AnthropicClient {
  constructor(private apiKey: string) {}

  async complete(params: CompletionRequest) {
    console.log('Anthropic complete called with params:', {
      modelId: params.modelId,
      temperature: params.temperature,
      maxTokens: params.maxTokens,
      hasDocuments: !!params.documents,
      documentCount: params.documents?.length || 0
    });
    
    if (params.documents?.length > 0) {
      console.log('Document names:', params.documents.map(doc => doc.name));
      console.log('First document preview:', 
        params.documents[0].content.length > 100 
          ? params.documents[0].content.substring(0, 100) + '...' 
          : params.documents[0].content
      );
    }
    
    // Build the messages array with document content if available
    const messages = [];
    
    // System message will be passed as a top-level parameter, not in the messages array
    const systemMessage = params.systemMessage || "You are an AI assistant helping with Earth Science papers. If I share any documents, I'll use their content to provide more relevant and specific answers.";
    
    // Add user message with document content if available
    if (params.documents?.length > 0) {
      try {
        const userContent = [
          {
            type: "text",
            text: "Here are the relevant documents:\n\n"
          }
        ];

        // Add each document's content with length limits to avoid issues
        params.documents.forEach((doc, index) => {
          // Limit content length to avoid potential issues
          const maxContentLength = 10000; // 10KB per document
          let content = doc.content;
          if (content.length > maxContentLength) {
            console.log(`Truncating document ${doc.name} from ${content.length} to ${maxContentLength} characters`);
            content = content.substring(0, maxContentLength) + "... [content truncated]";
          }
          
          userContent.push({
            type: "text", 
            text: `Document ${index + 1}: ${doc.name}\n${content}\n\n`
          });
        });

        // Add the actual user query
        userContent.push({
          type: "text",
          text: `\nUser request: ${params.prompt}`
        });

        messages.push({
          role: "user",
          content: userContent
        });
      } catch (error) {
        console.error('Error processing documents:', error);
        // Fallback to just the prompt if document processing fails
        messages.push({
          role: "user",
          content: [{ type: "text", text: `I was trying to analyze some documents, but had trouble processing them. Here's my question: ${params.prompt}` }]
        });
      }
    } else {
      // Just add the user's prompt if no documents
      messages.push({
        role: "user",
        content: [{ type: "text", text: params.prompt }]
      });
    }

    // Prepare the request body
    const requestBody = {
      model: params.modelId,
      max_tokens: params.maxTokens || 2000,
      temperature: params.temperature || 0.7,
      messages,
      system: systemMessage
    };
    
    try {
      console.log('Sending request to Anthropic API with model:', params.modelId);
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Anthropic API error: ${response.status}`;
        
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage += ` - ${JSON.stringify(errorJson)}`;
        } catch (e) {
          errorMessage += ` - ${errorText}`;
        }
        
        console.error(errorMessage);
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      return {
        content: data.content[0]?.text || 'No response content',
        usage: {
          prompt_tokens: data.usage?.input_tokens || 0,
          completion_tokens: data.usage?.output_tokens || 0,
          total_tokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
        }
      };
    } catch (error) {
      console.error('Error calling Anthropic API:', error);
      throw error;
    }
  }

  async listModels(): Promise<ModelInfo[]> {
    try {
      console.log('Fetching Anthropic models...');
      const response = await fetch('https://api.anthropic.com/v1/models', {
        method: 'GET',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
      });

      console.log('Anthropic API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Anthropic API error: ${response.status}`;
        
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage += ` - ${JSON.stringify(errorJson)}`;
        } catch (e) {
          errorMessage += ` - ${errorText}`;
        }
        
        console.error(errorMessage);
        throw new Error(errorMessage);
      }

      // Only read the response body once
      const responseText = await response.text();
      console.log('Anthropic API response body:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Failed to parse Anthropic response: ${e.message}`);
      }

      console.log('Parsed Anthropic data:', data);

      // The Anthropic API returns { data: [ models ] }
      if (!data) {
        throw new Error('Invalid response format from Anthropic API: empty response');
      }

      // Handle the actual response format which is { data: [ models ] }
      const modelList = data.data || [];
      
      if (!Array.isArray(modelList)) {
        console.error('Unexpected model list format:', modelList);
        throw new Error('Invalid model list format from Anthropic API');
      }
      
      return modelList
        .filter((model: any) => model && model.id && model.id.startsWith('claude'))
        .map((model: any) => ({
          id: model.id,
          name: model.name || model.id,
          provider: 'anthropic'
        }));
    } catch (error) {
      console.error('Error fetching Anthropic models:', error);
      throw error; // Let the caller handle the error
    }
  }
}

// Simple OpenAI client
class OpenAIClient {
  constructor(private apiKey: string) {}

  async complete(params: CompletionRequest) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: params.modelId,
        max_tokens: params.maxTokens || 2000,
        temperature: params.temperature || 0.7,
        messages: [
          {
            role: "system",
            content: "You are an AI assistant helping with Earth Science papers. If I mention any loaded documents in the context, use that information to provide more relevant and specific answers."
          },
          {
            role: "user",
            content: params.prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      usage: {
        prompt_tokens: data.usage.prompt_tokens,
        completion_tokens: data.usage.completion_tokens,
        total_tokens: data.usage.total_tokens
      }
    };
  }

  async listModels(): Promise<ModelInfo[]> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch OpenAI models: ${response.status}`);
      }

      const data = await response.json();
      return data.data
        .filter((model: any) => model.id.startsWith('gpt'))
        .map((model: any) => ({
          id: model.id,
          name: model.id,
          provider: 'openai'
        }));
    } catch (error) {
      console.error('Error fetching OpenAI models:', error);
      return [];
    }
  }
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    console.log('Request body length:', body.length);
    console.log('Request body preview:', body.substring(0, 200) + (body.length > 200 ? '...' : ''));
    
    let params;
    try {
      params = JSON.parse(body);
    } catch (e) {
      console.error('JSON parse error:', e);
      // Try to identify where the JSON parsing failed
      let errorPosition = '';
      if (e instanceof SyntaxError && e.message.includes('position')) {
        const posMatch = e.message.match(/position (\d+)/);
        if (posMatch && posMatch[1]) {
          const pos = parseInt(posMatch[1]);
          const start = Math.max(0, pos - 20);
          const end = Math.min(body.length, pos + 20);
          errorPosition = `Error near: "${body.substring(start, end)}"`;
        }
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON in request body', 
          details: e.message,
          errorPosition: errorPosition
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { action } = params;
    console.log('Action:', action);

    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Missing action parameter' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize API clients
    const anthropicClient = new AnthropicClient(Deno.env.get('ANTHROPIC_API_KEY') || '');
    const openaiClient = new OpenAIClient(Deno.env.get('OPENAI_API_KEY') || '');

    // Handle action
    switch (action) {
      case 'complete': {
        const { prompt, modelId, temperature, maxTokens, documents, systemMessage } = params;

        if (!prompt || !modelId) {
          return new Response(
            JSON.stringify({ error: 'Missing required parameters' }),
            { 
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        // Determine provider based on model ID prefix
        const provider = modelId.startsWith('claude') ? 'anthropic' : 'openai';
        console.log('Selected provider:', provider);
        
        const client = provider === 'anthropic' ? anthropicClient : openaiClient;
        const result = await client.complete({ prompt, modelId, temperature, maxTokens, documents, systemMessage });

        return new Response(
          JSON.stringify(result),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
        );
      }

      case 'models': {
        console.log('Fetching models...');
        try {
          let anthropicModels = [];
          let openaiModels = [];
          
          try {
            anthropicModels = await anthropicClient.listModels();
            console.log('Successfully fetched Anthropic models:', anthropicModels);
          } catch (error) {
            console.error('Error fetching Anthropic models:', error);
            // Don't rethrow, just continue with empty array
          }
          
          try {
            openaiModels = await openaiClient.listModels();
            console.log('Successfully fetched OpenAI models:', openaiModels);
          } catch (error) {
            console.error('Error fetching OpenAI models:', error);
            // Don't rethrow, just continue with empty array
          }
          
          const models = [...anthropicModels, ...openaiModels];
          
          if (models.length === 0) {
            console.warn('No models were fetched from any provider');
          }
          
          console.log('Returning models:', models);
          
          return new Response(
            JSON.stringify(models),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
          );
        } catch (error) {
          console.error('Error fetching models:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to fetch models', details: error.message }),
            { 
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
