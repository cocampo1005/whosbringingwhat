import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "../contexts/AuthContext";
import { IoClose, IoChevronDown, IoInformationCircleOutline } from "react-icons/io5";
// import { collection, getDocs } from "firebase/firestore";
// import { db } from "firebase";
import AssigneeAvatar from "./AssigneeAvatar";
import Tooltip from "./Tooltip";
import { useUsers } from "../contexts/UsersContext";
import ImageUpload from "./ImageUpload";
import useEscapeKey from "../hooks/useEscapeKey";
import UnsavedChangesPrompt from "./UnsavedChangesPrompt";

function ItemSidePanel({
  closeModal,
  onSubmit,
  initialData = {},
  mode = "add",
  memberIds = [],
}) {
  const { currentUser } = useAuth();
  const allMemberIds = Array.from(
    new Set(
      [currentUser?.uid, ...(Array.isArray(memberIds) ? memberIds : [])].filter(
        Boolean,
      ),
    ),
  );

  const { users: memberUsers = [], status: memberUsersStatus } =
    useUsers(allMemberIds);
  const [assigneeQuery, setAssigneeQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [itemData, setItemData] = useState({
    id: initialData?.id || (mode === "add" && uuidv4()),
    title: initialData?.title || "",
    assignee: initialData?.assignee || currentUser.name,
    assigneeId: initialData?.assigneeId ?? currentUser?.uid ?? null,
    category: initialData?.category || "Main",
    dietary: initialData?.dietary || [],
    description: initialData?.description || "",
    imageUrl: initialData?.imageUrl || "",
    servings: initialData?.servings || "",
    onBehalfOfName: initialData?.onBehalfOfName || "",
    isOnBehalfOf:
      !!(initialData?.onBehalfOfName && initialData.onBehalfOfName.trim()) ||
      !!initialData?.isOnBehalfOf,
  });
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);

  useEffect(() => {
    setAssigneeQuery(itemData.assignee || "");
  }, [itemData.assignee]);

  const isOnBehalfValid =
    !itemData.isOnBehalfOf ||
    (itemData.onBehalfOfName || "").trim() !== "";

  const hasValidAssigneeId =
    !itemData.isOnBehalfOf ? !!itemData.assigneeId : true;

  const isFormValid =
    (itemData.title || "").trim() !== "" &&
    (itemData.assignee || "").trim() !== "" &&
    !!itemData.category &&
    isOnBehalfValid &&
    hasValidAssigneeId;

  const shouldShowAssigneeError =
    !itemData.isOnBehalfOf &&
    assigneeQuery.trim() !== "" &&
    !itemData.assigneeId;

  const dietaryOptions = [
    { label: "Vegetarian", value: "vegetarian" },
    { label: "Vegan", value: "vegan" },
    { label: "Gluten Free", value: "gluten" },
    { label: "Has Dairy", value: "dairy" },
    { label: "Has Nuts", value: "nuts" },
    { label: "Has Pork", value: "pork" },
    { label: "Has Beef", value: "beef" },
    { label: "Has Poultry", value: "poultry" },
    { label: "Has Fish", value: "fish" },
    { label: "Has Shellfish", value: "shellfish" },
    { label: "Spicy", value: "spicy" },
  ];

  // Fetch users once
  // useEffect(() => {
  //   const fetchUsers = async () => {
  //     const snap = await getDocs(collection(db, "users"));
  //     setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  //   };
  //   fetchUsers();
  // }, []);

  // Handler when selecting from dropdown
  const handleSelectUser = (user) => {
    setHasInteracted(true);
    setItemData((prev) => ({
      ...prev,
      assignee: user.name,
      assigneeId: user.id,
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setHasInteracted(true);
    if (name === "onBehalfOfName") {
      setItemData((prev) => ({ ...prev, onBehalfOfName: value }));
    } else {
      setItemData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleToggleOnBehalfOf = () => {
    setHasInteracted(true);
    setItemData((prev) => {
      const nextIsOnBehalfOf = !prev.isOnBehalfOf;
      return {
        ...prev,
        isOnBehalfOf: nextIsOnBehalfOf,
        onBehalfOfName: nextIsOnBehalfOf ? prev.onBehalfOfName : "",
      };
    });
    setShowSuggestions(false);
  };

  const handleDietaryChange = (tag) => {
    setHasInteracted(true);
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

    const rawOnBehalfName = itemData.isOnBehalfOf
      ? (itemData.onBehalfOfName || "").trim()
      : "";
    const onBehalfOfName = rawOnBehalfName || null;
    const isOnBehalfOf = !!onBehalfOfName;

    const resolvedAssigneeId = itemData.assigneeId ?? null;

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
      onBehalfOfName,
      isOnBehalfOf,
    };

    onSubmit(payload);
    closeModal();
  };

  const requestClose = () => {
    if (hasInteracted) {
      setShowUnsavedPrompt(true);
    } else {
      closeModal();
    }
  };

  useEscapeKey(
    () => {
      if (showUnsavedPrompt) {
        setShowUnsavedPrompt(false);
        return;
      }
      requestClose();
    },
    true,
  );

  const handleBackdropClick = (e) => {
    if (e.target !== e.currentTarget) return;
    requestClose();
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-stretch justify-center md:justify-end bg-gray-500 bg-opacity-50"
      onClick={handleBackdropClick}
    >
      <div className="relative flex h-full w-full max-w-full md:max-w-md flex-col overflow-hidden bg-yellow-50 shadow-lg">
        <div className="flex items-center justify-center bg-primaryRed px-4 py-3">
          <h2 className="text-center text-lg font-semibold text-white">
            {mode === "add" ? "Add Item" : "Edit Item"}
          </h2>
          <IoClose
            className="absolute right-4 top-3 cursor-pointer text-2xl text-white"
            onClick={requestClose}
          />
        </div>
        <div className="flex-1 overflow-y-auto p-6">
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
              <div className="flex w-full items-stretch rounded-lg border border-gray-300 bg-white focus-within:border-primaryRed">
                <AssigneeAvatar
                  assigneeId={itemData.assigneeId}
                  displayName={itemData.assignee}
                  size={24}
                  className={"ml-3 self-center"}
                  showName={false}
                />

                <input
                  type="text"
                  name="assignee"
                  value={assigneeQuery}
                  onChange={(e) => {
                    setHasInteracted(true);
                    const value = e.target.value;
                    setAssigneeQuery(value);
                    setShowSuggestions(true);

                    if (value.trim() === "") {
                      setItemData((prev) => ({
                        ...prev,
                        assignee: "",
                        assigneeId: null,
                      }));
                    }
                  }}
                  className={`flex-1 border-0 bg-white p-2 pl-2 focus:ring-0 ${itemData.isOnBehalfOf ? "cursor-not-allowed bg-gray-100 text-gray-500" : ""}`}
                  placeholder="Search for a name..."
                  disabled={itemData.isOnBehalfOf}
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowSuggestions((prev) => !prev)}
                  disabled={itemData.isOnBehalfOf}
                  className={`rounded-r-lg px-3 text-primaryDark hover:bg-gray-50 ${itemData.isOnBehalfOf ? "cursor-not-allowed opacity-50 hover:bg-white" : ""}`}
                >
                  <IoChevronDown
                    className={`h-4 w-4 transition-transform ${
                      showSuggestions ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>

              {/* Suggestion dropdown */}
              {showSuggestions && !itemData.isOnBehalfOf && (
                <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-md bg-white shadow">
                  {memberUsers
                    .filter((u) =>
                      assigneeQuery
                        ? u?.name
                            ?.toLowerCase()
                            .includes(assigneeQuery.toLowerCase())
                        : true,
                    )
                    .map((u) => (
                      <li
                        key={u.id}
                        onClick={() => {
                          setHasInteracted(true);
                          setItemData((prev) => ({
                            ...prev,
                            assignee: u.name,
                            assigneeId: u.id,
                          }));
                          setAssigneeQuery(u.name);
                          setShowSuggestions(false);
                        }}
                        className="cursor-pointer px-3 py-2 hover:bg-gray-100"
                      >
                        <div className="flex items-center gap-2">
                          <AssigneeAvatar
                            assigneeId={u.id}
                            displayName={u.name}
                            size={24}
                          />
                        </div>
                      </li>
                    ))}
                </ul>
              )}

              {shouldShowAssigneeError && (
                <p className="mt-1 text-xs text-red-600">
                  Can't find who's bringing it, use "On behalf of someone else" instead.
                </p>
              )}

              <div className="mt-3 flex flex-col gap-2">
                <label className="flex items-center text-xs font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={!!itemData.isOnBehalfOf}
                    onChange={handleToggleOnBehalfOf}
                    className="mr-2 h-4 w-4 rounded border-gray-300 text-primaryRed focus:ring-0 focus:ring-offset-0"
                  />
                  <span>On behalf of someone else</span>
                  <Tooltip
                    content="Use this when someone who doesn't have an account is bringing an item."
                    ariaLabel="What does this checkbox do?"
                  >
                    <IoInformationCircleOutline className="ml-[6px] h-4 w-4" />
                  </Tooltip>
                </label>

                {itemData.isOnBehalfOf && (
                  <div className="mt-1 ml-6">
                    <div className="flex w-full items-stretch rounded-lg border border-gray-300 bg-white focus-within:border-primaryRed">
                      <AssigneeAvatar
                        assigneeId={null}
                        displayName={itemData.onBehalfOfName}
                        size={20}
                        className={"ml-3 self-center"}
                        showName={false}
                      />
                      <input
                        type="text"
                        name="onBehalfOfName"
                        value={itemData.onBehalfOfName}
                        onChange={handleChange}
                        placeholder="Name of the person who's bringing what"
                        className="flex-1 border-0 bg-white p-2 pl-2 text-sm focus:ring-0"
                        maxLength={30}
                      />
                    </div>
                  </div>
                )}
              </div>
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
              <ImageUpload
                label="Photo"
                imageUrl={itemData.imageUrl}
                onImageChange={(url) => {
                  setHasInteracted(true);
                  setItemData((prev) => ({ ...prev, imageUrl: url }));
                }}
                storageFolder="item-images"
                objectId={itemData.id}
                imageAlt="Item preview"
                onUploadingChange={setUploading}
                inputId="item-image-upload"
              />
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

            <div className="pt-4">
              <button
                type="submit"
                disabled={uploading || !isFormValid}
                className={`w-full rounded-lg px-4 py-3 text-center text-sm font-semibold text-white ${
                  uploading || !isFormValid
                    ? "bg-red-300 cursor-not-allowed"
                    : "bg-primaryRed hover:bg-secondaryRed"
                }`}
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
      <UnsavedChangesPrompt
        isOpen={showUnsavedPrompt}
        title="Discard changes?"
        description="You have unsaved changes for this item. Are you sure you want to close without saving?"
        onCancel={() => setShowUnsavedPrompt(false)}
        onConfirm={() => {
          setShowUnsavedPrompt(false);
          closeModal();
        }}
      />
    </div>
  );
}

export default ItemSidePanel;
