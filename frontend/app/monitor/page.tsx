"use client";
import { useRouter } from "next/navigation";
import React, { useRef, useState, useEffect } from "react";

export default function EnhancedExerciseTracker() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const exerciseSelectRef = useRef<HTMLSelectElement>(null);
  const messageLeftRef = useRef<HTMLDivElement>(null);
  const messageRightRef = useRef<HTMLDivElement>(null);
  const leftRepCountRef = useRef<HTMLParagraphElement>(null);
  const rightRepCountRef = useRef<HTMLParagraphElement>(null);
  const fallAlertRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // State variables
  const [currentExercise, setCurrentExercise] = useState("none");
  const [leftState, setLeftState] = useState("NONE");
  const [rightState, setRightState] = useState("NONE");
  const [leftReps, setLeftReps] = useState(0);
  const [rightReps, setRightReps] = useState(0);
  const [showFallAlert, setShowFallAlert] = useState(false);

  // Fall detection variables
  const [initialShoulderHipDistance, setInitialShoulderHipDistance] = useState<
    number | null
  >(null);
  const [fallFrameCount, setFallFrameCount] = useState(0);
  const FALL_FRAME_THRESHOLD = 30;
  const [lastPoseTime, setLastPoseTime] = useState(Date.now());

  // MediaPipe references (will be set after scripts load)
  const poseRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);

  // Load MediaPipe scripts
  useEffect(() => {
    // Dynamically load scripts
    const loadScript = (src: string, callback: () => void) => {
      const script = document.createElement("script");
      script.src = src;
      script.crossOrigin = "anonymous";
      script.onload = callback;
      document.body.appendChild(script);
      return () => document.body.removeChild(script);
    };

    let scriptsLoaded = 0;
    const totalScripts = 4;
    const onScriptLoad = () => {
      scriptsLoaded++;
      if (scriptsLoaded === totalScripts) {
        initializeMediaPipe();
      }
    };

    loadScript(
      "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js",
      onScriptLoad
    );
    loadScript(
      "https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js",
      onScriptLoad
    );
    loadScript(
      "https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js",
      onScriptLoad
    );
    loadScript(
      "https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js",
      onScriptLoad
    );

    return () => {
      // Cleanup scripts if needed
    };
  }, []);

  // Initialize MediaPipe after scripts load
  const initializeMediaPipe = () => {
    if (typeof window === "undefined") return;

    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;
    if (!videoElement || !canvasElement) return;

    const canvasCtx = canvasElement.getContext("2d");
    if (!canvasCtx) return;

    // Initialize Pose
    const pose = new window.Pose({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
      },
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      smoothSegmentation: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    pose.onResults((results: any) => onResults(results, canvasCtx));

    poseRef.current = pose;

    // Initialize Camera
    const camera = new window.Camera(videoElement, {
      onFrame: async () => {
        await pose.send({ image: videoElement });
      },
      width: 640,
      height: 480,
    });

    cameraRef.current = camera;
    camera.start();

    console.log(
      "Enhanced Exercise Tracker initialized with fall detection and rep counting!"
    );
  };

  // Utility Functions
  const calculateAngle = (
    a: { x: number; y: number },
    b: { x: number; y: number },
    c: { x: number; y: number }
  ) => {
    const radians =
      Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);
    if (angle > 180.0) {
      angle = 360 - angle;
    }
    return angle;
  };

  const calculateDistance = (
    a: { x: number; y: number },
    b: { x: number; y: number }
  ) => {
    return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
  };

  // Fall Detection
  const checkFallDetection = (landmarks: any[]) => {
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    const nose = landmarks[0];
    const leftKnee = landmarks[25];
    const rightKnee = landmarks[26];

    if (
      leftShoulder.visibility < 0.5 ||
      rightShoulder.visibility < 0.5 ||
      leftHip.visibility < 0.5 ||
      rightHip.visibility < 0.5
    ) {
      return false;
    }

    const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
    const hipY = (leftHip.y + rightHip.y) / 2;
    const currentShoulderHipDistance = Math.abs(shoulderY - hipY);

    if (initialShoulderHipDistance === null) {
      setInitialShoulderHipDistance(currentShoulderHipDistance);
      return false;
    }

    const heightRatio = currentShoulderHipDistance / initialShoulderHipDistance;
    const torsoAngle = calculateAngle(
      { x: leftShoulder.x, y: leftShoulder.y },
      { x: leftHip.x, y: leftHip.y },
      { x: leftKnee.x, y: leftKnee.y }
    );
    const headFloorDistance = 1.0 - nose.y;

    const isFalling =
      heightRatio < 0.6 ||
      (torsoAngle > 60 && torsoAngle < 120) ||
      headFloorDistance < 0.3;

    if (isFalling) {
      setFallFrameCount((prev) => {
        const newCount = prev + 1;
        if (newCount >= FALL_FRAME_THRESHOLD) {
          setShowFallAlert(true);
          return newCount;
        }
        return newCount;
      });
      return fallFrameCount + 1 >= FALL_FRAME_THRESHOLD;
    } else {
      setFallFrameCount(0);
      return false;
    }
  };

  const hideFallAlert = () => setShowFallAlert(false);

  // Rep Counting State Machines
  const updateBicepCurlReps = (
    angle: number,
    currentState: string,
    side: string
  ) => {
    let newState = currentState;
    let repCompleted = false;

    if (currentState === "NONE" || currentState === "DOWN") {
      if (angle > 160) {
        newState = "DOWN";
      } else if (angle < 140) {
        newState = "CURLING";
      }
    } else if (currentState === "CURLING") {
      if (angle < 50) {
        newState = "UP";
      }
    } else if (currentState === "UP") {
      if (angle > 70) {
        newState = "LOWERING";
      }
    } else if (currentState === "LOWERING") {
      if (angle > 150) {
        newState = "DOWN";
        repCompleted = true;
      }
    }

    return { newState, repCompleted };
  };

  const updateLegExtensionReps = (
    angle: number,
    currentState: string,
    side: string
  ) => {
    let newState = currentState;
    let repCompleted = false;

    if (currentState === "NONE" || currentState === "DOWN") {
      if (angle < 100) {
        newState = "DOWN";
      } else if (angle > 110) {
        newState = "EXTENDING";
      }
    } else if (currentState === "EXTENDING") {
      if (angle > 160) {
        newState = "UP";
      }
    } else if (currentState === "UP") {
      if (angle < 150) {
        newState = "LOWERING";
      }
    } else if (currentState === "LOWERING") {
      if (angle < 110) {
        newState = "DOWN";
        repCompleted = true;
      }
    }

    return { newState, repCompleted };
  };

  const updateShoulderPressReps = (
    angle: number,
    wristAboveShoulder: boolean,
    currentState: string,
    side: string
  ) => {
    let newState = currentState;
    let repCompleted = false;

    if (currentState === "NONE" || currentState === "DOWN") {
      if (angle < 100) {
        newState = "DOWN";
      } else if (angle > 110) {
        newState = "PRESSING";
      }
    } else if (currentState === "PRESSING") {
      if (angle > 150 && wristAboveShoulder) {
        newState = "UP";
      }
    } else if (currentState === "UP") {
      if (angle < 150) {
        newState = "LOWERING";
      }
    } else if (currentState === "LOWERING") {
      if (angle < 110) {
        newState = "DOWN";
        repCompleted = true;
      }
    }

    return { newState, repCompleted };
  };

  // Exercise Checking Functions
  const checkBicepCurlWithForm = (
    shoulder: any,
    elbow: any,
    wrist: any,
    hip: any,
    feedbackEl: HTMLDivElement | null,
    currentState: string,
    side: "left" | "right"
  ) => {
    if (
      shoulder.visibility > 0.5 &&
      elbow.visibility > 0.5 &&
      wrist.visibility > 0.5
    ) {
      const elbowAngle = calculateAngle(shoulder, elbow, wrist);
      const shoulderAngle = calculateAngle(hip, shoulder, elbow);

      if (feedbackEl) {
        feedbackEl.classList.remove("alert");
      }

      const { newState, repCompleted } = updateBicepCurlReps(
        elbowAngle,
        currentState,
        side
      );

      if (repCompleted) {
        if (side === "left") {
          setLeftReps((prev) => prev + 1);
        } else {
          setRightReps((prev) => prev + 1);
        }
      }

      let feedback = "";
      if (newState === "DOWN") {
        feedback = `✓ Ready (${elbowAngle.toFixed(0)}°)`;
      } else if (newState === "CURLING") {
        feedback = `↑ Curling (${elbowAngle.toFixed(0)}°)`;
      } else if (newState === "UP") {
        feedback = `💪 Top! (${elbowAngle.toFixed(0)}°)`;
      } else if (newState === "LOWERING") {
        feedback = `↓ Lowering (${elbowAngle.toFixed(0)}°)`;
      }

      if (shoulderAngle < 35) {
        feedback = "⚠️ Keep elbow stable!";
        if (feedbackEl) feedbackEl.classList.add("alert");
      }
      if (elbowAngle < 10) {
        feedback = "⚠️ Over-flexed!";
        if (feedbackEl) feedbackEl.classList.add("alert");
      }

      if (feedbackEl) feedbackEl.innerHTML = feedback;
      return newState;
    } else {
      if (feedbackEl) feedbackEl.innerHTML = "Arm not visible";
      return currentState;
    }
  };

  const checkLegExtensionWithForm = (
    hip: any,
    knee: any,
    ankle: any,
    feedbackEl: HTMLDivElement | null,
    currentState: string,
    side: "left" | "right"
  ) => {
    if (
      hip.visibility > 0.5 &&
      knee.visibility > 0.5 &&
      ankle.visibility > 0.5
    ) {
      const kneeAngle = calculateAngle(hip, knee, ankle);

      if (feedbackEl) {
        feedbackEl.classList.remove("alert");
      }

      const { newState, repCompleted } = updateLegExtensionReps(
        kneeAngle,
        currentState,
        side
      );

      if (repCompleted) {
        if (side === "left") {
          setLeftReps((prev) => prev + 1);
        } else {
          setRightReps((prev) => prev + 1);
        }
      }

      let feedback = "";
      if (newState === "DOWN") {
        feedback = `✓ Ready (${kneeAngle.toFixed(0)}°)`;
      } else if (newState === "EXTENDING") {
        feedback = `↑ Extending (${kneeAngle.toFixed(0)}°)`;
      } else if (newState === "UP") {
        feedback = `💪 Extended! (${kneeAngle.toFixed(0)}°)`;
      } else if (newState === "LOWERING") {
        feedback = `↓ Lowering (${kneeAngle.toFixed(0)}°)`;
      }

      if (kneeAngle > 175) {
        feedback = "⚠️ Hyperextended!";
        if (feedbackEl) feedbackEl.classList.add("alert");
      }

      if (feedbackEl) feedbackEl.innerHTML = feedback;
      return newState;
    } else {
      if (feedbackEl) feedbackEl.innerHTML = "Leg not visible";
      return currentState;
    }
  };

  const checkShoulderPressWithForm = (
    shoulder: any,
    elbow: any,
    wrist: any,
    feedbackEl: HTMLDivElement | null,
    currentState: string,
    side: "left" | "right"
  ) => {
    if (
      shoulder.visibility > 0.5 &&
      elbow.visibility > 0.5 &&
      wrist.visibility > 0.5
    ) {
      const elbowAngle = calculateAngle(shoulder, elbow, wrist);
      const wristAboveShoulder = wrist.y < shoulder.y;

      if (feedbackEl) {
        feedbackEl.classList.remove("alert");
      }

      const { newState, repCompleted } = updateShoulderPressReps(
        elbowAngle,
        wristAboveShoulder,
        currentState,
        side
      );

      if (repCompleted) {
        if (side === "left") {
          setLeftReps((prev) => prev + 1);
        } else {
          setRightReps((prev) => prev + 1);
        }
      }

      let feedback = "";
      if (newState === "DOWN") {
        feedback = `✓ Ready (${elbowAngle.toFixed(0)}°)`;
      } else if (newState === "PRESSING") {
        feedback = `↑ Pressing (${elbowAngle.toFixed(0)}°)`;
      } else if (newState === "UP") {
        feedback = `💪 Pressed! (${elbowAngle.toFixed(0)}°)`;
      } else if (newState === "LOWERING") {
        feedback = `↓ Lowering (${elbowAngle.toFixed(0)}°)`;
      }

      if (elbowAngle < 100 && wrist.y > elbow.y) {
        feedback = "⚠️ Keep wrists up!";
        if (feedbackEl) feedbackEl.classList.add("alert");
      }

      if (feedbackEl) feedbackEl.innerHTML = feedback;
      return newState;
    } else {
      if (feedbackEl) feedbackEl.innerHTML = "Arm not visible";
      return currentState;
    }
  };

  // Main Pose Detection Callback
  const onResults = (results: any, canvasCtx: CanvasRenderingContext2D) => {
    canvasCtx.save();
    canvasCtx.clearRect(
      0,
      0,
      canvasRef.current?.width || 0,
      canvasRef.current?.height || 0
    );
    if (results.image) {
      canvasCtx.drawImage(
        results.image,
        0,
        0,
        canvasRef.current?.width || 0,
        canvasRef.current?.height || 0
      );
    }

    if (results.poseLandmarks) {
      // Draw connectors and landmarks
      if (typeof window !== "undefined") {
        window.drawConnectors(
          canvasCtx,
          results.poseLandmarks,
          window.POSE_CONNECTIONS,
          { color: "#00FF00", lineWidth: 4 }
        );
        window.drawLandmarks(canvasCtx, results.poseLandmarks, {
          color: "#FF0000",
          lineWidth: 2,
        });
      }

      const landmarks = results.poseLandmarks;

      // Fall Detection
      const fallDetected = checkFallDetection(landmarks);
      if (fallDetected) {
        showFallAlert();
      } else {
        hideFallAlert();
      }

      // Exercise Routing
      let newLeftState = leftState;
      let newRightState = rightState;

      try {
        if (currentExercise === "bicepCurls") {
          newLeftState = checkBicepCurlWithForm(
            landmarks[11],
            landmarks[13],
            landmarks[15],
            landmarks[23],
            messageLeftRef.current,
            leftState,
            "left"
          );
          newRightState = checkBicepCurlWithForm(
            landmarks[12],
            landmarks[14],
            landmarks[16],
            landmarks[24],
            messageRightRef.current,
            rightState,
            "right"
          );
        } else if (currentExercise === "legExtensions") {
          newLeftState = checkLegExtensionWithForm(
            landmarks[23],
            landmarks[25],
            landmarks[27],
            messageLeftRef.current,
            leftState,
            "left"
          );
          newRightState = checkLegExtensionWithForm(
            landmarks[24],
            landmarks[26],
            landmarks[28],
            messageRightRef.current,
            rightState,
            "right"
          );
        } else if (currentExercise === "shoulderPresses") {
          newLeftState = checkShoulderPressWithForm(
            landmarks[11],
            landmarks[13],
            landmarks[15],
            messageLeftRef.current,
            leftState,
            "left"
          );
          newRightState = checkShoulderPressWithForm(
            landmarks[12],
            landmarks[14],
            landmarks[16],
            messageRightRef.current,
            rightState,
            "right"
          );
        } else if (currentExercise === "none") {
          if (messageLeftRef.current) {
            messageLeftRef.current.innerHTML = "Select an exercise";
            messageLeftRef.current.classList.remove("alert");
          }
          if (messageRightRef.current) {
            messageRightRef.current.innerHTML = "Select an exercise";
            messageRightRef.current.classList.remove("alert");
          }
        }
      } catch (error) {
        console.error(error);
        if (messageLeftRef.current) messageLeftRef.current.innerHTML = "Error";
        if (messageRightRef.current)
          messageRightRef.current.innerHTML = "Error";
      }

      setLeftState(newLeftState || leftState);
      setRightState(newRightState || rightState);
    } else {
      if (currentExercise !== "none") {
        if (messageLeftRef.current)
          messageLeftRef.current.innerHTML = "No pose detected";
        if (messageRightRef.current)
          messageRightRef.current.innerHTML = "No pose detected";
      }
    }

    canvasCtx.restore();
  };

  // Event handler for exercise select
  const handleExerciseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setCurrentExercise(value);
    setLeftReps(0);
    setRightReps(0);
    setLeftState("NONE");
    setRightState("NONE");
    if (leftRepCountRef.current) leftRepCountRef.current.textContent = "0";
    if (rightRepCountRef.current) rightRepCountRef.current.textContent = "0";

    if (value === "none") {
      if (messageLeftRef.current) {
        messageLeftRef.current.innerHTML = "Select an exercise";
        messageLeftRef.current.classList.remove("alert");
      }
      if (messageRightRef.current) {
        messageRightRef.current.innerHTML = "Select an exercise";
        messageRightRef.current.classList.remove("alert");
      }
    }
  };

  // Update rep counts in refs
  useEffect(() => {
    if (leftRepCountRef.current)
      leftRepCountRef.current.textContent = leftReps.toString();
  }, [leftReps]);

  useEffect(() => {
    if (rightRepCountRef.current)
      rightRepCountRef.current.textContent = rightReps.toString();
  }, [rightReps]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
      if (poseRef.current) {
        poseRef.current.close();
      }
    };
  }, []);

  return (
    <>
      <div className="font-sans flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-5 m-0">
        {showFallAlert && (
          <div
            ref={fallAlertRef}
            className="fixed top-5 left-1/2 -translate-x-1/2 bg-red-600 text-white px-10 py-5 rounded-lg text-xl font-bold z-50 animate-shake"
          >
            ⚠️ FALL DETECTED! Need Assistance? ⚠️
          </div>
        )}

        <h1 className="text-4xl font-light mb-5">
          Enhanced Exercise Tracker with Fall Detection
        </h1>

        <div className="relative w-[640px] h-[480px] border-2 border-cyan-400 rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            className="absolute top-0 left-0 w-full h-full -scale-x object-cover"
          />
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            className="absolute top-0 left-0 w-full h-full -scale-x bg-transparent"
          />
        </div>
        <button
          onClick={() => router.push("/finish")}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg hover:shadow-xl hover:brightness-110 transition-all"
        >
          Finish
        </button>
        <div className="mt-2 text-xl">
          <label htmlFor="exerciseSelect" className="mr-2">
            Choose exercise:{" "}
          </label>
          <select
            id="exerciseSelect"
            ref={exerciseSelectRef}
            value={currentExercise}
            onChange={handleExerciseChange}
            className="text-lg p-2 rounded-md bg-gray-700 text-white border border-cyan-400"
          >
            <option value="none">-- Select --</option>
            <option value="bicepCurls">Bicep Curls</option>
            <option value="legExtensions">Leg Extensions</option>
            <option value="shoulderPresses">Shoulder Presses</option>
          </select>
        </div>
        {/* <button onClick={()=>{router.push(`/finish`)}}>finish</button> */}

        <div className="mt-5 flex gap-8 items-center">
          <div className="bg-gray-700 p-5 rounded-lg border-2 border-cyan-400">
            <h3 className="m-0 mb-2 text-cyan-400 text-sm">LEFT SIDE REPS</h3>
            <p
              ref={leftRepCountRef}
              className="text-6xl font-bold text-green-400 m-0"
            >
              0
            </p>
          </div>
          <div className="bg-gray-700 p-5 rounded-lg border-2 border-cyan-400">
            <h3 className="m-0 mb-2 text-cyan-400 text-sm">RIGHT SIDE REPS</h3>
            <p
              ref={rightRepCountRef}
              className="text-6xl font-bold text-green-400 m-0"
            >
              0
            </p>
          </div>
        </div>

        <div className="mt-5 flex w-4/5 max-w-7xl justify-around">
          <button className="w-2/5 bg-gray-700 p-4 rounded-lg border-2 border-gray-600 box-border">
            <h3 className="mt-0 text-center text-cyan-400">
              LEFT SIDE FEEDBACK
            </h3>
            <div
              ref={messageLeftRef}
              className="text-2xl font-bold text-center min-h-[50px] leading-relaxed text-white"
            >
              Select an exercise
            </div>
          </button>
          <div className="w-2/5 bg-gray-700 p-4 rounded-lg border-2 border-gray-600 box-border">
            <h3 className="mt-0 text-center text-cyan-400">
              RIGHT SIDE FEEDBACK
            </h3>
            <div
              ref={messageRightRef}
              className="text-2xl font-bold text-center min-h-[50px] leading-relaxed text-white"
            >
              Select an exercise
            </div>
          </div>
        </div>

        
      </div>
    </>
  );
}
