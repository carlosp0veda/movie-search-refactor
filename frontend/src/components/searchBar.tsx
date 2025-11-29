import { useState } from "react";
import { Input } from "./ui/input";

interface SearchBarProps {
  onSearch: (query: string) => void;
}

const SearchBar = ({ onSearch }: SearchBarProps) => {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query) {
      onSearch(query);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto">
      <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <Input
        minLength={1} // Prevent empty strings
        type="text"
        placeholder="Search for movies..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-12 h-14 text-lg bg-white border-gray-300 focus:border-blue-500 transition-colors text-black"
      />
    </form>
  );
};

export default SearchBar;

