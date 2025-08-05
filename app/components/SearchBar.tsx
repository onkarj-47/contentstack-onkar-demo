"use client";

import { useState, useEffect } from "react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
  isLoading?: boolean;
  defaultValue?: string;
}

export default function SearchBar({ 
  onSearch, 
  placeholder = "Search stories...", 
  className = "",
  isLoading = false,
  defaultValue = ""
}: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState(defaultValue);

  // Update search query when defaultValue changes
  useEffect(() => {
    setSearchQuery(defaultValue);
  }, [defaultValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleClear = () => {
    setSearchQuery("");
    onSearch("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery.trim());
  };

  const handleSearchClick = () => {
    onSearch(searchQuery.trim());
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div className="flex items-center gap-3">
        {/* Search Input Container */}
        <div className="relative flex-1">
          {/* Search Icon */}
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Search Input */}
          <input
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            placeholder={placeholder}
            className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-full 
                     bg-gray-50 focus:bg-white focus:border-gray-400 focus:outline-none
                     transition-all duration-200 text-gray-900 placeholder-gray-500"
          />

          {/* Clear Button */}
          {searchQuery && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute inset-y-0 right-0 pr-4 flex items-center hover:text-gray-600 transition-colors"
            >
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Search Button */}
        <button
          type="submit"
          onClick={handleSearchClick}
          disabled={isLoading}
          className="px-6 py-3 bg-black text-white rounded-full font-medium 
                   hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
                   disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200
                   flex items-center gap-2 min-w-[100px] justify-center"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Searching...</span>
            </>
          ) : (
            <span>Search</span>
          )}
        </button>
      </div>
    </form>
  );
}