"use client";
import { useState } from "react";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setMessage(data.message || data.error);

    if (res.ok) {
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("user_id", data.user.id);
      window.location.href = "/";
    } 
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      {/* App container */}
      <div className="relative flex flex-col items-center gap-8 w-[380px] max-w-[80%] p-12 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Subtle background elements */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-gray-100 rounded-full opacity-60 -z-10"></div>
        <div className="absolute bottom-8 right-8 w-40 h-40 bg-gray-50 rounded-full opacity-80 -z-10"></div>
        
        {/* Minimal accent line */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-0.5 bg-gray-300"></div>

        {/* Logo */}
        <p className="text-4xl font-light text-gray-900 tracking-tight">SwapIt</p>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
          <input
            type="email"
            placeholder="Email"
            className="border border-gray-300 p-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-200 text-black"
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="border border-gray-300 p-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-200 text-black"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          
          <button
            type="submit"
            className="bg-gray-900 text-white py-3.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-all duration-200 w-full border border-gray-900 mt-2"
          >
            Sign In
          </button>
          
          {message && (
            <p className={`text-center text-sm mt-2 ${
              message.includes("error") || message.includes("Error") 
                ? "text-red-500" 
                : "text-green-500"
            }`}>
              {message}
            </p>
          )}
        </form>

        {/* Divider */}
        <div className="relative w-full flex items-center justify-center my-2">
          <div className="border-t border-gray-200 w-full"></div>
          <span className="absolute bg-white px-3 text-sm text-gray-500">or</span>
        </div>

        {/* Create Account Button */}
        <button
          onClick={() => (window.location.href = "/register")}
          className="bg-white text-gray-900 py-3.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all duration-200 w-full border border-gray-300"
        >
          Create Account
        </button>
      </div>
    </div>
  );
}