'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import MovieCard from '@/components/MovieCard';
import Pagination from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { useFavorites, useRemoveFromFavorites } from '@/hooks/useMovies';
import { Movie } from '@/types/movie';
import Link from 'next/link';

const Favorites = () => {
  const [currentPage, setCurrentPage] = useState(1);
  
  const { 
    data: favorites, 
    isLoading, 
    isError, 
    error,
  } = useFavorites(currentPage);
  
  const removeFromFavorites = useRemoveFromFavorites();

  // Calculate total results safely
  const totalResults = useMemo(() => {
    if (!favorites?.data.totalResults) return 0;
    const parsed = parseInt(String(favorites.data.totalResults));
    return isNaN(parsed) ? 0 : parsed;
  }, [favorites?.data.totalResults]);

  const totalPages = favorites?.data.totalPages ?? 0;

  // Navigate to previous page if current page becomes empty
  useEffect(() => {
    const favoritesCount = favorites?.data.favorites?.length ?? 0;
    if (favoritesCount === 0 && currentPage > 1 && !isLoading) {
      setCurrentPage((prev) => Math.max(1, prev - 1));
    }
  }, [favorites?.data.favorites?.length, currentPage, isLoading]);

  const handleRemoveFavorite = useCallback(async (movie: Movie) => {
    if (removeFromFavorites.isPending) return;

    try {
      await removeFromFavorites.mutateAsync(movie.imdbID);
    } catch (error) {
      console.error('Failed to remove from favorites:', error);
    }
  }, [removeFromFavorites]);

  const handlePageChange = useCallback((page: number) => {
    if (page < 1 || page > totalPages) return;
    
    setCurrentPage(page);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [totalPages]);

  const favoritesData = favorites?.data.favorites ?? [];

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <h1 className="text-4xl md:text-5xl text-white font-bold bg-clip-text">
              My Favorites
            </h1>
          </div>
          <p className="text-center text-muted-foreground">
            {totalResults} {totalResults === 1 ? 'movie' : 'movies'} saved
          </p>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary border-r-transparent" />
            <p className="mt-4 text-muted-foreground">Loading favorites...</p>
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <h2 className="text-xl font-semibold text-red-700 mb-2">
                Failed to load favorites
              </h2>
              <p className="text-red-600">
                {error?.message || 'Something went wrong. Please try again.'}
              </p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && totalResults === 0 && (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold mb-2">No Favorites Yet</h2>
            <p className="text-muted-foreground mb-6">
              Start adding movies to your favorites from the search page
            </p>
            <Link href="/">
              <Button className="bg-gradient-primary">Search Movies</Button>
            </Link>
          </div>
        )}

        {/* Favorites grid */}
        {!isLoading && !isError && favoritesData.length > 0 && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {favoritesData.map((movie) => (
                <MovieCard
                  key={movie.imdbID}
                  movie={movie}
                  isFavorite={true}
                  onToggleFavorite={handleRemoveFavorite}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Favorites;
