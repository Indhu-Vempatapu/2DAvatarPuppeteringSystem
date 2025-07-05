import React from 'react';
import AvatarPuppeteer from './components/AvatarPuppeteer';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Real-Time 2D Avatar Puppeteering
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Experience advanced motion capture with real-time 2D avatar control. 
            Your movements, expressions, and gestures brought to life with stunning visual effects.
          </p>
        </div>
        
        <AvatarPuppeteer />
      </div>
    </div>
  );
}

export default App;