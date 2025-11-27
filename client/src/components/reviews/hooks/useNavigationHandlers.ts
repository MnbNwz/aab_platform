import { useCallback } from "react";
import type { User } from "../../../types";

interface UseNavigationHandlersProps {
  onOpenProfileModal: (user: User) => void;
}

export function useNavigationHandlers({
  onOpenProfileModal,
}: UseNavigationHandlersProps) {
  const handleProfileClick = useCallback(
    (user: User) => {
      onOpenProfileModal(user);
    },
    [onOpenProfileModal]
  );

  return { handleProfileClick };
}

