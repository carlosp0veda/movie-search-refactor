import {
  NotFoundException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  GatewayTimeoutException,
  UnauthorizedException,
} from "@nestjs/common";

/**
 * Custom domain exceptions following NestJS patterns.
 * Using built-in exception classes as recommended by NestJS docs.
 * @see https://docs.nestjs.com/exception-filters#built-in-http-exceptions
 */

export class MovieNotFoundException extends NotFoundException {
  constructor(imdbID: string) {
    super(`Movie with ID "${imdbID}" not found in favorites`);
  }
}

export class MovieAlreadyExistsException extends ConflictException {
  constructor(imdbID: string) {
    super(`Movie with ID "${imdbID}" already exists in favorites`);
  }
}

export class InvalidMovieDataException extends BadRequestException {
  constructor(message: string = "Invalid movie data provided") {
    super(message);
  }
}

export class InvalidPaginationException extends BadRequestException {
  constructor(message: string = "Invalid pagination parameters") {
    super(message);
  }
}

export class SearchQueryRequiredException extends BadRequestException {
  constructor() {
    super("Search query is required");
  }
}

export class ExternalApiException extends InternalServerErrorException {
  constructor(message: string = "External API request failed") {
    super(message);
  }
}

export class ExternalApiTimeoutException extends GatewayTimeoutException {
  constructor() {
    super("External API request timed out");
  }
}

export class InvalidApiKeyException extends UnauthorizedException {
  constructor() {
    super("Invalid API key configured");
  }
}

export class StorageException extends InternalServerErrorException {
  constructor(message: string = "Storage operation failed") {
    super(message);
  }
}
