declare global {
  interface Window {
    Holistic: any;
    Camera: any;
  }
}

export const initializeMediaPipe = async (
  videoElement: HTMLVideoElement,
  canvasElement: HTMLCanvasElement,
  onResults: (results: any) => void
) => {
  return new Promise((resolve, reject) => {
    try {
      const holistic = new window.Holistic({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`;
        }
      });

      holistic.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        refineFaceLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      holistic.onResults(onResults);

      const camera = new window.Camera(videoElement, {
        onFrame: async () => {
          await holistic.send({ image: videoElement });
        },
        width: 640,
        height: 480
      });

      camera.start();
      
      resolve(holistic);
    } catch (error) {
      reject(error);
    }
  });
};