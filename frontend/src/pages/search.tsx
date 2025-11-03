import { useState, useEffect } from 'react';

interface SearchResult {
  id: number | string;
  kind: string;
  artistName: string;
  collectionName: string;
  collectionViewUrl: string;
  image: string;
  searchDate: string;
}

const Search = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [podcastViewMode, setPodcastViewMode] = useState<'slider' | 'grid'>('slider');
  
  // Keep track of the current abort controller
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Function to update URL with search term
  const updateURL = (term: string, addToHistory = false) => {
    if (term && term.trim()) {
      // Add search term to URL
      const url = new URL(window.location.href);
      url.searchParams.set('q', term.trim());
      if (addToHistory) {
        window.history.pushState({}, '', url.toString());
      } else {
        window.history.replaceState({}, '', url.toString());
      }
    } else {
      // Clear URL completely - go back to base URL without query params
      const baseUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
      if (addToHistory) {
        window.history.pushState({}, '', baseUrl);
      } else {
        window.history.replaceState({}, '', baseUrl);
      }
    }
  };

  // Handle search term change and update URL
  const handleSearchTermChange = (term: string) => {
    setSearchTerm(term);
    
    // Cancel any ongoing request first
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    
    // IMMEDIATE URL update - try multiple approaches
    if (!term || term === '' || term.trim() === '') {
      // Try multiple ways to clear the URL
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
      
      setLoading(false);
      setResults([]);
      setHasSearched(false);
      return;
    }
    
    // Update URL with the search term
    const urlWithQuery = window.location.origin + window.location.pathname + '?q=' + encodeURIComponent(term.trim());
    window.history.replaceState({}, '', urlWithQuery);
    
    // Auto-search with any character count
    searchAPI(term.trim());
  };

  // Force loading to false when search term is empty
  useEffect(() => {
    if (!searchTerm.trim()) {
      setLoading(false);
    }
  }, [searchTerm]);

  // Navigation functions for back/forward
  const handleGoBack = () => {
    window.history.back();
  };

  const handleGoForward = () => {
    window.history.forward();
  };

  const searchAPI = async (term: string) => {
    if (!term.trim()) return;
    
    // Create new abort controller for this request
    const controller = new AbortController();
    setAbortController(controller);
    
    setLoading(true);
    try {
      console.log('Searching for:', term);
      const response = await fetch(`http://localhost:3008/search/${encodeURIComponent(term)}`, {
        signal: controller.signal
      });
      
      console.log('Response status:', response.status);
      
      // Check if request was aborted before processing response
      if (controller.signal.aborted) return;
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Search results:', data);
      
      // Check again if request was aborted before setting results
      if (controller.signal.aborted) return;
      
      setResults(data);
      setHasSearched(true);
      setLoading(false);
    } catch (error) {
      // Don't process error if request was aborted
      if (error instanceof Error && error.name === 'AbortError') {
        return; // Exit silently for aborted requests
      }
      console.error('Search failed:', error);
      setResults([]);
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // Add to history when search is submitted
      updateURL(searchTerm, true);
      searchAPI(searchTerm);
    }
  };

  // Get search term from URL params on component mount and navigation
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    if (query) {
      setSearchTerm(query);
      searchAPI(query);
    }

    // Listen for browser navigation events (back/forward buttons)
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const query = urlParams.get('q') || '';
      setSearchTerm(query);
      if (query.trim()) {
        searchAPI(query);
      } else {
        setResults([]);
        setHasSearched(false);
        setLoading(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col overflow-x-hidden">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden">
          <div className="fixed left-0 top-0 h-full w-64 bg-gray-50 border-r border-gray-200">
            <div className="p-6 flex flex-col h-full justify-between">
              {/* Close button */}
              <div className="flex justify-between items-center mb-8">
                <a href="/">
                  <img 
                    src="https://thmanyah.com/_next/static/media/logo-black.37d9e07a.png" 
                    alt="Logo" 
                    className="h-8 w-auto"
                  />
                </a>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 hover:bg-gray-200 rounded"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Mobile Navigation Content (same as sidebar) */}
              <nav className="space-y-6 flex-1">
                <div>
                  <ul className="space-y-2">
                    <li>
                      <a href="/" className="text-gray-700 hover:text-black text-sm font-medium flex items-center py-2">
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        Home
                      </a>
                    </li>
                    <li>
                      <a href="/" className="text-black text-sm font-medium flex items-center py-2">
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Discover
                      </a>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    YOUR STUFF
                  </h3>
                  <ul className="space-y-2">
                    <li>
                      <a href="#" className="text-gray-600 hover:text-black text-sm flex items-center py-2">
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                        My Queue
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-gray-600 hover:text-black text-sm flex items-center py-2">
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                        My Podcasts
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-gray-600 hover:text-black text-sm flex items-center py-2">
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Recents
                      </a>
                    </li>
                  </ul>
                </div>
              </nav>

              {/* Copyright at bottom */}
              <div className="mt-8 pt-4">
                <p className="text-gray-500 text-xs">
                  © 2025. by <a href="https://github.com/abomaher" target='_blank'>Abduhkaim Zuqut</a>.
                </p>
                <p className="flex mt-1 items-center space-x-3">
                  <a href="#" className="text-gray-500 hover:text-black text-xs">About</a>
                  <a href="#" className="text-gray-500 hover:text-black text-xs">All Podcasts</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Layout with Sidebar */}
      <div className="flex flex-1">
        {/* Left Sidebar Navigation - Hidden on mobile */}
        <aside className="hidden lg:flex w-64 bg-gray-50 border-r border-gray-200 flex-shrink-0">
          <div className="p-6 flex flex-col h-full justify-between">
            {/* Logo */}
            <div className="mb-8">
              <a href="/">
                <img 
                  src="https://thmanyah.com/_next/static/media/logo-black.37d9e07a.png" 
                  alt="Logo" 
                  className="h-8 w-auto"
                />
              </a>
            </div>

            {/* Main Navigation */}
            <nav className="space-y-6 flex-1">
              <div>
                <ul className="space-y-2">
                  <li>
                    <a href="/" className="text-gray-700 hover:text-black text-sm font-medium flex items-center py-2">
                      <svg 
                        className="w-4 h-4 mr-3" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24" 
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={1.5} 
                          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
                        />
                      </svg>
                      Home
                    </a>
                  </li>
                  <li>
                    <a href="/" className="text-black text-sm font-medium flex items-center py-2">
                      <svg 
                        className="w-4 h-4 mr-3" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24" 
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={1.5} 
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                        />
                      </svg>
                      Discover
                    </a>
                  </li>
                </ul>
              </div>

              {/* YOUR STUFF section */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  YOUR STUFF
                </h3>
                <ul className="space-y-2">
                  <li>
                    <a href="#" className="text-gray-600 hover:text-black text-sm flex items-center py-2">
                      <svg 
                        className="w-4 h-4 mr-3" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24" 
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={1.5} 
                          d="M4 6h16M4 10h16M4 14h16M4 18h16" 
                        />
                      </svg>
                      My Queue
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-600 hover:text-black text-sm flex items-center py-2">
                      <svg 
                        className="w-4 h-4 mr-3" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24" 
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={1.5} 
                          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" 
                        />
                      </svg>
                      My Podcasts
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-600 hover:text-black text-sm flex items-center py-2">
                      <svg 
                        className="w-4 h-4 mr-3" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24" 
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={1.5} 
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
                        />
                      </svg>
                      Recents
                    </a>
                  </li>
                </ul>
              </div>

            </nav>

            {/* Copyright at bottom of sidebar */}
            <div className="mt-8 pt-4 position-absolute bottom-0">
                
              <p className="text-gray-500 text-xs">
                © 2025. by <a href="https://github.com/abomaher" target='_blank'>Abduhkaim Zuqut</a>.
              </p>
              <p className="flex mt-1 items-center space-x-3">
                    <a href="#" className="text-gray-500 hover:text-black text-xs">
                    About
                    </a>
                    <a href="#" className="text-gray-500 hover:text-black text-xs">
                    All Podcasts
                    </a>
                </p>
            </div>

          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          <div className="w-full max-w-7xl mx-auto min-w-0">
            {/* Search Section */}
            <div className="mb-6 sm:mb-8 lg:mb-12">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-6 lg:mb-8">
                {/* Mobile Menu Button (only visible on mobile) */}
                <button 
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="lg:hidden self-start p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded order-first"
                  title="Open menu"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                
                {/* Left Navigation Arrows */}
                <div className="hidden sm:flex items-center space-x-2 order-1 sm:order-none">
                  <button 
                    onClick={handleGoBack}
                    className="p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded"
                    title="Go back"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button 
                    onClick={handleGoForward}
                    className="p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded"
                    title="Go forward"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {/* Search Form - Center Column */}
                <form onSubmit={handleSearch} className="flex-1 order-2 sm:order-none w-full sm:w-auto">
                  <div className="relative max-w-2x2 mx-auto sm:mx-0">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => handleSearchTermChange(e.target.value)}
                      placeholder="Search through over 70 million podcasts and episodes..."
                      className="w-full px-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black bg-white text-center text-sm sm:text-base"
                    />
                  </div>
                </form>
                
                {/* Auth buttons - Right Column */}
                <div className="flex items-center justify-center sm:justify-start space-x-2 order-3 sm:order-none">
                  <button className="bg-black text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800 flex-1 sm:flex-none max-w-32">
                    Log in
                  </button>
                  <button className="bg-black text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800 flex-1 sm:flex-none max-w-32">
                    Sign up
                  </button>
                </div>
              </div>

              {/* Default message */}
              {!hasSearched && !loading && (
                <div className="text-center">
                  <p className="text-gray-500 mt-50 text">
                    Type in a search term to start.
                  </p>
                </div>
              )}
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
                <p className="text-gray-600">Searching...</p>
              </div>
            )}

            {/* Search Results */}
            {hasSearched && !loading && results.length > 0 && (
              <div className="space-y-8">
                <h2 className="text-xl font-semibold text-black mb-6">
                  Search Results ({results.length})
                </h2>
                
                {/* Separate results by type */}
                {(() => {
                  const podcasts = results.filter(result => result.kind === 'podcast');
                  const otherResults = results.filter(result => result.kind !== 'podcast');
                  
                  return (
                    <>
                      {/* Podcasts Slider */}
                      {podcasts.length > 0 && (
                        <div className="mb-8">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-black">
                              Podcasts ({podcasts.length})
                            </h3>
                            
                            {/* View Toggle and Navigation Controls */}
                            <div className="flex items-center space-x-2">
                              {/* View Mode Toggle */}
                              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                                <button
                                  className={`px-3 py-1 rounded text-sm transition-colors duration-200 ${
                                    podcastViewMode === 'slider' 
                                      ? 'bg-white text-black shadow-sm' 
                                      : 'text-gray-600 hover:text-black'
                                  }`}
                                  onClick={() => setPodcastViewMode('slider')}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                  </svg>
                                </button>
                                <button
                                  className={`px-3 py-1 rounded text-sm transition-colors duration-200 ${
                                    podcastViewMode === 'grid' 
                                      ? 'bg-white text-black shadow-sm' 
                                      : 'text-gray-600 hover:text-black'
                                  }`}
                                  onClick={() => setPodcastViewMode('grid')}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                  </svg>
                                </button>
                              </div>

                              {/* Navigation Arrows (only show in slider mode) */}
                              {podcastViewMode === 'slider' && (
                                <div className="flex items-center space-x-2">
                                  <button
                                    className="bg-white border border-gray-200 rounded-full p-2 hover:bg-gray-50 transition-colors duration-200"
                                    onClick={() => {
                                      const container = document.getElementById('podcast-slider');
                                      if (container) {
                                        container.scrollBy({ left: -200, behavior: 'smooth' });
                                      }
                                    }}
                                  >
                                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                  </button>

                                  <button
                                    className="bg-white border border-gray-200 rounded-full p-2 hover:bg-gray-50 transition-colors duration-200"
                                    onClick={() => {
                                      const container = document.getElementById('podcast-slider');
                                      if (container) {
                                        container.scrollBy({ left: 200, behavior: 'smooth' });
                                      }
                                    }}
                                  >
                                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Slider View */}
                          {podcastViewMode === 'slider' ? (
                            <div className="relative w-full min-w-0">
                              <div 
                                id="podcast-slider" 
                                className="w-full overflow-x-auto scrollbar-hide"
                                style={{ 
                                  scrollbarWidth: 'none',
                                  msOverflowStyle: 'none'
                                }}
                              >
                                <div className="flex space-x-3 sm:space-x-4 pb-4" style={{ width: 'max-content', minWidth: '100%' }}>
                                  {podcasts.map((result, index) => (
                                    <div
                                      key={`${result.id}-${index}`}
                                      className="flex-shrink-0 w-32 sm:w-40 md:w-48 lg:w-56 bg-white rounded-lg hover:shadow-md transition-shadow duration-200 border border-gray-100"
                                    >
                                      <div className="p-2 sm:p-3 md:p-4">
                                        <div className="mb-3">
                                          <a
                                            href={result.collectionViewUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block"
                                          >
                                            <img
                                              src={result.image || '/placeholder.jpg'}
                                              alt={result.collectionName}
                                              className="w-full h-32 sm:h-40 md:h-48 lg:h-56 rounded-lg object-cover bg-gray-100 hover:opacity-90 transition-opacity duration-200"
                                              onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjI0IiBoZWlnaHQ9IjIyNCIgdmlld0JveD0iMCAwIDIyNCAyMjQiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMjQiIGhlaWdodD0iMjI0IiBmaWxsPSIjRkFGQUZBIi8+CjxwYXRoIGQ9Ik0xMTIgNjhDMTMxLjMgNjggMTQ3IDgzLjcgMTQ3IDEwM0MxNDcgMTIyLjMgMTMxLjMgMTM4IDExMiAxMzhDOTIuNyAxMzggNzcgMTIyLjMgNzcgMTAzQzc3IDgzLjcgOTIuNyA2OCAxMTIgNjhaTTExMiA4M0MxMDMuMiA4MyA5NiA5MC4yIDk2IDk5Qzk2IDEwNy44IDEwMy4yIDExNSAxMTIgMTE1QzEyMC44IDExNSAxMjggMTA3LjggMTI4IDk5QzEyOCA5MC4yIDEyMC44IDgzIDExMiA4M1pNMTEyIDEyM0M5NC41IDEyMyA4MCA5OC41IDgwIDE2NEgxNDRDMTQ0IDEzNy41IDEyOS41IDEyMyAxMTIgMTIzWiIgZmlsbD0iI0JEQzRDRSIvPgo8L3N2Zz4=';
                                              }}
                                            />
                                          </a>
                                        </div>
                                        <div>
                                          <a
                                            href={result.collectionViewUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block"
                                          >
                                            <h4 className="font-medium text-black line-clamp-2 text-sm mb-1 hover:underline transition-all duration-200">
                                              {result.collectionName}
                                            </h4>
                                          </a>
                                          <p className="text-gray-600 text-xs line-clamp-1 mb-2">
                                            {result.artistName}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* Grid View */
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                              {podcasts.map((result, index) => (
                                <div
                                  key={`${result.id}-${index}`}
                                  className="bg-white rounded-lg hover:shadow-md transition-shadow duration-200 border border-gray-100"
                                >
                                  <div className="p-4">
                                    <div className="mb-3">
                                      <a
                                        href={result.collectionViewUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block"
                                      >
                                        <img
                                          src={result.image || '/placeholder.jpg'}
                                          alt={result.collectionName}
                                          className="w-full aspect-square rounded-lg object-cover bg-gray-100 hover:opacity-90 transition-opacity duration-200"
                                          onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjI0IiBoZWlnaHQ9IjIyNCIgdmlld0JveD0iMCAwIDIyNCAyMjQiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMjQiIGhlaWdodD0iMjI0IiBmaWxsPSIjRkFGQUZBIi8+CjxwYXRoIGQ9Ik0xMTIgNjhDMTMxLjMgNjggMTQ3IDgzLjcgMTQ3IDEwM0MxNDcgMTIyLjMgMTMxLjMgMTM4IDExMiAxMzhDOTIuNyAxMzggNzcgMTIyLjMgNzcgMTAzQzc3IDgzLjcgOTIuNyA2OCAxMTIgNjhaTTExMiA4M0MxMDMuMiA4MyA5NiA5MC4yIDk2IDk5Qzk2IDEwNy44IDEwMy4yIDExNSAxMTIgMTE1QzEyMC44IDExNSAxMjggMTA3LjggMTI4IDk5QzEyOCA5MC4yIDEyMC44IDgzIDExMiA4M1pNMTEyIDEyM0M5NC41IDEyMyA4MCA5OC41IDgwIDE2NEgxNDRDMTQ0IDEzNy41IDEyOS41IDEyMyAxMTIgMTIzWiIgZmlsbD0iI0JEQzRDRSIvPgo8L3N2Zz4=';
                                          }}
                                        />
                                      </a>
                                    </div>
                                    <div>
                                      <a
                                        href={result.collectionViewUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block"
                                      >
                                        <h4 className="font-medium text-black line-clamp-2 text-sm mb-1 hover:underline transition-all duration-200">
                                          {result.collectionName}
                                        </h4>
                                      </a>
                                      <p className="text-gray-600 text-xs line-clamp-1 mb-2">
                                        {result.artistName}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}                      {/* Other Results in Responsive Grid */}
                      {otherResults.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-black mb-4">
                            Other Results ({otherResults.length})
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            {otherResults.map((result, index) => (
                              <div
                                key={`${result.id}-${index}`}
                                className="flex items-center space-x-3 p-3 bg-white border border-gray-100 rounded-lg hover:shadow-sm transition-shadow duration-200"
                              >
                                {/* Artwork */}
                                <div className="flex-shrink-0">
                                  <a
                                    href={result.collectionViewUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block"
                                  >
                                    <img
                                      src={result.image || '/placeholder.jpg'}
                                      alt={result.collectionName}
                                      className="w-12 h-12 sm:w-14 sm:h-14 rounded object-cover bg-gray-100 hover:opacity-90 transition-opacity duration-200"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRkFGQUZBIi8+CjxwYXRoIGQ9Ik0yNCAyNEMyNCAyNCAyNCAyNCAyNCAyNFoiIGZpbGw9IiNCREM0Q0UiLz4KPC9zdmc+';
                                      }}
                                    />
                                  </a>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <a
                                    href={result.collectionViewUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block"
                                  >
                                    <h4 className="text-sm font-medium text-black line-clamp-2 mb-1 hover:underline transition-all duration-200">
                                      {result.collectionName}
                                    </h4>
                                  </a>
                                  <p className="text-gray-600 text-xs line-clamp-1">
                                    {result.artistName}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}

            {/* No Results */}
            {hasSearched && !loading && results.length === 0 && (
              <div className="text-center py-16">
                <p className="text-gray-500 text-xl">
                  No found for "{searchTerm}". Try a different search term.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Search; 