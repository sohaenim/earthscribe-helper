import { supabase } from '@/integrations/supabase/client';

export interface Journal {
  name: string;
  publisher: string;
  impactFactor: number;
  scope: string[];
  citationStyle: string;
  website: string;
  submissionGuidelines: string;
}

export interface Term {
  term: string;
  definition: string;
  category: string[];
  relatedTerms: string[];
  sources: string[];
}

export interface CitationPattern {
  field: string;
  pattern: string;
  example: string;
  frequency: number; // How often this pattern appears in the field
}

class EarthScienceDomainService {
  private static readonly CATEGORIES = [
    'Geology',
    'Atmospheric Science',
    'Oceanography',
    'Climate Science',
    'Geophysics',
    'Hydrology',
    'Mineralogy',
    'Paleontology',
    'Environmental Science',
    'Biogeochemistry'
  ];

  /**
   * Get relevant journals based on the paper's content and field
   */
  async suggestJournals(abstract: string, field: string): Promise<Journal[]> {
    try {
      // First check our cached suggestions
      const { data: cached } = await supabase
        .from('journal_suggestions')
        .select('*')
        .textSearch('content', abstract)
        .eq('field', field)
        .limit(5);

      if (cached?.length) {
        return cached as Journal[];
      }

      // For now, return mock data - in production this would connect to a journal database
      return [
        {
          name: "Journal of Geophysical Research: Earth Surface",
          publisher: "AGU/Wiley",
          impactFactor: 4.13,
          scope: ["Geology", "Geophysics", "Earth Surface Processes"],
          citationStyle: "AGU",
          website: "https://agupubs.onlinelibrary.wiley.com/journal/21699011",
          submissionGuidelines: "https://agupubs.onlinelibrary.wiley.com/hub/journal/21699011/author-guidelines"
        },
        {
          name: "Earth and Planetary Science Letters",
          publisher: "Elsevier",
          impactFactor: 5.255,
          scope: ["Earth Science", "Planetary Science"],
          citationStyle: "Elsevier - Harvard",
          website: "https://www.journals.elsevier.com/earth-and-planetary-science-letters",
          submissionGuidelines: "https://www.elsevier.com/journals/earth-and-planetary-science-letters/0012-821x/guide-for-authors"
        }
      ];
    } catch (error) {
      console.error('Error suggesting journals:', error);
      return [];
    }
  }

  /**
   * Get definition and context for Earth Science terminology
   */
  async getTermDefinition(term: string): Promise<Term | null> {
    try {
      // Check cached terms
      const { data: cached } = await supabase
        .from('earth_science_terms')
        .select('*')
        .eq('term', term.toLowerCase())
        .single();

      if (cached) {
        return cached as Term;
      }

      // For now return mock data - in production this would connect to a terminology database
      if (term.toLowerCase() === 'subduction') {
        return {
          term: 'Subduction',
          definition: 'A geological process where one tectonic plate moves under another and sinks into the mantle.',
          category: ['Geology', 'Plate Tectonics'],
          relatedTerms: ['Convergent Boundary', 'Oceanic Crust', 'Continental Crust'],
          sources: ['USGS Plate Tectonics Guide', 'Nature Geoscience']
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching term definition:', error);
      return null;
    }
  }

  /**
   * Analyze text for Earth Science terminology and suggest definitions
   */
  async analyzePaperTerminology(text: string): Promise<Term[]> {
    try {
      // In production, this would use NLP to identify domain-specific terms
      // For now, using a simple mock implementation
      const terms = text.toLowerCase().match(/\b(subduction|lithosphere|magma|seismic|stratigraphy)\b/g) || [];
      
      const definitions = await Promise.all(
        [...new Set(terms)].map(term => this.getTermDefinition(term))
      );

      return definitions.filter((def): def is Term => def !== null);
    } catch (error) {
      console.error('Error analyzing terminology:', error);
      return [];
    }
  }

  /**
   * Get common citation patterns for a specific field
   */
  async getCitationPatterns(field: string): Promise<CitationPattern[]> {
    try {
      const { data: patterns } = await supabase
        .from('citation_patterns')
        .select('*')
        .eq('field', field)
        .order('frequency', { ascending: false })
        .limit(5);

      if (patterns?.length) {
        return patterns as CitationPattern[];
      }

      // Mock data for common patterns
      return [
        {
          field: 'Geology',
          pattern: 'Method (Author, Year)',
          example: 'Using U-Pb dating (Smith et al., 2024)',
          frequency: 0.85
        },
        {
          field: 'Geology',
          pattern: 'Result + Citation',
          example: 'The zircon ages indicate Precambrian formation (Jones & Lee, 2023)',
          frequency: 0.75
        }
      ];
    } catch (error) {
      console.error('Error fetching citation patterns:', error);
      return [];
    }
  }

  /**
   * Get all available Earth Science categories
   */
  getCategories(): string[] {
    return EarthScienceDomainService.CATEGORIES;
  }
}

export const earthScienceDomainService = new EarthScienceDomainService();
