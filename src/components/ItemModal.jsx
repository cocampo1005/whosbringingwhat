import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "../contexts/AuthContext";

function ItemModal({
  closeModal,
  onSubmit,
  initialData = {},
  mode = "add", // "add" or "edit"
}) {
  const { currentUser } = useAuth();

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
    console.log(itemData);

    e.preventDefault();
    onSubmit(itemData);
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-96 rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-bold">
          {mode === "add" ? "Add Item" : "Edit Item"}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="mb-1 block font-bold">Title</label>
            <input
              type="text"
              name="title"
              value={itemData.title}
              onChange={handleChange}
              className="w-full rounded border p-2"
              required
            />
          </div>
          <div className="mb-4">
            <label className="mb-1 block font-bold">Who's Bringing It?</label>
            <input
              type="text"
              name="assignee"
              value={itemData.assignee}
              onChange={handleChange}
              className="w-full rounded border p-2"
              required
            />
          </div>
          <div className="mb-4">
            <label className="mb-1 block font-bold">Category</label>
            <select
              name="category"
              value={itemData.category}
              onChange={handleChange}
              className="w-full rounded border p-2"
              required
            >
              <option value="Main">Main</option>
              <option value="Side">Side</option>
              <option value="Dessert">Dessert</option>
              <option value="Beverage">Beverage</option>
            </select>
          </div>
          <div className="mb-8">
            <label className="mb-1 block font-bold">Dietary Tags</label>
            <div className="grid grid-cols-2 gap-2">
              {dietaryOptions.map((option) => (
                <label key={option.value} className="flex items-center">
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
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeModal}
              className="rounded bg-gray-300 px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded bg-primaryRed px-4 py-2 text-white"
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
