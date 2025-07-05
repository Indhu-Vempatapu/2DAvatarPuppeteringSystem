interface Point {
  x: number;
  y: number;
}

interface AvatarState {
  pose: any;
  leftHand: any;
  rightHand: any;
  face: any;
  isSmiling: boolean;
  isBlinking: boolean;
  isWaving: boolean;
  currentGesture: string;
}

export class AvatarRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private state: AvatarState;
  private animationSpeed: number = 0.1;
  private animationFrame: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.state = {
      pose: null,
      leftHand: null,
      rightHand: null,
      face: null,
      isSmiling: false,
      isBlinking: false,
      isWaving: false,
      currentGesture: ''
    };
    
    this.setupCanvas();
    this.startAnimation();
  }

  private setupCanvas() {
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
  }

  private startAnimation() {
    const animate = () => {
      this.animationFrame++;
      this.render();
      requestAnimationFrame(animate);
    };
    animate();
  }

  public updatePose(results: any) {
    this.state.pose = results.poseLandmarks;
    this.state.leftHand = results.leftHandLandmarks;
    this.state.rightHand = results.rightHandLandmarks;
    this.state.face = results.faceLandmarks;
  }

  public setGestures(isSmiling: boolean, isBlinking: boolean, isWaving: boolean, gesture: string = '') {
    this.state.isSmiling = isSmiling;
    this.state.isBlinking = isBlinking;
    this.state.isWaving = isWaving;
    this.state.currentGesture = gesture;
  }

  public render() {
    this.clearCanvas();
    this.drawBackground();
    
    if (this.state.pose) {
      this.drawAvatar();
      this.drawGestureEffects();
    } else {
      this.drawPlaceholder();
    }
  }

  private clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private drawBackground() {
    // Animated gradient background
    const time = this.animationFrame * 0.01;
    const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
    
    const hue1 = (200 + Math.sin(time) * 20) % 360;
    const hue2 = (280 + Math.cos(time * 0.7) * 30) % 360;
    
    gradient.addColorStop(0, `hsl(${hue1}, 70%, 95%)`);
    gradient.addColorStop(0.5, `hsl(${(hue1 + hue2) / 2}, 60%, 90%)`);
    gradient.addColorStop(1, `hsl(${hue2}, 70%, 95%)`);
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Animated grid pattern
    this.ctx.strokeStyle = `rgba(0, 0, 0, ${0.03 + Math.sin(time) * 0.02})`;
    this.ctx.lineWidth = 1;
    const gridSize = 30;
    const offset = (this.animationFrame * 0.5) % gridSize;
    
    for (let x = -offset; x < this.canvas.width + gridSize; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }
    
    for (let y = -offset; y < this.canvas.height + gridSize; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }
  }

  private drawAvatar() {
    const pose = this.state.pose;
    if (!pose || pose.length < 33) return;

    // Scale and center the avatar
    const scale = Math.min(this.canvas.width, this.canvas.height) * 0.7;
    const offsetX = this.canvas.width / 2;
    const offsetY = this.canvas.height / 2;

    const getPoint = (landmark: any): Point => ({
      x: offsetX + (0.5 - landmark.x) * scale,
      y: offsetY + (landmark.y - 0.5) * scale
    });

    // Draw body structure with enhanced styling
    this.drawBodyStructure(pose, getPoint);
    
    // Draw head with expressions
    this.drawHead(pose, getPoint);
    
    // Draw hands with gesture highlighting
    this.drawHands(getPoint);
    
    // Draw pose landmarks
    this.drawPoseLandmarks(pose, getPoint);
  }

  private drawBodyStructure(pose: any[], getPoint: (landmark: any) => Point) {
    // Body connections with different colors and widths
    const connections = [
      // Torso (thicker, main color)
      { connections: [[11, 12], [11, 23], [12, 24], [23, 24]], color: '#3b82f6', width: 12 },
      // Arms (medium thickness)
      { connections: [[11, 13], [13, 15], [12, 14], [14, 16]], color: '#8b5cf6', width: 8 },
      // Forearms (thinner)
      { connections: [[15, 17], [15, 19], [15, 21], [16, 18], [16, 20], [16, 22]], color: '#06b6d4', width: 6 },
      // Legs (medium thickness)
      { connections: [[23, 25], [25, 27], [24, 26], [26, 28]], color: '#10b981', width: 8 },
      // Feet
      { connections: [[27, 29], [27, 31], [28, 30], [28, 32]], color: '#f59e0b', width: 6 }
    ];

    connections.forEach(({ connections: conns, color, width }) => {
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = width;
      this.ctx.shadowColor = color;
      this.ctx.shadowBlur = 10;
      
      conns.forEach(([start, end]) => {
        if (pose[start] && pose[end]) {
          const startPoint = getPoint(pose[start]);
          const endPoint = getPoint(pose[end]);
          
          this.ctx.beginPath();
          this.ctx.moveTo(startPoint.x, startPoint.y);
          this.ctx.lineTo(endPoint.x, endPoint.y);
          this.ctx.stroke();
        }
      });
      
      this.ctx.shadowBlur = 0;
    });
  }

  private drawHead(pose: any[], getPoint: (landmark: any) => Point) {
    if (!pose[0]) return;
    
    const head = getPoint(pose[0]);
    const headSize = 60 + Math.sin(this.animationFrame * 0.1) * 5; // Subtle breathing animation
    
    // Head glow effect
    this.ctx.shadowColor = '#fbbf24';
    this.ctx.shadowBlur = 20;
    
    // Head circle with gradient
    const headGradient = this.ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, headSize);
    headGradient.addColorStop(0, '#fef3c7');
    headGradient.addColorStop(0.7, '#fbbf24');
    headGradient.addColorStop(1, '#f59e0b');
    
    this.ctx.fillStyle = headGradient;
    this.ctx.beginPath();
    this.ctx.arc(head.x, head.y, headSize, 0, 2 * Math.PI);
    this.ctx.fill();
    
    this.ctx.strokeStyle = '#d97706';
    this.ctx.lineWidth = 4;
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;
    
    // Enhanced face features
    this.drawEnhancedFace(head, headSize);
  }

  private drawEnhancedFace(head: Point, headSize: number) {
    const eyeOffset = headSize * 0.35;
    const eyeSize = this.state.isBlinking ? 4 : 12;
    
    // Eyes with animation
    this.ctx.fillStyle = this.state.isBlinking ? '#374151' : '#1f2937';
    this.ctx.shadowColor = '#000';
    this.ctx.shadowBlur = 5;
    
    // Left eye
    this.ctx.beginPath();
    if (this.state.isBlinking) {
      this.ctx.ellipse(head.x - eyeOffset, head.y - eyeOffset * 0.5, eyeSize * 2, eyeSize, 0, 0, 2 * Math.PI);
    } else {
      this.ctx.arc(head.x - eyeOffset, head.y - eyeOffset * 0.5, eyeSize, 0, 2 * Math.PI);
      // Eye shine
      this.ctx.fill();
      this.ctx.fillStyle = '#fff';
      this.ctx.beginPath();
      this.ctx.arc(head.x - eyeOffset + 4, head.y - eyeOffset * 0.5 - 3, 3, 0, 2 * Math.PI);
    }
    this.ctx.fill();
    
    // Right eye
    this.ctx.fillStyle = this.state.isBlinking ? '#374151' : '#1f2937';
    this.ctx.beginPath();
    if (this.state.isBlinking) {
      this.ctx.ellipse(head.x + eyeOffset, head.y - eyeOffset * 0.5, eyeSize * 2, eyeSize, 0, 0, 2 * Math.PI);
    } else {
      this.ctx.arc(head.x + eyeOffset, head.y - eyeOffset * 0.5, eyeSize, 0, 2 * Math.PI);
      // Eye shine
      this.ctx.fill();
      this.ctx.fillStyle = '#fff';
      this.ctx.beginPath();
      this.ctx.arc(head.x + eyeOffset + 4, head.y - eyeOffset * 0.5 - 3, 3, 0, 2 * Math.PI);
    }
    this.ctx.fill();
    
    this.ctx.shadowBlur = 0;
    
    // Enhanced mouth
    this.ctx.strokeStyle = '#1f2937';
    this.ctx.lineWidth = 5;
    this.ctx.lineCap = 'round';
    
    if (this.state.isSmiling) {
      // Animated smile
      const smileIntensity = 1 + Math.sin(this.animationFrame * 0.1) * 0.1;
      this.ctx.beginPath();
      this.ctx.arc(head.x, head.y + eyeOffset * 0.8, eyeOffset * 0.7 * smileIntensity, 0, Math.PI);
      this.ctx.stroke();
      
      // Cheek blush
      this.ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
      this.ctx.beginPath();
      this.ctx.arc(head.x - eyeOffset * 1.2, head.y + eyeOffset * 0.2, 15, 0, 2 * Math.PI);
      this.ctx.fill();
      this.ctx.beginPath();
      this.ctx.arc(head.x + eyeOffset * 1.2, head.y + eyeOffset * 0.2, 15, 0, 2 * Math.PI);
      this.ctx.fill();
    } else {
      // Neutral mouth
      this.ctx.beginPath();
      this.ctx.moveTo(head.x - eyeOffset * 0.4, head.y + eyeOffset * 0.8);
      this.ctx.lineTo(head.x + eyeOffset * 0.4, head.y + eyeOffset * 0.8);
      this.ctx.stroke();
    }
  }

  private drawHands(getPoint: (landmark: any) => Point) {
    // Enhanced hand drawing with gesture highlighting
    if (this.state.leftHand) {
      this.drawEnhancedHand(this.state.leftHand, getPoint, '#ef4444', this.state.isWaving);
    }
    
    if (this.state.rightHand) {
      this.drawEnhancedHand(this.state.rightHand, getPoint, '#10b981', this.state.isWaving);
    }
  }

  private drawEnhancedHand(hand: any[], getPoint: (landmark: any) => Point, color: string, isActive: boolean) {
    if (!hand || hand.length < 21) return;
    
    const glowIntensity = isActive ? 20 : 5;
    const lineWidth = isActive ? 4 : 3;
    
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.shadowColor = color;
    this.ctx.shadowBlur = glowIntensity;
    
    // Hand connections
    const handConnections = [
      [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
      [0, 5], [5, 6], [6, 7], [7, 8], // Index
      [0, 9], [9, 10], [10, 11], [11, 12], // Middle
      [0, 13], [13, 14], [14, 15], [15, 16], // Ring
      [0, 17], [17, 18], [18, 19], [19, 20] // Pinky
    ];
    
    // Draw hand structure
    handConnections.forEach(([start, end]) => {
      if (hand[start] && hand[end]) {
        const startPoint = getPoint(hand[start]);
        const endPoint = getPoint(hand[end]);
        
        this.ctx.beginPath();
        this.ctx.moveTo(startPoint.x, startPoint.y);
        this.ctx.lineTo(endPoint.x, endPoint.y);
        this.ctx.stroke();
      }
    });
    
    // Draw hand joints with enhanced styling
    this.ctx.fillStyle = color;
    hand.forEach((landmark, index) => {
      if (landmark) {
        const point = getPoint(landmark);
        const jointSize = isActive ? 6 : 4;
        
        this.ctx.beginPath();
        this.ctx.arc(point.x, point.y, jointSize, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Highlight fingertips
        if ([4, 8, 12, 16, 20].includes(index)) {
          this.ctx.fillStyle = '#fff';
          this.ctx.beginPath();
          this.ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
          this.ctx.fill();
          this.ctx.fillStyle = color;
        }
      }
    });
    
    this.ctx.shadowBlur = 0;
  }

  private drawPoseLandmarks(pose: any[], getPoint: (landmark: any) => Point) {
    // Draw key pose landmarks with different colors
    const landmarkGroups = [
      { indices: [11, 12], color: '#3b82f6', size: 8 }, // Shoulders
      { indices: [23, 24], color: '#10b981', size: 8 }, // Hips
      { indices: [13, 14], color: '#8b5cf6', size: 6 }, // Elbows
      { indices: [15, 16], color: '#06b6d4', size: 6 }, // Wrists
      { indices: [25, 26], color: '#f59e0b', size: 6 }, // Knees
      { indices: [27, 28], color: '#ef4444', size: 6 }  // Ankles
    ];

    landmarkGroups.forEach(({ indices, color, size }) => {
      this.ctx.fillStyle = color;
      this.ctx.shadowColor = color;
      this.ctx.shadowBlur = 8;
      
      indices.forEach(index => {
        if (pose[index]) {
          const point = getPoint(pose[index]);
          this.ctx.beginPath();
          this.ctx.arc(point.x, point.y, size, 0, 2 * Math.PI);
          this.ctx.fill();
        }
      });
      
      this.ctx.shadowBlur = 0;
    });
  }

  private drawGestureEffects() {
    if (!this.state.currentGesture) return;
    
    const time = this.animationFrame * 0.1;
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    // Gesture-specific effects
    switch (this.state.currentGesture) {
      case 'Waving':
        this.drawWaveEffect(centerX, centerY - 100, time);
        break;
      case 'Thumbs Up':
        this.drawThumbsUpEffect(centerX, centerY - 100, time);
        break;
      case 'Peace Sign':
        this.drawPeaceEffect(centerX, centerY - 100, time);
        break;
      case 'Pointing':
        this.drawPointingEffect(centerX, centerY - 100, time);
        break;
    }
    
    // Gesture text with animation
    this.drawGestureText();
  }

  private drawWaveEffect(x: number, y: number, time: number) {
    // Animated wave particles
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + time;
      const radius = 50 + Math.sin(time + i) * 20;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      
      this.ctx.fillStyle = `hsl(${200 + i * 20}, 70%, 60%)`;
      this.ctx.shadowColor = this.ctx.fillStyle;
      this.ctx.shadowBlur = 15;
      
      this.ctx.beginPath();
      this.ctx.arc(px, py, 4 + Math.sin(time * 2 + i) * 2, 0, 2 * Math.PI);
      this.ctx.fill();
    }
    this.ctx.shadowBlur = 0;
  }

  private drawThumbsUpEffect(x: number, y: number, time: number) {
    // Sparkle effect
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const radius = 40 + Math.sin(time * 3 + i) * 15;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      
      this.ctx.fillStyle = `hsl(${45 + i * 10}, 80%, 60%)`;
      this.ctx.shadowColor = this.ctx.fillStyle;
      this.ctx.shadowBlur = 10;
      
      this.ctx.beginPath();
      this.ctx.arc(px, py, 3, 0, 2 * Math.PI);
      this.ctx.fill();
    }
    this.ctx.shadowBlur = 0;
  }

  private drawPeaceEffect(x: number, y: number, time: number) {
    // Peace symbol with rotating elements
    this.ctx.strokeStyle = '#8b5cf6';
    this.ctx.lineWidth = 4;
    this.ctx.shadowColor = '#8b5cf6';
    this.ctx.shadowBlur = 15;
    
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(time * 0.5);
    
    // Peace symbol
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 30, 0, 2 * Math.PI);
    this.ctx.moveTo(0, -30);
    this.ctx.lineTo(0, 30);
    this.ctx.moveTo(0, 0);
    this.ctx.lineTo(-21, 21);
    this.ctx.moveTo(0, 0);
    this.ctx.lineTo(21, 21);
    this.ctx.stroke();
    
    this.ctx.restore();
    this.ctx.shadowBlur = 0;
  }

  private drawPointingEffect(x: number, y: number, time: number) {
    // Arrow effect
    this.ctx.strokeStyle = '#ef4444';
    this.ctx.fillStyle = '#ef4444';
    this.ctx.lineWidth = 3;
    this.ctx.shadowColor = '#ef4444';
    this.ctx.shadowBlur = 12;
    
    const arrowLength = 40 + Math.sin(time * 2) * 10;
    
    this.ctx.beginPath();
    this.ctx.moveTo(x - arrowLength, y);
    this.ctx.lineTo(x + arrowLength, y);
    this.ctx.moveTo(x + arrowLength - 10, y - 8);
    this.ctx.lineTo(x + arrowLength, y);
    this.ctx.lineTo(x + arrowLength - 10, y + 8);
    this.ctx.stroke();
    
    this.ctx.shadowBlur = 0;
  }

  private drawGestureText() {
    const padding = 20;
    const y = padding + 30;
    
    this.ctx.font = 'bold 24px Arial';
    this.ctx.fillStyle = '#1f2937';
    this.ctx.shadowColor = '#fff';
    this.ctx.shadowBlur = 5;
    this.ctx.textAlign = 'left';
    
    // Gesture indicator with emoji
    const gestureEmojis: { [key: string]: string } = {
      'Waving': '👋',
      'Thumbs Up': '👍',
      'Peace Sign': '✌️',
      'Pointing': '👉',
      'Open Palm': '✋',
      'Closed Fist': '✊'
    };
    
    const emoji = gestureEmojis[this.state.currentGesture] || '🤚';
    this.ctx.fillText(`${emoji} ${this.state.currentGesture}`, padding, y);
    
    // Expression indicators
    let expressionY = y + 40;
    this.ctx.font = 'bold 18px Arial';
    
    if (this.state.isSmiling) {
      this.ctx.fillStyle = '#f59e0b';
      this.ctx.fillText('😊 Smiling!', padding, expressionY);
      expressionY += 30;
    }
    
    if (this.state.isBlinking) {
      this.ctx.fillStyle = '#8b5cf6';
      this.ctx.fillText('😉 Blinking!', padding, expressionY);
    }
    
    this.ctx.shadowBlur = 0;
    this.ctx.textAlign = 'start';
  }

  private drawPlaceholder() {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    // Animated placeholder
    this.ctx.fillStyle = '#6b7280';
    this.ctx.font = 'bold 28px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.shadowColor = '#fff';
    this.ctx.shadowBlur = 3;
    
    const bounce = Math.sin(this.animationFrame * 0.1) * 5;
    this.ctx.fillText('🎨 Start camera to see your 2D avatar', centerX, centerY + bounce);
    
    this.ctx.font = '18px Arial';
    this.ctx.fillStyle = '#9ca3af';
    this.ctx.fillText('Move in front of the camera to animate', centerX, centerY + 40 + bounce);
    
    // Animated instruction icons
    const time = this.animationFrame * 0.05;
    const icons = ['🏃‍♂️', '👋', '😊', '👍'];
    icons.forEach((icon, i) => {
      const angle = (i / icons.length) * Math.PI * 2 + time;
      const radius = 80;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + 100 + Math.sin(angle) * radius;
      
      this.ctx.font = '32px Arial';
      this.ctx.fillText(icon, x, y);
    });
    
    this.ctx.shadowBlur = 0;
    this.ctx.textAlign = 'start';
  }

  public reset() {
    this.state = {
      pose: null,
      leftHand: null,
      rightHand: null,
      face: null,
      isSmiling: false,
      isBlinking: false,
      isWaving: false,
      currentGesture: ''
    };
  }
}