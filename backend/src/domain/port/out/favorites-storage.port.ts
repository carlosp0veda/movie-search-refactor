import { Movie } from "../../model/movie.model";

/**
 * Outbound port for persisting favorite movies.
 * This interface is implemented by infrastructure adapters (e.g., file storage, database).
 */
export interface FavoritesStoragePort {
  /**
   * Get all favorite movies.
   * @returns Array of favorite movies
   */
  findAll(): Promise<Movie[]>;

  /**
   * Find a favorite movie by its IMDb ID.
   * @param imdbID - The IMDb ID to search for
   * @returns The movie if found, undefined otherwise
   */
  findByImdbId(imdbID: string): Promise<Movie | undefined>;

  /**
   * Check if a movie exists in favorites.
   * @param imdbID - The IMDb ID to check
   * @returns True if the movie exists in favorites
   */
  exists(imdbID: string): Promise<boolean>;

  /**
   * Save a movie to favorites.
   * @param movie - The movie to save
   * @returns The saved movie
   */
  save(movie: Movie): Promise<Movie>;

  /**
   * Remove a movie from favorites.
   * @param imdbID - The IMDb ID of the movie to remove
   * @returns The removed movie if found
   */
  remove(imdbID: string): Promise<Movie | undefined>;

  /**
   * Get the total count of favorites.
   * @returns The number of favorite movies
   */
  count(): Promise<number>;
}

export const FAVORITES_STORAGE_PORT = "FavoritesStoragePort";
