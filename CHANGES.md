# Security, Architecture & Code Quality Improvements

This document details the security fixes, architecture refactoring, and code quality improvements applied to the movie-search application.

---

# Backend Changes

## Clean Architecture Refactoring

Based on a hexagonal architecture, the backend has been restructured into four distinct layers: domain, application, infrastructure, and bootstrap.

### New Project Structure

```
backend/src/
├── application/                    # Application Layer (Adapters In)
│   └── rest-api-adapter/
│       ├── controller/
│       │   ├── movie.controller.ts
│       └── dto/
│           └── movie.dto.ts
├── common/                         # Shared utilities
│   └── filters/
│       └── http-exception.filter.ts
├── bootstrap/                      # Module Configuration (DI Wiring)
│   ├── app.module.ts
│   ├── domain.module.ts
│   ├── infrastructure.module.ts
│   └── rest-api.module.ts
├── domain/                         # Domain Layer (Business Logic)
│   ├── exception/
│   │   └── domain.exceptions.ts    # Custom NestJS exceptions
│   ├── model/
│   │   └── movie.model.ts
│   ├── port/
│   │   ├── in/
│   │   │   └── movie.facade.ts     # Inbound Port (Use Cases)
│   │   └── out/
│   │       ├── favorites-storage.port.ts
│   │       └── movie-search.port.ts  # Outbound Ports
│   └── service/
│       └── movie.service.ts
├── infrastructure/                 # Infrastructure Layer (Adapters Out)
│   ├── file-storage-adapter/
│   │   └── file-favorites.adapter.ts
│   └── omdb-adapter/
│       └── omdb.adapter.ts
└── main.ts
```

### Layer Responsibilities

| Layer | Purpose | Dependencies |
|-------|---------|--------------|
| **Domain** | Core business logic, models, port interfaces | None (pure TypeScript) |
| **Application** | REST controllers, DTOs, request/response mapping | Domain ports (inbound) |
| **Infrastructure** | External integrations (OMDb API, file storage) | Domain ports (outbound) |
| **Bootstrap** | NestJS module configuration, dependency injection | All layers |

### Ports & Adapters

**Inbound Port (Facade):**
```typescript
// domain/port/in/movie.facade.ts
export interface MovieFacade {
  searchMovies(title: string, page: number): Promise<MovieSearchResult>;
  addToFavorites(movie: Movie): Promise<Movie>;
  removeFromFavorites(imdbID: string): Promise<Movie>;
  getFavorites(page: number, pageSize: number): Promise<FavoritesList>;
}
```

**Outbound Ports:**
```typescript
// domain/port/out/movie-search.port.ts
export interface MovieSearchPort {
  search(title: string, page: number): Promise<MovieSearchResult>;
}

// domain/port/out/favorites-storage.port.ts
export interface FavoritesStoragePort {
  findAll(): Promise<Movie[]>;
  findByImdbId(imdbID: string): Promise<Movie | undefined>;
  exists(imdbID: string): Promise<boolean>;
  save(movie: Movie): Promise<Movie>;
  remove(imdbID: string): Promise<Movie | undefined>;
  count(): Promise<number>;
}
```

### Dependency Injection

```typescript
// bootstrap/domain.module.ts
@Module({
  imports: [InfrastructureModule],
  providers: [
    {
      provide: MOVIE_FACADE,
      useFactory: (movieSearchPort, favoritesStoragePort) =>
        new MovieService(movieSearchPort, favoritesStoragePort),
      inject: [MOVIE_SEARCH_PORT, FAVORITES_STORAGE_PORT],
    },
  ],
  exports: [MOVIE_FACADE],
})
export class DomainModule {}
```

### Benefits

1. **Testability**: Domain logic can be tested in isolation by mocking ports
2. **Flexibility**: Easy to swap implementations (e.g., file storage → database)
3. **Separation of Concerns**: Each layer has a single responsibility
4. **Domain Independence**: Business logic doesn't depend on frameworks
5. **Clear Boundaries**: Ports define explicit contracts between layers

---

## NestJS Best Practices Applied

Following [NestJS official documentation](https://docs.nestjs.com/), the following patterns were implemented:

### 1. Built-in Exception Classes

**Instead of generic HttpException, use semantic exceptions:**

```typescript
// ❌ Before
throw new HttpException("Movie not found", HttpStatus.NOT_FOUND);

// ✅ After - Using built-in exceptions
export class MovieNotFoundException extends NotFoundException {
  constructor(imdbID: string) {
    super(`Movie with ID "${imdbID}" not found in favorites`);
  }
}
```

Custom exceptions created:
- `MovieNotFoundException` - 404 for missing movies
- `MovieAlreadyExistsException` - 409 for duplicates
- `InvalidMovieDataException` - 400 for validation errors
- `InvalidPaginationException` - 400 for bad pagination
- `ExternalApiTimeoutException` - 504 for API timeouts
- `StorageException` - 500 for storage failures

### 2. Global Exception Filter

Consistent error responses across all endpoints:
```typescript

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    // Returns consistent JSON error format
    response.status(status).json({
      statusCode: status,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
```

### 3. DTO Validation with Transform

Using `class-validator` and `class-transformer`:

```typescript
export class CreateMovieDto {
  @IsString()
  @IsNotEmpty({ message: "Title is required" })
  @Transform(({ value }) => value?.trim())
  title: string;
}
```

### 4. Global Validation Pipe

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,           // Strip unknown properties
    forbidNonWhitelisted: true, // Reject unknown properties
    transform: true,           // Auto-transform to DTO instances
  }),
);
```

### 5. Graceful Shutdown

```typescript
app.enableShutdownHooks();
```

### 6. Security Middleware

```typescript
app.use(helmet());  // Security headers
```

---

## Backend Security Fixes

### 1. Removed Hardcoded API Key (P0 - Critical)

**File:** `backend/src/movies/movies.service.ts`

**Before:**
```typescript
private readonly baseUrl = `http://www.omdbapi.com/?apikey=${process.env.OMDB_API_KEY || 'demo123'}`;
```

**After:**
```typescript
const apiKey = this.configService.get<string>('OMDB_API_KEY');
if (!apiKey) {
  throw new Error('OMDB_API_KEY environment variable is required');
}
this.apiKey = apiKey;
this.baseUrl = 'http://www.omdbapi.com/';
```

**Impact:** API keys are no longer exposed in source code. Application fails fast if environment variable is missing.

---

### 2. Fixed HttpExceptions (Throw Instead of Return) (P0 - Critical)

**File:** `backend/src/movies/movies.service.ts`

**Before:**
```typescript
if (foundMovie) {
  return new HttpException('Movie already in favorites', HttpStatus.BAD_REQUEST);
}
```

**After:**
```typescript
if (foundMovie) {
  throw new HttpException('Movie already in favorites', HttpStatus.CONFLICT);
}
```

**Impact:** Errors now properly propagate with correct HTTP status codes instead of being returned as successful 200 responses.

---

### 3. Added Input Validation with class-validator (P0 - Critical)

**File:** `backend/src/movies/dto/movie.dto.ts`

**Before:**
```typescript
export class MovieDto {
  title: string;
  imdbID: string;
  year: number;
  poster: string;
}
```

**After:**
```typescript
import { IsString, IsNotEmpty, IsNumber, IsOptional, IsBoolean } from "class-validator";

export class MovieDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  imdbID: string;

  @IsNumber()
  @IsOptional()
  year?: number;

  @IsString()
  @IsOptional()
  poster?: string;

  @IsBoolean()
  @IsOptional()
  isFavorite?: boolean;
}
```

**Impact:** All incoming payloads are validated. Invalid data is rejected with 400 Bad Request.

---

### 4. Added URL Parameter Encoding (P0 - Critical)

**File:** `backend/src/movies/movies.service.ts`

**Before:**
```typescript
const response = await axios.get(`${this.baseUrl}&s=${title}&plot=full&page=${page}`);
```

**After:**
```typescript
const response = await axios.get<OmdbSearchResponse>(this.baseUrl, {
  params: {
    apikey: this.apiKey,
    s: title.trim(),
    plot: 'full',
    page: page,
  },
  timeout: 10000,
});
```

**Impact:** Prevents URL injection attacks and properly handles special characters in search queries.

---

### 5. Added Global ValidationPipe (P1 - High)

**File:** `backend/src/main.ts`

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,           // Strip unknown properties
    forbidNonWhitelisted: true, // Throw error on unknown properties
    transform: true,           // Auto-transform payloads to DTO instances
    transformOptions: {
      enableImplicitConversion: true,
    },
  }),
);
```

**Impact:** All endpoints automatically validate incoming data. Prototype pollution attacks are prevented.

---

### 6. CORS Configuration from Environment Variables (P1 - High)

**File:** `backend/src/main.ts`

**Before:**
```typescript
app.enableCors({
  origin: ['http://localhost:3000'],
  // ...
});
```

**After:**
```typescript
const corsOrigins = configService.get<string>('CORS_ORIGINS') || 'http://localhost:3000';
const allowedOrigins = corsOrigins.split(',').map((origin) => origin.trim());

app.enableCors({
  origin: allowedOrigins,
  // ...
});
```

**Impact:** CORS origins are configurable per environment without code changes.

---

### 7. Added Rate Limiting (P1 - High)

**File:** `backend/src/app.module.ts`

```typescript
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,  // 1 minute
      limit: 100,  // 100 requests
    }]),
  ],
  providers: [{
    provide: APP_GUARD,
    useClass: ThrottlerGuard,
  }],
})
```

**Impact:** Prevents API abuse and DoS attacks. Limits to 100 requests per minute per IP.

---

### 8. Added Helmet Security Headers (P1 - High)

**File:** `backend/src/main.ts`

```typescript
import helmet from 'helmet';

app.use(helmet());
```

**Impact:** Adds security headers including X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, etc.

---

### 9. Comprehensive Error Handling (P1 - High)

**File:** `backend/src/movies/movies.service.ts`

```typescript
try {
  const response = await axios.get<OmdbSearchResponse>(this.baseUrl, {
    params: { /* ... */ },
    timeout: 10000,
  });
  // ...
} catch (error) {
  if (error instanceof AxiosError) {
    if (error.code === 'ECONNABORTED') {
      throw new HttpException('Search request timed out', HttpStatus.GATEWAY_TIMEOUT);
    }
    if (error.response?.status === 401) {
      throw new HttpException('Invalid API key', HttpStatus.UNAUTHORIZED);
    }
  }
  throw new HttpException('Failed to search movies', HttpStatus.INTERNAL_SERVER_ERROR);
}
```

**Impact:** Proper error handling with appropriate HTTP status codes and messages.

---

## Backend Code Quality Improvements

### 1. Added Logging (P2)

**File:** `backend/src/movies/movies.service.ts`

```typescript
private readonly logger = new Logger(MoviesService.name);

this.logger.log(`Loaded ${this.favorites.length} favorites from file`);
this.logger.error(`Failed to load favorites: ${error}`);
this.logger.debug(`No results for query "${title}": ${response.data.Error}`);
```

**Impact:** Better observability and debugging capabilities.

---

## Backend Dependencies

```json
{
  "class-validator": "^latest",
  "class-transformer": "^latest",
  "@nestjs/throttler": "^latest",
  "helmet": "^latest"
}
```

---

## Backend Environment Variables

```bash
# .env file in /backend
OMDB_API_KEY=your_api_key_here  # Required - get from https://www.omdbapi.com/apikey.aspx
PORT=3001                        # Optional, default: 3001
CORS_ORIGINS=http://localhost:3000  # Optional, comma-separated list
```

---

## Backend Files Modified

- `src/main.ts` - Security middleware, validation, CORS
- `src/app.module.ts` - Rate limiting configuration
- `src/movies/movies.service.ts` - Complete rewrite with proper error handling
- `src/movies/movies.controller.ts` - Input validation and type safety
- `src/movies/dto/movie.dto.ts` - Validation decorators

---

# Frontend Changes

## Frontend Security Fixes

### 1. Added URL Parameter Encoding (P0 - Critical)

**File:** `frontend/src/lib/api.ts`

```typescript
const encodedQuery = encodeURIComponent(query.trim());
const url = `${API_BASE_URL}/search?q=${encodedQuery}&page=${page}`;
```

**Impact:** Prevents URL injection attacks and properly handles special characters in search queries.

---

## Frontend Code Quality Improvements

### 1. Fixed API Error Handling (P2)

**File:** `frontend/src/lib/api.ts`

```typescript
class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    // Parse and throw proper error
  }
  return response.json();
}
```

**Impact:** Consistent error handling across all API calls.

---

### 2. Added React Query Retry Logic (P2)

**File:** `frontend/src/hooks/useSearchMovies.ts`

```typescript
return useQuery<SearchMoviesResponse, ApiError>({
  queryKey: ['movies', 'search', query, page],
  queryFn: () => movieApi.searchMovies(query, page),
  staleTime: 1000 * 60 * 5, // 5 minutes
  retry: (failureCount, error) => {
    if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
      return false; // Don't retry client errors
    }
    return failureCount < 3;
  },
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
});
```

**Impact:** Intelligent retry logic that doesn't retry on client errors.

---

### 3. Fixed QueryClient Re-creation Bug (P2)

**File:** `frontend/src/providers/QueryProvider.tsx`

**Before:**
```typescript
const queryClient = new QueryClient({ /* ... */ });
```

**After:**
```typescript
const [queryClient] = useState(() => new QueryClient({ /* ... */ }));
```

**Impact:** QueryClient is now created only once, preventing cache loss on re-renders.

---

### 4. Added Memoization in Components (P2)

**File:** `frontend/src/app/page.tsx`

```typescript
const totalPages = useMemo(() => {
  if (!searchResults?.data.totalResults) return 0;
  return Math.ceil(parseInt(searchResults.data.totalResults) / RESULTS_PER_PAGE);
}, [searchResults?.data.totalResults]);

const handleSearch = useCallback((query: string) => {
  // ...
}, []);

const handleToggleFavorite = useCallback(async (movie: Movie) => {
  if (addToFavorites.isPending || removeFromFavorites.isPending) {
    return; // Prevent rapid clicks
  }
  // ...
}, [addToFavorites, removeFromFavorites]);
```

**Impact:** Reduced unnecessary re-renders and prevented race conditions.

---

### 5. Fixed Type Consistency (P2)

**File:** `frontend/src/types/movie.ts`

**Before:**
```typescript
export interface FavoritesResponse {
  data: {
    totalResults: number; // Inconsistent with backend
  };
}
```

**After:**
```typescript
export interface FavoritesResponse {
  data: {
    totalResults: string; // Matches backend response
  };
}
```

**Impact:** Type safety between frontend and backend responses.