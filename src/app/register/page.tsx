"use client";
import { useState } from "react";

export default function RegisterPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setMessage(data.message || data.error);

    if (res.ok) {
      localStorage.setItem("auth_token", data.token);
      window.location.href = "/";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f5f0e6]">
      {/* Logo */}
      <p className="text-4xl font-bold mb-16 text-black">SwapIt</p>

      {/* Registration Buttons */}
      <div className="flex flex-col gap-6 w-64">
        {/* Create Account */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 bg-[#f5f0e6] p-6 rounded-3xl shadow-md">
          <input
            type="email"
            placeholder="Email"
            className="border border-gray-400 p-2 rounded w-full bg-white text-black"
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            type="password"
            placeholder="Password"
            className="border border-gray-400 p-2 rounded w-full bg-white text-black"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <button
            type="submit"
            className="bg-black text-[#f5f0e6] py-3 rounded-3xl text-lg font-semibold hover:bg-gray-900 transition"
          >
            Create Account
          </button>
          {message && <p className="text-center text-sm text-gray-700 mt-2">{message}</p>}
        </form>

        {/* Sign In Button */}
        <button
          onClick={() => (window.location.href = "/login")}
          className="bg-gray-800 text-[#f5f0e6] py-3 rounded-3xl text-lg font-semibold hover:bg-gray-900 transition"
        >
          Sign In
        </button>
      </div>
    </div>
  );
}
