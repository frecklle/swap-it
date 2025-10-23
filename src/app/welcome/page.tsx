"use client";
import React from "react";

export default function WelcomePage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      {/* App container */}
      <div className="relative flex flex-col items-center gap-20 w-[380px] max-w-[80%] p-12 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Subtle background elements */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-gray-100 rounded-full opacity-60 -z-10"></div>
        <div className="absolute bottom-8 right-8 w-40 h-40 bg-gray-50 rounded-full opacity-80 -z-10"></div>
        
        {/* Minimal accent line */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-0.5 bg-gray-300"></div>

        {/* Logo */}
        <p className="text-4xl font-light text-gray-900 tracking-tight">SwapIt</p>

        {/* Buttons */}
        <div className="flex flex-col gap-4 w-full">
          {/* Create Account */}
          <button
            onClick={() => (window.location.href = "/register")}
            className="bg-gray-900 text-white py-3.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-all duration-200 w-full border border-gray-900"
          >
            Create Account
          </button>

          {/* Sign In */}
          <button
            onClick={() => (window.location.href = "/login")}
            className="bg-white text-gray-900 py-3.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all duration-200 w-full border border-gray-300"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}