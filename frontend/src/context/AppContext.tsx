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
  blogs: Blog[] | null;
  blogLoading: boolean;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  searchQuery: string;
  category: string;
  setCategory: React.Dispatch<React.SetStateAction<string>>;
  fetchBlogs:()=>Promise<void>;
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

      const { data }: any = await axios.get(`${user_service}/api/v1/me`, {
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

  const [blogLoading, setBlogLoading] = useState(true);
  const [blogs, setBlogs] = useState<Blog[] | null>(null);

  const [category, setCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  async function fetchBlogs() {
    setBlogLoading(true);
    try {
      const { data }: any = await axios.get(
        `${blog_service}/api/v1/blog/all?searchQuery=${searchQuery}&category=${category}`
      );
      if (Array.isArray(data)) {
        setBlogs(data);
        console.log("Fetched blogs:", data);
      } else if (data.blogs && Array.isArray(data.blogs)) {
        setBlogs(data.blogs);
        console.log("Fetched blogs:", data.blogs);
      } else {
        setBlogs([]);
        console.log("No blogs found");
      }
      console.log("All Blog", data.blogs);
      console.log("Fetched blogs:", data.blogs);
    } catch (error) {
      console.log("Error fetching blog:", error);
    } finally {
      setBlogLoading(false);
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

  useEffect(() => {
    fetchBlogs();
  }, [category, searchQuery]);

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
        blogs,
        blogLoading,
        setSearchQuery,
        searchQuery,
        category,
        setCategory,
        fetchBlogs,
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
