import React from "react";
import { MdEdit } from "react-icons/md";
import { MdDelete } from "react-icons/md";

export default function ItemCard({ items, edit, onDelete, openDeleteModal }) {
  const categoryColors = {
    Main: "text-red-900",
    Side: "text-yellow-600",
    Dessert: "text-rose-500",
    Beverage: "text-blue-600",
  };
  return (
    <div>
      {items?.map((item) => (
        <div key={item.id} className="flex justify-between border-t py-4">
          <div className="flex flex-col">
            <p
              className={`font-bold ${categoryColors[item.category] || "text-black"}`}
            >
              {item.title}
            </p>
            <p className="text-xs text-gray-400">{item.assignee}</p>
          </div>
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
