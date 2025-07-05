import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Text, Html } from '@react-three/drei';
import { Camera, Play, Pause, RotateCcw, Maximize2, Settings } from 'lucide-react';
import { initializeMediaPipe } from '../utils/mediaPipeSetup';
import { Avatar3D } from './Avatar3D';
import { GestureDetector } from '../utils/gestureDetector';

const AvatarPuppeteer3D: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const avatarRef = useRef<any>(null);
  
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentGesture, setCurrentGesture] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [poseData, setPoseData] = useState<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const holisticRef = useRef<any>(null);
  const gestureDetectorRef = useRef<GestureDetector | null>(null);

  useEffect(() => {
    gestureDetectorRef.current = new GestureDetector();
  }, []);

  const startCamera = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
          frameRate: { ideal: 30 }
        }
      });
      
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      
      // Initialize MediaPipe
      holisticRef.current = await initializeMediaPipe(
        videoRef.current,
        canvasRef.current,
        onResults
      );
      
      setIsActive(true);
    } catch (err) {
      setError('Failed to access camera. Please ensure camera permissions are granted.');
      console.error('Camera error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    if (holisticRef.current) {
      holisticRef.current.close();
    }
    
    setIsActive(false);
    setPoseData(null);
  };

  const resetAvatar = () => {
    setPoseData(null);
    setCurrentGesture('');
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const onResults = (results: any) => {
    if (!gestureDetectorRef.current) return;
    
    // Detect gestures
    const gesture = gestureDetectorRef.current.detectGesture(results);
    setCurrentGesture(gesture);
    
    // Update pose data for 3D avatar
    setPoseData({
      pose: results.poseLandmarks,
      leftHand: results.leftHandLandmarks,
      rightHand: results.rightHandLandmarks,
      face: results.faceLandmarks,
      isSmiling: gestureDetectorRef.current.isSmiling(results),
      isBlinking: gestureDetectorRef.current.isBlinking(results),
      gesture: gesture
    });
  };

  const LoadingScreen = () => (
    <Html center>
      <div className="text-center text-white">
        <div className="animate-spin w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-xl font-semibold">Loading 3D Avatar...</p>
        <p className="text-gray-400 mt-2">Preparing the experience</p>
      </div>
    </Html>
  );

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-slate-900' : 'max-w-7xl mx-auto'}`}>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 h-full">
        {/* Camera Feed */}
        <div className={`space-y-4 ${isFullscreen ? 'xl:col-span-1' : ''}`}>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-gray-700/50">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <Camera className="w-7 h-7 text-cyan-400" />
              Motion Capture
            </h2>
            
            <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
                width={640}
                height={480}
              />
              
              {!isActive && !isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90 backdrop-blur-sm">
                  <div className="text-center text-white">
                    <Camera className="w-20 h-20 mx-auto mb-6 opacity-50 text-cyan-400" />
                    <p className="text-xl font-semibold mb-2">Ready for Motion Capture</p>
                    <p className="text-gray-400">Click Start to begin 3D puppeteering</p>
                  </div>
                </div>
              )}
              
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90 backdrop-blur-sm">
                  <div className="text-center text-white">
                    <div className="animate-spin w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-xl font-semibold">Initializing Camera...</p>
                    <p className="text-gray-400 mt-2">Setting up motion capture</p>
                  </div>
                </div>
              )}
            </div>
            
            {error && (
              <div className="mt-4 p-4 bg-red-900/50 border border-red-500/50 rounded-xl backdrop-blur-sm">
                <p className="text-red-200">{error}</p>
              </div>
            )}
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={isActive ? stopCamera : startCamera}
                disabled={isLoading}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  isActive
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/25'
                    : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg shadow-green-600/25'
                } disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105`}
              >
                {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                {isActive ? 'Stop' : 'Start'} Capture
              </button>
              
              <button
                onClick={resetAvatar}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-blue-600/25 transform hover:scale-105"
              >
                <RotateCcw className="w-5 h-5" />
                Reset
              </button>
              
              <button
                onClick={toggleFullscreen}
                className="flex items-center gap-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
              >
                <Maximize2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Gesture Display */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-gray-700/50">
            <h3 className="text-xl font-bold text-white mb-4">Live Gestures</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full transition-all duration-300 ${
                  currentGesture ? 'bg-gradient-to-r from-green-400 to-emerald-400 shadow-lg shadow-green-400/50' : 'bg-gray-600'
                }`}></div>
                <span className="text-white font-medium text-lg">
                  {currentGesture || 'No gesture detected'}
                </span>
              </div>
              
              {currentGesture && (
                <div className="mt-4 p-3 bg-gradient-to-r from-cyan-900/50 to-purple-900/50 rounded-xl border border-cyan-500/30">
                  <p className="text-cyan-200 text-sm">
                    🎭 Avatar is responding to your {currentGesture.toLowerCase()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3D Avatar Display */}
        <div className={`${isFullscreen ? 'xl:col-span-2' : 'xl:col-span-2'} space-y-4`}>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-gray-700/50 h-full min-h-[600px]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <span className="text-3xl">🎭</span>
                3D Avatar
              </h2>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all duration-200"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
            
            <div className="bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 rounded-xl h-full min-h-[500px] relative overflow-hidden">
              <Canvas
                camera={{ position: [0, 1, 4], fov: 50 }}
                shadows
                className="w-full h-full"
              >
                <Suspense fallback={<LoadingScreen />}>
                  {/* Lighting */}
                  <ambientLight intensity={0.4} />
                  <directionalLight
                    position={[10, 10, 5]}
                    intensity={1}
                    castShadow
                    shadow-mapSize-width={2048}
                    shadow-mapSize-height={2048}
                  />
                  <pointLight position={[-10, -10, -10]} intensity={0.3} color="#8b5cf6" />
                  <pointLight position={[10, -10, -10]} intensity={0.3} color="#06b6d4" />
                  
                  {/* Environment */}
                  <Environment preset="studio" />
                  
                  {/* 3D Avatar */}
                  <Avatar3D ref={avatarRef} poseData={poseData} />
                  
                  {/* Ground */}
                  <ContactShadows
                    position={[0, -2, 0]}
                    opacity={0.4}
                    scale={10}
                    blur={2}
                    far={4}
                  />
                  
                  {/* Title */}
                  <Text
                    position={[0, 3, 0]}
                    fontSize={0.5}
                    color="#06b6d4"
                    anchorX="center"
                    anchorY="middle"
                    font="/fonts/inter-bold.woff"
                  >
                    Motion Capture Avatar
                  </Text>
                  
                  {/* Controls */}
                  <OrbitControls
                    enablePan={true}
                    enableZoom={true}
                    enableRotate={true}
                    minDistance={2}
                    maxDistance={10}
                    minPolarAngle={0}
                    maxPolarAngle={Math.PI / 1.5}
                  />
                </Suspense>
              </Canvas>
              
              {!poseData && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
                  <div className="text-center text-white">
                    <div className="text-6xl mb-4">🎭</div>
                    <p className="text-2xl font-bold mb-2">3D Avatar Ready</p>
                    <p className="text-gray-400">Start motion capture to see your avatar come to life</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Instructions Panel */}
      {!isFullscreen && (
        <div className="mt-8 bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-gray-700/50">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">How to Use 3D Avatar Puppeteering</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-3">🏃‍♂️</div>
              <h4 className="text-lg font-semibold text-white mb-2">Body Movement</h4>
              <p className="text-gray-300">Move your body to see the 3D avatar mirror your pose in real-time</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">👋</div>
              <h4 className="text-lg font-semibold text-white mb-2">Hand Gestures</h4>
              <p className="text-gray-300">Wave, point, thumbs up, peace signs - all detected and animated</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">😊</div>
              <h4 className="text-lg font-semibold text-white mb-2">Facial Expressions</h4>
              <p className="text-gray-300">Smile and blink to see facial animations on your 3D avatar</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvatarPuppeteer3D;