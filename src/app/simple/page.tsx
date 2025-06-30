'use client';

export default function SimplePage() {
  return (
    <div style={{ padding: '2rem', backgroundColor: '#f3f4f6' }}>
      <h1 style={{ color: '#1f2937', fontSize: '2rem', marginBottom: '1rem' }}>
        Simple Test Page
      </h1>
      
      <div style={{ 
        backgroundColor: 'white', 
        padding: '1.5rem', 
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        marginBottom: '1rem'
      }}>
        <h2 style={{ color: '#374151', marginBottom: '0.5rem' }}>Inline Styles Test</h2>
        <p style={{ color: '#6b7280' }}>
          This page uses inline styles to verify React rendering is working properly.
        </p>
      </div>

      <div className="bg-blue-100 p-4 rounded-lg mb-4">
        <h3 className="text-blue-800 font-semibold">Tailwind Test</h3>
        <p className="text-blue-600">
          If this has a blue background and proper styling, Tailwind CSS is working!
        </p>
      </div>

      <button 
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        onClick={() => alert('Button clicked!')}
      >
        Test Button (Tailwind)
      </button>

      <br /><br />

      <button 
        style={{
          backgroundColor: '#10b981',
          color: 'white',
          padding: '0.5rem 1rem',
          borderRadius: '6px',
          border: 'none',
          cursor: 'pointer'
        }}
        onClick={() => alert('Inline style button clicked!')}
      >
        Test Button (Inline Styles)
      </button>
    </div>
  );
}