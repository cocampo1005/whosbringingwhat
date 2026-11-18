import { useNavigate, getRouteApi, Link } from "@tanstack/react-router";
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
import {
  LuChevronLeft,
  LuClock,
  LuLightbulb,
  LuLogOut,
  LuMapPin,
  LuPencil,
  LuPlus,
  LuTrash2,
  LuUsers,
} from "react-icons/lu";
import { GiChickenOven } from "react-icons/gi";
import { FaBowlFood } from "react-icons/fa6";
import { GiCakeSlice } from "react-icons/gi";
import { FaWineGlassAlt } from "react-icons/fa";
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
import { Button, IconButton } from "../components/ui";
import {
  CATEGORY_ORDER,
  CATEGORY_THEME,
  eventBannerPastel,
} from "../constants/categoryTheme";

// This route hangs off the pathless "home" layout route (see homeRoute's explicit id: "home"
// in router.jsx), so its composed route id is "/home/events/$eventId", not "/events/$eventId".
const eventDetailsRouteApi = getRouteApi("/home/events/$eventId");

// Short captions for the category strip (display only).
const STRIP_CAPTIONS = {
  Main: "MAINS",
  Side: "SIDES",
  Dessert: "DESSERTS",
  Beverage: "BEVERAGES",
  Miscellaneous: "MISC",
};

function EventDetails() {
  const { eventId } = eventDetailsRouteApi.useParams();
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
        color: CATEGORY_THEME.Main.pastel,
        textColor: "text-red-600",
        icon: GiChickenOven,
      },
      {
        name: "Side",
        count: counts.Side,
        color: CATEGORY_THEME.Side.pastel,
        textColor: "text-yellow-500",
        icon: FaBowlFood,
      },
      {
        name: "Dessert",
        count: counts.Dessert,
        color: CATEGORY_THEME.Dessert.pastel,
        textColor: "text-purple-600",
        icon: GiCakeSlice,
      },
      {
        name: "Beverage",
        count: counts.Beverage,
        color: CATEGORY_THEME.Beverage.pastel,
        textColor: "text-blue-600",
        icon: FaWineGlassAlt,
      },
      {
        name: "Miscellaneous",
        count: counts.Miscellaneous,
        color: CATEGORY_THEME.Miscellaneous.pastel,
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
      navigate({ to: "/events" });
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

  // Presentational values derived from data the page already holds.
  const hasImage = !!event.imageUrl;
  const totalItems = event.items?.length ?? 0;
  const openSuggestionsCount = (event.suggestedItems || []).filter(
    (s) => s && !s.claimed,
  ).length;
  const heroText = hasImage ? "text-white" : "text-ink";
  const stripCategories = CATEGORY_ORDER.filter(
    (name) => categoryCounts[name] > 0,
  );

  const actionButtons = (
    <>
          <Button
            variant="neutral"
            onClick={handleParticipantsModal}
            leftIcon={<LuUsers aria-hidden="true" className="text-base" />}
          >
            Participants
          </Button>
          <Button
            variant="outline"
            onClick={handleSuggestionsModal}
            aria-label="View suggestions"
            leftIcon={<LuLightbulb aria-hidden="true" className="text-base" />}
          >
            Suggestions
            {openSuggestionsCount > 0 && (
              <span
                aria-hidden="true"
                className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-selected px-1 text-[11px] font-bold text-white"
              >
                {openSuggestionsCount}
              </span>
            )}
          </Button>
          <ShareButton eventId={eventId} eventTitle={event.title} />
          {canManageEvent && (
            <>
              <IconButton
                aria-label="Edit event"
                title="Edit event"
                onClick={() => setEditingEvent(true)}
              >
                <LuPencil aria-hidden="true" className="text-base" />
              </IconButton>
              <IconButton
                variant="danger"
                aria-label="Delete event"
                title="Delete event"
                onClick={openDeleteModalForEvent}
              >
                <LuTrash2 aria-hidden="true" className="text-base" />
              </IconButton>
            </>
          )}
          {showSelfRemoveButton && currentUser && (
            <IconButton
              aria-label="Leave event"
              title="Leave event"
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
            >
              <LuLogOut aria-hidden="true" className="text-base" />
            </IconButton>
          )}
    </>
  );

  return (
    <div className="relative mb-10">
      {/* Back link (desktop: text link) */}
      <Link
        to="/events"
        className="mb-3 hidden items-center gap-1 text-sm text-muted hover:text-ink md:inline-flex"
      >
        <LuChevronLeft aria-hidden="true" className="text-base" />
        <span>Events</span>
      </Link>

      <div className="relative">
        {/* Back link (phone: round button over the hero) */}
        <Link
          to="/events"
          aria-label="Back to Events"
          className="absolute left-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-raised text-ink shadow-chip hover:bg-surface2 md:hidden"
        >
          <LuChevronLeft aria-hidden="true" className="text-lg" />
        </Link>

        {/* Hero: event image under a dark scrim, or a pastel block */}
        <div
          className={`relative isolate min-h-[24rem] overflow-hidden rounded-card lg:min-h-[22rem] ${heroText}`}
          style={
            hasImage ? undefined : { backgroundColor: eventBannerPastel(event) }
          }
        >
          {hasImage && (
            <>
              <img
                src={event.imageUrl}
                alt={event.title || "Event image"}
                className="absolute inset-0 -z-10 h-full w-full object-cover"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 -z-10"
                style={{
                  background:
                    "linear-gradient(to top, rgba(22,22,22,0.86), rgba(22,22,22,0.12))",
                }}
              />
            </>
          )}

          <div className="flex min-h-[24rem] flex-col justify-end gap-3 p-5 pt-16 md:p-8 md:pt-16 lg:min-h-[22rem] lg:pb-8 lg:pr-[18rem] lg:pt-8">
            {event.date && (
              <div>
                <span className="inline-flex rounded-full bg-raised px-3 py-1 font-display text-[11px] font-bold uppercase tracking-wider text-ink shadow-chip">
                  {formatDisplayDate(event.date)}
                </span>
              </div>
            )}
            <h1 className="break-words font-display text-3xl md:text-4xl lg:text-5xl font-extrabold uppercase leading-[1.02] [font-stretch:125%]">
              {event.title}
            </h1>
            {(event.time || event.location) && (
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm font-semibold">
                {event.time && (
                  <span className="inline-flex items-center gap-1.5">
                    <LuClock aria-hidden="true" className="shrink-0" />
                    {formatTime(event.time)}
                  </span>
                )}
                {event.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <LuMapPin aria-hidden="true" className="shrink-0" />
                    {event.location}
                  </span>
                )}
              </div>
            )}
            {event.description && (
              <p className="max-w-xl text-[0.9375rem] leading-relaxed">
                {event.description}
              </p>
            )}
            <div className="mt-6 hidden flex-wrap items-center gap-2 lg:flex">
              {actionButtons}
            </div>
          </div>
        </div>

        {/* Action rail: under the hero on phone/tablet (inside the hero's text column from lg) */}
        <div className="mt-3 flex flex-wrap items-center gap-2 lg:hidden">
          {actionButtons}
        </div>

        {/* Distribution wheel: right side of the hero on desktop, under the rail on phone */}
        <section
          aria-labelledby="event-distribution-heading"
          className="mt-6 flex justify-center lg:absolute lg:right-8 lg:top-1/2 lg:mt-0 lg:-translate-y-1/2"
        >
          <h2 id="event-distribution-heading" className="sr-only">
            Item Distribution ({totalItems})
          </h2>
          {pieData.length > 0 ? (
            <div className="rounded-full lg:bg-white/75 lg:p-3 lg:shadow-soft">
              <PieChart
                data={pieData}
                size={220}
                animate
                duration={700}
                delayStep={140}
                variant="donut"
                centerLabel="ITEMS"
              />
            </div>
          ) : (
            <p className="rounded-full bg-raised px-4 py-2 text-sm text-muted shadow-chip">
              No items added yet
            </p>
          )}
        </section>
      </div>

      {/* Items header: label, proportional category strip, add button */}
      <div className="mt-8 hidden items-center gap-x-6 gap-y-3 md:flex">
        <div className="flex shrink-0 items-baseline gap-2">
          <span className="font-display text-sm font-extrabold uppercase tracking-wider text-ink">
            ITEMS
          </span>
          <span className="text-sm text-muted">{totalItems}</span>
        </div>
        <div className="flex min-w-0 flex-1 gap-1.5" aria-hidden="true">
          {stripCategories.map((name) => {
            const theme = CATEGORY_THEME[name];
            return (
              <div
                key={name}
                className="min-w-[3.5rem]"
                style={{ flex: `${categoryCounts[name]} 1 0%` }}
              >
                <div
                  className="flex h-6 items-center rounded-full px-1"
                  style={{ backgroundColor: theme.bar }}
                >
                  <img src={theme.icon} alt="" className="h-4 w-4" />
                </div>
                <p className="mt-1 whitespace-nowrap font-display text-[11px] font-bold uppercase tracking-wider text-muted">
                  {STRIP_CAPTIONS[name]}{" "}
                  <span className="font-semibold">{categoryCounts[name]}</span>
                </p>
              </div>
            );
          })}
        </div>
        <Button
          onClick={handleAddItem}
          size="lg"
          className="shrink-0"
          leftIcon={<LuPlus aria-hidden="true" className="text-lg" />}
        >
          Add / Suggest Item
        </Button>
      </div>

      {/* Categories: stacked collapsible sections on phone, columns from md */}
      <div className="mt-6 grid grid-cols-1 items-start gap-3 md:mt-5 md:grid-cols-3 lg:grid-cols-5">
        {CATEGORY_ORDER.map(
          (name) =>
            groupedItems[name]?.length > 0 && (
              <CategoryList
                key={name}
                categoryName={name}
                items={groupedItems[name] || []}
                categoryColor={getCategoryTextColor(name)}
                dietaryIcons={dietaryIcons}
                onEditItem={handleEditItem}
                onDeleteItem={openDeleteModalForItem}
                onToggleReaction={handleToggleReaction}
                canManageItem={canUserManageItem}
                defaultExpanded
              />
            ),
        )}
      </div>

      {/* Empty state */}
      {(!event.items || event.items.length === 0) && (
        <div className="py-12 text-center">
          <div className="mb-4 text-3xl">
            {["🍗", "🍛", "🥧", "🥗", "🍷"].map((emoji, i) => (
              <span
                key={emoji}
                className="mx-1 inline-block animate-bounce"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {emoji}
              </span>
            ))}
          </div>
          <p className="mb-4 text-lg text-muted">No items added yet</p>
          <p className="text-muted">Click the + button to add your first item!</p>
        </div>
      )}

      {/* Add item button (phone: sits in the slot reserved beside the nav pill) */}
      <button
        type="button"
        onClick={handleAddItem}
        aria-label="Add / Suggest Item"
        className="fixed bottom-4 left-4 z-30 flex h-[54px] w-[54px] items-center justify-center rounded-full bg-accent text-white shadow-action ring-4 ring-white transition-colors hover:bg-accent-hover md:hidden"
      >
        <LuPlus aria-hidden="true" className="text-2xl" />
      </button>

      {/* Modals */}
      <JoinEventPromptModal
        isOpen={!!currentUser && !!event && !isMember}
        onCancel={() => navigate({ to: "/events" })}
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
