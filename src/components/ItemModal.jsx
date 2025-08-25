import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "../contexts/AuthContext";
import { IoClose } from "react-icons/io5";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { IoChevronDown } from "react-icons/io5";

function ItemModal({
  closeModal,
  onSubmit,
  initialData = {},
  mode = "add", // "add" or "edit"
}) {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [itemData, setItemData] = useState({
    id: initialData?.id || (mode === "add" && uuidv4()),
    title: initialData?.title || "",
    assignee: initialData?.assignee || currentUser.name,
    category: initialData?.category || "Main",
    dietary: initialData?.dietary || [],
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

      // set createdBy only the first time this item is saved
      createdById: itemData.createdById ?? meUid,
      createdByName: itemData.createdByName ?? (currentUser?.name || ""),

      updatedAt: Date.now(),
    };

    onSubmit(payload);
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative mx-4 w-full rounded-2xl bg-yellow-50 p-6 shadow-lg">
        <h2 className="mb-4 text-center text-xl font-bold">
          {mode === "add" ? "Add Item" : "Edit Item"}
        </h2>
        <IoClose
          className="absolute right-4 top-4 cursor-pointer text-2xl"
          onClick={closeModal}
        />
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="mb-1 block font-bold">Title</label>
            <input
              type="text"
              name="title"
              value={itemData.title}
              onChange={handleChange}
              className="w-full rounded border p-2 focus:border-primaryRed"
              required
            />
          </div>
          <div className="relative mb-4">
            <label className="mb-1 block font-bold">Who's Bringing It?</label>
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

          <div className="mb-4">
            <label className="mb-1 block font-bold">Category</label>
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
            </select>
          </div>
          <div className="mb-8">
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
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-lg border-2 border-primaryRed bg-white px-4 py-2 font-bold text-primaryRed"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-primaryRed px-4 py-2 text-white"
            >
              {mode === "add" ? "Add Item" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ItemModal;
