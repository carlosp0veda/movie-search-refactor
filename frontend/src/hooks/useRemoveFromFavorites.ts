import { useMutation, useQueryClient } from '@tanstack/react-query';
import { movieApi, ApiError } from '@/lib/api';

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

