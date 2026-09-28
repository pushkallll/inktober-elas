"use client";

import React, { useState } from "react";
import imageCompression from "browser-image-compression";

interface CloudinaryUploadProps {
  onUploadSuccess: (info: { public_id: string; secure_url: string; bytes: number; width: number; height: number; format: string }) => void;
  onUploadError: (error: string) => void;
  disabled?: boolean;
}

const MAX_UPLOAD_SIZE_MB = 15;
const TARGET_MAX_BYTES = 300 * 1024;

export function CloudinaryUpload({ onUploadSuccess, onUploadError, disabled }: CloudinaryUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [statusText, setStatusText] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      onUploadError("Only images are allowed.");
      return;
    }

    if (file.size / 1024 / 1024 > MAX_UPLOAD_SIZE_MB) {
      onUploadError(`This image is too large. Please choose an image under ${MAX_UPLOAD_SIZE_MB} MB.`);
      return;
    }

    setIsUploading(true);
    try {
      setStatusText("Compressing artwork...");

      let compressedFile = file;

      if (compressedFile.size > TARGET_MAX_BYTES) {
        // Strategy: First reduce quality gradually, then if needed, reduce dimensions
        const compressionSteps = [
          { quality: 0.85, maxDim: 3000 },
          { quality: 0.75, maxDim: 2400 },
          { quality: 0.70, maxDim: 1600 },
          { quality: 0.65, maxDim: 1000 }
        ];

        for (const step of compressionSteps) {
          try {
            compressedFile = await imageCompression(file, {
              maxSizeMB: 295 / 1024, // Target slightly below 300KB to account for byte thresholds
              maxWidthOrHeight: step.maxDim,
              useWebWorker: true,
              initialQuality: step.quality,
              fileType: file.type === "image/png" ? "image/png" : "image/webp"
            });
          } catch (err) {
            console.error("Compression step failed:", err);
          }

          if (compressedFile.size <= TARGET_MAX_BYTES) {
            break;
          }
        }
      }

      if (compressedFile.size > TARGET_MAX_BYTES) {
        throw new Error("Your artwork is too complex to compress below 300 KB without significant quality loss. Please choose a smaller or simpler image.");
      }

      setStatusText("Preparing upload...");

      // Calculate timestamp exactly once
      const timestamp = Math.round(new Date().getTime() / 1000);

      // Get signature from our secure backend
      const res = await fetch("/api/cloudinary/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paramsToSign: {
            timestamp,
            folder: "inktober_submissions"
          }
        })
      });

      if (!res.ok) {
        throw new Error("Failed to authenticate upload. Please try again.");
      }

      const { signature } = await res.json();

      const formData = new FormData();
      formData.append("file", compressedFile);
      formData.append("api_key", process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || "");
      formData.append("timestamp", timestamp.toString());
      formData.append("signature", signature);
      formData.append("folder", "inktober_submissions");

      setStatusText("Uploading artwork...");

      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData
      });

      if (!uploadRes.ok) {
        throw new Error("Upload to Cloudinary failed.");
      }

      const uploadData = await uploadRes.json();

      setStatusText("Image ready");
      onUploadSuccess({
        public_id: uploadData.public_id,
        secure_url: uploadData.secure_url,
        bytes: uploadData.bytes,
        width: uploadData.width,
        height: uploadData.height,
        format: uploadData.format
      });
    } catch (err: any) {
      console.error(err);
      onUploadError(err.message || "Failed to upload image.");
    } finally {
      setIsUploading(false);
      setStatusText("");
      // Reset input
      e.target.value = "";
    }
  };

  return (
    <div className="w-full flex flex-col gap-2">
      <label className={`
        relative flex flex-col items-center justify-center w-full h-32
        border-2 border-dashed border-foreground/20 bg-white/40
        hover:bg-white/60 transition-colors cursor-pointer
        ${(disabled || isUploading) ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}
      `}>
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <p className="mb-2 text-sm text-foreground/70 font-sans tracking-wide">
            {isUploading ? statusText : "Click to upload artwork"}
          </p>
          {!isUploading && (
            <p className="text-xs text-muted/60 uppercase tracking-widest font-sans">
              Max {MAX_UPLOAD_SIZE_MB}MB
            </p>
          )}
        </div>
        <input
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
          disabled={disabled || isUploading}
        />
      </label>
    </div>
  );
}
