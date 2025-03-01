-- Drop triggers first
drop trigger if exists update_earth_science_terms_updated_at on earth_science_terms;
drop trigger if exists update_journal_suggestions_updated_at on journal_suggestions;
drop trigger if exists update_citation_patterns_updated_at on citation_patterns;
drop trigger if exists journal_suggestions_search_vector_trigger on journal_suggestions;

-- Drop functions
drop function if exists update_updated_at_column();
drop function if exists journal_suggestions_search_vector_update();

-- Drop tables (this will also drop their indexes and policies)
drop table if exists earth_science_terms;
drop table if exists journal_suggestions;
drop table if exists citation_patterns;
