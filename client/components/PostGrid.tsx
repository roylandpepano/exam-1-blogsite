/**
 * PostGrid component
 * Displays posts in a responsive grid layout
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import { PostCard } from "./PostCard";
import type { Post, Comment } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";

interface PostGridProps {
   posts: Post[];
   isLoading?: boolean;
}

type ViewMode = "all" | "popular" | "recent_posts" | "recent_comments";
type SortMode =
   | "newest"
   | "oldest"
   | "most_comments"
   | "least_comments"
   | "title_asc"
   | "title_desc";

export function PostGrid({ posts, isLoading = false }: PostGridProps) {
   const [view, setView] = useState<ViewMode>("all");
   const [sort, setSort] = useState<SortMode>("newest");
   const [recentComments, setRecentComments] = useState<Comment[] | null>(null);

   useEffect(() => {
      if (view === "recent_comments") {
         let mounted = true;
         api.getRecentComments(20)
            .then((cs) => {
               if (mounted) setRecentComments(cs);
            })
            .catch(() => {
               if (mounted) setRecentComments([]);
            });
         return () => {
            mounted = false;
         };
      }
   }, [view]);

   const filteredAndSorted = useMemo(() => {
      let out = [...posts];

      if (view === "popular") {
         out.sort((a, b) => (b.comment_count ?? 0) - (a.comment_count ?? 0));
         // For "popular" view show only the single most-commented post
         return out.slice(0, 1);
      } else if (view === "recent_posts") {
         out.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
      } else if (view === "recent_comments") {
         if (!recentComments || recentComments.length === 0) return [];
         // map post id to latest comment timestamp
         const latestByPost = new Map<number, string>();
         for (const c of recentComments) {
            const prev = latestByPost.get(c.post_id);
            if (!prev || new Date(c.created_at) > new Date(prev)) {
               latestByPost.set(c.post_id, c.created_at);
            }
         }
         const postIds = new Set(latestByPost.keys());
         out = out.filter((p) => postIds.has(p.id));
         out.sort((a, b) => {
            const ta = latestByPost.get(a.id) ?? "1970-01-01";
            const tb = latestByPost.get(b.id) ?? "1970-01-01";
            return +new Date(tb) - +new Date(ta);
         });
      }

      // Apply sort override
      if (sort === "newest") {
         out.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
      } else if (sort === "oldest") {
         out.sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
      } else if (sort === "most_comments") {
         out.sort((a, b) => (b.comment_count ?? 0) - (a.comment_count ?? 0));
      } else if (sort === "least_comments") {
         out.sort((a, b) => (a.comment_count ?? 0) - (b.comment_count ?? 0));
      } else if (sort === "title_asc") {
         out.sort((a, b) => a.title.localeCompare(b.title));
      } else if (sort === "title_desc") {
         out.sort((a, b) => b.title.localeCompare(a.title));
      }

      return out;
   }, [posts, view, sort, recentComments]);

   if (isLoading) {
      return (
         <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
               <Card key={i} className="h-64 animate-pulse" />
            ))}
         </div>
      );
   }

   if (posts.length === 0) {
      return (
         <Card className="flex min-h-[400px] items-center justify-center">
            <CardContent className="text-center">
               <p className="text-xl text-muted-foreground">No posts found</p>
               <p className="mt-2 text-sm text-muted-foreground">
                  Try adjusting your search or create a new post
               </p>
            </CardContent>
         </Card>
      );
   }

   return (
      <>
         <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
               <label className="text-sm">View:</label>
               <select
                  value={view}
                  onChange={(e) => setView(e.target.value as ViewMode)}
                  className="rounded-md border px-2 py-1 text-sm"
               >
                  <option value="all">All Posts</option>
                  <option value="popular">Most Popular Post</option>
                  <option value="recent_posts">Recent Posts</option>
                  <option value="recent_comments">
                     Posts with Recent Comments
                  </option>
               </select>
            </div>

            <div className="flex items-center gap-2">
               <label className="text-sm">Sort:</label>
               <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortMode)}
                  className="rounded-md border px-2 py-1 text-sm"
               >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="most_comments">Most Comments</option>
                  <option value="least_comments">Least Comments</option>
                  <option value="title_asc">Title A → Z</option>
                  <option value="title_desc">Title Z → A</option>
               </select>
            </div>
         </div>

         <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAndSorted.map((post, index) => (
               <PostCard key={post.id} post={post} index={index} />
            ))}
         </div>
      </>
   );
}
