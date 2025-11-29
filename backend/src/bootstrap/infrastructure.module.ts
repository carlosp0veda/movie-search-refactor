import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { OmdbAdapter } from "../infrastructure/omdb-adapter/omdb.adapter";
import { FileFavoritesAdapter } from "../infrastructure/file-storage-adapter/file-favorites.adapter";
import { MOVIE_SEARCH_PORT } from "../domain/port/out/movie-search.port";
import { FAVORITES_STORAGE_PORT } from "../domain/port/out/favorites-storage.port";

/**
 * Module that provides infrastructure adapters.
 * Exports outbound port implementations for use by the domain layer.
 */
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: MOVIE_SEARCH_PORT,
      useClass: OmdbAdapter,
    },
    {
      provide: FAVORITES_STORAGE_PORT,
      useClass: FileFavoritesAdapter,
    },
  ],
  exports: [MOVIE_SEARCH_PORT, FAVORITES_STORAGE_PORT],
})
export class InfrastructureModule {}
