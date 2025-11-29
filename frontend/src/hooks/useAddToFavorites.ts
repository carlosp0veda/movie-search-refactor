import { useMutation, useQueryClient } from '@tanstack/react-query';
import { movieApi, ApiError } from '@/lib/api';

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

