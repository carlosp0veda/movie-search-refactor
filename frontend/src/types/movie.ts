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
    totalResults: number;
  };
}

export interface FavoritesResponse {
  data: {
    favorites: Movie[];
    count: number;
    totalResults: number;
    currentPage: number;
    totalPages: number;
  };
}
