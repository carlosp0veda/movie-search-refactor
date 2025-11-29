export interface Movie {
  title: string;
  imdbID: string;
  year: number | string;
  poster: string;
  isFavorite?: boolean;
}

export interface SearchMoviesResponse {
  data: {
    movies: Movie[];
    count: number;
    totalResults: string;
  };
}

export interface FavoritesResponse {
  data: {
    favorites: Movie[];
    count: number;
    totalResults: string;
    currentPage: number;
    totalPages: number;
  };
}
