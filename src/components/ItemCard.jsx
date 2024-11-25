import React from "react";
import { MdEdit } from "react-icons/md";
import { MdDelete } from "react-icons/md";

export default function ItemCard({ items, edit, onDelete, openDeleteModal }) {
  const categoryColors = {
    Main: "text-red-900", // Red for Main
    Side: "text-yellow-600", // Yellow for Side
    Dessert: "text-rose-500", // Rose for Dessert
    Beverage: "text-blue-600", // Blue for Drink
  };
  return (
    <div>
      {items?.map((item) => (
        <div key={item.id} className="flex justify-between border-t py-4">
          <p>
            <span
              className={`font-bold ${categoryColors[item.category] || "text-black"}`}
            >
              {item.title}
            </span>{" "}
            - <span className="text-gray-400">{item.assignee}</span>
          </p>
          <div className="flex items-center">
            <MdEdit
              onClick={() => edit(item)}
              className="mr-4 text-2xl text-primaryRed"
            />
            <MdDelete
              onClick={() => openDeleteModal(item)}
              className="text-2xl text-primaryRed"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
