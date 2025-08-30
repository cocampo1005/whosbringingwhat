import React, { useMemo } from "react"
import { useUser } from "../contexts/UsersContext"

export default function AssigneeAvatar({ assigneeId, displayName, size=24, className = "", showName = true}) {
  const { user } = useUser(assigneeId);
  const name = user?.name || displayName || "";
  const initials = useMemo(() => {
    const splitName = name.trim().split(/\s+/);
    const a = splitName[0]?.[0] || "";
    const b = splitName[splitName.length - 1]?.[0] || "";
    return (a + b).toUpperCase() || "?";
  }, [name]);

  if (user?.avatar) {
    return (
      <>
        <img 
          src={user.avatar}
          alt={`${name || "User"} avatar`}
          className={`rounded-full object-cover ${className}`}
          style={{ width: size, height: size }}
        />
        {showName && <span className={`${className}`}>{user.name}</span>}
      </>
    )
  }

  return (
    <>
      <div
        className={`flex items-center justify-center rounded-full bg-primaryRed text-white text-[10px] font-medium ${className}`}
        style={{ width: size, height: size }}
        title={name}
      >
        {initials}
      </div>
      {showName && <span className={`${className}`}>{name || "Unassigned"}</span>}
    </>
  )
}