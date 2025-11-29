import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios, { AxiosError } from "axios";
import { MovieSearchPort } from "../../domain/port/out/movie-search.port";
import { MovieSearchResult } from "../../domain/model/movie.model";
import {
  ExternalApiException,
  ExternalApiTimeoutException,
  InvalidApiKeyException,
} from "../../domain/exception/domain.exceptions";

/**
 * Response structure from OMDb API.
 */
interface OmdbSearchResponse {
  Search?: OmdbMovie[];
  totalResults?: string;
  Response: string;
  Error?: string;
}

interface OmdbMovie {
  Title: string;
  Year: string;
  imdbID: string;
  Type: string;
  Poster: string;
}

/**
 * Infrastructure adapter implementing MovieSearchPort.
 * Connects to the OMDb API for movie searches.
 */
@Injectable()
export class OmdbAdapter implements MovieSearchPort {
  private readonly logger = new Logger(OmdbAdapter.name);
  private readonly baseUrl = "http://www.omdbapi.com/";
  private readonly apiKey: string;
  private readonly timeout = 10000; // 10 seconds

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>("OMDB_API_KEY");
    if (!apiKey) {
      throw new Error("OMDB_API_KEY environment variable is required");
    }
    this.apiKey = apiKey;
    this.logger.log("OMDb adapter initialized");
  }

  async search(title: string, page: number): Promise<MovieSearchResult> {
    try {
      const response = await axios.get<OmdbSearchResponse>(this.baseUrl, {
        params: {
          apikey: this.apiKey,
          s: title,
          plot: "full",
          page: page,
        },
        timeout: this.timeout,
      });

      if (response.data.Response === "False" || response.data.Error) {
        this.logger.debug(
          `No results for query "${title}": ${response.data.Error}`,
        );
        return { movies: [], totalResults: "0" };
      }

      const movies = (response.data.Search || []).map((movie) => ({
        title: movie.Title,
        imdbID: movie.imdbID,
        year: movie.Year,
        poster: movie.Poster,
      }));

      return {
        movies,
        totalResults: response.data.totalResults || "0",
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  private handleError(error: unknown): never {
    if (error instanceof AxiosError) {
      this.logger.error(`OMDb API error: ${error.message}`);

      if (error.code === "ECONNABORTED") {
        throw new ExternalApiTimeoutException();
      }
      if (error.response?.status === 401) {
        throw new InvalidApiKeyException();
      }
    }

    throw new ExternalApiException("Failed to search movies from OMDb API");
  }
}
