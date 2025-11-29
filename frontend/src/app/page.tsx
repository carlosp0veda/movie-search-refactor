'use client';

import { useState, useMemo, useCallback } from 'react';
import { useSearchMovies, useAddToFavorites, useRemoveFromFavorites } from '@/hooks/useMovies';
import { Movie } from '@/types/movie';
import SearchBar from '@/components/searchBar';
import MovieCard from '@/components/MovieCard';
import Pagination from '@/components/pagination';

const RESULTS_PER_PAGE = 10;

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const { 
    data: searchResults, 
    isLoading, 
    error,
    isError,
  } = useSearchMovies(searchQuery, currentPage, searchEnabled);
  
  const addToFavorites = useAddToFavorites();
  const removeFromFavorites = useRemoveFromFavorites();

  // Memoize total pages calculation
  const totalPages = useMemo(() => {
    if (!searchResults?.data.totalResults) return 0;
    return Math.ceil(parseInt(searchResults.data.totalResults) / RESULTS_PER_PAGE);
  }, [searchResults?.data.totalResults]);

  const handleSearch = useCallback((query: string) => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length === 0) return;
    
    setSearchQuery(trimmedQuery);
    setSearchEnabled(true);
    setCurrentPage(1);
  }, []);

  const handleToggleFavorite = useCallback(async (movie: Movie) => {
    // Prevent multiple rapid clicks
    if (addToFavorites.isPending || removeFromFavorites.isPending) {
      return;
    }

    try {
      if (movie.isFavorite) {
        await removeFromFavorites.mutateAsync(movie.imdbID);
      } else {
        await addToFavorites.mutateAsync(movie);
      }
    } catch (error) {
      // Error is already logged in the hook
      console.error('Failed to toggle favorite:', error);
    }
  }, [addToFavorites, removeFromFavorites]);

  const handlePageChange = useCallback((page: number) => {
    if (page < 1 || page > totalPages) return;
    
    setCurrentPage(page);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [totalPages]);

  const movies = searchResults?.data.movies ?? [];
  const hasMovies = movies.length > 0;
  const showEmptyState = !isLoading && !hasMovies && !searchQuery;
  const showNoResults = !isLoading && !hasMovies && searchQuery && !isError;

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text">
              Movie Finder
            </h1>
          </div>
          <SearchBar onSearch={handleSearch} />
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary border-r-transparent" />
            <p className="mt-4 text-muted-foreground">Searching for movies...</p>
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <h2 className="text-xl font-semibold text-red-700 mb-2">Something went wrong</h2>
              <p className="text-red-600">
                {error?.message || 'Failed to search movies. Please try again.'}
              </p>
              <button
                onClick={() => setSearchEnabled(true)}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Empty state - before search */}
        {showEmptyState && (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold mb-2">Start Your Search</h2>
            <p className="text-muted-foreground">
              Search for your favorite movies and add them to your favorites
            </p>
          </div>
        )}

        {/* No results state */}
        {showNoResults && (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground">
              No movies found for &quot;{searchQuery}&quot;
            </p>
          </div>
        )}

        {/* Results grid */}
        {!isLoading && hasMovies && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {movies.map((movie: Movie, index: number) => (
                <MovieCard
                  key={`${movie.imdbID}-${index}`}
                  movie={movie}
                  isFavorite={movie.isFavorite ?? false}
                  onToggleFavorite={handleToggleFavorite}
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
}
