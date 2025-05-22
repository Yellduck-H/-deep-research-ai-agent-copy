"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestSearchPage() {
  const [query, setQuery] = useState('');
  const [numResults, setNumResults] = useState(5);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, numResults }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '搜索请求失败');
      }
      
      setResults(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '搜索过程中发生错误');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">搜索 API 测试</h1>
      
      <div className="mb-6 space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="query">搜索关键词</Label>
            <Input 
              id="query" 
              value={query} 
              onChange={(e) => setQuery(e.target.value)}
              placeholder="输入搜索关键词..."
              className="w-full"
            />
          </div>
          
          <div>
            <Label htmlFor="numResults">结果数量</Label>
            <Input 
              id="numResults" 
              type="number" 
              min="1" 
              max="20" 
              value={numResults} 
              onChange={(e) => setNumResults(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
        
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? '搜索中...' : '执行搜索'}
        </Button>
      </div>
      
      {error && (
        <div className="p-4 mb-6 bg-red-50 text-red-500 rounded-md border border-red-200">
          错误: {error}
        </div>
      )}
      
      <div className="space-y-4">
        {results.length > 0 ? (
          <>
            <h2 className="text-2xl font-bold">搜索结果 ({results.length})</h2>
            {results.map((result, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>{result.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-2 text-sm text-gray-500">
                    {result.publishedDate && `发布日期: ${result.publishedDate} | `}
                    {result.author && `作者: ${result.author} | `}
                    <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                      访问链接
                    </a>
                  </p>
                  <p className="text-sm">{result.text}</p>
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          !loading && !error && <p>请输入关键词执行搜索。</p>
        )}
      </div>
    </div>
  );
} 