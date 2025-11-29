import { Movie, SearchMoviesResponse, FavoritesResponse } from '@/types/movie';

// API URL from environment variable with fallback
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/movies';

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
    let errorMessage = `Request failed with status ${response.status}`;
    let errorCode: string | undefined;

    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
      errorCode = errorData.statusCode?.toString();
    } catch {
      // Response wasn't JSON, use default message
    }

    throw new ApiError(errorMessage, response.status, errorCode);
  }

  return response.json();
}

export const movieApi = {
  searchMovies: async (query: string, page: number = 1): Promise<SearchMoviesResponse> => {
    // Validate input
    if (!query || query.trim().length === 0) {
      return {
        data: {
          movies: [],
          count: 0,
          totalResults: 0,
        },
      };
    }

    // Properly encode URL parameters
    const encodedQuery = encodeURIComponent(query.trim());
    const url = `${API_BASE_URL}/search?q=${encodedQuery}&page=${page}`;

    try {
      const response = await fetch(url);
      return await handleResponse<SearchMoviesResponse>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Network error. Please check your connection.', 0, 'NETWORK_ERROR');
    }
  },

  getFavorites: async (page: number = 1): Promise<FavoritesResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/favorites/list?page=${page}`);
      return await handleResponse<FavoritesResponse>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        // Handle empty favorites gracefully
        if (error.status === 404) {
          return {
            data: {
              favorites: [],
              count: 0,
              totalResults: 0,
              currentPage: page,
              totalPages: 0,
            },
          };
        }
        throw error;
      }
      throw new ApiError('Failed to fetch favorites', 0, 'NETWORK_ERROR');
    }
  },

  addToFavorites: async (movie: Movie): Promise<{ data: { message: string; movie: Movie } }> => {
    // Validate required fields
    if (!movie.imdbID || !movie.title) {
      throw new ApiError('Movie must have imdbID and title', 400, 'VALIDATION_ERROR');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/favorites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: movie.title,
          imdbID: movie.imdbID,
          year: movie.year,
          poster: movie.poster,
        }),
      });

      return await handleResponse<{ data: { message: string; movie: Movie } }>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Failed to add movie to favorites', 0, 'NETWORK_ERROR');
    }
  },

  removeFromFavorites: async (imdbID: string): Promise<{ data: { message: string } }> => {
    if (!imdbID || imdbID.trim().length === 0) {
      throw new ApiError('Movie ID is required', 400, 'VALIDATION_ERROR');
    }

    try {
      const encodedId = encodeURIComponent(imdbID.trim());
      const response = await fetch(`${API_BASE_URL}/favorites/${encodedId}`, {
        method: 'DELETE',
      });

      return await handleResponse<{ data: { message: string } }>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Failed to remove movie from favorites', 0, 'NETWORK_ERROR');
    }
  },
};

export { ApiError };
