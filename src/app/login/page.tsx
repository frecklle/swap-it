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
    }  else {
    alert(data.error);
  }
  };

  return (
    

    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-md w-80">
        <h1 className="text-2xl font-bold mb-4 text-center">Login</h1>
        <input
          type="email"
          placeholder="Email"
          className="border p-2 rounded w-full mb-2"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          type="password"
          placeholder="Password"
          className="border p-2 rounded w-full mb-2"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button type="submit" className="bg-green-500 text-white w-full py-2 rounded hover:bg-green-600">
          Sign In
        </button>
        <p className="text-center text-sm text-gray-600 mt-2">{message}</p>
      </form>
    </div>
  );
}
