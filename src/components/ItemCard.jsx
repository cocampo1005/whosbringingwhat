import React from "react";
import { MdEdit } from "react-icons/md";
import { MdDelete } from "react-icons/md";
import { LuVegan } from "react-icons/lu";
import { FaLeaf } from "react-icons/fa6";
import { GiPig } from "react-icons/gi";
import { GiPeanut } from "react-icons/gi";
import { GiMilkCarton } from "react-icons/gi";
import { FaGlideG } from "react-icons/fa";

export default function ItemCard({ items, edit, onDelete, openDeleteModal }) {
  const categoryColors = {
    Main: "text-red-900",
    Side: "text-yellow-600",
    Dessert: "text-rose-500",
    Beverage: "text-blue-600",
  };

  const dietaryIcons = {
    vegan: { icon: <LuVegan />, color: "text-green-600" },
    vegetarian: { icon: <FaLeaf />, color: "text-emerald-500" },
    pork: { icon: <GiPig />, color: "text-pink-400" },
    nuts: { icon: <GiPeanut />, color: "text-yellow-600" },
    dairy: { icon: <GiMilkCarton />, color: "text-blue-500" },
    gluten: { icon: <FaGlideG />, color: "text-purple-600" },
  };

  return (
    <div>
      {items?.map((item) => (
        <div key={item.id} className="flex justify-between border-t py-4">
          <div className="flex">
            <div className="flex flex-col pr-2">
              <p
                className={`text-sm font-bold ${categoryColors[item.category] || "text-black"}`}
              >
                {item.title}
              </p>
              <p className="text-xs text-gray-400">{item.assignee}</p>
            </div>
            {/* Dietary Icons */}
            <div className="flex space-x-2">
              {item.dietary.map((tag, idx) => {
                const dietaryData = dietaryIcons[tag.toLowerCase()];
                return (
                  dietaryData && (
                    <span
                      key={idx}
                      className={`flex items-center ${dietaryData.color}`}
                    >
                      {dietaryData.icon}
                    </span>
                  )
                );
              })}
            </div>
          </div>
          <div className="ml-2 flex items-center">
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
