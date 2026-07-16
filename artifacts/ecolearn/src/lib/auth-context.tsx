import { createContext, useContext, ReactNode, useState } from "react";
import { User } from "@workspace/api-client-react";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

interface AuthContextType {
  user: User | null | undefined;
  isLoading: boolean;
  logoutUser: () => void;
  loginUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { data: user, isLoading, isError } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  });
  const [sessionUser, setSessionUser] = useState<User | null | undefined>(undefined);

  const currentUser = sessionUser === undefined ? (isError ? null : user) : sessionUser;

  const logoutUser = () => {
    setSessionUser(null);
    queryClient.clear();
  };

  const loginUser = (loggedInUser: User) => {
    setSessionUser(loggedInUser);
    queryClient.setQueryData(getGetMeQueryKey(), loggedInUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user: currentUser,
        isLoading,
        logoutUser,
        loginUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
