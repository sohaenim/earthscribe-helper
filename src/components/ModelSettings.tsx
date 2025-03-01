import React, { useEffect, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, ChevronDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { aiService, type ModelInfo } from '@/lib/ai-service';

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
    model: 'default',
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
    async function loadModels() {
      try {
        console.log('Fetching models...');
        const availableModels = await aiService.getAvailableModels();
        console.log('Received models:', availableModels);
        setModels(availableModels);
        setLoading(false);
      } catch (err) {
        console.error('Error loading models:', err);
        setError('Failed to load available models');
        setLoading(false);
      }
    }
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

  const updateFactChecking = (updates: Partial<ModelSettingsState['factChecking']>) => {
    updateSettings({
      factChecking: { ...settings.factChecking, ...updates }
    });
  };

  if (loading) return <div>Loading models...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={cn("gap-1.5", className)}
        >
          <Settings className="h-3.5 w-3.5" />
          <span>AI Settings</span>
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80" 
        align="end" 
        side="bottom" 
        sideOffset={5}
        collisionPadding={20}
        avoidCollisions={false}
      >
        <div className="space-y-4">
          <h3 className="font-medium text-sm">Model Configuration</h3>
          
          <div className="space-y-2">
            <Label>Model</Label>
            <Select 
              value={settings.model} 
              onValueChange={(model) => updateSettings({ model })}
              disabled={settings.role === 'fact-checker'}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name} ({model.provider})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {settings.role === 'fact-checker' && (
              <p className="text-sm text-muted-foreground">
                Using Claude 3 Sonnet for fact checking
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Select 
              value={settings.role} 
              onValueChange={(role) => {
                const newSettings = { ...settings, role };
                if (role === 'fact-checker') {
                  newSettings.model = 'claude-3-sonnet';
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
            <Label>Preset</Label>
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
            <div className="flex items-center justify-between">
              <Label>Temperature ({settings.temperature})</Label>
            </div>
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
            <div className="flex items-center justify-between">
              <Label>Max Length ({settings.maxTokens})</Label>
            </div>
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
            <h3 className="font-medium text-sm">Fact Checking</h3>
            
            <div className="flex items-center justify-between">
              <Label>Enable Fact Checking</Label>
              <Switch
                checked={settings.factChecking.enabled}
                onCheckedChange={(checked) => updateFactChecking({ enabled: checked })}
              />
            </div>

            {settings.factChecking.enabled && (
              <>
                <div className="flex items-center justify-between">
                  <Label>Auto-verify Claims</Label>
                  <Switch
                    checked={settings.factChecking.autoVerify}
                    onCheckedChange={(checked) => updateFactChecking({ autoVerify: checked })}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>
                      Minimum Confidence: {Math.round(settings.factChecking.minConfidence * 100)}%
                    </Label>
                  </div>
                  <Slider
                    value={[settings.factChecking.minConfidence]}
                    min={0.5}
                    max={1}
                    step={0.05}
                    onValueChange={([minConfidence]) => updateFactChecking({ minConfidence })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum confidence required to consider a claim verified.
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <Label>Strict Mode</Label>
                  <Switch
                    checked={settings.factChecking.strictMode}
                    onCheckedChange={(checked) => updateFactChecking({ strictMode: checked })}
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
