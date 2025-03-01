
import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, ChevronDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ModelSettingsProps {
  className?: string;
}

const ModelSettings = ({ className }: ModelSettingsProps) => {
  const [temperature, setTemperature] = React.useState(0.7);
  const [maxTokens, setMaxTokens] = React.useState(2000);
  const [role, setRole] = React.useState("assistant");
  const [preset, setPreset] = React.useState("default");
  
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
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <h3 className="font-medium text-sm">Model Configuration</h3>
          
          <div className="space-y-2">
            <Label htmlFor="preset">Preset</Label>
            <Select value={preset} onValueChange={setPreset}>
              <SelectTrigger id="preset">
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
            <Label htmlFor="role">Assistant Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="assistant">General Assistant</SelectItem>
                <SelectItem value="co-author">Co-Author</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="reviewer">Reviewer</SelectItem>
                <SelectItem value="proofreader">Proofreader</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="temperature">Temperature: {temperature}</Label>
            </div>
            <Slider
              id="temperature"
              min={0}
              max={1}
              step={0.1}
              value={[temperature]}
              onValueChange={(value) => setTemperature(value[0])}
            />
            <p className="text-xs text-muted-foreground">
              Lower values create more predictable responses, higher values more creative.
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="maxTokens">Max Length: {maxTokens}</Label>
            </div>
            <Slider
              id="maxTokens"
              min={500}
              max={4000}
              step={100}
              value={[maxTokens]}
              onValueChange={(value) => setMaxTokens(value[0])}
            />
            <p className="text-xs text-muted-foreground">
              Maximum response length in tokens.
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ModelSettings;
