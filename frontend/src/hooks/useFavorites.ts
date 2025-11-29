import { useQuery } from '@tanstack/react-query';
import { movieApi, ApiError } from '@/lib/api';
import { FavoritesResponse } from '@/types/movie';

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

