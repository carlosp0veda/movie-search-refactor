import { Injectable, Logger } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";
import { FavoritesStoragePort } from "../../domain/port/out/favorites-storage.port";
import { Movie } from "../../domain/model/movie.model";
import { StorageException } from "../../domain/exception/domain.exceptions";

/**
 * Infrastructure adapter implementing FavoritesStoragePort.
 * Persists favorites to a JSON file.
 * Uses NestJS built-in exceptions as recommended.
 * @see https://docs.nestjs.com/exception-filters#built-in-http-exceptions
 */
@Injectable()
export class FileFavoritesAdapter implements FavoritesStoragePort {
  private readonly logger = new Logger(FileFavoritesAdapter.name);
  private readonly filePath: string;
  private favorites: Movie[] = [];

  constructor() {
    this.filePath = path.join(process.cwd(), "data", "favorites.json");
    this.loadFromFile();
  }

  private loadFromFile(): void {
    try {
      const dataDir = path.dirname(this.filePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
        this.logger.log(`Created data directory: ${dataDir}`);
      }

      if (fs.existsSync(this.filePath)) {
        const fileContent = fs.readFileSync(this.filePath, "utf-8");
        const parsed: unknown = JSON.parse(fileContent);

        if (Array.isArray(parsed)) {
          this.favorites = parsed.filter(
            (item) =>
              typeof item === "object" &&
              item !== null &&
              typeof (item as Record<string, unknown>).imdbID === "string" &&
              typeof (item as Record<string, unknown>).title === "string",
          ) as Movie[];
          this.logger.log(
            `Loaded ${this.favorites.length} favorites from file`,
          );
        } else {
          this.logger.warn(
            "Favorites file contains invalid data, starting with empty array",
          );
          this.favorites = [];
        }
      } else {
        this.favorites = [];
        this.saveToFile();
        this.logger.log("Created new favorites file");
      }
    } catch (error) {
      this.logger.error(`Failed to load favorites: ${error}`);
      this.favorites = [];
    }
  }

  private saveToFile(): void {
    try {
      const dataDir = path.dirname(this.filePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.favorites, null, 2));
      this.logger.debug("Favorites saved to file");
    } catch (error) {
      this.logger.error(`Failed to save favorites: ${error}`);
      throw new StorageException("Failed to save favorites to file");
    }
  }

  findAll(): Promise<Movie[]> {
    this.loadFromFile(); // Reload for fresh data
    return Promise.resolve([...this.favorites]);
  }

  findByImdbId(imdbID: string): Promise<Movie | undefined> {
    this.loadFromFile();
    const movie = this.favorites.find(
      (m) => m.imdbID.toLowerCase() === imdbID.toLowerCase(),
    );
    return Promise.resolve(movie);
  }

  async exists(imdbID: string): Promise<boolean> {
    const movie = await this.findByImdbId(imdbID);
    return movie !== undefined;
  }

  save(movie: Movie): Promise<Movie> {
    this.loadFromFile();
    this.favorites.push(movie);
    this.saveToFile();
    return Promise.resolve(movie);
  }

  remove(imdbID: string): Promise<Movie | undefined> {
    this.loadFromFile();
    const index = this.favorites.findIndex(
      (movie) => movie.imdbID.toLowerCase() === imdbID.toLowerCase(),
    );

    if (index === -1) {
      return Promise.resolve(undefined);
    }

    const [removed] = this.favorites.splice(index, 1);
    this.saveToFile();
    return Promise.resolve(removed);
  }

  count(): Promise<number> {
    this.loadFromFile();
    return Promise.resolve(this.favorites.length);
  }
}
