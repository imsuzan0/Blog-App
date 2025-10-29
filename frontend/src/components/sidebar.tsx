"use client";

import { BoxSelect } from "lucide-react";
import { Input } from "./ui/input";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./ui/sidebar";
import { blogCategories } from "@/app/blog/new/page";
import { useAppData } from "@/context/AppContext";

const SideBar = () => {
  const { searchQuery, setSearchQuery, category,setCategory } = useAppData();
  return (
    <Sidebar>
      <SidebarHeader className=" text-2xl font-bold mt-5">
        The Reading Retreat
      </SidebarHeader>
      <SidebarContent className="bg-white">
        <SidebarGroup>
          <SidebarGroupLabel>Search</SidebarGroupLabel>
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Your Desired Blogs"
          />
          <SidebarGroupLabel>Categories</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={()=>setCategory("")}>
                <BoxSelect />
                <span>All</span>
              </SidebarMenuButton>
              {blogCategories.map((cat, index) => {
                return (
                  <SidebarMenuButton key={index} onClick={()=>setCategory(cat)}>
                    <BoxSelect />
                    <span>{cat}</span>
                  </SidebarMenuButton>
                );
              })}
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default SideBar;
