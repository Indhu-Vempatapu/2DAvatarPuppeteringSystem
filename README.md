# 🧍‍♂🖥️ Real-Time Full-Body Motion Tracking using MediaPipe + OpenCV

## 📌 Overview
This project demonstrates a real-time full-body pose detection system using MediaPipe's Holistic model and OpenCV. It captures and tracks face, hand, and body landmarks using just a webcam, making it useful for interactive AI applications like fitness, gaming, education, and more.

## 🎥 Demo
In the output video, I performed minimal movement to demonstrate the pipeline.
However, the system works effectively even with full-body posture and complex gestures.

💡 Try it out with kids — it’s a fun way to get them moving and engaged away from phone screens!

## 🛠️ Tech Stack
- Python

- MediaPipe Holistic (for detecting face, hand, and pose landmarks)

- OpenCV (for webcam capture and rendering)

- NumPy (optional, for calculations)

## 🚀 Features
- Real-time detection of:

- Face landmarks

- Hand landmarks (left & right)

- Body pose (33 keypoints)

- Live visualization of detected landmarks and connections

- Works on standard webcam input

- Lightweight and fast (runs on CPU)

## 📦 Installation
Clone the repository
```bash
git clone https://github.com/yourusername/real-time-pose-tracking.git
cd real-time-pose-tracking
```
Create a virtual environment (optional but recommended)
```
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```
Install dependencies
```
pip install opencv-python mediapipe
```
▶️ How to Run
```
python pose_tracking.py
```
A webcam window will open.
Move your hands, face, and body—landmarks will be drawn in real time.

## 🌍 Potential Applications
- Fitness & Posture Correction

- Motion-Based Gaming

- Educational Tools for Children

- Virtual Avatars & Puppeteering

- Sign Language Recognition

## 🔮 Future Improvements
- Connect to a 3D avatar in Unity via WebSocket

- Add gesture recognition & labeling

- Export movement/posture analytics

- Enable recording & playback of sessions
