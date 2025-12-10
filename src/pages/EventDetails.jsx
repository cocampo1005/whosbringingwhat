import { useNavigate, useParams } from "react-router-dom";
import { useMemo, useEffect, useState } from "react";
import {
  arrayRemove,
  arrayUnion,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { formatTime } from "../utils/formatters";
import { useAuth } from "../contexts/AuthContext";
import { useRole } from "../hooks/useRole";
import EventModal from "../components/EventModal";
import ShareButton from "../components/ShareButton";
import { FiEdit, FiLogOut } from "react-icons/fi";
import { BsPeople, BsLightbulb } from "react-icons/bs";
import { MdOutlineAccessTimeFilled } from "react-icons/md";
import { FaCalendarAlt } from "react-icons/fa";
import { TiLocation } from "react-icons/ti";
import { FaPlus } from "react-icons/fa6";
import { GiChickenOven } from "react-icons/gi";
import { FaBowlFood } from "react-icons/fa6";
import { GiCakeSlice } from "react-icons/gi";
import { FaWineGlassAlt } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { BsThreeDots } from "react-icons/bs";
// Dietary restriction icons
import { LuVegan } from "react-icons/lu";
import { FaLeaf, FaFish } from "react-icons/fa6";
import { PiCowFill } from "react-icons/pi";
import { FaGlideG, FaPepperHot } from "react-icons/fa";
import { GiChicken, GiPeanut, GiMilkCarton, GiShrimp } from "react-icons/gi";
import { PorkIconComponent } from "../styles/svgs";
import ItemSidePanel from "../components/ItemSidePanel";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import ParticipantsModal from "../components/ParticipantsModal";
import SuggestionsModal from "../components/SuggestionsModal";
import PieChart from "../components/PieChart";
import CategoryList from "../components/CategoryList";
import JoinEventPromptModal from "../components/JoinEventPromptModal";
import { deleteAllEventItemImages } from "../utils/storageCleanup";
import CookingLoader from "../components/CookingLoader";

function EventDetails() {
  const { eventId } = useParams();
  const { currentUser } = useAuth();
  const role = useRole();
  const isAdmin = role === "admin";

  const [event, setEvent] = useState(null);
  const [editingEvent, setEditingEvent] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [itemToDeleteName, setItemToDeleteName] = useState("");
  const [isParticipantModalOpen, setIsParticipantModalOpen] = useState(false);
  const [isParticipantConfirmOpen, setIsParticipantConfirmOpen] =
    useState(false);
  const [participantToRemove, setParticipantToRemove] = useState(null);
  const [participantToRemoveName, setParticipantToRemoveName] = useState("");
  const [isSuggestionsModalOpen, setIsSuggestionsModalOpen] = useState(false);
  const [claimingSuggestion, setClaimingSuggestion] = useState(null);
  const [isSelfRemoval, setIsSelfRemoval] = useState(false);
  const navigate = useNavigate();

  const isHost =
    !!currentUser &&
    !!event &&
    ((event.hostId && event.hostId === currentUser.uid) ||
      (!event.hostId &&
        event.createdById &&
        event.createdById === currentUser.uid));

  const isMember =
    !!currentUser &&
    !!event &&
    (isAdmin ||
      isHost ||
      (Array.isArray(event.members) &&
        event.members.includes(currentUser.uid)));

  const isSidePanelOpen =
    isItemModalOpen ||
    isParticipantModalOpen ||
    editingEvent ||
    isSuggestionsModalOpen;

  const memberIds = useMemo(() => {
    if (!event) return [];

    const baseHostId = event.hostId || event.createdById || null;
    const membersArray = Array.isArray(event.members) ? event.members : [];

    return Array.from(new Set([baseHostId, ...membersArray].filter(Boolean)));
  }, [event]);

  const canManageEvent = isAdmin || isHost;
  const showSelfRemoveButton =
    !!currentUser && !!event && !isHost && !isAdmin && isMember;

  const canUserManageItem = (item) => {
    if (!currentUser || !event) return false;
    if (isAdmin || isHost) return true;
    return (
      item.createdById === currentUser.uid ||
      item.assigneeId === currentUser.uid
    );
  };

  // Dietary icons configuration
  const dietaryIcons = {
    vegan: { icon: <LuVegan />, color: "text-green-600" },
    vegetarian: { icon: <FaLeaf />, color: "text-emerald-500" },
    pork: { icon: <PorkIconComponent />, color: "text-pink-400" },
    beef: { icon: <PiCowFill />, color: "text-amber-800" },
    poultry: { icon: <GiChicken />, color: "text-orange-400" },
    fish: { icon: <FaFish />, color: "text-sky-600" },
    shellfish: { icon: <GiShrimp />, color: "text-orange-600" },
    nuts: { icon: <GiPeanut />, color: "text-yellow-600" },
    dairy: { icon: <GiMilkCarton />, color: "text-blue-500" },
    gluten: { icon: <FaGlideG />, color: "text-purple-600" },
    spicy: { icon: <FaPepperHot />, color: "text-red-600" },
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return "";
    // If it matches YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const date = new Date(dateStr);
      // Adjust for timezone offset to display correct date
      const offset = date.getTimezoneOffset();
      const adjusted = new Date(date.getTime() + offset * 60 * 1000);
      return new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(adjusted);
    }
    return dateStr; // Return as is if not ISO (legacy format)
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, "events", eventId),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const eventData = { id: docSnapshot.id, ...docSnapshot.data() };
          setEvent(eventData);
        } else {
          console.error("Event not found!");
        }
      },
    );

    return () => unsubscribe();
  }, [eventId]);

  const handleEdit = async (updatedEventData) => {
    try {
      const eventRef = doc(db, "events", eventId);
      await updateDoc(eventRef, updatedEventData);
      setEvent((prev) => ({ ...prev, ...updatedEventData }));

      console.log("Event updated successfully!");
    } catch (error) {
      console.error("Error updating event:", error);
    } finally {
      setEditingEvent(false);
    }
  };

  const handleJoinEvent = async () => {
    if (!currentUser || !event) return;

    try {
      const eventRef = doc(db, "events", eventId);
      await updateDoc(eventRef, {
        members: arrayUnion(currentUser.uid),
      });

      setEvent((prev) => {
        if (!prev) return prev;
        const existingMembers = Array.isArray(prev.members) ? prev.members : [];
        if (existingMembers.includes(currentUser.uid)) return prev;
        return {
          ...prev,
          members: [...existingMembers, currentUser.uid],
        };
      });
    } catch (error) {
      console.error("Error joining event:", error);
    }
  };

  const handleRemoveParticipant = async (participantId) => {
    if (!participantId) return;

    try {
      const eventRef = doc(db, "events", eventId);
      const eventSnap = await getDoc(eventRef);

      if (!eventSnap.exists()) {
        console.error("Event not found when removing participant");
        return;
      }

      const data = eventSnap.data();
      const hostIdFromDoc = data.hostId || data.createdById || null;

      if (hostIdFromDoc && hostIdFromDoc === participantId) {
        console.warn("Cannot remove the host from the event");
        return;
      }

      const existingMembers = Array.isArray(data.members) ? data.members : [];
      const updatedMembers = existingMembers.filter(
        (id) => id !== participantId,
      );

      const existingItems = Array.isArray(data.items) ? data.items : [];
      const updatedItems = existingItems.filter(
        (item) => item.assigneeId !== participantId,
      );

      await updateDoc(eventRef, {
        members: updatedMembers,
        items: updatedItems,
      });

      setEvent((prev) => {
        if (!prev) return prev;

        const prevMembers = Array.isArray(prev.members) ? prev.members : [];
        const nextMembers = prevMembers.filter((id) => id !== participantId);

        const prevItems = Array.isArray(prev.items) ? prev.items : [];
        const nextItems = prevItems.filter(
          (item) => item.assigneeId !== participantId,
        );

        return {
          ...prev,
          members: nextMembers,
          items: nextItems,
        };
      });

      if (currentUser && currentUser.uid === participantId) {
        setIsParticipantModalOpen(false);
      }
    } catch (error) {
      console.error("Error removing participant:", error);
    }
  };

  const openParticipantRemovalConfirm = (
    participantId,
    participantName,
    isSelf = false,
  ) => {
    if (!participantId) return;

    setParticipantToRemove(participantId);
    setParticipantToRemoveName(participantName || "this participant");
    setIsSelfRemoval(!!isSelf);
    setIsParticipantConfirmOpen(true);
  };

  const handleConfirmRemoveParticipant = async () => {
    if (!participantToRemove) return;

    await handleRemoveParticipant(participantToRemove);

    setIsParticipantConfirmOpen(false);
    setParticipantToRemove(null);
    setParticipantToRemoveName("");
    setIsSelfRemoval(false);
  };

  const handleParticipantsModal = () => {
    setIsParticipantModalOpen(!isParticipantModalOpen);
  };

  const handleSuggestionsModal = () => {
    setIsSuggestionsModalOpen((prev) => !prev);
  };

  const handleClaimSuggestion = (suggestion) => {
    if (!event || !currentUser) return;
    if (!isMember && !isAdmin) return;

    const initialData = {
      title: suggestion.itemName,
      category: suggestion.category || "Main",

      // Assign to current user
      assignee:
        currentUser.name || currentUser.displayName || currentUser.email || "",
      assigneeId: currentUser.uid,

      // Lock fields inside the panel
      isSuggestion: true,
      suggestionId: suggestion.id,
      suggesterId: suggestion.suggesterId,

      createdById: currentUser.uid,
      createdByName:
        currentUser.name || currentUser.displayName || currentUser.email || "",
    };

    setClaimingSuggestion(suggestion);
    setEditingItem(initialData);
    setIsItemModalOpen(true);
  };

  const handleEditSuggestion = async (updatedSuggestion) => {
    if (!event) return;

    try {
      await updateSuggestionInEvent(event.id, updatedSuggestion);
    } catch (error) {
      console.error("Error updating suggestion:", error);
    }
  };

  const handleDeleteSuggestion = async (suggestion) => {
    if (!event) return;

    if (suggestion.claimed) {
      alert("This suggestion has been claimed and cannot be deleted.");
      return;
    }

    try {
      await deleteSuggestionFromEvent(event.id, suggestion.id);
    } catch (e) {
      console.error("Error deleting suggestion:", e);
    }
  };

  const groupItemsByCategory = (items) => {
    const categories = ["Main", "Side", "Dessert", "Beverage", "Miscellaneous"];
    const grouped = {};

    categories.forEach((category) => {
      grouped[category] = items
        .filter((item) => item.category === category)
        .sort((a, b) => a.title.localeCompare(b.title));
    });

    return grouped;
  };

  const getCategoryCounts = (items) => {
    const categoryCounts = {
      Main: 0,
      Side: 0,
      Dessert: 0,
      Beverage: 0,
      Miscellaneous: 0,
    };

    items.forEach((item) => {
      if (categoryCounts[item.category] !== undefined) {
        categoryCounts[item.category] += 1;
      }
    });

    return categoryCounts;
  };

  const getPieChartData = (items) => {
    const counts = getCategoryCounts(items);
    const total = items.length;

    if (total === 0) return [];

    const categories = [
      {
        name: "Main",
        count: counts.Main,
        color: "#dc2626",
        textColor: "text-red-600",
        icon: GiChickenOven,
      },
      {
        name: "Side",
        count: counts.Side,
        color: "#eab308",
        textColor: "text-yellow-500",
        icon: FaBowlFood,
      },
      {
        name: "Dessert",
        count: counts.Dessert,
        color: "#ad46ff",
        textColor: "text-purple-600",
        icon: GiCakeSlice,
      },
      {
        name: "Beverage",
        count: counts.Beverage,
        color: "#2563eb",
        textColor: "text-blue-600",
        icon: FaWineGlassAlt,
      },
      {
        name: "Miscellaneous",
        count: counts.Miscellaneous,
        color: "#009689",
        textColor: "text-teal-600",
        icon: BsThreeDots,
      },
    ];

    return categories.filter((cat) => cat.count > 0);
  };

  // Keep grouped/category counts stable across unrelated re-renders
  const categoryCounts = useMemo(() => {
    const items = event?.items || [];
    return getCategoryCounts(items);
  }, [event?.items]);

  const groupedItems = useMemo(() => {
    const items = event?.items || [];
    return groupItemsByCategory(items);
  }, [event?.items]);

  // Signature changes only when any category’s count changes
  const pieSignature = useMemo(() => {
    const c = categoryCounts;
    return `Main:${c.Main}|Side:${c.Side}|Dessert:${c.Dessert}|Beverage:${c.Beverage}|Misc:${c.Miscellaneous}`;
  }, [categoryCounts]);

  // Recompute pieData only when the signature changes
  const pieData = useMemo(() => {
    const items = event?.items || [];
    return getPieChartData(items);
  }, [pieSignature]);

  // Helper function to get text color for a category
  const getCategoryTextColor = (categoryName) => {
    const categoryData = pieData.find((cat) => cat.name === categoryName);
    return categoryData ? categoryData.textColor : "text-gray-800";
  };

  // Functions for item CRUD operations
  const toggleReactionOnEventItem = async (eventId, itemId, emoji, userId) => {
    const eventRef = doc(db, "events", eventId);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(eventRef);
      if (!snap.exists()) return;

      const data = snap.data() || {};
      const items = Array.isArray(data.items) ? data.items : [];

      const updatedItems = items.map((item) => {
        if (!item || item.id !== itemId) return item;

        const reactions = { ...(item.reactions || {}) };
        const current = reactions[emoji] || {
          count: 0,
          userIds: [],
          order: undefined,
        };
        const existingUserIds = Array.isArray(current.userIds)
          ? current.userIds
          : [];
        const userIdSet = new Set(existingUserIds);

        if (userIdSet.has(userId)) {
          userIdSet.delete(userId);
        } else {
          userIdSet.add(userId);
        }

        const nextUserIds = Array.from(userIdSet);

        if (nextUserIds.length === 0) {
          delete reactions[emoji];
        } else {
          let order = typeof current.order === "number" ? current.order : null;

          if (order === null) {
            const existingOrders = Object.values(reactions).map((value) =>
              typeof value?.order === "number" ? value.order : 0,
            );
            const maxOrder =
              existingOrders.length > 0 ? Math.max(...existingOrders) : 0;
            order = maxOrder + 1;
          }

          reactions[emoji] = {
            count: nextUserIds.length,
            userIds: nextUserIds,
            order,
          };
        }

        const hasAnyEmoji = Object.keys(reactions).length > 0;

        // Important: Firestore does not allow fields with value `undefined`.
        // Build a new item object and conditionally include/remove `reactions`.
        const nextItem = { ...item };
        if (hasAnyEmoji) {
          nextItem.reactions = reactions;
        } else {
          delete nextItem.reactions;
        }

        return nextItem;
      });

      tx.update(eventRef, { items: updatedItems });
    });
  };

  const addItemToEvent = async (eventId, newItem) => {
    const eventRef = doc(db, "events", eventId);
    await updateDoc(eventRef, {
      items: arrayUnion(newItem),
    });
  };

  const addSuggestionToEvent = async (eventId, suggestion) => {
    const eventRef = doc(db, "events", eventId);

    const suggestionForFirestore = {
      id: suggestion.id,
      itemName: suggestion.itemName,
      category: suggestion.category || "Main",
      suggesterId: suggestion.suggesterId,
      suggester: suggestion.suggester,
      claimed: false,
      claimedById: null,
      claimedItemId: null,
      createdAt: Date.now(),
    };

    await updateDoc(eventRef, {
      suggestedItems: arrayUnion(suggestionForFirestore),
    });
  };

  const markSuggestionClaimed = async (
    eventId,
    suggestionId,
    claimedById,
    claimedItemId,
  ) => {
    const eventRef = doc(db, "events", eventId);

    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(eventRef);
      if (!snap.exists()) return;

      const data = snap.data() || {};
      const suggestedItems = Array.isArray(data.suggestedItems)
        ? data.suggestedItems
        : [];

      const updated = suggestedItems.map((s) =>
        s && s.id === suggestionId
          ? {
              ...s,
              claimed: true,
              claimedById,
              claimedItemId,
            }
          : s,
      );

      transaction.update(eventRef, { suggestedItems: updated });
    });
  };

  const markSuggestionUnclaimed = async (eventId, suggestionId) => {
    const eventRef = doc(db, "events", eventId);

    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(eventRef);
      if (!snap.exists()) return;

      const data = snap.data() || {};
      const suggestedItems = Array.isArray(data.suggestedItems)
        ? data.suggestedItems
        : [];

      const updated = suggestedItems.map((s) =>
        s && s.id === suggestionId
          ? {
              ...s,
              claimed: false,
              claimedById: null,
              claimedItemId: null,
            }
          : s,
      );

      transaction.update(eventRef, { suggestedItems: updated });
    });
  };

  const updateSuggestionInEvent = async (eventId, updatedSuggestion) => {
    const eventRef = doc(db, "events", eventId);

    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(eventRef);
      if (!snap.exists()) return;

      const data = snap.data() || {};
      const suggestedItems = Array.isArray(data.suggestedItems)
        ? data.suggestedItems
        : [];

      const mapped = suggestedItems.map((s) =>
        s && s.id === updatedSuggestion.id ? { ...s, ...updatedSuggestion } : s,
      );

      transaction.update(eventRef, { suggestedItems: mapped });
    });
  };

  const deleteSuggestionFromEvent = async (eventId, suggestionId) => {
    const eventRef = doc(db, "events", eventId);

    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(eventRef);
      if (!snap.exists()) return;

      const data = snap.data() || {};
      const suggestedItems = Array.isArray(data.suggestedItems)
        ? data.suggestedItems
        : [];

      const filtered = suggestedItems.filter((s) => s && s.id !== suggestionId);

      transaction.update(eventRef, { suggestedItems: filtered });
    });
  };

  const updateItemInEvent = async (eventId, updatedItem) => {
    const eventRef = doc(db, "events", eventId);
    const eventDoc = await getDoc(eventRef);

    if (eventDoc.exists()) {
      const { items } = eventDoc.data();
      const updatedItems = items.map((item) => {
        if (!item || item.id !== updatedItem.id) return item;

        // Merge new fields into existing item but always preserve reactions.
        const merged = { ...item, ...updatedItem };

        if (item.reactions && !merged.reactions) {
          merged.reactions = item.reactions;
        }

        return merged;
      });

      await updateDoc(eventRef, { items: updatedItems });
    }
  };

  const handleAddItem = () => {
    if (!isMember && !isAdmin) {
      return;
    }
    setEditingItem(null);
    setIsItemModalOpen(true);
  };

  const handleEditItem = (item) => {
    if (!canUserManageItem(item)) {
      return;
    }
    setEditingItem(item);
    setIsItemModalOpen(true);
  };

  const handleItemSubmit = async (itemData) => {
    if (!event) return;

    // 1) Pure suggestion coming from Suggest Item mode in ItemSidePanel
    if (itemData.__type === "suggestion") {
      try {
        await addSuggestionToEvent(event.id, itemData);
      } catch (error) {
        console.error("Error adding suggestion:", error);
      } finally {
        setIsItemModalOpen(false);
      }
      return;
    }

    // 2) Normal item or item created from a suggestion
    try {
      let itemToSave = { ...itemData };

      // If we are in the middle of claiming a suggestion, attach suggestion metadata
      if (claimingSuggestion) {
        itemToSave = {
          ...itemToSave,
          isSuggestion: true,
          suggestionId: claimingSuggestion.id,
          suggesterId: claimingSuggestion.suggesterId,
        };
      }

      if (editingItem && !claimingSuggestion) {
        // Regular edit
        await updateItemInEvent(event.id, itemToSave);
      } else {
        // New item (either regular add or claim-add)
        await addItemToEvent(event.id, itemToSave);

        // If this was created from a suggestion, mark that suggestion as claimed
        if (claimingSuggestion) {
          await markSuggestionClaimed(
            event.id,
            claimingSuggestion.id,
            currentUser?.uid ?? null,
            itemToSave.id,
          );
        }
      }
    } catch (error) {
      console.error("Error saving item:", error);
    } finally {
      setClaimingSuggestion(null);
      setEditingItem(null);
      setIsItemModalOpen(false);
    }
  };

  const handleToggleReaction = async (itemId, emoji) => {
    if (!currentUser || !event) return;
    if (!itemId || !emoji) return;

    try {
      await toggleReactionOnEventItem(event.id, itemId, emoji, currentUser.uid);
    } catch (error) {
      console.error("Error toggling reaction:", error);
    }
  };

  // Functions for Confirming Deleting Modal
  const handleDeleteEvent = async () => {
    try {
      await deleteAllEventItemImages(eventId);
      if (event?.imageUrl) {
        try {
          const { getStorage, ref, deleteObject } = await import(
            "firebase/storage"
          );
          const storage = getStorage();
          const imageRef = ref(storage, event.imageUrl);
          await deleteObject(imageRef);

          console.log("Event hero image deleted from storage");
        } catch (imageError) {
          console.error("Error deleting event hero image:", imageError);
        }
      }
      const eventRef = doc(db, "events", eventId);
      await deleteDoc(eventRef);
      navigate("/events");
    } catch (error) {
      console.error("Error deleting event:", error);
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    const eventRef = doc(db, "events", eventId);

    try {
      const eventDoc = await getDoc(eventRef);
      if (eventDoc.exists()) {
        const { items } = eventDoc.data();
        const itemToRemove = items.find((item) => item.id === itemId);
        if (itemToRemove) {
          // Delete associated image from storage if it exists
          if (
            itemToRemove.imageUrl &&
            itemToRemove.imageUrl.includes("firebase")
          ) {
            try {
              const { getStorage, ref, deleteObject } = await import(
                "firebase/storage"
              );
              const storage = getStorage();
              const imageRef = ref(storage, itemToRemove.imageUrl);
              await deleteObject(imageRef);
              console.log("Associated image deleted from storage");
            } catch (imageError) {
              console.error("Error deleting image from storage:", imageError);
              // Continue with item deletion even if image deletion fails
            }
          }

          // Remove item from event
          await updateDoc(eventRef, {
            items: arrayRemove(itemToRemove),
          });
          // If this item was created from a suggestion, mark that suggestion as unclaimed
          if (itemToRemove.isSuggestion && itemToRemove.suggestionId) {
            try {
              await markSuggestionUnclaimed(eventId, itemToRemove.suggestionId);
            } catch (error) {
              console.error("Error marking suggestion unclaimed:", error);
            }
          }
        }
      } else {
        console.log("Event not found!");
      }
    } catch (error) {
      console.error("Error removing item from event:", error);
    }
    console.log("Item deleted:", itemId);
    setIsDeleteModalOpen(false);
  };

  const openDeleteModalForEvent = () => {
    setItemToDeleteName(event.title);
    setItemToDelete(eventId);
    setIsDeleteModalOpen(true);
  };

  const openDeleteModalForItem = (item) => {
    if (!canUserManageItem(item)) {
      return;
    }
    setItemToDeleteName(item.title);
    setItemToDelete(item.id);
    setIsDeleteModalOpen(true);
  };

  if (!event) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-center">
        <CookingLoader />
      </div>
    );
  }

  const bannerColor = event.bannerColor || "#f94a5a";

  return (
    <div
      className={`relative mb-10 mt-8 max-w-7xl rounded-2xl bg-white shadow-md transition-all duration-200 ease-out ${
        isSidePanelOpen ? "md:mr-[12rem] lg:mr-[14rem]" : ""
      }`}
    >
      {/* Hero header: event image or colored banner */}
      <div className="relative w-full overflow-hidden rounded-tl-2xl rounded-tr-2xl">
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.title || "Event image"}
            className="h-48 w-full object-cover"
          />
        ) : (
          <div
            className="h-48 w-full"
            style={{ backgroundColor: bannerColor }}
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 px-4 py-3">
          <h1 className="text-lg font-bold text-white md:text-xl">
            {event.title}
          </h1>
        </div>
      </div>

      <div className="p-4 md:p-6">
        {/* Mobile layout */}
        <div className="md:hidden">
          <div className="mb-6">
            <div className="relative">
              {/* Action buttons - vertical on mobile */}
              <div className="absolute right-0 top-0">
                <div className="flex flex-col gap-2">
                  {canManageEvent && (
                    <>
                      <button
                        onClick={openDeleteModalForEvent}
                        className="flex rounded-full bg-primaryRed p-2 hover:bg-secondaryRed"
                      >
                        <MdDelete className="text-lg text-white" />
                      </button>
                      <button
                        onClick={() => setEditingEvent(true)}
                        className="flex rounded-full bg-primaryRed p-2 hover:bg-secondaryRed"
                      >
                        <FiEdit className="text-lg text-white" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={handleSuggestionsModal}
                    className="flex rounded-full bg-primaryRed p-2 hover:bg-secondaryRed"
                    aria-label="View suggestions"
                  >
                    <BsLightbulb className="text-lg text-white" />
                  </button>
                  <button
                    onClick={handleParticipantsModal}
                    className="flex rounded-full bg-primaryRed p-2 hover:bg-secondaryRed"
                  >
                    <BsPeople className="text-lg text-white" />
                  </button>
                  <ShareButton eventId={eventId} eventTitle={event.title} />
                  {showSelfRemoveButton && currentUser && (
                    <button
                      type="button"
                      onClick={() =>
                        openParticipantRemovalConfirm(
                          currentUser.uid,
                          currentUser.displayName ||
                            currentUser.name ||
                            currentUser.email ||
                            "You",
                          true,
                        )
                      }
                      className="flex rounded-full bg-primaryRed p-2 hover:bg-secondaryRed"
                      aria-label="Leave event"
                    >
                      <FiLogOut className="text-lg text-white" />
                    </button>
                  )}
                </div>
              </div>

              {/* Event info */}
              <div className="pr-20">
                <div className="mb-4 space-y-2">
                  <div className="flex items-center">
                    <FaCalendarAlt className="mr-2 h-4 w-4 shrink-0 text-primaryRed" />
                    <p className="font-bold">{formatDisplayDate(event.date)}</p>
                  </div>
                  <div className="flex items-center">
                    <MdOutlineAccessTimeFilled className="mr-2 h-4 w-4 shrink-0 text-primaryRed" />
                    <p className="font-bold">{formatTime(event.time)}</p>
                  </div>
                  <div className="flex items-center">
                    <TiLocation className="mr-2 h-4 w-4 shrink-0 text-primaryRed" />
                    <p className="font-bold">{event.location}</p>
                  </div>
                </div>
                <p className="text-gray-700">{event.description}</p>
              </div>
            </div>

            {/* Pie chart for mobile */}
            <div className="mt-6">
              <h3 className="font-bold text-primaryDark">
                Item Distribution ({event.items.length})
              </h3>
              {pieData.length > 0 ? (
                <div className="flex items-center gap-4">
                  <div className="shrink-0">
                    <div className="origin-center scale-90">
                      <PieChart
                        data={pieData}
                        size={160}
                        animate
                        duration={700}
                        delayStep={140}
                      />
                    </div>
                  </div>

                  {/* Legend (right) */}
                  <ul className="flex-1 space-y-2">
                    {pieData.map((cat) => {
                      const IconComponent = cat.icon;
                      return (
                        <li key={cat.name} className="flex items-center">
                          <IconComponent
                            className={`mr-2 text-xl ${cat.textColor}`}
                          />
                          <span className="text-sm font-bold">
                            {cat.name}: {cat.count}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No items added yet</p>
              )}
            </div>
          </div>

          {/* Mobile items layout */}
          <div>
            {groupedItems.Main?.length > 0 && (
              <CategoryList
                categoryName="Main"
                items={groupedItems.Main || []}
                categoryColor={getCategoryTextColor("Main")}
                dietaryIcons={dietaryIcons}
                onEditItem={handleEditItem}
                onDeleteItem={openDeleteModalForItem}
                onToggleReaction={handleToggleReaction}
                canManageItem={canUserManageItem}
                defaultExpanded
              />
            )}
            {groupedItems.Side?.length > 0 && (
              <CategoryList
                categoryName="Side"
                items={groupedItems.Side || []}
                categoryColor={getCategoryTextColor("Side")}
                dietaryIcons={dietaryIcons}
                onEditItem={handleEditItem}
                onDeleteItem={openDeleteModalForItem}
                onToggleReaction={handleToggleReaction}
                canManageItem={canUserManageItem}
                defaultExpanded
              />
            )}
            {groupedItems.Dessert?.length > 0 && (
              <CategoryList
                categoryName="Dessert"
                items={groupedItems.Dessert || []}
                categoryColor={getCategoryTextColor("Dessert")}
                dietaryIcons={dietaryIcons}
                onEditItem={handleEditItem}
                onDeleteItem={openDeleteModalForItem}
                onToggleReaction={handleToggleReaction}
                canManageItem={canUserManageItem}
                defaultExpanded
              />
            )}
            {groupedItems.Beverage?.length > 0 && (
              <CategoryList
                categoryName="Beverage"
                items={groupedItems.Beverage || []}
                categoryColor={getCategoryTextColor("Beverage")}
                dietaryIcons={dietaryIcons}
                onEditItem={handleEditItem}
                onDeleteItem={openDeleteModalForItem}
                onToggleReaction={handleToggleReaction}
                canManageItem={canUserManageItem}
                defaultExpanded
              />
            )}
            {groupedItems.Miscellaneous?.length > 0 && (
              <CategoryList
                categoryName="Miscellaneous"
                items={groupedItems.Miscellaneous || []}
                categoryColor={getCategoryTextColor("Miscellaneous")}
                dietaryIcons={dietaryIcons}
                onEditItem={handleEditItem}
                onDeleteItem={openDeleteModalForItem}
                onToggleReaction={handleToggleReaction}
                canManageItem={canUserManageItem}
                defaultExpanded
              />
            )}

            {/* Empty state */}
            {(!event.items || event.items.length === 0) && (
              <div className="py-12 text-center">
                <div className="mb-4 text-3xl">
                  <span
                    className="mx-1 inline-block animate-bounce"
                    style={{ animationDelay: "0s" }}
                  >
                    🍗
                  </span>
                  <span
                    className="mx-1 inline-block animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  >
                    🍛
                  </span>
                  <span
                    className="mx-1 inline-block animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  >
                    🥧
                  </span>
                  <span
                    className="mx-1 inline-block animate-bounce"
                    style={{ animationDelay: "0.3s" }}
                  >
                    🥗
                  </span>
                  <span
                    className="mx-1 inline-block animate-bounce"
                    style={{ animationDelay: "0.4s" }}
                  >
                    🍷
                  </span>
                </div>
                <p className="mb-4 text-lg text-gray-500">No items added yet</p>
                <p className="text-gray-400">
                  Click the + button to add your first item!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Desktop layout */}
        <div className="hidden md:block">
          <div className="mb-8 flex items-start justify-between gap-6">
            {/* Event details section - flexible width */}
            <div className="min-w-0 flex-1">
              <div className="mb-4 space-y-2">
                <div className="flex items-center">
                  <FaCalendarAlt className="mr-2 h-4 w-4 shrink-0 text-primaryRed" />
                  <p className="font-bold">{formatDisplayDate(event.date)}</p>
                </div>
                <div className="flex items-center">
                  <MdOutlineAccessTimeFilled className="mr-2 h-4 w-4 shrink-0 text-primaryRed" />
                  <p className="font-bold">{formatTime(event.time)}</p>
                </div>
                <div className="flex items-center">
                  <TiLocation className="mr-2 h-4 w-4 shrink-0 text-primaryRed" />
                  <p className="font-bold">{event.location}</p>
                </div>
              </div>
              <p className="text-gray-700">{event.description}</p>
            </div>

            {/* Pie chart section - auto width based on content */}
            <div className="shrink-0">
              <h3 className="mb-3 text-center font-bold text-primaryDark">
                Item Distribution ({event.items.length})
              </h3>
              {pieData.length > 0 ? (
                <div className="flex items-center gap-8">
                  <PieChart
                    data={pieData}
                    size={170}
                    animate
                    duration={700}
                    delayStep={140}
                  />

                  {/* Legend */}
                  <div className="grid grid-cols-1 gap-3">
                    {pieData.map((cat) => {
                      const IconComponent = cat.icon;
                      return (
                        <div key={cat.name} className="flex items-center">
                          <IconComponent
                            className={`mr-3 text-xl ${cat.textColor}`}
                          />
                          <span className="whitespace-nowrap font-bold">
                            {cat.name}: {cat.count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-center text-sm text-gray-500">
                  No items added yet
                </p>
              )}
            </div>

            {/* Action buttons - auto width, aligned top and bottom */}
            <div className="flex shrink-0 flex-col items-end justify-between self-stretch">
              <div className="flex gap-2">
                {canManageEvent && (
                  <>
                    <button
                      onClick={openDeleteModalForEvent}
                      className="flex rounded-full bg-primaryRed p-2 hover:bg-secondaryRed"
                    >
                      <MdDelete className="text-lg text-white" />
                    </button>
                    <button
                      onClick={() => setEditingEvent(true)}
                      className="flex rounded-full bg-primaryRed p-2 hover:bg-secondaryRed"
                    >
                      <FiEdit className="text-lg text-white" />
                    </button>
                  </>
                )}
                <button
                  onClick={handleSuggestionsModal}
                  className="flex rounded-full bg-primaryRed p-2 hover:bg-secondaryRed"
                  aria-label="View suggestions"
                >
                  <BsLightbulb className="text-lg text-white" />
                </button>
                <button
                  onClick={handleParticipantsModal}
                  className="flex rounded-full bg-primaryRed p-2 hover:bg-secondaryRed"
                >
                  <BsPeople className="text-lg text-white" />
                </button>
                <ShareButton eventId={eventId} eventTitle={event.title} />
                {showSelfRemoveButton && currentUser && (
                  <button
                    type="button"
                    onClick={() =>
                      openParticipantRemovalConfirm(
                        currentUser.uid,
                        currentUser.displayName ||
                          currentUser.name ||
                          currentUser.email ||
                          "You",
                        true,
                      )
                    }
                    className="flex rounded-full bg-primaryRed p-2 hover:bg-secondaryRed"
                    aria-label="Leave event"
                  >
                    <FiLogOut className="text-lg text-white" />
                  </button>
                )}
              </div>
              <button
                onClick={handleAddItem}
                className="flex shrink-0 items-center gap-2 rounded-xl bg-primaryRed px-4 py-3 text-sm font-semibold text-white hover:bg-secondaryRed"
              >
                <FaPlus />
                <span>Add / Suggest Item</span>
              </button>
            </div>
          </div>

          {/* Five column layout for categories on desktop (slightly wider cards) */}
          <div className="grid grid-cols-5 gap-3">
            {groupedItems.Main?.length > 0 && (
              <CategoryList
                categoryName="Main"
                items={groupedItems.Main || []}
                categoryColor={getCategoryTextColor("Main")}
                dietaryIcons={dietaryIcons}
                onEditItem={handleEditItem}
                onDeleteItem={openDeleteModalForItem}
                onToggleReaction={handleToggleReaction}
                canManageItem={canUserManageItem}
                defaultExpanded
              />
            )}
            {groupedItems.Side?.length > 0 && (
              <CategoryList
                categoryName="Side"
                items={groupedItems.Side || []}
                categoryColor={getCategoryTextColor("Side")}
                dietaryIcons={dietaryIcons}
                onEditItem={handleEditItem}
                onDeleteItem={openDeleteModalForItem}
                onToggleReaction={handleToggleReaction}
                canManageItem={canUserManageItem}
                defaultExpanded
              />
            )}
            {groupedItems.Dessert?.length > 0 && (
              <CategoryList
                categoryName="Dessert"
                items={groupedItems.Dessert || []}
                categoryColor={getCategoryTextColor("Dessert")}
                dietaryIcons={dietaryIcons}
                onEditItem={handleEditItem}
                onDeleteItem={openDeleteModalForItem}
                onToggleReaction={handleToggleReaction}
                canManageItem={canUserManageItem}
                defaultExpanded
              />
            )}
            {groupedItems.Beverage?.length > 0 && (
              <CategoryList
                categoryName="Beverage"
                items={groupedItems.Beverage || []}
                categoryColor={getCategoryTextColor("Beverage")}
                dietaryIcons={dietaryIcons}
                onEditItem={handleEditItem}
                onDeleteItem={openDeleteModalForItem}
                onToggleReaction={handleToggleReaction}
                canManageItem={canUserManageItem}
                defaultExpanded
              />
            )}
            {groupedItems.Miscellaneous?.length > 0 && (
              <CategoryList
                categoryName="Miscellaneous"
                items={groupedItems.Miscellaneous || []}
                categoryColor={getCategoryTextColor("Miscellaneous")}
                dietaryIcons={dietaryIcons}
                onEditItem={handleEditItem}
                onDeleteItem={openDeleteModalForItem}
                onToggleReaction={handleToggleReaction}
                canManageItem={canUserManageItem}
                defaultExpanded
              />
            )}
          </div>

          {/* Empty state for desktop */}
          {(!event.items || event.items.length === 0) && (
            <div className="py-12 text-center">
              <div className="mb-4 text-3xl">
                <span
                  className="mx-1 inline-block animate-bounce"
                  style={{ animationDelay: "0s" }}
                >
                  🍗
                </span>
                <span
                  className="mx-1 inline-block animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                >
                  🍛
                </span>
                <span
                  className="mx-1 inline-block animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                >
                  🥧
                </span>
                <span
                  className="mx-1 inline-block animate-bounce"
                  style={{ animationDelay: "0.3s" }}
                >
                  🥗
                </span>
                <span
                  className="mx-1 inline-block animate-bounce"
                  style={{ animationDelay: "0.4s" }}
                >
                  🍷
                </span>
              </div>
              <p className="mb-2 text-lg text-gray-500">No items added yet</p>
              <p className="text-gray-400">
                Click the + button to add your first item!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add item button */}
      <button
        onClick={handleAddItem}
        className="fixed bottom-24 right-4 rounded-full bg-primaryRed p-4 text-white shadow-lg transition-colors hover:bg-secondaryRed md:hidden"
      >
        <FaPlus />
      </button>

      {/* Modals */}
      <JoinEventPromptModal
        isOpen={!!currentUser && !!event && !isMember}
        onCancel={() => navigate("/events")}
        onJoin={handleJoinEvent}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        closeModal={() => setIsDeleteModalOpen(false)}
        onConfirmDelete={
          itemToDelete && itemToDelete.itemName
            ? () => handleDeleteSuggestion(itemToDelete)
            : itemToDelete === event.id
              ? handleDeleteEvent
              : () => handleDeleteItem(itemToDelete)
        }
        deleteItemName={itemToDeleteName}
      />

      <ConfirmDeleteModal
        isOpen={isParticipantConfirmOpen}
        closeModal={() => setIsParticipantConfirmOpen(false)}
        onConfirmDelete={handleConfirmRemoveParticipant}
        deleteItemName={participantToRemoveName}
        title={isSelfRemoval ? "Leave Event" : "Remove Participant"}
        confirmLabel={isSelfRemoval ? "Leave" : "Remove"}
        description={
          isSelfRemoval
            ? "Are you sure you want to leave this event? Any items you are bringing will be removed."
            : `Are you sure you want to remove ${participantToRemoveName} from this event? Any items they are bringing will be removed.`
        }
      />

      {isParticipantModalOpen && (
        <ParticipantsModal
          isOpen={isParticipantModalOpen}
          onClose={handleParticipantsModal}
          memberIds={memberIds}
          items={event?.items || []}
          currentUserId={currentUser?.uid ?? null}
          hostId={event?.hostId || event?.createdById || null}
          canManageEvent={canManageEvent}
          onRemoveParticipant={openParticipantRemovalConfirm}
        />
      )}

      {event && (
        <SuggestionsModal
          isOpen={isSuggestionsModalOpen}
          onClose={handleSuggestionsModal}
          suggestions={event.suggestedItems || []}
          currentUserId={currentUser?.uid ?? null}
          onClaimSuggestion={handleClaimSuggestion}
          onEditSuggestion={handleEditSuggestion}
          onDeleteSuggestion={(suggestion) => {
            setItemToDelete(suggestion);
            setItemToDeleteName(suggestion.itemName);
            setIsDeleteModalOpen(true);
          }}
          memberIds={memberIds}
        />
      )}

      {editingEvent && (
        <EventModal
          closeModal={() => setEditingEvent(false)}
          onSubmit={handleEdit}
          initialData={event}
        />
      )}

      {isItemModalOpen && (
        <ItemSidePanel
          closeModal={() => setIsItemModalOpen(false)}
          onSubmit={handleItemSubmit}
          initialData={editingItem}
          mode={editingItem ? "edit" : "add"}
          formMode={claimingSuggestion ? "claim" : editingItem ? "edit" : "add"}
          memberIds={event?.members || []}
        />
      )}
    </div>
  );
}

export default EventDetails;
