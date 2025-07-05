export class GestureDetector {
  private previousGesture: string = '';
  private gestureConfidence: number = 0;
  private minConfidence: number = 3; // Reduced for more responsive detection
  private gestureHistory: string[] = [];
  private maxHistoryLength: number = 10;

  public detectGesture(results: any): string {
    let currentGesture = '';
    
    // Check for gestures in order of complexity
    if (this.isWaving(results)) {
      currentGesture = 'Waving';
    }
    else if (this.isThumbsUp(results)) {
      currentGesture = 'Thumbs Up';
    }
    else if (this.isPeaceSign(results)) {
      currentGesture = 'Peace Sign';
    }
    else if (this.isPointing(results)) {
      currentGesture = 'Pointing';
    }
    else if (this.isOpenPalm(results)) {
      currentGesture = 'Open Palm';
    }
    else if (this.isClosedFist(results)) {
      currentGesture = 'Closed Fist';
    }

    // Add to gesture history
    this.gestureHistory.push(currentGesture);
    if (this.gestureHistory.length > this.maxHistoryLength) {
      this.gestureHistory.shift();
    }

    // Gesture smoothing with history
    if (currentGesture === this.previousGesture) {
      this.gestureConfidence++;
    } else {
      this.gestureConfidence = 1;
      this.previousGesture = currentGesture;
    }

    // Return gesture if confidence is high enough or if it's consistent in recent history
    const recentGestures = this.gestureHistory.slice(-5);
    const gestureCount = recentGestures.filter(g => g === currentGesture).length;
    
    if (this.gestureConfidence >= this.minConfidence || gestureCount >= 3) {
      return currentGesture;
    }

    return '';
  }

  public isSmiling(results: any): boolean {
    if (!results.faceLandmarks) return false;
    
    const face = results.faceLandmarks;
    if (face.length < 468) return false;

    try {
      // More reliable mouth landmarks for smile detection
      const leftMouthCorner = face[61];   // Left mouth corner
      const rightMouthCorner = face[291]; // Right mouth corner
      const upperLip = face[13];          // Upper lip center
      const lowerLip = face[14];          // Lower lip center
      const mouthCenter = face[17];       // Mouth center

      if (!leftMouthCorner || !rightMouthCorner || !upperLip || !lowerLip || !mouthCenter) {
        return false;
      }

      // Calculate mouth dimensions
      const mouthWidth = Math.abs(rightMouthCorner.x - leftMouthCorner.x);
      const mouthHeight = Math.abs(lowerLip.y - upperLip.y);
      
      // Calculate mouth corner elevation
      const mouthCenterY = mouthCenter.y;
      const leftCornerElevation = mouthCenterY - leftMouthCorner.y;
      const rightCornerElevation = mouthCenterY - rightMouthCorner.y;
      const avgElevation = (leftCornerElevation + rightCornerElevation) / 2;
      
      // Smile detection: corners elevated and mouth width increased
      const isSmiling = avgElevation > 0.004 && mouthWidth / mouthHeight > 2.2;
      
      return isSmiling;
    } catch (error) {
      console.warn('Error in smile detection:', error);
      return false;
    }
  }

  public isBlinking(results: any): boolean {
    if (!results.faceLandmarks) return false;
    
    const face = results.faceLandmarks;
    if (face.length < 468) return false;

    try {
      // More accurate eye landmarks
      const leftEyeTop = face[159];
      const leftEyeBottom = face[145];
      const leftEyeLeft = face[33];
      const leftEyeRight = face[133];
      
      const rightEyeTop = face[386];
      const rightEyeBottom = face[374];
      const rightEyeLeft = face[362];
      const rightEyeRight = face[263];

      if (!leftEyeTop || !leftEyeBottom || !leftEyeLeft || !leftEyeRight ||
          !rightEyeTop || !rightEyeBottom || !rightEyeLeft || !rightEyeRight) {
        return false;
      }

      // Calculate Eye Aspect Ratios (EAR)
      const leftEyeHeight = Math.abs(leftEyeTop.y - leftEyeBottom.y);
      const leftEyeWidth = Math.abs(leftEyeRight.x - leftEyeLeft.x);
      const leftEAR = leftEyeHeight / leftEyeWidth;
      
      const rightEyeHeight = Math.abs(rightEyeTop.y - rightEyeBottom.y);
      const rightEyeWidth = Math.abs(rightEyeRight.x - rightEyeLeft.x);
      const rightEAR = rightEyeHeight / rightEyeWidth;
      
      // Average EAR
      const avgEAR = (leftEAR + rightEAR) / 2;
      
      // Blinking threshold (lower values indicate closed eyes)
      return avgEAR < 0.18;
    } catch (error) {
      console.warn('Error in blink detection:', error);
      return false;
    }
  }

  public isWaving(results: any): boolean {
    if (!results.poseLandmarks) return false;

    const pose = results.poseLandmarks;
    
    try {
      // Check both hands for waving
      let isWaving = false;
      
      // Right hand waving
      if (results.rightHandLandmarks && pose[16] && pose[12]) {
        const wrist = results.rightHandLandmarks[0];
        const shoulder = pose[12];
        const elbow = pose[14];
        
        if (wrist && shoulder && elbow) {
          // Hand raised above shoulder and elbow
          const handRaised = wrist.y < shoulder.y - 0.05 && wrist.y < elbow.y;
          // Hand is to the side (not in front of body)
          const handToSide = Math.abs(wrist.x - shoulder.x) > 0.1;
          isWaving = handRaised && handToSide;
        }
      }
      
      // Left hand waving
      if (!isWaving && results.leftHandLandmarks && pose[15] && pose[11]) {
        const wrist = results.leftHandLandmarks[0];
        const shoulder = pose[11];
        const elbow = pose[13];
        
        if (wrist && shoulder && elbow) {
          // Hand raised above shoulder and elbow
          const handRaised = wrist.y < shoulder.y - 0.05 && wrist.y < elbow.y;
          // Hand is to the side (not in front of body)
          const handToSide = Math.abs(wrist.x - shoulder.x) > 0.1;
          isWaving = handRaised && handToSide;
        }
      }
      
      return isWaving;
    } catch (error) {
      console.warn('Error in wave detection:', error);
      return false;
    }
  }

  private isThumbsUp(results: any): boolean {
    const hand = results.rightHandLandmarks || results.leftHandLandmarks;
    if (!hand || hand.length < 21) return false;

    try {
      // Finger landmarks
      const thumbTip = hand[4];
      const thumbMCP = hand[2];
      const indexTip = hand[8];
      const indexMCP = hand[5];
      const middleTip = hand[12];
      const middleMCP = hand[9];
      const ringTip = hand[16];
      const ringMCP = hand[13];
      const pinkyTip = hand[20];
      const pinkyMCP = hand[17];

      if (!thumbTip || !thumbMCP || !indexTip || !indexMCP || 
          !middleTip || !middleMCP || !ringTip || !ringMCP || 
          !pinkyTip || !pinkyMCP) return false;

      // Thumb extended (tip higher than MCP joint)
      const thumbExtended = thumbTip.y < thumbMCP.y - 0.02;
      
      // Other fingers folded (tips lower than MCP joints)
      const indexFolded = indexTip.y > indexMCP.y + 0.01;
      const middleFolded = middleTip.y > middleMCP.y + 0.01;
      const ringFolded = ringTip.y > ringMCP.y + 0.01;
      const pinkyFolded = pinkyTip.y > pinkyMCP.y + 0.01;

      return thumbExtended && indexFolded && middleFolded && ringFolded && pinkyFolded;
    } catch (error) {
      console.warn('Error in thumbs up detection:', error);
      return false;
    }
  }

  private isPeaceSign(results: any): boolean {
    const hand = results.rightHandLandmarks || results.leftHandLandmarks;
    if (!hand || hand.length < 21) return false;

    try {
      // Finger landmarks
      const indexTip = hand[8];
      const indexMCP = hand[5];
      const middleTip = hand[12];
      const middleMCP = hand[9];
      const ringTip = hand[16];
      const ringMCP = hand[13];
      const pinkyTip = hand[20];
      const pinkyMCP = hand[17];

      if (!indexTip || !indexMCP || !middleTip || !middleMCP || 
          !ringTip || !ringMCP || !pinkyTip || !pinkyMCP) return false;

      // Index and middle fingers extended
      const indexExtended = indexTip.y < indexMCP.y - 0.02;
      const middleExtended = middleTip.y < middleMCP.y - 0.02;
      
      // Ring and pinky fingers folded
      const ringFolded = ringTip.y > ringMCP.y + 0.01;
      const pinkyFolded = pinkyTip.y > pinkyMCP.y + 0.01;

      // Check finger separation (V shape)
      const fingerSeparation = Math.abs(indexTip.x - middleTip.x) > 0.03;

      return indexExtended && middleExtended && ringFolded && pinkyFolded && fingerSeparation;
    } catch (error) {
      console.warn('Error in peace sign detection:', error);
      return false;
    }
  }

  private isPointing(results: any): boolean {
    const hand = results.rightHandLandmarks || results.leftHandLandmarks;
    if (!hand || hand.length < 21) return false;

    try {
      // Finger landmarks
      const indexTip = hand[8];
      const indexMCP = hand[5];
      const middleTip = hand[12];
      const middleMCP = hand[9];
      const ringTip = hand[16];
      const ringMCP = hand[13];
      const pinkyTip = hand[20];
      const pinkyMCP = hand[17];

      if (!indexTip || !indexMCP || !middleTip || !middleMCP || 
          !ringTip || !ringMCP || !pinkyTip || !pinkyMCP) return false;

      // Only index finger extended
      const indexExtended = indexTip.y < indexMCP.y - 0.02;
      const middleFolded = middleTip.y > middleMCP.y + 0.01;
      const ringFolded = ringTip.y > ringMCP.y + 0.01;
      const pinkyFolded = pinkyTip.y > pinkyMCP.y + 0.01;

      return indexExtended && middleFolded && ringFolded && pinkyFolded;
    } catch (error) {
      console.warn('Error in pointing detection:', error);
      return false;
    }
  }

  private isOpenPalm(results: any): boolean {
    const hand = results.rightHandLandmarks || results.leftHandLandmarks;
    if (!hand || hand.length < 21) return false;

    try {
      // All finger tips and MCP joints
      const fingerTips = [hand[4], hand[8], hand[12], hand[16], hand[20]];
      const fingerMCPs = [hand[2], hand[5], hand[9], hand[13], hand[17]];

      // Check if all fingers are extended
      let extendedCount = 0;
      for (let i = 0; i < 5; i++) {
        if (fingerTips[i] && fingerMCPs[i]) {
          if (fingerTips[i].y < fingerMCPs[i].y - 0.01) {
            extendedCount++;
          }
        }
      }

      return extendedCount >= 4; // At least 4 fingers extended
    } catch (error) {
      console.warn('Error in open palm detection:', error);
      return false;
    }
  }

  private isClosedFist(results: any): boolean {
    const hand = results.rightHandLandmarks || results.leftHandLandmarks;
    if (!hand || hand.length < 21) return false;

    try {
      // Finger tips and MCP joints (excluding thumb for fist)
      const fingerTips = [hand[8], hand[12], hand[16], hand[20]];
      const fingerMCPs = [hand[5], hand[9], hand[13], hand[17]];

      // Check if fingers are folded
      let foldedCount = 0;
      for (let i = 0; i < 4; i++) {
        if (fingerTips[i] && fingerMCPs[i]) {
          if (fingerTips[i].y > fingerMCPs[i].y + 0.01) {
            foldedCount++;
          }
        }
      }

      return foldedCount >= 3; // At least 3 fingers folded
    } catch (error) {
      console.warn('Error in closed fist detection:', error);
      return false;
    }
  }
}