import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { earthScienceDomainService, Journal } from '@/lib/earth-science/domain-service';
import { Library, ExternalLink, TrendingUp, FileText, Globe } from 'lucide-react';

interface JournalSuggestionsProps {
  abstract: string;
}

export const JournalSuggestions: React.FC<JournalSuggestionsProps> = ({
  abstract
}) => {
  const [loading, setLoading] = useState(false);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [selectedField, setSelectedField] = useState<string>('');
  const categories = earthScienceDomainService.getCategories();

  const loadJournalSuggestions = async (field: string) => {
    setLoading(true);
    try {
      const suggestions = await earthScienceDomainService.suggestJournals(abstract, field);
      setJournals(suggestions);
    } catch (error) {
      console.error('Error loading journal suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field: string) => {
    setSelectedField(field);
    loadJournalSuggestions(field);
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Library className="h-4 w-4" />
          Journal Suggestions
        </h3>
      </div>

      <div className="space-y-2">
        <Select value={selectedField} onValueChange={handleFieldChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select field of study" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Library className="h-4 w-4 animate-pulse mr-2" />
          <span className="text-sm">Finding relevant journals...</span>
        </div>
      ) : journals.length > 0 ? (
        <ScrollArea className="h-[400px]">
          <div className="space-y-4">
            {journals.map((journal) => (
              <Card key={journal.name} className="p-4 space-y-3">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium">{journal.name}</h4>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      IF: {journal.impactFactor}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {journal.publisher}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {journal.scope.map((topic) => (
                    <Badge key={topic} variant="outline">
                      {topic}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  Citation Style: {journal.citationStyle}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => window.open(journal.website, '_blank')}
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    Visit Journal
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => window.open(journal.submissionGuidelines, '_blank')}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Guidelines
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      ) : selectedField && (
        <div className="text-center py-4 text-sm text-muted-foreground">
          No journal suggestions found for the selected field.
        </div>
      )}
    </Card>
  );
};

export default JournalSuggestions;
