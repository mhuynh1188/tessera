export default function BasicPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
          🎨 CSS Test Page
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Tailwind CSS Test</h2>
          <p className="text-gray-600 mb-4">
            If you can see proper colors, spacing, and styling, Tailwind CSS is working correctly!
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-red-100 border border-red-300 rounded-lg p-4 text-center">
              <div className="text-red-800 font-semibold">Red Card</div>
              <div className="text-red-600 text-sm">This should be red</div>
            </div>
            <div className="bg-green-100 border border-green-300 rounded-lg p-4 text-center">
              <div className="text-green-800 font-semibold">Green Card</div>
              <div className="text-green-600 text-sm">This should be green</div>
            </div>
            <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 text-center">
              <div className="text-blue-800 font-semibold">Blue Card</div>
              <div className="text-blue-600 text-sm">This should be blue</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg p-6 text-white text-center">
          <h3 className="text-xl font-bold mb-2">Gradient Background Test</h3>
          <p className="text-purple-100">
            This should have a beautiful purple to pink gradient background
          </p>
        </div>

        <div className="mt-8 text-center">
          <div className="inline-block bg-yellow-100 border-2 border-yellow-400 rounded-full px-6 py-3">
            <span className="text-yellow-800 font-medium">
              ✅ If you see this styled correctly, CSS is working!
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}