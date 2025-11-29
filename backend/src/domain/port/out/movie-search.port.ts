import { MovieSearchResult } from "../../model/movie.model";

/**
 * Outbound port for searching movies from an external source.
 * This interface is implemented by infrastructure adapters (e.g., OMDb API).
 */
export interface MovieSearchPort {
  /**
   * Search movies by title.
   * @param title - The search query
   * @param page - The page number (1-based)
   * @returns Search results from the external source
   */
  search(title: string, page: number): Promise<MovieSearchResult>;
}

export const MOVIE_SEARCH_PORT = "MovieSearchPort";
