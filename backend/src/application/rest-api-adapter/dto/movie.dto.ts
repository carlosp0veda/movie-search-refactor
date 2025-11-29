import { IsString, IsNotEmpty, IsOptional, IsBoolean } from "class-validator";
import { Transform } from "class-transformer";
import { Movie } from "../../../domain/model/movie.model";

/**
 * DTO for creating/adding a movie to favorites.
 */
export class CreateMovieDto {
  @IsString()
  @IsNotEmpty({ message: "Title is required" })
  @Transform(({ value }: { value: string }) => value?.trim())
  title: string;

  @IsString()
  @IsNotEmpty({ message: "IMDb ID is required" })
  @Transform(({ value }: { value: string }) => value?.trim())
  imdbID: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }: { value: string }) => value?.trim())
  year?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }: { value: string }) => value?.trim())
  poster?: string;

  @IsBoolean()
  @IsOptional()
  isFavorite?: boolean;

  /**
   * Convert DTO to domain model.
   */
  toDomain(): Movie {
    return {
      title: this.title,
      imdbID: this.imdbID,
      year: this.year || "",
      poster: this.poster || "",
      isFavorite: this.isFavorite,
    };
  }
}

/**
 * DTO for movie response.
 */
export class MovieResponseDto {
  title: string;
  imdbID: string;
  year: string;
  poster: string;
  isFavorite: boolean;

  /**
   * Create DTO from domain model.
   */
  static fromDomain(movie: Movie): MovieResponseDto {
    const dto = new MovieResponseDto();
    dto.title = movie.title;
    dto.imdbID = movie.imdbID;
    dto.year = movie.year;
    dto.poster = movie.poster;
    dto.isFavorite = movie.isFavorite ?? false;
    return dto;
  }
}

/**
 * DTO for search results response.
 */
export class SearchResultsDto {
  movies: MovieResponseDto[];
  count: number;
  totalResults: string;

  static create(
    movies: Movie[],
    totalResults: string,
  ): { data: SearchResultsDto } {
    const dto = new SearchResultsDto();
    dto.movies = movies.map((movie) => MovieResponseDto.fromDomain(movie));
    dto.count = movies.length;
    dto.totalResults = totalResults;
    return { data: dto };
  }
}

/**
 * DTO for favorites list response.
 */
export class FavoritesListDto {
  favorites: MovieResponseDto[];
  count: number;
  totalResults: string;
  currentPage: number;
  totalPages: number;

  static create(
    favorites: Movie[],
    count: number,
    totalResults: string,
    currentPage: number,
    totalPages: number,
  ): { data: FavoritesListDto } {
    const dto = new FavoritesListDto();
    dto.favorites = favorites.map((movie) =>
      MovieResponseDto.fromDomain(movie),
    );
    dto.count = count;
    dto.totalResults = totalResults;
    dto.currentPage = currentPage;
    dto.totalPages = totalPages;
    return { data: dto };
  }
}

/**
 * DTO for success message response.
 */
export class MessageResponseDto {
  message: string;
  movie?: MovieResponseDto;

  static create(message: string, movie?: Movie): { data: MessageResponseDto } {
    const dto = new MessageResponseDto();
    dto.message = message;
    if (movie) {
      dto.movie = MovieResponseDto.fromDomain(movie);
    }
    return { data: dto };
  }
}
