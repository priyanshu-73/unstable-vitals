"use client";

import React, { useState } from "react";
import { Dumbbell } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");

  // Form values
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [guardianEmail, setGuardianEmail] = useState("");

  const handleSubmit = async () => {
    const payload =
      mode === "login"
        ? { email, password }
        : { fullName, email, password, guardianEmail };

    const apiUrl = mode === "login" ? "/api/login" : "/api/signup";

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Something went wrong!");
        return;
      }

      // SUCCESS
      toast.success(
        mode === "login"
          ? "Login successful! 🎉"
          : "Account created successfully! 🚀"
      );

      // Redirect after a short toast delay
      setTimeout(() => {
        router.push("/");
      }, 900);
    } catch (err) {
      toast.error("Network error! Try again.");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center  bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `
    linear-gradient(to bottom right, #241c41, rgba(244,246,255,0.85), #241c41),


            url('/ac.jpg')

    `,
        backgroundAttachment: "fixed",
      }}
    >
      <div className="w-full min-h-screen flex items-center justify-center   p-6">
        <div className="w-full max-w-[30rem]   backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl p-10 relative overflow-hidden">
          {/* LOGO */}
          <div className="flex flex-col items-center mb-8">
            <div className="bg-blue-600/10 p-4 rounded-full">
              <Dumbbell className="h-10 w-10 text-[#26143e]" />
            </div>

            <h1 className="mt-4 text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-[#26143e]">
              Unstable Vitals
            </h1>

            <p className="text-gray-600 mt-2">
              {mode === "login"
                ? "Welcome back! Let's continue training."
                : "Create an account and begin your journey."}
            </p>
          </div>

          {/* TOGGLE */}
          <div className="flex mb-8 bg-white/60 p-1 rounded-xl shadow-inner">
            <button
              className={`flex-1 py-2 rounded-xl font-semibold transition ${
                mode === "login"
                  ? "bg-[#26143e] text-white shadow"
                  : "text-gray-700"
              }`}
              onClick={() => setMode("login")}
            >
              Login
            </button>

            <button
              className={`flex-1 py-2 rounded-xl font-semibold transition ${
                mode === "signup"
                  ? "bg-[#26143e] text-white shadow"
                  : "text-gray-700"
              }`}
              onClick={() => setMode("signup")}
            >
              Sign Up
            </button>
          </div>

          {/* FULL NAME */}
          {mode === "signup" && (
            <div className="mb-4">
              <label className="text-gray-700 font-medium">Full Name</label>
              <input
                type="text"
                placeholder="Your name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full mt-1 p-3 rounded-xl bg-white/80 border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          )}

          {/* EMAIL */}
          <div className="mb-4">
            <label className="text-gray-700 font-medium">Email</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 p-3 rounded-xl bg-white/80 border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* PASSWORD */}
          <div className="mb-6">
            <label className="text-gray-700 font-medium">Password</label>
            <input
              type="password"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 p-3 rounded-xl bg-white/80 border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* GUARDIAN EMAIL (only for signup) */}
          {mode === "signup" && (
            <div className="mb-4">
              <label className="text-gray-700 font-medium">
                Guardian Email
              </label>
              <input
                type="email"
                placeholder="guardian@email.com"
                value={guardianEmail}
                onChange={(e) => setGuardianEmail(e.target.value)}
                className="w-full mt-1 p-3 rounded-xl bg-white/80 border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          )}

          {/* BUTTON */}
          <button
            onClick={handleSubmit}
            className="w-full bg-[#26143e] text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition"
          >
            {mode === "login" ? "Login" : "Create Account"}
          </button>
        </div>
      </div>
    </div>
  );
}
