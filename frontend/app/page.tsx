"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Dumbbell, Activity, ArrowRight } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();

  return (
    // <div className="min-h-screen bg-gradient-to-br from-[#EEF3FF] via-[#F4F6FF] to-[#EAF0FF] flex flex-col">
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat p-8 flex flex-col"
      style={{
        backgroundImage: `
    linear-gradient(to bottom right, #241c41, rgba(244,246,255,0.85), #241c41),

            url('/ac.jpg')

    `,
        backgroundAttachment: "fixed",
      }}
    >
      {/* NAVBAR */}
      <div className="w-full py-6 px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600/10 p-3 rounded-xl">
            <Dumbbell className="h-8 w-8 text-[#26143e]" />
          </div>
          <h1
            className="text-2xl font-bold  text-[#26143e]-500 bg-clip-text "
            style={{ textShadow: "0 0px 3px rgba(197, 196, 196, 0.53)" }}
          >
            Unstable Vitals
          </h1>
        </div>

        <button
          onClick={() => router.push("/auth")}
          className="bg-[#26143e] text-white px-6 py-2.5 rounded-xl font-semibold shadow hover:shadow-lg transition"
        >
          Login
        </button>
      </div>

      {/* HERO SECTION */}
      <div className="flex-1 flex flex-col-reverse lg:flex-row items-center justify-center px-8 lg:px-24 py-10 gap-16">
        {/* LEFT SECTION */}
        <div className="text-center lg:text-left max-w-xl">
          <h2 className="text-5xl text-[#26143e] font-extrabold   bg-clip-text   leading-tight">
            Real-Time Exercise Tracking.
          </h2>

          <h3 className="text-3xl font-semibold text-gray-800 mt-4">
            Improve your form. Prevent injuries.
          </h3>

          <p className="text-gray-600 mt-4 text-lg">
            Train smarter with posture detection, form correction, and live
            tracking powered by your webcam — no equipment required.
          </p>

          <button
            onClick={() => router.push("/auth")}
            className="mt-8 bg-[#26143e] text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition flex items-center gap-2 mx-auto lg:mx-0"
          >
            Start Training
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>

        {/* RIGHT ILLUSTRATION */}
        <div className="w-full max-w-lg flex justify-center">
          <div className="bg-white/60 backdrop-blur-xl border border-white/40 p-8 rounded-3xl shadow-2xl">
            <Activity className="w-40 h-40 text-[#26143e] mx-auto" />
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="text-center text-gray-500 py-6">
        © {new Date().getFullYear()} Unstable Vitals. All rights reserved.
      </footer>
    </div>
  );
}
