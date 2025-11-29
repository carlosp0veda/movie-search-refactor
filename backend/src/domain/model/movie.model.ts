/**
 * Domain model representing a Movie entity.
 * This is the core business entity, independent of any technical implementation.
 */
export interface Movie {
  readonly title: string;
  readonly imdbID: string;
  readonly year: string;
  readonly poster: string;
  readonly isFavorite?: boolean;
}

/**
 * Domain model for paginated movie search results.
 */
export interface MovieSearchResult {
  readonly movies: Movie[];
  readonly totalResults: string;
}

/**
 * Domain model for paginated favorites list.
 */
export interface FavoritesList {
  readonly favorites: Movie[];
  readonly count: number;
  readonly totalResults: string;
  readonly currentPage: number;
  readonly totalPages: number;
}
