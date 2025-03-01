import React, { useEffect, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Settings, ChevronDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { aiService, type ModelInfo } from '@/lib/ai-service';
import { toast } from "@/components/ui/use-toast";

interface ModelSettingsProps {
  className?: string;
  onSettingsChange?: (settings: ModelSettingsState) => void;
}

export interface ModelSettingsState {
  model: string;
  temperature: number;
  maxTokens: number;
  role: string;
  preset: string;
  factChecking: {
    enabled: boolean;
    autoVerify: boolean;
    minConfidence: number;
    strictMode: boolean;
  };
}

const ModelSettings = ({ className, onSettingsChange }: ModelSettingsProps) => {
  const [settings, setSettings] = React.useState<ModelSettingsState>({
    model: '',  
    temperature: 0.7,
    maxTokens: 2000,
    role: "assistant",
    preset: "default",
    factChecking: {
      enabled: true,
      autoVerify: true,
      minConfidence: 0.7,
      strictMode: false,
    }
  });

  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadModels = async () => {
      try {
        setLoading(true);
        const availableModels = await aiService.getAvailableModels();
        if (availableModels.length === 0) {
          throw new Error('No models available');
        }
        setModels(availableModels);
        
        // Set default model if none selected
        if (!settings.model && availableModels.length > 0) {
          updateSettings({ model: availableModels[0].id });
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Failed to load models:', error);
        toast({
          title: "Error Loading Models",
          description: error.message,
          variant: "destructive",
          duration: 5000
        });
      } finally {
        setLoading(false);
      }
    };
    loadModels();
  }, []);

  const roles = [
    { id: 'assistant', name: 'General Assistant' },
    { id: 'co-author', name: 'Co-author' },
    { id: 'editor', name: 'Editor' },
    { id: 'reviewer', name: 'Reviewer' },
    { id: 'fact-checker', name: 'Fact Checker' }
  ];

  const updateSettings = (updates: Partial<ModelSettingsState>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    onSettingsChange?.(newSettings);
  };

  if (loading) return <div>Loading models...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  const anthropicModels = models.filter(m => m.provider === 'anthropic');
  const openaiModels = models.filter(m => m.provider === 'openai');

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="text-muted-foreground h-8 w-8"
          title="AI settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Model</h4>
            <Select value={settings.model} onValueChange={(value) => updateSettings({ model: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {anthropicModels.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>Anthropic</SelectLabel>
                    {anthropicModels.map(model => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
                {openaiModels.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>OpenAI</SelectLabel>
                    {openaiModels.map(model => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
                {anthropicModels.length === 0 && openaiModels.length === 0 && (
                  <SelectItem value="" disabled>No models available</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium leading-none">Role</h4>
            <Select 
              value={settings.role} 
              onValueChange={(role) => {
                const newSettings = { ...settings, role };
                if (role === 'fact-checker') {
                  const sonnetModel = models.find(m => m.id === 'claude-3-sonnet');
                  if (sonnetModel) {
                    console.log('Setting fact-checker model:', sonnetModel.id);
                    newSettings.model = sonnetModel.id;
                  }
                }
                updateSettings(newSettings);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium leading-none">Preset</h4>
            <Select 
              value={settings.preset} 
              onValueChange={(value) => updateSettings({ preset: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select preset" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="drafting">Drafting</SelectItem>
                <SelectItem value="editing">Editing</SelectItem>
                <SelectItem value="polishing">Polishing</SelectItem>
                <SelectItem value="citation">Citation & References</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium leading-none">Temperature ({settings.temperature})</h4>
            <Slider
              value={[settings.temperature]}
              min={0}
              max={1}
              step={0.1}
              onValueChange={([temperature]) => updateSettings({ temperature })}
            />
            <p className="text-xs text-muted-foreground">
              Lower values create more predictable responses, higher values more creative.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium leading-none">Max Length ({settings.maxTokens})</h4>
            <Slider
              value={[settings.maxTokens]}
              min={100}
              max={settings.role === 'fact-checker' ? 200000 : 8192}
              step={100}
              onValueChange={([maxTokens]) => updateSettings({ maxTokens })}
            />
            <p className="text-xs text-muted-foreground">
              Maximum response length in tokens.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium leading-none">Fact Checking</h4>
            
            <div className="flex items-center justify-between">
              <h4 className="font-medium leading-none">Enable Fact Checking</h4>
              <Switch
                checked={settings.factChecking.enabled}
                onCheckedChange={(checked) => updateSettings({ factChecking: { ...settings.factChecking, enabled: checked } })}
              />
            </div>

            {settings.factChecking.enabled && (
              <>
                <div className="flex items-center justify-between">
                  <h4 className="font-medium leading-none">Auto-verify Claims</h4>
                  <Switch
                    checked={settings.factChecking.autoVerify}
                    onCheckedChange={(checked) => updateSettings({ factChecking: { ...settings.factChecking, autoVerify: checked } })}
                  />
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium leading-none">
                    Minimum Confidence: {Math.round(settings.factChecking.minConfidence * 100)}%
                  </h4>
                  <Slider
                    value={[settings.factChecking.minConfidence]}
                    min={0.5}
                    max={1}
                    step={0.05}
                    onValueChange={([minConfidence]) => updateSettings({ factChecking: { ...settings.factChecking, minConfidence } })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum confidence required to consider a claim verified.
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <h4 className="font-medium leading-none">Strict Mode</h4>
                  <Switch
                    checked={settings.factChecking.strictMode}
                    onCheckedChange={(checked) => updateSettings({ factChecking: { ...settings.factChecking, strictMode: checked } })}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  In strict mode, only claims with high confidence and multiple sources are accepted.
                </p>
              </>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ModelSettings;
