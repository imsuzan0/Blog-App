"use client";

import React, { createContext, ReactNode, useEffect, useState } from "react";
import Cookies from "js-cookie";
import toast, { Toaster } from "react-hot-toast";
import { GoogleOAuthProvider } from "@react-oauth/google";
import axios from "axios";

export const user_service = "http://localhost:5000";
export const author_service = "http://localhost:5001";
export const blog_service = "http://localhost:5002";

export interface User {
  _id: string;
  name: string;
  email: string;
  image?: string;
  instagram: string;
  facebook: string;
  github: string;
  linkedin: string;
  bio: string;
}

export interface Blog {
  id: string;
  title: string;
  description: string;
  blogcontent: string;
  category: string;
  image: string;
  author: string;
  createdAt: string;
}

interface AppProviderProps {
  children: ReactNode;
}

interface AppContextType {
  user: User | null;
  isAuth: boolean;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setIsAuth: React.Dispatch<React.SetStateAction<boolean>>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  logOutUser: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  async function fetchUser() {
    try {
      const token = Cookies.get("token");

      if (!token) {
        setLoading(false);
        return;
      }

      const { data } = await axios.get(`${user_service}/api/v1/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUser(data.user);
      setIsAuth(true);
    } catch (error) {
      console.log("Error fetching user:", error);
      setIsAuth(false);
    } finally {
      setLoading(false);
    }
  }

  async function logOutUser() {
    Cookies.remove("token");
    setIsAuth(false);
    setUser(null);
    toast.success("Logged out successfully");
  }

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        isAuth,
        loading,
        setLoading,
        setIsAuth,
        setUser,
        logOutUser,
      }}
    >
      <GoogleOAuthProvider clientId="683718027551-q6q8klh8mvr34p90hr0u11lt14cv01jg.apps.googleusercontent.com">
        {children}
        <Toaster />
      </GoogleOAuthProvider>
    </AppContext.Provider>
  );
};

export const useAppData = (): AppContextType => {
  const context = React.useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppData must be used within a AppProvider");
  }
  return context;
};
