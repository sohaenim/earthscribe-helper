import React from 'react';
import { CheckCircle, AlertCircle, HelpCircle, ExternalLink } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { FactCheckResult, Source } from '@/lib/fact-checking';

interface FactCheckIndicatorProps {
  result?: FactCheckResult;
  isChecking?: boolean;
  onRequestAlternatives?: () => void;
}

export const FactCheckIndicator: React.FC<FactCheckIndicatorProps> = ({
  result,
  isChecking,
  onRequestAlternatives
}) => {
  if (isChecking) {
    return (
      <div className="flex items-center text-muted-foreground">
        <HelpCircle className="h-4 w-4 animate-pulse mr-1" />
        <span className="text-sm">Verifying...</span>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  const { isVerified, confidence, sources, alternativeSources } = result;

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-500';
    if (score >= 0.6) return 'text-yellow-500';
    return 'text-red-500';
  };

  const renderSource = (source: Source) => (
    <div key={source.url} className="space-y-1 py-2">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-medium">{source.title}</h4>
          <p className="text-sm text-muted-foreground">{source.publisher}, {source.year}</p>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <a href={source.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </div>
      <div className="flex gap-2">
        <Badge variant={source.credibilityScore >= 0.8 ? "default" : "secondary"}>
          Credibility: {Math.round(source.credibilityScore * 100)}%
        </Badge>
        <Badge variant={source.relevanceScore >= 0.8 ? "default" : "secondary"}>
          Relevance: {Math.round(source.relevanceScore * 100)}%
        </Badge>
      </div>
    </div>
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className={`gap-1.5 ${isVerified ? 'text-green-500' : 'text-red-500'}`}
        >
          {isVerified ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <span className="text-sm">
            {isVerified ? 'Verified' : 'Unverified'}
          </span>
          <span className={`text-sm ${getConfidenceColor(confidence)}`}>
            ({Math.round(confidence * 100)}%)
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">Verification Sources</h3>
            <p className="text-sm text-muted-foreground">
              Based on {sources.length} academic source{sources.length !== 1 ? 's' : ''}
            </p>
          </div>

          <ScrollArea className="h-[200px] pr-4">
            {sources.map(renderSource)}
            
            {alternativeSources && alternativeSources.length > 0 && (
              <>
                <Separator className="my-2" />
                <div>
                  <h4 className="font-medium mb-2">Alternative Sources</h4>
                  {alternativeSources.map(renderSource)}
                </div>
              </>
            )}
          </ScrollArea>

          {!isVerified && !alternativeSources && (
            <Button 
              variant="secondary" 
              size="sm" 
              className="w-full"
              onClick={onRequestAlternatives}
            >
              Find Alternative Sources
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default FactCheckIndicator;
