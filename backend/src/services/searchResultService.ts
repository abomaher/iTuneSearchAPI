import { searchResultModel } from "../models/searchResult.js";

// Return type for the search function
interface ISearchResult {
  id: number | string;
  kind: string;
  artistName: string;
  collectionName: string;
  collectionViewUrl: string;
  image: string;
  searchDate: Date;
}

// Function to search iTunes API and save to database
export async function searchAndSave(searchWord: string): Promise<ISearchResult[]> {
  try {
    // Build iTunes API URL
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(searchWord)}&limit=30&country=sa`;

    // Fetch data from iTunes API
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`iTunes API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Process and save each result
    const savedResults = [];
    for (const item of data.results) {
      try {
        // Create document for database
        const searchResult = {
          id: item.trackId || item.collectionId || Date.now(),
          kind: item.kind,
          artistName: item.artistName,
          collectionName: item.collectionName || item.trackName || '',
          collectionViewUrl: item.collectionViewUrl || item.trackViewUrl || '',
          image: item.artworkUrl600 || item.artworkUrl100,
          searchDate: new Date()
        };
        
        // Save to database (update if exists, create if not)
        const saved = await searchResultModel.findOneAndUpdate(
          { id: searchResult.id },
          searchResult,
          { upsert: true, new: true }
        );
        
        savedResults.push(saved);
      } catch (error) {
        console.error('Error saving individual result:', error);
      }
    }

    // Return all saved results (since they're already relevant to the search term from iTunes API)
    return savedResults;
    
  } catch (error) {
    console.error('Error in searchAndSave:', error);
    return [];
  }
}