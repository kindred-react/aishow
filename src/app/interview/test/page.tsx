'use client';

import { useState, useEffect } from 'react';

export default function TestPage() {
  const [data, setData] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    console.log('TestPage: useEffect running');
    async function fetchData() {
      try {
        console.log('TestPage: fetching /api/interview/docs/list');
        const res = await fetch('/api/interview/docs/list');
        console.log('TestPage: response ok:', res.ok);
        const json = await res.json();
        console.log('TestPage: got', json.documents?.length, 'documents');
        setData(`Got ${json.documents?.length || 0} documents`);
      } catch (e) {
        console.error('TestPage: error:', e);
        setError(String(e));
      }
    }
    fetchData();
  }, []);

  return (
    <div style={{ padding: '20px', color: 'white' }}>
      <h1>Test Page</h1>
      <p>Status: {data || (error ? `Error: ${error}` : 'Loading...')}</p>
    </div>
  );
}