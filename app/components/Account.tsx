"use client";
import { useAuth } from "@/app/context/AuthContext";
import { useState } from "react";

export default function Account() {
  const { isLoggedIn, isAdmin, toggleLogin, toggleAdmin } = useAuth();
  const [showControls, setShowControls] = useState(false);

  return (
    <>
    <button
      className="fixed top-10 left-1/2 transform -translate-x-1/2 z-50 px-3 py-1 bg-white/3 backdrop-filter backdrop-blur-xs text-black shadow-md border border-red-600 rounded"
      onClick={() => setShowControls((prev) => !prev)}
    >
      {showControls ? "Hide Auth Panel" : "Show Auth Panel"}
    </button>

      {/* //! ************************************/}

      {showControls && (
        <div className="p-4 border-b border-x border-red-600 flex items-center justify-between bg-white shadow-md z-50 w-1/5 fixed left-1/2 -translate-x-1/2 text-black rounded-b">
          <div>
            {isLoggedIn ? (
              <span>Logged in as {isAdmin ? "Admin" : "User"}</span>
            ) : (
              <span>Not logged in</span>
            )}
          </div>
          <div className="space-x-2">
            <button
              className="px-3 py-1 bg-blue-600 text-white rounded"
              onClick={toggleLogin}
            >
              {isLoggedIn ? "Log Out" : "Log In"}
            </button>
            {isLoggedIn && (
              <button
                className="px-3 py-1 bg-gray-700 text-white rounded"
                onClick={toggleAdmin}
              >
                Toggle Admin
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
