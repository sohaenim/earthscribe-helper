import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { earthScienceDomainService, Term } from '@/lib/earth-science/domain-service';
import { Book, Info, Link as LinkIcon } from 'lucide-react';

interface TerminologyAssistantProps {
  text: string;
  onTermClick?: (term: string) => void;
}

export const TerminologyAssistant: React.FC<TerminologyAssistantProps> = ({
  text,
  onTermClick
}) => {
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);

  useEffect(() => {
    const analyzeText = async () => {
      if (!text.trim()) return;
      
      setLoading(true);
      try {
        const foundTerms = await earthScienceDomainService.analyzePaperTerminology(text);
        setTerms(foundTerms);
      } catch (error) {
        console.error('Error analyzing terminology:', error);
      } finally {
        setLoading(false);
      }
    };

    analyzeText();
  }, [text]);

  const handleTermClick = (term: Term) => {
    setSelectedTerm(term);
    onTermClick?.(term.term);
  };

  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center space-x-2">
          <Book className="h-4 w-4 animate-pulse" />
          <span className="text-sm">Analyzing terminology...</span>
        </div>
      </Card>
    );
  }

  if (!terms.length) {
    return null;
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Book className="h-4 w-4" />
          Earth Science Terms
        </h3>
        <Badge variant="secondary">
          {terms.length} term{terms.length !== 1 ? 's' : ''} found
        </Badge>
      </div>

      <ScrollArea className="h-[200px]">
        <div className="space-y-2">
          {terms.map((term) => (
            <Popover key={term.term}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-left font-normal"
                  onClick={() => handleTermClick(term)}
                >
                  <Info className="h-4 w-4 mr-2" />
                  {term.term}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">{term.term}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {term.definition}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">Categories</h5>
                    <div className="flex flex-wrap gap-2">
                      {term.category.map((cat) => (
                        <Badge key={cat} variant="outline">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {term.relatedTerms.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium">Related Terms</h5>
                      <div className="flex flex-wrap gap-2">
                        {term.relatedTerms.map((related) => (
                          <Button
                            key={related}
                            variant="ghost"
                            size="sm"
                            className="h-6"
                            onClick={() => onTermClick?.(related)}
                          >
                            {related}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">Sources</h5>
                    <div className="space-y-1">
                      {term.sources.map((source) => (
                        <div
                          key={source}
                          className="text-sm text-muted-foreground flex items-center gap-2"
                        >
                          <LinkIcon className="h-3 w-3" />
                          {source}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};

export default TerminologyAssistant;
