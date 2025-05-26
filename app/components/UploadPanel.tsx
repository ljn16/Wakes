"use client";

import { useAuth } from "@/app/context/AuthContext";

interface Props {
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadedUrl: string | null;
  uploadedFileType: string | null;
}

export default function UploadPanel({
  handleFileUpload,
  uploadedUrl,
  uploadedFileType,
}: Props) {
  // const { isLoggedIn, isAdmin } = useAuth();
  // if (!isLoggedIn || !isAdmin) return null;

  return (
    <div className="hidden md:block p-4 bg-white/3 backdrop-filter backdrop-blur-xs text-black shadow-md z-100 fixed text-xs left-14 top-4 rounded">
      <label htmlFor="mediaUpload" className="block mb-2 font-semibold">
        Upload Image, Video, or GPX:
      </label>
      <input
        id="mediaUpload"
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.mp4,.mov,.gpx"
        onChange={handleFileUpload}
        className="border rounded p-2"
      />
      {uploadedUrl && uploadedFileType && (
        <div className="mt-4">
          <p className="text-sm text-gray-600">Uploaded: {uploadedFileType}</p>
          {uploadedFileType.startsWith("image") ? (
            <div className="relative w-full h-60 mt-2 border">
              <img
                src={uploadedUrl}
                alt="Preview"
                style={{ objectFit: "contain" }}
              />
            </div>
          ) : uploadedFileType.startsWith("video") ? (
            <video src={uploadedUrl} controls className="w-full max-h-60 mt-2" />
          ) : (
            <p className="mt-2 text-sm italic text-gray-500">File uploaded.</p>
          )}
        </div>
      )}
    </div>
  );
}