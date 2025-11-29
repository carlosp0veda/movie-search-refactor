import { useState } from "react";
import { Movie } from "@/types/movie";
import Image from "next/image";

interface MovieCardProps {
  movie: Movie;
  isFavorite: boolean;
  onToggleFavorite: (movie: Movie) => void;
  isLoading: boolean;
}

const MovieCard = ({ movie, isFavorite, onToggleFavorite, isLoading }: MovieCardProps) => {
  const [imageError, setImageError] = useState(false);

  const hasValidPoster = movie.poster && movie.poster !== "N/A" && !imageError;

  return (
    <div className="group relative bg-white rounded-lg overflow-hidden hover:mouse-pointer shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="relative aspect-2/3 overflow-hidden">
        {hasValidPoster ? (
          <Image
            src={movie.poster}
            alt={movie.title}
            width={150}
            height={225}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <svg className="h-12 w-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm">No Image</p>
            </div>
          </div>
        )}
        
        <button
          onClick={() => onToggleFavorite(movie)}
          disabled={isLoading}
          className={`absolute top-2 right-2 p-2 rounded-full transition-all duration-200 ${
            isFavorite
              ? "bg-red-500 text-white hover:bg-red-600"
              : "bg-white/80 text-gray-600 hover:bg-white hover:text-red-500"
          }`}
        >
          <svg 
            className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1 line-clamp-2 text-black group-hover:text-blue-600 transition-colors">
          {movie.title}
        </h3>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{movie.year}</span>
        </div>
      </div>

      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 pointer-events-none" />
    </div>
  );
};

export default MovieCard;

