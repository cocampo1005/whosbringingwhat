import React, { useState } from "react";
import { MdImage } from "react-icons/md";
import { LuTrash2 } from "react-icons/lu";
import IconButton from "./ui/IconButton";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import imageCompression from "browser-image-compression";

function ImageUpload({
  label,
  imageUrl,
  onImageChange,
  storageFolder,
  objectId,
  imageAlt = "Image preview",
  disabled = false,
  onUploadingChange,
  inputId,
}) {
  const [uploading, setUploading] = useState(false);

  const setUploadingState = (value) => {
    setUploading(value);
    if (typeof onUploadingChange === "function") {
      onUploadingChange(value);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || disabled) return;

    const storage = getStorage();
    setUploadingState(true);

    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);

      const path = `${storageFolder}/${objectId || "unknown"}/${compressedFile.name}`;
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, compressedFile);

      uploadTask.on(
        "state_changed",
        () => {},
        (error) => {
          console.error("Error uploading file: ", error);
          setUploadingState(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          onImageChange(downloadURL);
          setUploadingState(false);
        },
      );
    } catch (error) {
      console.error("Error compressing file: ", error);
      setUploadingState(false);
    }
  };

  const handleRemoveImage = async () => {
    if (disabled) return;

    if (imageUrl) {
      try {
        if (imageUrl.includes("firebase")) {
          const storage = getStorage();
          const imageRef = ref(storage, imageUrl);
          await deleteObject(imageRef);
          console.log("Image deleted from storage");
        }
      } catch (error) {
        console.error("Error deleting image from storage:", error);
      }
    }

    onImageChange("");
  };

  const resolvedInputId =
    inputId || `image-upload-${storageFolder}-${objectId || "default"}`;
  const isDisabled = disabled || uploading;

  return (
    <div>
      {label && (
        <label htmlFor={resolvedInputId} className="mb-2 block font-semibold">
          {label}
        </label>
      )}

      {imageUrl ? (
        <div className="relative">
          <img
            src={imageUrl}
            alt={imageAlt}
            className="h-32 w-full rounded-[18px] object-cover"
          />
          <IconButton
            variant="danger"
            onClick={handleRemoveImage}
            disabled={isDisabled}
            aria-label="Remove photo"
            className="absolute right-2 top-2"
          >
            <LuTrash2 size={16} />
          </IconButton>
        </div>
      ) : (
        <div className="relative">
          <input
            type="file"
            id={resolvedInputId}
            accept="image/*"
            onChange={handleImageUpload}
            disabled={isDisabled}
            className="hidden"
            aria-label="Click to upload photo"
          />
          <label
            htmlFor={resolvedInputId}
            className={`flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-[18px] border-2 border-dashed border-lineStrong bg-surface2 hover:bg-surface3 ${
              isDisabled ? "cursor-not-allowed opacity-50" : ""
            }`}
          >
            {uploading ? (
              <div className="flex flex-col items-center">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-selected"></div>
                <p className="mt-2 text-sm text-muted">Uploading...</p>
              </div>
            ) : (
              <>
                <MdImage className="mb-2 text-4xl text-control" />
                <p className="text-sm text-muted">Click to upload photo</p>
              </>
            )}
          </label>
        </div>
      )}
    </div>
  );
}

export default ImageUpload;
