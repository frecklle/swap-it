// lib/api.ts
export async function apiFetch(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem("auth_token");

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    // Token invalid or expired → log out
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_id");
    window.location.href = "/login";
    return;
  }

  let data;
  try {
    data = await res.json();
  } catch (err) {
    console.error("Failed to parse JSON from API response:", err);
    return { error: "Invalid API response" };
  }

  return data;
}
