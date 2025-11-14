"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Dumbbell, Users, ArrowLeftRight } from "lucide-react";

export default function ExerciseSelectScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Strength");

  const exerciseOptions = [
    {
      id: "shoulder_press",
      label: "Shoulder Press",
      icon: Dumbbell,
      category: "Shoulders",
      youtubeId: "2yjwXTZQDDI",
    },
    {
      id: "squat",
      label: "Squat",
      icon: Users,
      category: "Legs",
      youtubeId: "aclHkVaku9U",
    },
    {
      id: "lunge",
      label: "Lunge",
      icon: ArrowLeftRight,
      category: "Lunge",
      youtubeId: "wrwwXE_x-pQ",
    },
  ];

  // Bottom recommended exercise database
  const recommendedMap: any = {
    Strength: [
      {
        name: "Deadlift",
        benefits: [
          "Builds full-body strength",
          "Improves posture & stability",
          "Strengthens lower back & core",
        ],
        type: "benefits",
      },
      {
        name: "Bench Press",
        benefits: [
          "Strengthens chest & triceps",
          "Improves upper-body pushing power",
          "Enhances shoulder stability",
        ],
        type: "benefits",
      },
      {
        name: "Shoulder Press",
        benefits: [
          "Increases shoulder strength",
          "Enhances overhead mobility",
          "Improves core stabilization",
        ],
        type: "benefits",
      },
    ],

    Mobility: [
      {
        name: "Hip Opener",
        benefits: [
          "Reduces hip tightness",
          "Improves flexibility",
          "Enhances lower-body mobility",
        ],
        type: "benefits",
      },
      {
        name: "Arm Circles",
        benefits: [
          "Warms up shoulders safely",
          "Improves joint mobility",
          "Prevents shoulder injuries",
        ],
        type: "benefits",
      },
      {
        name: "Calf Stretch",
        benefits: [
          "Improves ankle mobility",
          "Reduces calf tightness",
          "Prevents Achilles strain",
        ],
        type: "benefits",
      },
    ],

    Legs: [
      {
        name: "Lunges",
        benefits: [
          "Strengthens quads & glutes",
          "Improves balance",
          "Enhances hip mobility",
        ],
        type: "benefits",
      },
      {
        name: "Leg Press",
        benefits: [
          "Builds lower-body strength",
          "Targets quads effectively",
          "Low back-friendly movement",
        ],
        type: "benefits",
      },
      {
        name: "Bulgarian Split Squat",
        benefits: [
          "Unilateral leg strength",
          "Strengthens glutes deeply",
          "Improves hip stability",
        ],
        type: "benefits",
      },
    ],

    Arms: [
      {
        name: "Bicep Curl",
        benefits: [
          "Improves arm strength",
          "Enhances grip",
          "Builds upper-arm muscle",
        ],
        type: "benefits",
      },
      {
        name: "Tricep Pushdown",
        benefits: [
          "Isolates triceps safely",
          "Improves pushing power",
          "Enhances arm definition",
        ],
        type: "benefits",
      },
      {
        name: "Hammer Curl",
        benefits: [
          "Strengthens forearms",
          "Targets brachialis muscle",
          "Improves functional grip",
        ],
        type: "benefits",
      },
    ],

    Cardio: [
      {
        name: "Jump Rope",
        benefits: [
          "Boosts heart health",
          "Improves coordination",
          "Burns calories fast",
        ],
        type: "benefits",
      },
      {
        name: "Running",
        benefits: [
          "Improves stamina",
          "Strengthens heart & lungs",
          "Enhances overall fitness",
        ],
        type: "benefits",
      },
      {
        name: "High Knees",
        benefits: [
          "Great warm-up cardio",
          "Strengthens hip flexors",
          "Improves agility",
        ],
        type: "benefits",
      },
    ],
  };

  const popularCategories = [
    { name: "Strength", icon: Dumbbell },
    { name: "Mobility", icon: ArrowLeftRight },
    { name: "Legs", icon: Users },
    { name: "Arms", icon: Dumbbell },
    { name: "Cardio", icon: ArrowLeftRight },
  ];

  const handleSelect = (id: string) => router.push(`/monitor?exercise=${id}`);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EEF3FF] via-[#F4F6FF] to-[#EAF0FF] p-4">
   


      {/* MAIN CONTAINER */}
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        {/* RIGHT SECTION */}
        <div className="flex-1">
          {/* HEADER CONTROLS */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent tracking-tight">
              Unstable Vitals - Exercises Real-Time tracking
            </h2>

            <div className="relative flex items-center justify-center">
              <input
                type="text"
                placeholder="Search exercises..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-11 pr-4 py-2.5 rounded-xl border bg-white/70 shadow-sm border-gray-200 focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
            </div>
          </div>
          {/* CTA */}
           
          {/* GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7 shadow-lg">
            {exerciseOptions
              .filter((e) =>
                e.label.toLowerCase().includes(search.toLowerCase())
              )
              .map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => handleSelect(opt.id)}
                  className="bg-white/80 border border-white/40 backdrop-blur-sm rounded-2xl p-5 shadow hover:shadow-xl transition cursor-pointer"
                >
                  {/* TAG */}
                  <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-md font-medium">
                    {opt.category}
                  </span>

                  {/* VIDEO */}
                  <div className="h-48 mt-4 overflow-hidden rounded-xl border relative group">
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${opt.youtubeId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${opt.youtubeId}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                    />
                  </div>

                  <h3 className="mt-4 text-lg font-semibold text-gray-800">
                    {opt.label}
                  </h3>
                  <p className="text-sm text-gray-500">Bodyweight / Standard</p>
                </div>
              ))}
          </div>
        </div>

        {/* POPULAR CATEGORIES */}
        <div className="mt-16">
          <h3 className="text-2xl font-semibold text-gray-800 mb-4 ">
            Popular Categories
          </h3>

          <div className="flex gap-5 overflow-x-auto pb-4 custom-scroll">
            {popularCategories.map((item) => (
              <div
                key={item.name}
                onClick={() => setSelectedCategory(item.name)}
                className={`flex-shrink-0 w-40 h-32 rounded-2xl shadow-md flex flex-col items-center justify-center transition cursor-pointer border
                  ${
                    selectedCategory === item.name
                      ? "bg-blue-600 text-white"
                      : "bg-white/70 backdrop-blur-sm border-white/50"
                  }`}
              >
                <item.icon className="h-8 w-8 mb-2" />
                <p className="font-medium">{item.name}</p>
              </div>
            ))}
          </div>

          {/* DYNAMIC RECOMMENDED */}
          <h3 className="text-2xl font-semibold text-gray-800 mt-14 mb-4">
            Recommended For {selectedCategory}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
            {recommendedMap[selectedCategory].map((ex: any, i: number) => (
              <div
                key={i}
                className="bg-white/90 border border-gray-200 rounded-2xl p-5 shadow hover:shadow-md transition"
              >
                <h4 className="text-lg font-semibold text-gray-800">
                  {ex.name}
                </h4>

                <ul className="mt-3 space-y-1 text-sm text-gray-600">
                  {ex.benefits.map((b: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* CTA */}
          {/* <div className="mt-16 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-10 text-center shadow-lg">
            <h3 className="text-3xl font-bold mb-3">Ready to Start Training?</h3>
            <p className="text-lg opacity-90 mb-6">Select any exercise and begin real-time tracking.</p>
            <button
              onClick={() => router.push("/")}
              className="bg-white text-blue-700 px-7 py-3 rounded-xl font-semibold shadow hover:shadow-lg transition"
            >
              Start Now
            </button>
          </div> */}
          {/* FULL FOOTER */}
          {/* <footer className="mt-20 bg-gray-900 text-gray-200 rounded-t-3xl pt-16 pb-10 px-6">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
              <div>
                <h3 className="text-xl font-bold mb-4 text-white">
                  Unstable Vitals FitTrack
                </h3>
                <p className="opacity-70">
                  Real-time exercise monitoring using motion tracking. Improve
                  your form, avoid injuries.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 text-white">
                  Quick Links
                </h3>
                <ul className="space-y-2 opacity-80">
                  <li>Exercises</li>
                  <li>Categories</li>
                  <li>About</li>
                  <li>Support</li>
                </ul>
              </div>

              <div className="text-center md:text-left">
                <h3 className="text-lg font-semibold mb-3 text-white">
                  Start Training
                </h3>
                <button
                  onClick={() => router.push("/")}
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold shadow hover:bg-blue-700 transition"
                >
                  Begin Workout
                </button>
              </div>
            </div>

            <p className="text-center text-sm mt-14 opacity-50">
              © {new Date().getFullYear()} Unstable Vitals FitTrack. All rights
              reserved.
            </p>
          </footer> */}
        </div>
      </div>
    </div>
  );
}
