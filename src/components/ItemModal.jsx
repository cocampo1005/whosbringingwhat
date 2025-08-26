import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "../contexts/AuthContext";
import { IoClose } from "react-icons/io5";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { IoChevronDown } from "react-icons/io5";
import { MdDelete, MdImage } from "react-icons/md";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import imageCompression from "browser-image-compression";

function ItemModal({
  closeModal,
  onSubmit,
  initialData = {},
  mode = "add", // "add" or "edit"
}) {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [itemData, setItemData] = useState({
    id: initialData?.id || (mode === "add" && uuidv4()),
    title: initialData?.title || "",
    assignee: initialData?.assignee || currentUser.name,
    category: initialData?.category || "Main",
    dietary: initialData?.dietary || [],
    description: initialData?.description || "",
    imageUrl: initialData?.imageUrl || "",
    servings: initialData?.servings || "",
  });

  const dietaryOptions = [
    { label: "Vegetarian", value: "vegetarian" },
    { label: "Vegan", value: "vegan" },
    { label: "Gluten-Free", value: "gluten" },
    { label: "Has Dairy", value: "dairy" },
    { label: "Has Nuts", value: "nuts" },
    { label: "Has Pork", value: "pork" },
  ];

  const normalize = (s = "") => s.trim().toLowerCase().replace(/\s+/g, " ");

  // Fetch users once
  useEffect(() => {
    const fetchUsers = async () => {
      const snap = await getDocs(collection(db, "users"));
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    };
    fetchUsers();
  }, []);

  // Handler when selecting from dropdown
  const handleSelectUser = (user) => {
    setItemData((prev) => ({
      ...prev,
      assignee: user.name,
      assigneeId: user.id,
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setItemData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDietaryChange = (tag) => {
    setItemData((prev) => {
      if (prev.dietary.includes(tag)) {
        // Remove the tag if already selected
        return { ...prev, dietary: prev.dietary.filter((t) => t !== tag) };
      } else {
        // Add the tag if not already selected
        return { ...prev, dietary: [...prev.dietary, tag] };
      }
    });
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const storage = getStorage();
    setUploading(true);

    try {
      // Compress the image
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);
      console.log("Original file size:", file.size / 1024 / 1024, "MB");
      console.log(
        "Compressed file size:",
        compressedFile.size / 1024 / 1024,
        "MB",
      );

      // Upload the compressed file to Firebase Storage
      const storageRef = ref(
        storage,
        `item-images/${itemData.id}/${compressedFile.name}`,
      );
      const uploadTask = uploadBytesResumable(storageRef, compressedFile);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log("Upload is " + progress + "% done");
        },
        (error) => {
          console.error("Error uploading file: ", error);
          setUploading(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setItemData((prev) => ({ ...prev, imageUrl: downloadURL }));
          setUploading(false);
          console.log("File available at", downloadURL);
        },
      );
    } catch (error) {
      console.error("Error compressing file: ", error);
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (itemData.imageUrl) {
      try {
        // If it's a Firebase Storage URL, try to delete it
        if (itemData.imageUrl.includes("firebase")) {
          const storage = getStorage();
          const imageRef = ref(storage, itemData.imageUrl);
          await deleteObject(imageRef);
          console.log("Image deleted from storage");
        }
      } catch (error) {
        console.error("Error deleting image from storage:", error);
        // Continue anyway to remove from item data
      }
    }
    setItemData((prev) => ({ ...prev, imageUrl: "" }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const meUid = currentUser?.uid || null;
    const meName = normalize(currentUser?.name || "");
    const assigneeIsMe = normalize(itemData.assignee) === meName;

    // If your combo dropdown set a UID, trust it.
    // Otherwise, set UID only when the assignee text equals my display name.
    const resolvedAssigneeId =
      itemData.assigneeId ?? (assigneeIsMe ? meUid : null);

    const payload = {
      ...itemData,
      assignee: itemData.assignee?.trim() || "",
      assigneeId: resolvedAssigneeId,
      description: itemData.description?.trim() || "",
      servings: itemData.servings?.trim() || "",

      // set createdBy only the first time this item is saved
      createdById: itemData.createdById ?? meUid,
      createdByName: itemData.createdByName ?? (currentUser?.name || ""),

      updatedAt: Date.now(),
    };

    onSubmit(payload);
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative mx-4 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-yellow-50 p-6 shadow-lg">
        <h2 className="mb-4 text-center text-xl font-bold">
          {mode === "add" ? "Add Item" : "Edit Item"}
        </h2>
        <IoClose
          className="absolute right-4 top-4 cursor-pointer text-2xl"
          onClick={closeModal}
        />
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block font-bold after:ml-0.5 after:text-primaryRed after:content-['*']">
              Item Name
            </label>
            <input
              type="text"
              name="title"
              value={itemData.title}
              onChange={handleChange}
              className="w-full rounded border p-2 focus:border-primaryRed"
              placeholder="e.g., Caesar Salad"
              required
            />
          </div>

          <div className="relative">
            <label className="mb-1 block font-bold after:ml-0.5 after:text-primaryRed after:content-['*']">
              Who's Bringing It?
            </label>
            <div className="flex">
              <input
                type="text"
                name="assignee"
                value={itemData.assignee}
                onChange={(e) => {
                  handleChange(e);
                  setShowSuggestions(true);
                }}
                className="combo-input w-full rounded-l-lg border border-gray-300 p-2 shadow-none ring-0 focus:border-primaryRed focus:ring-0"
                placeholder="Type a name..."
                required
              />
              {/* Down arrow button */}
              <button
                type="button"
                onClick={() => setShowSuggestions((prev) => !prev)}
                className="flex items-center justify-center rounded-r-lg border border-l-0 border-gray-300 bg-white px-3 text-primaryDark hover:bg-gray-50"
              >
                <IoChevronDown
                  className={`h-4 w-4 transition-transform ${showSuggestions ? "rotate-180" : ""}`}
                />
              </button>
            </div>

            {/* Suggestion dropdown */}
            {showSuggestions && (
              <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-md bg-white shadow">
                {users
                  .filter(
                    (u) =>
                      itemData.assignee
                        ? u.name
                            .toLowerCase()
                            .includes(itemData.assignee.toLowerCase())
                        : true, // if no filter, show all
                  )
                  .map((u) => (
                    <li
                      key={u.id}
                      onClick={() => {
                        setItemData((prev) => ({
                          ...prev,
                          assignee: u.name,
                          assigneeId: u.id,
                        }));
                        setShowSuggestions(false);
                      }}
                      className="cursor-pointer px-3 py-1 hover:bg-gray-100"
                    >
                      {u.name}
                    </li>
                  ))}
              </ul>
            )}
          </div>

          <div>
            <label className="mb-1 block font-bold after:ml-0.5 after:text-primaryRed after:content-['*']">
              Category
            </label>
            <select
              name="category"
              value={itemData.category}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 p-2 focus:border-primaryRed focus:ring-0"
              required
            >
              <option value="Main">Main</option>
              <option value="Side">Side</option>
              <option value="Dessert">Dessert</option>
              <option value="Beverage">Beverage</option>
              <option value="Miscellaneous">Miscellaneous</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block font-bold">Description</label>
            <textarea
              name="description"
              value={itemData.description}
              onChange={handleChange}
              placeholder="Add a description of your dish"
              className="w-full resize-none rounded border p-2 focus:border-primaryRed"
              rows="3"
            />
          </div>

          <div>
            <label className="mb-1 block font-bold">Servings</label>
            <input
              type="text"
              name="servings"
              value={itemData.servings}
              onChange={handleChange}
              placeholder="e.g., 4-6 people"
              className="w-full rounded border p-2 focus:border-primaryRed"
            />
          </div>

          <div>
            <label className="mb-2 block font-bold">Photo</label>
            {itemData.imageUrl ? (
              <div className="relative">
                <img
                  src={itemData.imageUrl}
                  alt="Item preview"
                  className="h-32 w-full rounded-lg border object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                >
                  <MdDelete className="text-sm" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="file"
                  id="image-upload"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="hidden"
                />
                <label
                  htmlFor="image-upload"
                  className={`flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 hover:bg-white ${
                    uploading ? "cursor-not-allowed opacity-50" : ""
                  }`}
                >
                  {uploading ? (
                    <div className="flex flex-col items-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primaryRed"></div>
                      <p className="mt-2 text-sm text-gray-500">Uploading...</p>
                    </div>
                  ) : (
                    <>
                      <MdImage className="mb-2 text-4xl text-gray-400" />
                      <p className="text-sm text-gray-500">
                        Click to upload photo
                      </p>
                    </>
                  )}
                </label>
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block font-bold">Dietary Tags</label>
            <div className="grid grid-cols-2 gap-2">
              {dietaryOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center text-sm font-semibold"
                >
                  <input
                    type="checkbox"
                    checked={itemData.dietary.includes(option.value)}
                    onChange={() => handleDietaryChange(option.value)}
                    className="mr-2 h-4 w-4 rounded border-gray-300 text-primaryRed focus:ring-primaryRed"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-lg border-2 border-primaryRed bg-white px-4 py-2 font-bold text-primaryRed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="rounded-lg bg-primaryRed px-4 py-2 text-white disabled:opacity-50"
            >
              {uploading
                ? "Uploading..."
                : mode === "add"
                  ? "Add Item"
                  : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ItemModal;
