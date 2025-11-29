import { Module } from "@nestjs/common";
import { DomainModule } from "./domain.module";
import { MovieController } from "../application/rest-api-adapter/controller/movie.controller";

/**
 * Module that configures the REST API adapter.
 * Imports domain module and registers controllers.
 */
@Module({
  imports: [DomainModule],
  controllers: [MovieController],
})
export class RestApiModule {}
