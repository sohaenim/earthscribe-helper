import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Split } from '@/components/ui/split';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Save, FileText } from 'lucide-react';

import TerminologyAssistant from './TerminologyAssistant';
import JournalSuggestions from './JournalSuggestions';

interface PaperEditorProps {
  initialContent?: string;
  onSave?: (content: string) => void;
}

export const PaperEditor: React.FC<PaperEditorProps> = ({
  initialContent = '',
  onSave
}) => {
  const [content, setContent] = useState(initialContent);
  const [selectedTab, setSelectedTab] = useState('terminology');

  const handleSave = () => {
    onSave?.(content);
  };

  const handleTermClick = (term: string) => {
    // In the future, we could implement features like:
    // - Highlighting all instances of the term
    // - Adding the term to a glossary
    // - Suggesting related references
    console.log('Term clicked:', term);
  };

  return (
    <Split className="h-[calc(100vh-4rem)]">
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between p-2 border-b">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="text-sm font-medium">Paper Editor</span>
          </div>
          <Button size="sm" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 resize-none p-4 font-mono text-sm"
          placeholder="Start writing your paper..."
        />
      </div>

      <Card className="w-80 flex flex-col">
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="w-full">
            <TabsTrigger value="terminology" className="flex-1">
              Terminology
            </TabsTrigger>
            <TabsTrigger value="journals" className="flex-1">
              Journals
            </TabsTrigger>
          </TabsList>
          <ScrollArea className="flex-1">
            <TabsContent value="terminology" className="m-0">
              <TerminologyAssistant
                text={content}
                onTermClick={handleTermClick}
              />
            </TabsContent>
            <TabsContent value="journals" className="m-0">
              <JournalSuggestions abstract={content} />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </Card>
    </Split>
  );
};

export default PaperEditor;
