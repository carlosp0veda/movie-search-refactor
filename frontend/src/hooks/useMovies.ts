import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { movieApi, ApiError } from '@/lib/api';
import { SearchMoviesResponse, FavoritesResponse } from '@/types/movie';

export const useSearchMovies = (query: string, page: number = 1, enabled: boolean = false) => {
  return useQuery<SearchMoviesResponse, ApiError>({
    queryKey: ['movies', 'search', query, page],
    queryFn: () => movieApi.searchMovies(query, page),
    enabled: enabled && query.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors
      if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

export const useFavorites = (page: number = 1) => {
  return useQuery<FavoritesResponse, ApiError>({
    queryKey: ['movies', 'favorites', page],
    queryFn: () => movieApi.getFavorites(page),
    staleTime: 1000 * 30, // 30 seconds
    retry: (failureCount, error) => {
      // 404 is handled gracefully in the API layer
      if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

export const useAddToFavorites = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: movieApi.addToFavorites,
    onSuccess: () => {
      // Invalidate only favorites-related queries
      queryClient.invalidateQueries({ queryKey: ['movies', 'favorites'] });
      // Also invalidate search to update isFavorite status
      queryClient.invalidateQueries({ queryKey: ['movies', 'search'] });
    },
    onError: (error: ApiError) => {
      console.error('Failed to add to favorites:', error.message);
    },
  });
};

export const useRemoveFromFavorites = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: movieApi.removeFromFavorites,
    onSuccess: () => {
      // Invalidate only favorites-related queries
      queryClient.invalidateQueries({ queryKey: ['movies', 'favorites'] });
      // Also invalidate search to update isFavorite status
      queryClient.invalidateQueries({ queryKey: ['movies', 'search'] });
    },
    onError: (error: ApiError) => {
      console.error('Failed to remove from favorites:', error.message);
    },
  });
};
