"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function TestSearchPage() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setResponse('');

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`API request failed with status ${res.status}: ${errorText}`);
      }

      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setError(err.message);
      console.error("Test search page error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">API Search Test Page</h1>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="query-input">Search Query:</Label>
          <Input
            id="query-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type your search query here..."
            disabled={isLoading}
          />
        </div>
        
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send to /api/search'}
        </Button>
        
        {response && (
          <div>
            <h2 className="text-xl font-semibold mt-4">API Response:</h2>
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-x-auto">
              {response}
            </pre>
          </div>
        )}
        
        {error && (
          <div>
            <h2 className="text-xl font-semibold mt-4 text-red-500">Error:</h2>
            <pre className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 p-4 rounded-md overflow-x-auto">
              {error}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
} 