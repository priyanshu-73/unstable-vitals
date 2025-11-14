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
      id: "Shoulder Press",
      label: "Shoulder Press",
      icon: Dumbbell,
      category: "Shoulders",
      youtubeId: "hOTABpGvhBc",
    },
    {
      id: "Squats",
      label: "Squats",
      icon: Users,
      category: "Legs",
      youtubeId: "aclHkVaku9U",
    },
    {
      id: "Bicep Curls",
      label: "Bicep Curls",
      icon: ArrowLeftRight,
      category: "Bicep Curls",
      youtubeId: "6DeLZ6cbgWQ",
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
    // <div className="min-h-screen bg-gradient-to-br from-[#EEF3FF] via-[#F4F6FF] to-[#EAF0FF] p-4">

    <div
      className="min-h-screen flex items-center justify-center  bg-cover bg-center bg-no-repeat p-4"
      style={{
        backgroundImage: `
    linear-gradient(to bottom right, #241c41, rgba(244,246,255,0.85), #241c41),


            url('/ac.jpg')

    `,
        backgroundAttachment: "fixed",
      }}
    >
      {/* MAIN CONTAINER */}
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        {/* RIGHT SECTION */}
        <div className="flex-1">
          {/* HEADER CONTROLS */}
          <div className="flex items-center justify-between mb-8">
            <h2
              className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-#241c41 tracking-tight"
            >
              UNstable Vitals - Exercises Real-Time tracking
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7  ">
            {exerciseOptions
              .filter((e) =>
                e.label.toLowerCase().includes(search.toLowerCase())
              )
              .map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => handleSelect(opt.id)}
                  className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 p-6 rounded-2xl p-5 shadow hover:shadow-xl transition cursor-pointer"
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
          <h3 className="text-2xl font-semibold text-#241c41 mb-4 ">
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
                      ? "bg-[#241c41] text-white"
                      : "bg-white/70 backdrop-blur-sm border-white/50"
                  }`}
              >
                <item.icon className="h-8 w-8 mb-2" />
                <p className="font-medium">{item.name}</p>
              </div>
            ))}
          </div>

          {/* DYNAMIC RECOMMENDED */}
          <h3 className="text-2xl font-semibold text-#241c41 mt-14 mb-4">
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
        </div>
      </div>
    </div>
  );
}
