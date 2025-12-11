/**
 * Home Page - Blog Posts List
 * Displays all blog posts with search and pagination
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { PostGrid } from "@/components/PostGrid";
import { SearchBar } from "@/components/SearchBar";
import { Pagination } from "@/components/Pagination";
import { api } from "@/lib/api";
import type { Post, PaginatedResponse } from "@/lib/types";

export default function Home() {
   const [posts, setPosts] = useState<Post[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [currentPage, setCurrentPage] = useState(1);
   const [totalPages, setTotalPages] = useState(1);
   const [searchQuery, setSearchQuery] = useState("");

   const fetchPosts = useCallback(async () => {
      setIsLoading(true);
      try {
         const response: PaginatedResponse<Post> = await api.getPosts({
            page: currentPage,
            per_page: 9,
            search: searchQuery,
         });
         setPosts(response.data);
         setTotalPages(response.total_pages);
      } catch (err) {
         toast.error("Failed to load posts. Please try again later.");
         console.error("Error fetching posts:", err);
      } finally {
         setIsLoading(false);
      }
   }, [currentPage, searchQuery]);

   useEffect(() => {
      fetchPosts();
   }, [fetchPosts]);

   const handleSearch = useCallback((query: string) => {
      setSearchQuery(query);
      setCurrentPage(1);
   }, []);

   const handlePageChange = (page: number) => {
      const newPage = Math.max(1, Math.min(page, totalPages));
      if (newPage === currentPage) return;
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
   };

   return (
      <div className="container mx-auto px-4 py-8">
         {/* Header / Hero */}
         <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center hero"
         >
            {/* Decorative animated background - purely visual */}
            <div className="hero__bg" aria-hidden="true">
               <div className="blob b1" />
               <div className="blob b2" />
               <div className="blob b3" />
            </div>

            <header className="hero-content" role="banner">
               <h1 className="mb-4 text-4xl font-bold">Explore Stories</h1>
               <p className="text-muted-foreground">
                  Discover amazing blog posts from our community
               </p>
               <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 }}
                  className="mt-6 mx-auto max-w-xl"
               >
                  <SearchBar onSearch={handleSearch} />
               </motion.div>
            </header>
         </motion.div>

         {/* Posts Grid */}
         <PostGrid posts={posts} isLoading={isLoading} />

         {/* Pagination */}
         {!isLoading && posts.length > 0 && (
            <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 0.2 }}
               className="mt-8"
            >
               <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
               />
            </motion.div>
         )}
      </div>
   );
}
