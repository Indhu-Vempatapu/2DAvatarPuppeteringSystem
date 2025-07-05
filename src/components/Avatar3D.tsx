import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Box, Cylinder } from '@react-three/drei';
import * as THREE from 'three';

interface Avatar3DProps {
  poseData: any;
}

export const Avatar3D = forwardRef<any, Avatar3DProps>(({ poseData }, ref) => {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftHandRef = useRef<THREE.Mesh>(null);
  const rightHandRef = useRef<THREE.Mesh>(null);
  
  // Animation state
  const animationState = useRef({
    headRotation: new THREE.Euler(),
    leftArmRotation: new THREE.Euler(),
    rightArmRotation: new THREE.Euler(),
    leftLegRotation: new THREE.Euler(),
    rightLegRotation: new THREE.Euler(),
    bodyRotation: new THREE.Euler(),
    isWaving: false,
    waveTime: 0,
    isSmiling: false,
    isBlinking: false,
    gestureScale: 1
  });

  useImperativeHandle(ref, () => ({
    reset: () => {
      if (groupRef.current) {
        groupRef.current.rotation.set(0, 0, 0);
        groupRef.current.position.set(0, 0, 0);
      }
    }
  }));

  useEffect(() => {
    if (poseData && groupRef.current) {
      updateAvatarPose(poseData);
    }
  }, [poseData]);

  const updateAvatarPose = (data: any) => {
    if (!data.pose || data.pose.length < 33) return;

    const pose = data.pose;
    const state = animationState.current;

    // Update gesture states
    state.isWaving = data.gesture === 'Waving';
    state.isSmiling = data.isSmiling;
    state.isBlinking = data.isBlinking;
    state.gestureScale = data.gesture ? 1.1 : 1;

    // Calculate body orientation
    const leftShoulder = pose[11];
    const rightShoulder = pose[12];
    const leftHip = pose[23];
    const rightHip = pose[24];

    if (leftShoulder && rightShoulder && leftHip && rightHip) {
      // Body rotation based on shoulder alignment
      const shoulderAngle = Math.atan2(
        rightShoulder.y - leftShoulder.y,
        rightShoulder.x - leftShoulder.x
      );
      state.bodyRotation.z = -shoulderAngle * 0.5;

      // Head rotation (simplified)
      const nose = pose[0];
      if (nose) {
        const headCenterX = (leftShoulder.x + rightShoulder.x) / 2;
        const headOffsetX = nose.x - headCenterX;
        state.headRotation.y = headOffsetX * 2;
        state.headRotation.z = -shoulderAngle * 0.3;
      }

      // Arm rotations
      const leftElbow = pose[13];
      const rightElbow = pose[14];
      const leftWrist = pose[15];
      const rightWrist = pose[16];

      if (leftElbow && leftWrist) {
        const leftArmAngle = Math.atan2(
          leftWrist.y - leftElbow.y,
          leftWrist.x - leftElbow.x
        );
        state.leftArmRotation.z = leftArmAngle - Math.PI / 2;
      }

      if (rightElbow && rightWrist) {
        const rightArmAngle = Math.atan2(
          rightWrist.y - rightElbow.y,
          rightWrist.x - rightElbow.x
        );
        state.rightArmRotation.z = rightArmAngle - Math.PI / 2;
      }

      // Leg rotations (simplified)
      const leftKnee = pose[25];
      const rightKnee = pose[26];
      const leftAnkle = pose[27];
      const rightAnkle = pose[28];

      if (leftKnee && leftAnkle) {
        const leftLegAngle = Math.atan2(
          leftAnkle.y - leftKnee.y,
          leftAnkle.x - leftKnee.x
        );
        state.leftLegRotation.z = leftLegAngle;
      }

      if (rightKnee && rightAnkle) {
        const rightLegAngle = Math.atan2(
          rightAnkle.y - rightKnee.y,
          rightAnkle.x - rightKnee.x
        );
        state.rightLegRotation.z = rightLegAngle;
      }
    }
  };

  useFrame((state, delta) => {
    const animState = animationState.current;
    
    // Smooth interpolation for all rotations
    const lerpFactor = 1 - Math.pow(0.01, delta);
    
    if (headRef.current) {
      headRef.current.rotation.x = THREE.MathUtils.lerp(
        headRef.current.rotation.x,
        animState.headRotation.x,
        lerpFactor
      );
      headRef.current.rotation.y = THREE.MathUtils.lerp(
        headRef.current.rotation.y,
        animState.headRotation.y,
        lerpFactor
      );
      headRef.current.rotation.z = THREE.MathUtils.lerp(
        headRef.current.rotation.z,
        animState.headRotation.z,
        lerpFactor
      );
      
      // Scale for expressions
      const targetScale = animState.isSmiling ? 1.05 : 1;
      headRef.current.scale.setScalar(
        THREE.MathUtils.lerp(headRef.current.scale.x, targetScale, lerpFactor)
      );
    }

    if (bodyRef.current) {
      bodyRef.current.rotation.z = THREE.MathUtils.lerp(
        bodyRef.current.rotation.z,
        animState.bodyRotation.z,
        lerpFactor
      );
    }

    // Arm animations
    if (leftArmRef.current) {
      if (animState.isWaving) {
        animState.waveTime += delta * 8;
        leftArmRef.current.rotation.z = Math.sin(animState.waveTime) * 0.5 - 0.5;
      } else {
        leftArmRef.current.rotation.z = THREE.MathUtils.lerp(
          leftArmRef.current.rotation.z,
          animState.leftArmRotation.z,
          lerpFactor
        );
      }
    }

    if (rightArmRef.current) {
      if (animState.isWaving) {
        rightArmRef.current.rotation.z = Math.sin(animState.waveTime + Math.PI) * 0.5 + 0.5;
      } else {
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(
          rightArmRef.current.rotation.z,
          animState.rightArmRotation.z,
          lerpFactor
        );
      }
    }

    // Leg animations
    if (leftLegRef.current) {
      leftLegRef.current.rotation.z = THREE.MathUtils.lerp(
        leftLegRef.current.rotation.z,
        animState.leftLegRotation.z,
        lerpFactor
      );
    }

    if (rightLegRef.current) {
      rightLegRef.current.rotation.z = THREE.MathUtils.lerp(
        rightLegRef.current.rotation.z,
        animState.rightLegRotation.z,
        lerpFactor
      );
    }

    // Hand scaling for gestures
    const handScale = animState.gestureScale;
    if (leftHandRef.current) {
      leftHandRef.current.scale.setScalar(
        THREE.MathUtils.lerp(leftHandRef.current.scale.x, handScale, lerpFactor)
      );
    }
    if (rightHandRef.current) {
      rightHandRef.current.scale.setScalar(
        THREE.MathUtils.lerp(rightHandRef.current.scale.x, handScale, lerpFactor)
      );
    }

    // Idle animation
    if (groupRef.current && !poseData) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={[0, -1, 0]}>
      {/* Head */}
      <Sphere ref={headRef} args={[0.3]} position={[0, 1.7, 0]} castShadow>
        <meshStandardMaterial 
          color="#ffdbac" 
          roughness={0.8}
          metalness={0.1}
        />
      </Sphere>

      {/* Eyes */}
      <Sphere args={[0.05]} position={[-0.1, 1.75, 0.25]} castShadow>
        <meshStandardMaterial color="#000" />
      </Sphere>
      <Sphere args={[0.05]} position={[0.1, 1.75, 0.25]} castShadow>
        <meshStandardMaterial color="#000" />
      </Sphere>

      {/* Body */}
      <Box ref={bodyRef} args={[0.6, 1.2, 0.3]} position={[0, 0.6, 0]} castShadow>
        <meshStandardMaterial 
          color="#4f46e5" 
          roughness={0.7}
          metalness={0.2}
        />
      </Box>

      {/* Left Arm */}
      <group ref={leftArmRef} position={[-0.4, 1.1, 0]}>
        <Cylinder args={[0.08, 0.08, 0.8]} rotation={[0, 0, 0]} castShadow>
          <meshStandardMaterial color="#ffdbac" roughness={0.8} />
        </Cylinder>
        <Sphere ref={leftHandRef} args={[0.12]} position={[0, -0.5, 0]} castShadow>
          <meshStandardMaterial color="#ffdbac" roughness={0.8} />
        </Sphere>
      </group>

      {/* Right Arm */}
      <group ref={rightArmRef} position={[0.4, 1.1, 0]}>
        <Cylinder args={[0.08, 0.08, 0.8]} rotation={[0, 0, 0]} castShadow>
          <meshStandardMaterial color="#ffdbac" roughness={0.8} />
        </Cylinder>
        <Sphere ref={rightHandRef} args={[0.12]} position={[0, -0.5, 0]} castShadow>
          <meshStandardMaterial color="#ffdbac" roughness={0.8} />
        </Sphere>
      </group>

      {/* Left Leg */}
      <group ref={leftLegRef} position={[-0.2, -0.2, 0]}>
        <Cylinder args={[0.1, 0.1, 1]} rotation={[0, 0, 0]} castShadow>
          <meshStandardMaterial color="#2563eb" roughness={0.7} />
        </Cylinder>
        <Sphere args={[0.15]} position={[0, -0.6, 0]} castShadow>
          <meshStandardMaterial color="#1f2937" roughness={0.9} />
        </Sphere>
      </group>

      {/* Right Leg */}
      <group ref={rightLegRef} position={[0.2, -0.2, 0]}>
        <Cylinder args={[0.1, 0.1, 1]} rotation={[0, 0, 0]} castShadow>
          <meshStandardMaterial color="#2563eb" roughness={0.7} />
        </Cylinder>
        <Sphere args={[0.15]} position={[0, -0.6, 0]} castShadow>
          <meshStandardMaterial color="#1f2937" roughness={0.9} />
        </Sphere>
      </group>

      {/* Gesture Effect Particles */}
      {poseData?.gesture && (
        <group position={[0, 2.5, 0]}>
          {[...Array(8)].map((_, i) => (
            <Sphere key={i} args={[0.02]} position={[
              Math.cos(i * Math.PI / 4) * 0.5,
              Math.sin(i * Math.PI / 4) * 0.3,
              0
            ]}>
              <meshStandardMaterial 
                color="#06b6d4" 
                emissive="#06b6d4"
                emissiveIntensity={0.5}
              />
            </Sphere>
          ))}
        </group>
      )}
    </group>
  );
});

Avatar3D.displayName = 'Avatar3D';