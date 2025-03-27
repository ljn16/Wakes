"use client";
import { useAuth } from "@/app/context/AuthContext"; //! mock
import { useEffect, useState } from "react"; //? Auth
import { supabase } from "@/app/lib/supabaseClient";

export default function Account() {
  const { isLoggedIn, isAdmin, user, logout } = useAuth(); //* Auth

  const [showControls, setShowControls] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError(error.message);
  };

  const handleSignup = async () => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setAuthError(error.message);
  };

  return (
    <>
    <button
      className="fixed top-0 right-0 md:top-10 md:right-auto md:left-1/2 md:transform-translate-x-1/2 z-50 px-3 py-1 bg-white/3 backdrop-filter backdrop-blur-xs text-black shadow-md border border-red-600 rounded"
      onClick={() => setShowControls((prev) => !prev)}
    >
      {showControls ? "Hide Auth Panel" : "Login"}
    </button>

      {/* //! ************************************/}

      {showControls && (
        <div className="p-4 border-b border-x border-red-600 flex items-center justify-between bg-white shadow-md z-50 w-1/5 fixed left-1/2 -translate-x-1/2 text-black rounded">
          <div>
            {isLoggedIn ? (
              <span>Logged in as {isAdmin ? "Admin" : "User"}</span>
            ) : (
              <span>Not logged in</span>
            )}
          </div>
          <div className="space-x-2">
            {isLoggedIn ? (
              <button
                className="px-3 py-1 bg-blue-600 text-white rounded"
                onClick={logout} //* Auth
              >
                Log Out
              </button>
            ) : (
              <>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="p-1 border rounded"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="p-1 border rounded"
                />
                <button onClick={handleLogin} className="px-3 py-1 bg-blue-600 text-white rounded">
                  Log In
                </button>
                <button onClick={handleSignup} className="px-3 py-1 bg-green-600 text-white rounded">
                  Sign Up
                </button>
                {authError && <p className="text-red-600 text-xs">{authError}</p>}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
