import {
  Movie,
  MovieSearchResult,
  FavoritesList,
} from "../../model/movie.model";

/**
 * Inbound port defining the use cases for movie operations.
 * This interface is implemented by the domain service and used by the application layer.
 */
export interface MovieFacade {
  /**
   * Search movies by title with pagination.
   * @param title - The search query
   * @param page - The page number (1-based)
   * @returns Search results with movies and total count
   */
  searchMovies(title: string, page: number): Promise<MovieSearchResult>;

  /**
   * Add a movie to favorites.
   * @param movie - The movie to add
   * @returns The added movie
   * @throws ConflictException if movie already exists in favorites
   */
  addToFavorites(movie: Movie): Promise<Movie>;

  /**
   * Remove a movie from favorites.
   * @param imdbID - The IMDb ID of the movie to remove
   * @returns The removed movie
   * @throws NotFoundException if movie not found in favorites
   */
  removeFromFavorites(imdbID: string): Promise<Movie>;

  /**
   * Get paginated list of favorite movies.
   * @param page - The page number (1-based)
   * @param pageSize - Number of items per page
   * @returns Paginated favorites list
   */
  getFavorites(page: number, pageSize: number): Promise<FavoritesList>;
}

export const MOVIE_FACADE = "MovieFacade";
