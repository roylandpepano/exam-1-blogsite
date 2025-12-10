/**
 * API client for Blogsite backend
 * Handles all HTTP requests to Flask server
 */

import type {
   Post,
   Comment,
   PaginatedResponse,
   CreatePostInput,
   UpdatePostInput,
   CreateCommentInput,
   UpdateCommentInput,
   ApiError,
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

class ApiClient {
   private baseURL: string;

   constructor(baseURL: string) {
      this.baseURL = baseURL;
   }

   private async request<T>(
      endpoint: string,
      options?: RequestInit
   ): Promise<T> {
      const url = `${this.baseURL}${endpoint}`;

      try {
         const response = await fetch(url, {
            headers: {
               "Content-Type": "application/json",
               ...options?.headers,
            },
            ...options,
         });

         if (!response.ok) {
            const error: ApiError = await response.json().catch(() => ({
               error: "An error occurred",
               status: response.status,
            }));
            throw new Error(error.error || `HTTP Error: ${response.status}`);
         }

         return response.json();
      } catch (error) {
         console.error("API Request failed:", error);
         throw error;
      }
   }

   // ==================== POSTS API ====================

   /**
    * Get all posts with pagination and optional search
    */
   async getPosts(params?: {
      page?: number;
      per_page?: number;
      search?: string;
   }): Promise<PaginatedResponse<Post>> {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set("page", params.page.toString());
      if (params?.per_page)
         searchParams.set("per_page", params.per_page.toString());
      if (params?.search) searchParams.set("search", params.search);

      const query = searchParams.toString();
      const resp = await this.request<{
         success: boolean;
         data: Post[];
         pagination: {
            page: number;
            per_page: number;
            total: number;
            pages: number;
            has_next: boolean;
            has_prev: boolean;
         };
      }>(`/api/posts${query ? `?${query}` : ""}`);

      return {
         data: resp.data,
         total: resp.pagination.total,
         page: resp.pagination.page,
         per_page: resp.pagination.per_page,
         total_pages: resp.pagination.pages,
      } as PaginatedResponse<Post>;
   }

   /**
    * Get a single post by ID
    */
   async getPost(id: number): Promise<Post> {
      const resp = await this.request<{ success: boolean; data: Post }>(
         `/api/posts/${id}`
      );
      return resp.data;
   }

   /**
    * Create a new post
    */
   async createPost(data: CreatePostInput): Promise<Post> {
      const resp = await this.request<{
         success: boolean;
         message: string;
         data: Post;
      }>("/api/posts", {
         method: "POST",
         body: JSON.stringify(data),
      });
      return resp.data;
   }

   /**
    * Update an existing post
    */
   async updatePost(id: number, data: UpdatePostInput): Promise<Post> {
      const resp = await this.request<{
         success: boolean;
         message: string;
         data: Post;
      }>(`/api/posts/${id}`, {
         method: "PUT",
         body: JSON.stringify(data),
      });
      return resp.data;
   }

   /**
    * Delete a post
    */
   async deletePost(id: number): Promise<{ message: string }> {
      const resp = await this.request<{ success: boolean; message: string }>(
         `/api/posts/${id}`,
         {
            method: "DELETE",
         }
      );
      return { message: resp.message } as { message: string };
   }

   // ==================== COMMENTS API ====================

   /**
    * Get all comments for a post
    */
   async getComments(postId: number): Promise<Comment[]> {
      const response = await this.request<{
         success: boolean;
         data: Comment[];
         pagination: number;
      }>(`/api/comments/post/${postId}`);
      return response.data;
   }

   /**
    * Get recent comments (cached)
    */
   async getRecentComments(limit: number = 10): Promise<Comment[]> {
      // The backend exposes `/api/comments` which returns comments ordered
      // by `created_at` desc. Use `per_page` to limit the number returned.
      const resp = await this.request<{
         success: boolean;
         data: Comment[];
         pagination: {
            page: number;
            per_page: number;
            total: number;
            pages: number;
            has_next: boolean;
            has_prev: boolean;
         };
      }>(`/api/comments?per_page=${limit}`);
      return resp.data;
   }

   /**
    * Create a new comment
    */
   async createComment(
      postId: number,
      data: CreateCommentInput
   ): Promise<Comment> {
      const response = await this.request<{
         success: boolean;
         message: string;
         data: Comment;
      }>(`/api/comments`, {
         method: "POST",
         body: JSON.stringify({
            post_id: postId,
            ...data,
         }),
      });
      return response.data;
   }

   /**
    * Update a comment
    */
   async updateComment(
      commentId: number,
      data: UpdateCommentInput
   ): Promise<Comment> {
      return this.request<Comment>(`/api/comments/${commentId}`, {
         method: "PUT",
         body: JSON.stringify(data),
      });
   }

   /**
    * Delete a comment
    */
   async deleteComment(commentId: number): Promise<{ message: string }> {
      return this.request<{ message: string }>(`/api/comments/${commentId}`, {
         method: "DELETE",
      });
   }
}

// Export singleton instance
export const api = new ApiClient(API_BASE_URL);
