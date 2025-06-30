'use client';

export default function CSSTestPage() {
  return (
    <div className="min-h-screen p-8 bg-blue-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-blue-600 mb-8">CSS Test Page</h1>
        
        <div className="test-css-loading mb-8">
          If you see this with a gradient background, custom CSS is working!
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Tailwind Test</h2>
          <p className="text-gray-600 mb-4">If this has proper spacing and colors, Tailwind is working!</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-red-100 p-4 rounded">Red Background</div>
            <div className="bg-green-100 p-4 rounded">Green Background</div>
            <div className="bg-blue-100 p-4 rounded">Blue Background</div>
          </div>
        </div>
        
        <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
          Test Button
        </button>
      </div>
    </div>
  );
}