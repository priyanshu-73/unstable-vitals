"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Home, RefreshCcw } from "lucide-react";
import confetti from "canvas-confetti";

export default function ExerciseCompleteScreen({ exercise = "Exercise" }) {
  const router = useRouter();

  // Confetti Celebration
  useEffect(() => {
    const duration = 2 * 1000;
    const animationEnd = Date.now() + duration;

    const confettiInterval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(confettiInterval);
      }

      confetti({
        startVelocity: 35,
        spread: 360,
        ticks: 60,
        origin: {
          x: Math.random(),
          y: Math.random() - 0.2,
        },
      });
    }, 200);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 flex items-center justify-center p-6">
      <div className="max-w-xl w-full bg-white/80 backdrop-blur-lg border border-white/40 shadow-2xl rounded-3xl p-10 text-center relative">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 p-6 rounded-full shadow-inner">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-extrabold text-gray-800 mb-3">
          Great Job! 🎉
        </h1>

        <p className="text-lg text-gray-600 mb-8">
          You successfully completed your{" "}
          <span className="font-semibold text-blue-600">{exercise}</span>{" "}
          session.
        </p>

        {/* Stats Section */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="bg-blue-50 rounded-xl p-4 shadow text-center">
            <h2 className="text-xl font-bold text-blue-700">5</h2>
            <p className="text-sm text-gray-700">Sets</p>
          </div>

          <div className="bg-green-50 rounded-xl p-4 shadow text-center">
            <h2 className="text-xl font-bold text-green-700">40</h2>
            <p className="text-sm text-gray-700">Reps</p>
          </div>

          <div className="bg-purple-50 rounded-xl p-4 shadow text-center">
            <h2 className="text-xl font-bold text-purple-700">💪</h2>
            <p className="text-sm text-gray-700">Perfect Form</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => router.push("/select")}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold shadow hover:bg-blue-700 transition"
          >
            <RefreshCcw size={20} />
            Try Another Exercise
          </button>

          <button
            onClick={() => router.push("/")}
            className="flex items-center justify-center gap-2 bg-gray-200 text-gray-900 px-6 py-3 rounded-xl font-semibold shadow hover:bg-gray-300 transition"
          >
            <Home size={20} />
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}
