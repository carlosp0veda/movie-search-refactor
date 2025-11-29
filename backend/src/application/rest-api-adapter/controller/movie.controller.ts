import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  Inject,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
} from "@nestjs/common";
import type { MovieFacade } from "../../../domain/port/in/movie.facade";
import { MOVIE_FACADE } from "../../../domain/port/in/movie.facade";
import {
  CreateMovieDto,
  SearchResultsDto,
  FavoritesListDto,
  MessageResponseDto,
} from "../dto/movie.dto";

/**
 * REST API controller for movie operations.
 * This is an application layer adapter that connects HTTP requests to the domain.
 */
@Controller("movies")
export class MovieController {
  constructor(
    @Inject(MOVIE_FACADE)
    private readonly movieFacade: MovieFacade,
  ) {}

  /**
   * Search movies by title.
   * GET /movies/search?q=title&page=1
   */
  @Get("search")
  async searchMovies(
    @Query("q") query: string,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
  ) {
    if (!query || query.trim().length === 0) {
      return SearchResultsDto.create([], "0");
    }

    const validPage = Math.max(1, page);
    const result = await this.movieFacade.searchMovies(query.trim(), validPage);

    return SearchResultsDto.create(result.movies, result.totalResults);
  }

  /**
   * Add a movie to favorites.
   * POST /movies/favorites
   */
  @Post("favorites")
  @HttpCode(HttpStatus.CREATED)
  async addToFavorites(@Body() createMovieDto: CreateMovieDto) {
    const movie = createMovieDto.toDomain();
    const savedMovie = await this.movieFacade.addToFavorites(movie);

    return MessageResponseDto.create("Movie added to favorites", savedMovie);
  }

  /**
   * Remove a movie from favorites.
   * DELETE /movies/favorites/:imdbID
   */
  @Delete("favorites/:imdbID")
  @HttpCode(HttpStatus.OK)
  async removeFromFavorites(@Param("imdbID") imdbID: string) {
    if (!imdbID || imdbID.trim().length === 0) {
      return { error: "Movie ID is required" };
    }

    const removedMovie = await this.movieFacade.removeFromFavorites(
      imdbID.trim(),
    );

    return MessageResponseDto.create(
      "Movie removed from favorites",
      removedMovie,
    );
  }

  /**
   * Get paginated list of favorite movies.
   * GET /movies/favorites/list?page=1&pageSize=10
   */
  @Get("favorites/list")
  async getFavorites(
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("pageSize", new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
  ) {
    const validPage = Math.max(1, page);
    const validPageSize = Math.min(100, Math.max(1, pageSize));

    const result = await this.movieFacade.getFavorites(
      validPage,
      validPageSize,
    );

    return FavoritesListDto.create(
      result.favorites,
      result.count,
      result.totalResults,
      result.currentPage,
      result.totalPages,
    );
  }
}
