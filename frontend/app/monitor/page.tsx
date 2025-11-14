'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  PoseLandmarker,
  FaceLandmarker,
  FilesetResolver,
  DrawingUtils
} from "@mediapipe/tasks-vision";
import toast, { Toaster } from 'react-hot-toast';

interface Exercise {
  name: string;
  icon: string;
  color: string;
}

export default function ExerciseTracker() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [poseLandmarker, setPoseLandmarker] = useState<any>(null);
  const [faceLandmarker, setFaceLandmarker] = useState<any>(null);
  const [webcamRunning, setWebcamRunning] = useState(false);
  const [currentExercise, setCurrentExercise] = useState<string | null>(null);
  const [repCount, setRepCount] = useState(0);
  const [timer, setTimer] = useState('');
  const [formFeedback, setFormFeedback] = useState('');
  const [debugData, setDebugData] = useState<any>(null);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [emotionStatus, setEmotionStatus] = useState('😊 Normal');
  const [accidentWarning, setAccidentWarning] = useState<string | null>(null);
  const [accidentCountdown, setAccidentCountdown] = useState(0);
 
  // Exercise tracking refs
  const exerciseStartTimeRef = useRef(0);
  const lastAlertTimeRef = useRef(0);
  const lastVideoTimeRef = useRef(-1);
  const consecutiveFramesWithErrorRef = useRef(0);
  const repStartTimeRef = useRef(0);
  const repInProgressRef = useRef(false);
  const lastRepStateRef = useRef('unknown');
  const lastSpeedWarningTimeRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastEmotionToastRef = useRef(0);
 
  // Fall detection refs
  const fallWarningStartTimeRef = useRef(0);
  const previousTrunkAngleRef = useRef(90);
  const consecutiveFallFramesRef = useRef(0);
  const lastFallCheckRef = useRef(0);
  const normalStandingHeightRef = useRef(0);
 
  // ACCIDENT DETECTION REFS
  const personLastSeenTimeRef = useRef(0);
  const personCurrentlyVisibleRef = useRef(false);
  const accidentDetectionStartTimeRef = useRef(0);
  const accidentDetectionActiveRef = useRef(false);
  const emergencyAlertShownRef = useRef(false);
 
  // Movement detection refs
  const movementHistoryRef = useRef<Array<{x: number, y: number, z: number, time: number, scale: number}>>([]);
  const lastMovementTimeRef = useRef(Date.now());
  const stuckWarningShownRef = useRef(false);
 
  // Toast management refs
  const activeToastIdsRef = useRef<{[key: string]: number}>({
    formError: 0,
    emotion: 0,
    rep: 0,
    speed: 0,
    accident: 0,
    fall: 0
  });

  // Angle smoothing refs
  const angleHistoryRef = useRef<{[key: string]: number[]}>({});
  const lastDisplayedAnglesRef = useRef<{[key: string]: number}>({});
  
  // ✨ NEW: Stricter rep counting refs
  const repStateHistoryRef = useRef<string[]>([]);
  const lastValidRepTransitionRef = useRef(0);
  const repPhaseStartTimeRef = useRef(0);
  const repCompletionRequiredStateRef = useRef<string>('extended'); // State needed to complete rep

  const ANGLE_HISTORY_SIZE = 5;
  const ANGLE_CHANGE_THRESHOLD = 3;
  const GRACE_PERIOD = 20000;
  const ALERT_COOLDOWN = 3000;
  const FRAMES_BEFORE_ALERT = 10;
  const MIN_REP_DURATION = 2000;
  const EMOTION_TOAST_COOLDOWN = 15000;
  const FALL_CHECK_INTERVAL = 100;
  const FALL_ANGLE_THRESHOLD = 45;
  const FALL_CONSECUTIVE_FRAMES = 8;
  
  // ✨ NEW: Rep validation constants
  const REP_STATE_HISTORY_SIZE = 3;
  const MIN_PHASE_DURATION = 500; // Must hold each phase for 500ms
  const REP_COOLDOWN = 800; // Minimum time between counted reps
  const ANGLE_THRESHOLD_BUFFER = 5;
 
  // Accident detection constants
  const ACCIDENT_WARNING_DURATION = 20000;
  const MOVEMENT_HISTORY_SIZE = 30;
  const NO_MOVEMENT_THRESHOLD = 0.015;
  const STUCK_WARNING_TIME = 10000;
  const STUCK_ACCIDENT_TIME = 20000;

  const exercises: Exercise[] = [
    { name: 'Shoulder Press', icon: '💪', color: 'from-blue-500 to-purple-600' },
    { name: 'Squats', icon: '🦵', color: 'from-green-500 to-teal-600' },
    { name: 'Bicep Curls', icon: '💪', color: 'from-orange-500 to-red-600' }
  ];

  // TOAST MANAGEMENT
  const showToastWithCooldown = (type: string, message: string, category: keyof typeof activeToastIdsRef.current, duration = 5000) => {
    const currentTime = Date.now();
    const lastShown = activeToastIdsRef.current[category];
   
    if (currentTime - lastShown < duration) {
      return;
    }
   
    activeToastIdsRef.current[category] = currentTime;
    toast.dismiss(`${category}-toast`);
   
    const toastConfig = {
      id: `${category}-toast`,
      duration: duration,
      style: {
        fontSize: '16px',
        fontWeight: 'bold',
        padding: '16px'
      }
    };
   
    switch(type) {
      case 'error':
        toast.error(message, toastConfig);
        break;
      case 'warning':
        toast(message, { ...toastConfig, icon: '⚠️', style: { ...toastConfig.style, background: '#F59E0B', color: '#fff' }});
        break;
      case 'success':
        toast.success(message, toastConfig);
        break;
      case 'info':
        toast(message, { ...toastConfig, icon: '💙', style: { ...toastConfig.style, background: '#3B82F6', color: '#fff' }});
        break;
    }
  };

  // Calculate angle with smoothing
  const calculateAngle = (pointA: any, pointB: any, pointC: any) => {
    const vectorBA = { x: pointA.x - pointB.x, y: pointA.y - pointB.y };
    const vectorBC = { x: pointC.x - pointB.x, y: pointC.y - pointB.y };
    const dotProduct = vectorBA.x * vectorBC.x + vectorBA.y * vectorBC.y;
    const magnitudeBA = Math.sqrt(vectorBA.x ** 2 + vectorBA.y ** 2);
    const magnitudeBC = Math.sqrt(vectorBC.x ** 2 + vectorBC.y ** 2);
    const angleRad = Math.acos(Math.max(-1, Math.min(1, dotProduct / (magnitudeBA * magnitudeBC))));
    return (angleRad * 180) / Math.PI;
  };

  // Smoothed angle calculation with moving average
  const calculateSmoothedAngle = (pointA: any, pointB: any, pointC: any, angleKey: string): number => {
    const rawAngle = calculateAngle(pointA, pointB, pointC);
    
    if (!angleHistoryRef.current[angleKey]) {
      angleHistoryRef.current[angleKey] = [];
      lastDisplayedAnglesRef.current[angleKey] = rawAngle;
    }
    
    angleHistoryRef.current[angleKey].push(rawAngle);
    if (angleHistoryRef.current[angleKey].length > ANGLE_HISTORY_SIZE) {
      angleHistoryRef.current[angleKey].shift();
    }
    
    const smoothedAngle = angleHistoryRef.current[angleKey].reduce((sum, a) => sum + a, 0) / angleHistoryRef.current[angleKey].length;
    
    const lastDisplayed = lastDisplayedAnglesRef.current[angleKey];
    if (Math.abs(smoothedAngle - lastDisplayed) > ANGLE_CHANGE_THRESHOLD) {
      lastDisplayedAnglesRef.current[angleKey] = smoothedAngle;
      return smoothedAngle;
    }
    
    return lastDisplayed;
  };

  // Initialize MediaPipe with higher confidence thresholds
  useEffect(() => {
    const initializeModels = async () => {
      try {
        console.log("🔄 Initializing MediaPipe...");
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
       
        const poseModel = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numPoses: 1,
          minPoseDetectionConfidence: 0.7,
          minPosePresenceConfidence: 0.7,
          minTrackingConfidence: 0.7
        });
       
        const faceModel = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          outputFaceBlendshapes: true,
          numFaces: 1
        });
       
        setPoseLandmarker(poseModel);
        setFaceLandmarker(faceModel);
        setIsLoading(false);
        console.log("✅ MediaPipe initialized!");
        showToastWithCooldown('success', '🎯 AI Models Ready!', 'accident', 3000);
      } catch (error) {
        console.error("❌ Failed to initialize:", error);
        setIsLoading(false);
        showToastWithCooldown('error', 'Failed to load AI models', 'accident', 5000);
      }
    };
    initializeModels();
  }, []);

  // Emotion Detection
  const detectEmotion = (faceBlendshapes: any) => {
    if (!faceBlendshapes || faceBlendshapes.length === 0) return;
   
    const currentTime = Date.now();
    if (currentTime - lastEmotionToastRef.current < EMOTION_TOAST_COOLDOWN) return;

    const blendshapesList = faceBlendshapes[0];
    if (!blendshapesList || !blendshapesList.categories) return;
   
    const categories = blendshapesList.categories;
   
    const getScore = (name: string) => {
      const shape = categories.find((b: any) => b.categoryName === name);
      return shape ? shape.score : 0;
    };

    const eyeSquintLeft = getScore('eyeSquintLeft');
    const eyeSquintRight = getScore('eyeSquintRight');
    const browDownLeft = getScore('browDownLeft');
    const browDownRight = getScore('browDownRight');
    const mouthFrownLeft = getScore('mouthFrownLeft');
    const mouthFrownRight = getScore('mouthFrownRight');
    const jawOpen = getScore('jawOpen');
    const mouthPucker = getScore('mouthPucker');

    const painScore = ((eyeSquintLeft + eyeSquintRight) * 1.5 + (browDownLeft + browDownRight) * 1.2 + mouthPucker) / 5;
    const frustrationScore = ((browDownLeft + browDownRight) * 1.5 + (mouthFrownLeft + mouthFrownRight)) / 4;
    const fatigueScore = (jawOpen * 1.8 + (eyeSquintLeft + eyeSquintRight)) / 3;

    if (painScore > 0.35) {
      setEmotionStatus('😣 Pain');
      showToastWithCooldown('info', '🌟 You\'re doing great! Take a break if needed.', 'emotion', EMOTION_TOAST_COOLDOWN);
      lastEmotionToastRef.current = currentTime;
    } else if (frustrationScore > 0.4) {
      setEmotionStatus('😤 Frustration');
      showToastWithCooldown('warning', '💪 Stay strong! Every rep brings progress!', 'emotion', EMOTION_TOAST_COOLDOWN);
      lastEmotionToastRef.current = currentTime;
    } else if (fatigueScore > 0.45) {
      setEmotionStatus('😴 Fatigue');
      showToastWithCooldown('info', '🌸 Rest is part of progress. Listen to your body!', 'emotion', EMOTION_TOAST_COOLDOWN);
      lastEmotionToastRef.current = currentTime;
    } else {
      setEmotionStatus('😊 Normal');
    }
  };

  // ACCIDENT DETECTION
  const handleAccidentDetection = (personVisible: boolean) => {
    const currentTime = Date.now();
    const elapsedTime = currentTime - exerciseStartTimeRef.current;
   
    if (elapsedTime < GRACE_PERIOD) return;
   
    if (personVisible) {
      personLastSeenTimeRef.current = currentTime;
     
      if (!personCurrentlyVisibleRef.current) {
        personCurrentlyVisibleRef.current = true;
       
        if (accidentDetectionActiveRef.current && !emergencyAlertShownRef.current) {
          accidentDetectionActiveRef.current = false;
          setAccidentWarning(null);
          setAccidentCountdown(0);
          showToastWithCooldown('success', '✅ Back in view! Keep going!', 'accident', 3000);
        }
      }
    } else {
      if (personCurrentlyVisibleRef.current || !accidentDetectionActiveRef.current) {
        accidentDetectionStartTimeRef.current = currentTime;
        accidentDetectionActiveRef.current = true;
        personCurrentlyVisibleRef.current = false;
      }
     
      if (accidentDetectionActiveRef.current) {
        const timeSinceDisappeared = currentTime - accidentDetectionStartTimeRef.current;
        const secondsRemaining = Math.ceil((ACCIDENT_WARNING_DURATION - timeSinceDisappeared) / 1000);
       
        if (timeSinceDisappeared < ACCIDENT_WARNING_DURATION) {
          setAccidentWarning('Person not detected!');
          setAccidentCountdown(secondsRemaining);
        } else {
          if (!emergencyAlertShownRef.current) {
            triggerEmergencyAlert('PERSON_DISAPPEARED');
          }
        }
      }
    }
  };

  // MOVEMENT DETECTION
  const trackBodyMovement = (landmarks: any[]) => {
    const currentTime = Date.now();
    const elapsedTime = currentTime - exerciseStartTimeRef.current;

    if (elapsedTime < GRACE_PERIOD) {
      lastMovementTimeRef.current = currentTime;
      return;
    }

    if (!landmarks || landmarks.length === 0) return;

    const pose = landmarks[0];
    const keyIndices = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
    const keyPoints = keyIndices.map(i => pose[i]).filter(Boolean);
    if (keyPoints.length === 0) return;

    const centerX = keyPoints.reduce((sum, p) => sum + p.x, 0) / keyPoints.length;
    const centerY = keyPoints.reduce((sum, p) => sum + p.y, 0) / keyPoints.length;
    const centerZ = keyPoints.reduce((sum, p) => sum + (p.z || 0), 0) / keyPoints.length;

    const bodyScale = getBodyScale(pose) || 0.25;

    movementHistoryRef.current.push({ x: centerX, y: centerY, z: centerZ, time: currentTime, scale: bodyScale });

    if (movementHistoryRef.current.length > MOVEMENT_HISTORY_SIZE) {
      movementHistoryRef.current.shift();
    }

    if (movementHistoryRef.current.length < 3) {
      lastMovementTimeRef.current = currentTime;
      stuckWarningShownRef.current = false;
      return;
    }

    let totalDisp = 0;
    let count = 0;
    for (let i = 1; i < movementHistoryRef.current.length; i++) {
      const a = movementHistoryRef.current[i-1];
      const b = movementHistoryRef.current[i];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dz = (b.z || 0) - (a.z || 0);
      const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
      const avgScale = (a.scale + b.scale) / 2 || bodyScale;
      totalDisp += dist / avgScale;
      count++;
    }
    const avgDisp = totalDisp / count;

    const isMoving = avgDisp > NO_MOVEMENT_THRESHOLD;

    if (isMoving) {
      lastMovementTimeRef.current = currentTime;
      stuckWarningShownRef.current = false;
      if (accidentWarning?.includes('NOT MOVING')) {
        setAccidentWarning(null);
        setAccidentCountdown(0);
      }
    } else {
      const timeSinceLastMovement = currentTime - lastMovementTimeRef.current;

      if (timeSinceLastMovement > STUCK_ACCIDENT_TIME && !emergencyAlertShownRef.current) {
        triggerEmergencyAlert('NOT_MOVING');
      } else if (timeSinceLastMovement > STUCK_WARNING_TIME && !stuckWarningShownRef.current) {
        stuckWarningShownRef.current = true;
        const secondsRemaining = Math.ceil((STUCK_ACCIDENT_TIME - timeSinceLastMovement) / 1000);
        setAccidentWarning('NOT MOVING!');
        setAccidentCountdown(secondsRemaining);
      }
    }
  };

  const getBodyScale = (pose: any) => {
    try {
      const leftHip = pose[23], rightHip = pose[24];
      if (leftHip && rightHip) {
        const dx = leftHip.x - rightHip.x;
        const dy = leftHip.y - rightHip.y;
        const d = Math.sqrt(dx*dx + dy*dy);
        if (d > 0.02) return d;
      }
    } catch (e) {}
    return 0.25;
  };

  const triggerEmergencyAlert = (type: 'PERSON_DISAPPEARED' | 'NOT_MOVING' | 'FALL_CONFIRMED') => {
    emergencyAlertShownRef.current = true;
   
    let message = '';
    switch(type) {
      case 'PERSON_DISAPPEARED':
        message = '🚨 EMERGENCY: Person missing for 20+ seconds!';
        setFormFeedback('🚨 PERSON DISAPPEARED! Guardian alerted!');
        break;
      case 'NOT_MOVING':
        message = '🚨 EMERGENCY: No movement for 20+ seconds!';
        setFormFeedback('🚨 NOT MOVING! Guardian alerted!');
        break;
      case 'FALL_CONFIRMED':
        message = '🚨 EMERGENCY: Fall confirmed!';
        setFormFeedback('🚨 FALL DETECTED! Guardian alerted!');
        break;
    }
   
    toast.error(message, {
      id: 'emergency-alert',
      duration: 10000,
      style: {
        background: '#EF4444',
        color: '#fff',
        fontSize: '20px',
        fontWeight: 'bold',
        padding: '20px'
      }
    });
   
    console.log('🚨 GUARDIAN ALERT:', type);
  };

  const detectFall = (landmarks: any[]) => {
    const currentTime = Date.now();
    if (currentTime - lastFallCheckRef.current < FALL_CHECK_INTERVAL) return;
    lastFallCheckRef.current = currentTime;

    if (!landmarks || landmarks.length === 0) {
      consecutiveFallFramesRef.current = 0;
      return;
    }

    const pose = landmarks[0];
   
    const leftShoulder = pose[11];
    const rightShoulder = pose[12];
    const leftHip = pose[23];
    const rightHip = pose[24];

    const shoulderCenter = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2
    };
   
    const hipCenter = {
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2
    };

    const deltaY = hipCenter.y - shoulderCenter.y;
    const deltaX = Math.abs(hipCenter.x - shoulderCenter.x);
    const trunkAngleFromVertical = Math.atan2(deltaX, deltaY) * (180 / Math.PI);

    const isFalling = trunkAngleFromVertical > FALL_ANGLE_THRESHOLD;

    if (isFalling) {
      consecutiveFallFramesRef.current++;
     
      if (consecutiveFallFramesRef.current >= FALL_CONSECUTIVE_FRAMES) {
        if (!emergencyAlertShownRef.current) {
          triggerEmergencyAlert('FALL_CONFIRMED');
        }
      }
    } else {
      consecutiveFallFramesRef.current = 0;
    }

    previousTrunkAngleRef.current = trunkAngleFromVertical;
  };

  // Exercise form checking with smoothed angles
  const checkShoulderPress = (landmarks: any[]) => {
    const currentTime = Date.now();
    if (currentTime - exerciseStartTimeRef.current < GRACE_PERIOD) return;
   
    const pose = landmarks[0];
    const leftShoulderAngle = calculateSmoothedAngle(pose[23], pose[11], pose[13], 'leftShoulder');
    const rightShoulderAngle = calculateSmoothedAngle(pose[24], pose[12], pose[14], 'rightShoulder');
   
    const hasError = leftShoulderAngle > 130 && rightShoulderAngle > 130;
   
    if (hasError) {
      consecutiveFramesWithErrorRef.current++;
      setConsecutiveErrors(consecutiveFramesWithErrorRef.current);
     
      if (consecutiveFramesWithErrorRef.current >= FRAMES_BEFORE_ALERT) {
        if (currentTime - lastAlertTimeRef.current > ALERT_COOLDOWN) {
          setFormFeedback("⚠️ Elbows flaring! Keep them closer!");
          showToastWithCooldown('error', '⚠️ Elbows too wide! Risk of injury', 'formError', ALERT_COOLDOWN);
          lastAlertTimeRef.current = currentTime;
          setTimeout(() => setFormFeedback(''), 4000);
        }
      }
    } else {
      consecutiveFramesWithErrorRef.current = 0;
      setConsecutiveErrors(0);
    }
  };

  const checkSquats = (landmarks: any[]) => {
    const currentTime = Date.now();
    if (currentTime - exerciseStartTimeRef.current < GRACE_PERIOD) return;
   
    const pose = landmarks[0];
    const leftKneeAngle = calculateSmoothedAngle(pose[23], pose[25], pose[27], 'leftKnee');
    const rightKneeAngle = calculateSmoothedAngle(pose[24], pose[26], pose[28], 'rightKnee');
    const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;
   
    const isSquatting = avgKneeAngle < 140;
    const kneeDistance = Math.abs(pose[25].x - pose[26].x);
    const ankleDistance = Math.abs(pose[27].x - pose[28].x);
    const kneesCaving = kneeDistance < ankleDistance * 0.7;
   
    const hasError = kneesCaving && isSquatting;
   
    if (hasError) {
      consecutiveFramesWithErrorRef.current++;
      setConsecutiveErrors(consecutiveFramesWithErrorRef.current);
     
      if (consecutiveFramesWithErrorRef.current >= FRAMES_BEFORE_ALERT) {
        if (currentTime - lastAlertTimeRef.current > ALERT_COOLDOWN) {
          setFormFeedback("⚠️ Knees caving! Push them outward!");
          showToastWithCooldown('error', '⚠️ Knees caving in! Risk of injury', 'formError', ALERT_COOLDOWN);
          lastAlertTimeRef.current = currentTime;
          setTimeout(() => setFormFeedback(''), 4000);
        }
      }
    } else {
      consecutiveFramesWithErrorRef.current = 0;
      setConsecutiveErrors(0);
    }
  };

  const checkBicepCurls = (landmarks: any[]) => {
    const currentTime = Date.now();
    if (currentTime - exerciseStartTimeRef.current < GRACE_PERIOD) return;
   
    const pose = landmarks[0];
    const leftElbowForward = pose[13].z < pose[11].z - 0.1;
    const rightElbowForward = pose[14].z < pose[12].z - 0.1;
    const leftElbowAngle = calculateSmoothedAngle(pose[11], pose[13], pose[15], 'leftElbow');
    const rightElbowAngle = calculateSmoothedAngle(pose[12], pose[14], pose[16], 'rightElbow');
    const isCurling = leftElbowAngle < 140 || rightElbowAngle < 140;
   
    const hasError = (leftElbowForward || rightElbowForward) && isCurling;
   
    if (hasError) {
      consecutiveFramesWithErrorRef.current++;
      setConsecutiveErrors(consecutiveFramesWithErrorRef.current);
     
      if (consecutiveFramesWithErrorRef.current >= FRAMES_BEFORE_ALERT) {
        if (currentTime - lastAlertTimeRef.current > ALERT_COOLDOWN) {
          setFormFeedback("⚠️ Stop swinging! Pin elbows!");
          showToastWithCooldown('error', '⚠️ Stop swinging! Pin elbows to sides', 'formError', ALERT_COOLDOWN);
          lastAlertTimeRef.current = currentTime;
          setTimeout(() => setFormFeedback(''), 4000);
        }
      }
    } else {
      consecutiveFramesWithErrorRef.current = 0;
      setConsecutiveErrors(0);
    }
  };

  // Debug data with smoothed angles
  const updateDebugData = (landmarks: any[], exerciseName: string) => {
    if (!landmarks || landmarks.length === 0) return;
   
    const pose = landmarks[0];
   
    const leftShoulder = pose[11];
    const rightShoulder = pose[12];
    const leftHip = pose[23];
    const rightHip = pose[24];
   
    const shoulderCenter = { x: (leftShoulder.x + rightShoulder.x) / 2, y: (leftShoulder.y + rightShoulder.y) / 2 };
    const hipCenter = { x: (leftHip.x + rightHip.x) / 2, y: (leftHip.y + rightHip.y) / 2 };
   
    const deltaY = hipCenter.y - shoulderCenter.y;
    const deltaX = Math.abs(hipCenter.x - shoulderCenter.x);
    const trunkAngle = Math.atan2(deltaX, deltaY) * (180 / Math.PI);
   
    let data: any = {
      exercise: exerciseName,
      reps: repCount,
      errors: consecutiveFramesWithErrorRef.current,
      trunkAngle: trunkAngle.toFixed(1) + '°',
      fallFrames: consecutiveFallFramesRef.current,
      personVisible: true
    };
   
    switch(exerciseName) {
      case "Shoulder Press":
        const leftElbowAngle = calculateSmoothedAngle(pose[11], pose[13], pose[15], 'leftElbowDebug');
        const rightElbowAngle = calculateSmoothedAngle(pose[12], pose[14], pose[16], 'rightElbowDebug');
        const avgElbowAngle = (leftElbowAngle + rightElbowAngle) / 2;
       
        data = { ...data, elbowAngle: avgElbowAngle.toFixed(0) + '°', state: avgElbowAngle > 150 ? 'UP ⬆️' : 'DOWN ⬇️' };
        break;
     
      case "Squats":
        const leftKneeAngle = calculateSmoothedAngle(pose[23], pose[25], pose[27], 'leftKneeDebug');
        const rightKneeAngle = calculateSmoothedAngle(pose[24], pose[26], pose[28], 'rightKneeDebug');
        const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;
       
        data = { ...data, kneeAngle: avgKneeAngle.toFixed(0) + '°', state: avgKneeAngle < 140 ? 'DOWN ⬇️' : 'UP ⬆️' };
        break;
     
      case "Bicep Curls":
        const leftBicepAngle = calculateSmoothedAngle(pose[11], pose[13], pose[15], 'leftBicepDebug');
        const rightBicepAngle = calculateSmoothedAngle(pose[12], pose[14], pose[16], 'rightBicepDebug');
        const avgBicepAngle = (leftBicepAngle + rightBicepAngle) / 2;
       
        data = { ...data, bicepAngle: avgBicepAngle.toFixed(0) + '°', state: avgBicepAngle < 60 ? 'UP ⬆️' : 'DOWN ⬇️' };
        break;
    }
   
    setDebugData(data);
  };

  // ✨ NEW: Stricter rep counting with full range of motion validation
  const trackRepSpeed = (landmarks: any[], exerciseName: string) => {
    const currentTime = Date.now();
    const elapsedTime = currentTime - exerciseStartTimeRef.current;
   
    if (elapsedTime < GRACE_PERIOD) return;
   
    const pose = landmarks[0];
    let currentAngle = 0;
    let minAngle = 0;
    let maxAngle = 0;
    let contractedThreshold = 0;
    let extendedThreshold = 0;
   
    switch(exerciseName) {
      case "Shoulder Press":
        currentAngle = (calculateSmoothedAngle(pose[11], pose[13], pose[15], 'shoulderRep') + 
                       calculateSmoothedAngle(pose[12], pose[14], pose[16], 'shoulderRep2')) / 2;
        minAngle = 85;
        maxAngle = 165;
        contractedThreshold = 100; // Must go below this for contracted
        extendedThreshold = 155;   // Must go above this for extended
        break;
        
      case "Squats":
        currentAngle = (calculateSmoothedAngle(pose[23], pose[25], pose[27], 'kneeRep') + 
                       calculateSmoothedAngle(pose[24], pose[26], pose[28], 'kneeRep2')) / 2;
        minAngle = 80;
        maxAngle = 175;
        contractedThreshold = 110; // Deep squat
        extendedThreshold = 160;   // Standing
        break;
        
      case "Bicep Curls":
        currentAngle = (calculateSmoothedAngle(pose[11], pose[13], pose[15], 'bicepRep') + 
                       calculateSmoothedAngle(pose[12], pose[14], pose[16], 'bicepRep2')) / 2;
        minAngle = 35;
        maxAngle = 165;
        contractedThreshold = 50;  // ✨ Stricter: Must curl to < 50°
        extendedThreshold = 150;   // ✨ Stricter: Must extend to > 150°
        break;
    }
   
    // Determine current state with strict thresholds
    let currentRepState = "transition";
    
    switch(exerciseName) {
      case "Shoulder Press":
        if (currentAngle >= extendedThreshold) {
          currentRepState = "extended";
        } else if (currentAngle <= contractedThreshold) {
          currentRepState = "contracted";
        }
        break;
        
      case "Squats":
        if (currentAngle >= extendedThreshold) {
          currentRepState = "standing";
        } else if (currentAngle <= contractedThreshold) {
          currentRepState = "squatting";
        }
        break;
        
      case "Bicep Curls":
        // ✨ STRICTER: Only count as contracted/extended if clearly in those positions
        if (currentAngle <= contractedThreshold) {
          currentRepState = "contracted";
        } else if (currentAngle >= extendedThreshold) {
          currentRepState = "extended";
        }
        break;
    }
   
    // Track state history for consistency validation
    repStateHistoryRef.current.push(currentRepState);
    if (repStateHistoryRef.current.length > REP_STATE_HISTORY_SIZE) {
      repStateHistoryRef.current.shift();
    }
   
    // ✨ NEW: Ignore transition states completely
    if (currentRepState === "transition") {
      return;
    }
   
    // ✨ NEW: Check if state has changed from last valid state
    if (currentRepState !== lastRepStateRef.current && 
        lastRepStateRef.current !== "unknown" && 
        lastRepStateRef.current !== "transition") {
      
      // Calculate how long we were in the previous state
      const phaseHoldTime = currentTime - repPhaseStartTimeRef.current;
      
      // ✨ Must hold each phase for minimum duration (prevents micro-movements from counting)
      if (phaseHoldTime < MIN_PHASE_DURATION) {
        repPhaseStartTimeRef.current = currentTime;
        return;
      }
      
      // ✨ Check rep cooldown - prevent double counting from jitter
      if (currentTime - lastValidRepTransitionRef.current < REP_COOLDOWN) {
        return;
      }
      
      // ✨ Validate that we have consistent state in history (not flickering)
      const recentHistory = repStateHistoryRef.current.slice(-3);
      const consistentState = recentHistory.filter(s => s === currentRepState).length >= 2;
      
      if (!consistentState) {
        return;
      }
      
      // ✨ NEW: Full cycle validation - must complete both phases
      const expectedNextState = repCompletionRequiredStateRef.current;
      
      if (currentRepState === expectedNextState) {
        // Complete rep only if we went through full range
        if (!repInProgressRef.current) {
          // Start of first phase
          repStartTimeRef.current = currentTime;
          repInProgressRef.current = true;
          
          // Set next required state
          if (exerciseName === "Bicep Curls") {
            repCompletionRequiredStateRef.current = currentRepState === "contracted" ? "extended" : "contracted";
          } else if (exerciseName === "Shoulder Press") {
            repCompletionRequiredStateRef.current = currentRepState === "extended" ? "contracted" : "extended";
          } else if (exerciseName === "Squats") {
            repCompletionRequiredStateRef.current = currentRepState === "standing" ? "squatting" : "standing";
          }
        } else {
          // Complete full rep cycle
          const repDuration = currentTime - repStartTimeRef.current;
          
          // ✨ Only count if rep took reasonable time
          if (repDuration >= MIN_REP_DURATION) {
            setRepCount(prev => prev + 1);
            showToastWithCooldown('success', `Rep ${repCount + 1} completed! 🎉`, 'rep', 2000);
            lastValidRepTransitionRef.current = currentTime;
          } else {
            // Too fast - warn user
            if (currentTime - lastSpeedWarningTimeRef.current > 8000) {
              showToastWithCooldown('warning', '⏱️ Slow down! Quality over speed', 'speed', 8000);
              lastSpeedWarningTimeRef.current = currentTime;
            }
          }
          
          // Reset for next rep
          repInProgressRef.current = false;
          
          // Set next required state
          if (exerciseName === "Bicep Curls") {
            repCompletionRequiredStateRef.current = currentRepState === "contracted" ? "extended" : "contracted";
          } else if (exerciseName === "Shoulder Press") {
            repCompletionRequiredStateRef.current = currentRepState === "extended" ? "contracted" : "extended";
          } else if (exerciseName === "Squats") {
            repCompletionRequiredStateRef.current = currentRepState === "standing" ? "squatting" : "standing";
          }
        }
      }
    }
   
    // Update last state and phase time
    if (currentRepState !== lastRepStateRef.current && currentRepState !== "transition") {
      lastRepStateRef.current = currentRepState;
      repPhaseStartTimeRef.current = currentTime;
    }
  };

  const checkPersonVisibility = (landmarks: any[]) => {
    return landmarks && landmarks.length > 0 && landmarks[0].length >= 25;
  };

  const predictWebcam = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !poseLandmarker || !faceLandmarker || !webcamRunning) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
   
    if (video.readyState < 2) {
      animationFrameRef.current = requestAnimationFrame(predictWebcam);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    try {
      const currentVideoTime = video.currentTime;
      if (currentVideoTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = currentVideoTime;
       
        const startTimeMs = performance.now();
       
        const poseResult = await poseLandmarker.detectForVideo(video, startTimeMs);
        const faceResult = await faceLandmarker.detectForVideo(video, startTimeMs);
       
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
       
        const personVisible = checkPersonVisibility(poseResult.landmarks);
       
        if (poseResult.landmarks && poseResult.landmarks.length > 0) {
          const drawingUtils = new DrawingUtils(canvasCtx);
         
          for (const landmark of poseResult.landmarks) {
            drawingUtils.drawConnectors(landmark, PoseLandmarker.POSE_CONNECTIONS, { color: '#00FF00', lineWidth: 4 });
            drawingUtils.drawLandmarks(landmark, {
              color: '#FF0000',
              fillColor: '#FF0000',
              radius: (data: any) => DrawingUtils.lerp(data.from!.z!, -0.15, 0.1, 8, 1)
            });
          }

          handleAccidentDetection(personVisible);
          trackBodyMovement(poseResult.landmarks);
          detectFall(poseResult.landmarks);

          if (currentExercise) {
            const exerciseFunctions: any = {
              'Shoulder Press': checkShoulderPress,
              'Squats': checkSquats,
              'Bicep Curls': checkBicepCurls
            };
           
            if (exerciseFunctions[currentExercise]) {
              exerciseFunctions[currentExercise](poseResult.landmarks);
              trackRepSpeed(poseResult.landmarks, currentExercise);
            }
           
            updateDebugData(poseResult.landmarks, currentExercise);

            const elapsedTime = Date.now() - exerciseStartTimeRef.current;
            const remainingGracePeriod = GRACE_PERIOD - elapsedTime;
           
            if (remainingGracePeriod > 0) {
              setTimer(`⏳ Setup: ${Math.ceil(remainingGracePeriod / 1000)}s`);
            } else {
              setTimer('✅ Tracking');
            }
          } else {
            updateDebugData(poseResult.landmarks, 'Monitoring');
          }
        } else {
          handleAccidentDetection(false);
        }
       
        if (faceResult.faceBlendshapes && faceResult.faceBlendshapes.length > 0) {
          detectEmotion(faceResult.faceBlendshapes);
        }
      }
    } catch (error) {
      console.error("❌ Detection error:", error);
    }

    if (webcamRunning) {
      animationFrameRef.current = requestAnimationFrame(predictWebcam);
    }
  }, [poseLandmarker, faceLandmarker, webcamRunning, currentExercise, repCount]);

  const enableWebcam = async () => {
    if (!poseLandmarker || !faceLandmarker) {
      showToastWithCooldown('error', 'Please wait, loading AI...', 'accident', 3000);
      return;
    }

    if (webcamRunning) {
      setWebcamRunning(false);
      setCurrentExercise(null);
      setAccidentWarning(null);
      setAccidentCountdown(0);
     
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
     
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
     
      showToastWithCooldown('info', '📹 Webcam stopped', 'accident', 2000);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } }
      });
     
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadeddata = () => {
          setWebcamRunning(true);
          showToastWithCooldown('success', '📹 AI tracking active!', 'accident', 3000);
        };
      }
    } catch (error) {
      console.error("❌ Webcam error:", error);
      showToastWithCooldown('error', 'Failed to access webcam', 'accident', 5000);
    }
  };

  useEffect(() => {
    if (webcamRunning && poseLandmarker && faceLandmarker) {
      predictWebcam();
    }
   
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [webcamRunning, poseLandmarker, faceLandmarker, predictWebcam]);

  const startExercise = (exerciseName: string) => {
    if (!webcamRunning) {
      showToastWithCooldown('error', 'Enable webcam first!', 'accident', 3000);
      return;
    }
   
    if (currentExercise === exerciseName) {
      setCurrentExercise(null);
      setRepCount(0);
      setTimer('');
      setFormFeedback('');
      setAccidentWarning(null);
      setAccidentCountdown(0);
      consecutiveFramesWithErrorRef.current = 0;
      emergencyAlertShownRef.current = false;
      accidentDetectionActiveRef.current = false;
      movementHistoryRef.current = [];
      angleHistoryRef.current = {};
      lastDisplayedAnglesRef.current = {};
      repStateHistoryRef.current = [];
      lastRepStateRef.current = 'unknown';
      repInProgressRef.current = false;
      
      showToastWithCooldown('info', `🛑 ${exerciseName} stopped`, 'accident', 2000);
    } else {
      setCurrentExercise(exerciseName);
      exerciseStartTimeRef.current = Date.now();
      setRepCount(0);
      lastAlertTimeRef.current = 0;
      consecutiveFramesWithErrorRef.current = 0;
      lastRepStateRef.current = "unknown";
      repInProgressRef.current = false;
      personLastSeenTimeRef.current = Date.now();
      personCurrentlyVisibleRef.current = true;
      accidentDetectionActiveRef.current = false;
      emergencyAlertShownRef.current = false;
      movementHistoryRef.current = [];
      lastMovementTimeRef.current = Date.now();
      stuckWarningShownRef.current = false;
      setAccidentWarning(null);
      setAccidentCountdown(0);
      angleHistoryRef.current = {};
      lastDisplayedAnglesRef.current = {};
      repStateHistoryRef.current = [];
      repPhaseStartTimeRef.current = Date.now();
      lastValidRepTransitionRef.current = 0;
      
      // ✨ Set initial required state based on exercise
      if (exerciseName === "Bicep Curls" || exerciseName === "Shoulder Press") {
        repCompletionRequiredStateRef.current = "extended";
      } else if (exerciseName === "Squats") {
        repCompletionRequiredStateRef.current = "standing";
      }
     
      showToastWithCooldown('success', `🎯 ${exerciseName} started!`, 'accident', 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          style: { padding: '16px', fontSize: '15px' }
        }}
        containerStyle={{ top: 80 }}
      />
     
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🤖</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold">AI Exercise Guardian</h1>
                <p className="text-xs text-gray-400">Form + Emotion + Accident Detection</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <div className="text-sm text-gray-400">Emotion</div>
                <div className="text-lg font-semibold">{emotionStatus}</div>
              </div>
              {accidentWarning && (
                <div className="text-right animate-pulse">
                  <div className="text-sm text-orange-400">⚠️ {accidentWarning}</div>
                  <div className="text-lg font-bold text-orange-500">Alert in: {accidentCountdown}s</div>
                </div>
              )}
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
                  <span className="text-sm">Loading...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-sm">AI Ready</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-black/40 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center space-x-2">
                  <span>📹</span>
                  <span>Live Feed</span>
                </h2>
                <button
                  onClick={enableWebcam}
                  disabled={isLoading}
                  className={`px-6 py-2 rounded-lg font-semibold transition-all transform hover:scale-105 ${
                    webcamRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {webcamRunning ? '🛑 Stop' : '▶️ Start'}
                </button>
              </div>
             
              <div className="relative aspect-video bg-gray-900">
                <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
               
                {!webcamRunning && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                    <div className="text-center">
                      <div className="text-6xl mb-4">📹</div>
                      <p className="text-xl text-gray-400">Click "Start" to begin</p>
                    </div>
                  </div>
                )}

                {currentExercise && timer && (
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 rounded-xl shadow-lg">
                    <div className="text-sm font-medium">{currentExercise}</div>
                    <div className="text-xl font-bold">{timer}</div>
                  </div>
                )}

                {formFeedback && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-red-500/95 px-8 py-4 rounded-xl shadow-2xl border-2 border-white max-w-md text-center animate-bounce">
                    <p className="text-base font-bold">{formFeedback}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-4">
              {exercises.map((exercise) => (
                <button
                  key={exercise.name}
                  onClick={() => startExercise(exercise.name)}
                  disabled={!webcamRunning}
                  className={`relative overflow-hidden rounded-xl p-6 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                    currentExercise === exercise.name ? `bg-gradient-to-r ${exercise.color} shadow-2xl ring-4 ring-white/50` : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  <div className="text-4xl mb-2">{exercise.icon}</div>
                  <div className="text-sm font-semibold">{exercise.name}</div>
                  {currentExercise === exercise.name && (
                    <div className="absolute top-2 right-2">
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 shadow-2xl">
              <div className="text-sm font-medium opacity-80 mb-2">Rep Count</div>
              <div className="text-6xl font-bold">{repCount}</div>
              <div className="mt-2 text-sm opacity-80">{currentExercise || 'Select exercise'}</div>
            </div>

            {debugData && (
              <div className="bg-black/60 backdrop-blur-sm rounded-2xl border border-green-500/30 p-6 shadow-2xl font-mono">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-green-400">📊 Live Data</h3>
                  <div className={`w-2 h-2 rounded-full ${accidentWarning ? 'bg-orange-500' : 'bg-green-500'} animate-pulse`}></div>
                </div>
               
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Exercise:</span>
                    <span className="text-cyan-400 font-bold">{debugData.exercise}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Reps:</span>
                    <span className="text-cyan-400 text-xl font-bold">{debugData.reps}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Trunk Angle:</span>
                    <span className={`font-bold ${parseFloat(debugData.trunkAngle) > 45 ? 'text-red-500' : 'text-green-400'}`}>
                      {debugData.trunkAngle}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Person:</span>
                    <span className={`font-bold ${debugData.personVisible ? 'text-green-400' : 'text-red-500'}`}>
                      {debugData.personVisible ? '✅ Visible' : '❌ Missing'}
                    </span>
                  </div>
                 
                  {debugData.elbowAngle && (
                    <>
                      <div className="h-px bg-green-500/30 my-4"></div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Elbow:</span>
                        <span className="text-white text-lg">{debugData.elbowAngle}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">State:</span>
                        <span className="text-cyan-400 font-bold">{debugData.state}</span>
                      </div>
                    </>
                  )}
                 
                  {debugData.kneeAngle && (
                    <>
                      <div className="h-px bg-green-500/30 my-4"></div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Knee:</span>
                        <span className="text-white text-lg">{debugData.kneeAngle}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">State:</span>
                        <span className="text-cyan-400 font-bold">{debugData.state}</span>
                      </div>
                    </>
                  )}
                 
                  {debugData.bicepAngle && (
                    <>
                      <div className="h-px bg-green-500/30 my-4"></div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Bicep:</span>
                        <span className="text-white text-lg">{debugData.bicepAngle}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">State:</span>
                        <span className="text-cyan-400 font-bold">{debugData.state}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
              <h3 className="text-lg font-bold mb-4">✨ AI Features</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-3">
                  <span className="text-green-400">✓</span>
                  <span>Real-time form correction</span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-green-400">✓</span>
                  <span>Emotion detection & support</span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-green-400">✓</span>
                  <span>Person disappearance alerts (20s)</span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-green-400">✓</span>
                  <span>Stuck/no movement detection (20s)</span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-green-400">✓</span>
                  <span>Fall detection (angle-based)</span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-green-400">✓</span>
                  <span>Guardian emergency alerts</span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-green-400">✓</span>
                  <span>🆕 Angle smoothing & stabilization</span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-green-400">✓</span>
                  <span>🆕 Full ROM rep validation</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
