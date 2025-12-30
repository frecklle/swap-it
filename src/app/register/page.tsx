"use client";
import { useState } from "react";

export default function RegisterPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);

    // Clean and validate before sending
    const cleanedEmail = form.email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanedEmail)) {
      setMessage("Invalid email format.");
      return;
    }

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: cleanedEmail, password: form.password }),
    });

    const data = await res.json();
    setMessage(data.message || data.error);
    if (data.error) {
      setError(true);
    }

    if (res.ok) {
      window.location.href = "/login";
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="relative flex flex-col items-center gap-8 w-[380px] max-w-[80%] p-12 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        <p className="text-4xl font-light text-gray-900 tracking-tight">SwapIt</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
          <input
            type="email"
            placeholder="Email"
            className="border border-gray-300 p-3 rounded-xl text-sm focus:ring-2 focus:ring-gray-400 transition-all text-black"
            onChange={(e) =>
              setForm({ ...form, email: e.target.value.toLowerCase() })
            }
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="border border-gray-300 p-3 rounded-xl text-sm focus:ring-2 focus:ring-gray-400 transition-all text-black"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />

          <button
            type="submit"
            className="bg-gray-900 text-white py-3.5 rounded-xl font-medium hover:bg-gray-800 transition-all w-full mt-2"
          >
            Create Account
          </button>


          {message && (
            <p
              className={`text-center text-sm mt-2 ${
                error
                  ? "text-red-500"
                  : "text-green-500"
              }`}
            >
              {message}
            </p>
          )}
        </form>

        <button
          onClick={() => (window.location.href = "/login")}
          className="bg-white text-gray-900 py-3.5 rounded-xl font-medium hover:bg-gray-50 transition-all w-full border border-gray-300"
        >
          Sign In
        </button>
      </div>
    </div>
  );
}

export const runtime = "nodejs";