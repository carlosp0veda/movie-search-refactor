import { Injectable, Inject, Logger } from "@nestjs/common";
import { Movie, MovieSearchResult, FavoritesList } from "../model/movie.model";
import { MovieFacade } from "../port/in/movie.facade";
import type { MovieSearchPort } from "../port/out/movie-search.port";
import { MOVIE_SEARCH_PORT } from "../port/out/movie-search.port";
import type { FavoritesStoragePort } from "../port/out/favorites-storage.port";
import { FAVORITES_STORAGE_PORT } from "../port/out/favorites-storage.port";
import {
  MovieNotFoundException,
  MovieAlreadyExistsException,
  InvalidMovieDataException,
  InvalidPaginationException,
  SearchQueryRequiredException,
} from "../exception/domain.exceptions";

/**
 * Domain service implementing the MovieFacade.
 * Contains the core business logic for movie operations.
 */
@Injectable()
export class MovieService implements MovieFacade {
  private readonly logger = new Logger(MovieService.name);

  constructor(
    @Inject(MOVIE_SEARCH_PORT)
    private readonly movieSearchPort: MovieSearchPort,
    @Inject(FAVORITES_STORAGE_PORT)
    private readonly favoritesStoragePort: FavoritesStoragePort,
  ) {}

  async searchMovies(title: string, page: number): Promise<MovieSearchResult> {
    if (!title || title.trim().length === 0) {
      throw new SearchQueryRequiredException();
    }

    if (page < 1 || !Number.isInteger(page)) {
      throw new InvalidPaginationException("Page must be a positive integer");
    }

    this.logger.debug(`Searching movies with title: "${title}", page: ${page}`);

    const searchResult = await this.movieSearchPort.search(title.trim(), page);

    const enrichedMovies = await Promise.all(
      searchResult.movies.map(async (movie) => {
        const isFavorite = await this.favoritesStoragePort.exists(movie.imdbID);
        return { ...movie, isFavorite };
      }),
    );

    return {
      movies: enrichedMovies,
      totalResults: searchResult.totalResults,
    };
  }

  async addToFavorites(movie: Movie): Promise<Movie> {
    if (!movie.imdbID || !movie.title) {
      throw new InvalidMovieDataException("Movie must have imdbID and title");
    }

    const exists = await this.favoritesStoragePort.exists(movie.imdbID);
    if (exists) {
      throw new MovieAlreadyExistsException(movie.imdbID);
    }

    const movieToSave: Movie = {
      title: String(movie.title).trim(),
      imdbID: String(movie.imdbID).trim(),
      year: movie.year,
      poster: movie.poster,
    };

    const savedMovie = await this.favoritesStoragePort.save(movieToSave);
    this.logger.log(`Added movie to favorites: ${savedMovie.imdbID}`);

    return savedMovie;
  }

  async removeFromFavorites(imdbID: string): Promise<Movie> {
    if (!imdbID || imdbID.trim().length === 0) {
      throw new InvalidMovieDataException("Movie ID is required");
    }

    const removedMovie = await this.favoritesStoragePort.remove(imdbID.trim());

    if (!removedMovie) {
      throw new MovieNotFoundException(imdbID);
    }

    this.logger.log(`Removed movie from favorites: ${imdbID}`);
    return removedMovie;
  }

  async getFavorites(page: number, pageSize: number): Promise<FavoritesList> {
    if (page < 1 || !Number.isInteger(page)) {
      throw new InvalidPaginationException("Page must be a positive integer");
    }
    if (pageSize < 1 || pageSize > 100 || !Number.isInteger(pageSize)) {
      throw new InvalidPaginationException(
        "Page size must be between 1 and 100",
      );
    }

    const allFavorites = await this.favoritesStoragePort.findAll();
    const totalCount = allFavorites.length;

    if (totalCount === 0) {
      return {
        favorites: [],
        count: 0,
        totalResults: 0,
        currentPage: page,
        totalPages: 0,
      };
    }

    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedFavorites = allFavorites.slice(startIndex, endIndex);
    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      favorites: paginatedFavorites,
      count: paginatedFavorites.length,
      totalResults: totalCount,
      currentPage: page,
      totalPages,
    };
  }
}
