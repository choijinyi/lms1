"use client";

import { useCurrentUserContext } from "../context/current-user-context";

export const useCurrentUser = () => {
  const context = useCurrentUserContext();
  
  return {
    ...context,
    role: context.user?.userMetadata?.role as 'learner' | 'instructor' | 'operator' | undefined,
  };
};
