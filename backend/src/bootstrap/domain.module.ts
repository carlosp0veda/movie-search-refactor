import { Module } from "@nestjs/common";
import { InfrastructureModule } from "./infrastructure.module";
import { MovieService } from "../domain/service/movie.service";
import { MOVIE_FACADE } from "../domain/port/in/movie.facade";
import {
  MovieSearchPort,
  MOVIE_SEARCH_PORT,
} from "../domain/port/out/movie-search.port";
import {
  FavoritesStoragePort,
  FAVORITES_STORAGE_PORT,
} from "../domain/port/out/favorites-storage.port";

/**
 * Module that provides domain services.
 * Uses factory pattern to inject outbound ports into domain services.
 */
@Module({
  imports: [InfrastructureModule],
  providers: [
    {
      provide: MOVIE_FACADE,
      useFactory: (
        movieSearchPort: MovieSearchPort,
        favoritesStoragePort: FavoritesStoragePort,
      ) => new MovieService(movieSearchPort, favoritesStoragePort),
      inject: [MOVIE_SEARCH_PORT, FAVORITES_STORAGE_PORT],
    },
  ],
  exports: [MOVIE_FACADE],
})
export class DomainModule {}
