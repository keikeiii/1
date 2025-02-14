import { defineStore } from 'pinia';
import { ref } from 'vue';
import request from '@/utils/request';
import type { ApiResponse } from '@/types';

export interface PostComment {
    id: number;
    postId: number;
    parentId?: number;
    content: string;
    userId: number;
    userName: string;
    createTime: string;
    replyUserId?: number;
    replyUserName?: string;
    replies?: PostComment[];
}
export interface Post {
  id: number;
  title: string;
  content: string;
  userId: string;  // Changed to string to match localStorage
  userName: string;
  userAvatar: string;
  createTime: string;
  likeCount: number;
  commentCount: number;
  images?: string[];
  commentList: PostComment[];
  likedUsers: number[];
}

export const useCommunityStore = defineStore('community', () => {
    const posts = ref<Post[]>([]);

    // 清除帖子列表
    const clearPosts = () => {
        posts.value = [];
    };

    const getRawData = (responseData: any) => {
      posts.value = responseData.map((post: any) => ({
        ...post,
        likeCount: post.like_count,
        commentCount: post.comment_count,
        commentList: post.comment_list || [],
        likedUsers: JSON.parse(post.liked_users || '[]'),
        createTime: post.create_time,
        userId: post.user_id,
        userName: post.user_name,
        userAvatar: post.user_avatar,
        images: JSON.parse(post.images || '[]')
      }));
  };
 
  // 获取帖子列表
    const getPosts = async () => {
      try {
        const response = await request.get<ApiResponse<Post[]>>('/community/posts');
        if (response.code === 200) {
          getRawData(response.data[0])
        }
      } catch (error) {
        console.error('获取帖子列表失败:', error);
        throw error;
      }
    };

  // 添加新帖子
  const addPost = async (postData: { title: string; content: string; images?: string[] }) => {
    try {
      const response = await request.post<ApiResponse<Post>>('/community/posts', {
        ...postData,
        userId: localStorage.getItem('user_id'),
        userName: localStorage.getItem('vuems_name'),
        userAvatar: localStorage.getItem('vuems_avatar')
      });
      if (response.code === 200) {
        posts.value.unshift(response.data);
        return response.data;
      }
    } catch (error) {
      console.error('发布帖子失败:', error);
      throw error;
    }
  }
    // 点赞/取消点赞
    const toggleLike = async (postId: number, like_id: number) => {
        try {
          const response = await request.post<ApiResponse<{ likeCount: number }>>(`/community/posts/${postId}/like`, {
              like_id: like_id,
            });
            if (response.code === 200) {
                const post = posts.value.find(p => p.id === postId);
                if (post) {
                    post.likeCount = response.data.likeCount;
                }
            }
        } catch (error) {
            console.error('点赞操作失败:', error);
            throw error;
        }
    };
  // 添加评论
  const addComment = async (postId: number, data: {
    content: string;
    parentId?: number;
    postId: number;
    userId: number;
    userName: string;
    }) => {
        try {
            const response = await request.post<ApiResponse<PostComment>>(`/community/posts/${postId}/comments`, {
                ...data,
            });
          console.log("response", response);
            if (response.code === 200) {
              const post = posts.value.find(p => p.id === postId);
              console.log("post.commentList", post)
                if (post) {
                    // 如果存在 parentId，说明这是一条回复评论
                    if (data.parentId) {
                      // 在帖子的评论列表中找到父评论
                        console.log("post.commentList", post.commentList)
                        const parentComment = post.commentList.find(c => c.id === data.parentId);
                        if (parentComment) {
                            // 确保父评论有 replies 数组来存储回复
                            if (!parentComment.replies) parentComment.replies = [];
                            // 将新的回复添加到父评论的回复列表中
                            parentComment.replies.push(response.data);
                        }
                    } else {
                        // 如果没有 parentId，说明这是一条主评论
                        // 直接添加到帖子的评论列表中
                        post.commentList.push(response.data);
                    }
                    // 增加帖子的评论总数
                    post.commentCount++;
                }
                return response.data;
            }
        } catch (error) {
            console.error('发表评论失败:', error);
            throw error;
        }
    };

    // 删除帖子
    const deletePost = async (postId: number) => {
        try {
            const response = await request.delete<ApiResponse<void>>(`/community/posts/${postId}`);
            if (response.code === 200) {
                const index = posts.value.findIndex(p => p.id === postId);
                if (index !== -1) {
                    posts.value.splice(index, 1);
                }
            }
        } catch (error) {
            console.error('删除帖子失败:', error);
            throw error;
        }
    };
  // 评价数据处理
  const getRawData2 = (postId: number, responseData: any) => {
    // id: number;
    // postId: number;
    // parentId ?: number;
    // content: string;
    // userId: number;
    // userName: string;
    // createTime: string;
    // replyUserId ?: number;
    // replyUserName ?: string;
    // replies ?: PostComment[]; 
    const index = posts.value.findIndex(p => p.id === postId);
    if (index !== -1) {
      // First create a map of all comments
      const commentMap = new Map();
      const topLevelComments: any[] = [];

      // First pass - create all comment objects and store in map
      responseData.forEach((comment: any) => {
        const formattedComment = {
          ...comment,
          postId: comment.post_id,
          parentId: comment.parent_id,
          createTime: comment.create_time,
          userId: comment.user_id,
          userName: comment.user_name,
          replyUserId: comment.reply_user_id,
          replyUserName: comment.reply_uer_name,
          replies: []
        };
        commentMap.set(comment.id, formattedComment);
      });

      // Second pass - organize replies
      responseData.forEach((comment: any) => {
        if (comment.parent_id) {
          // This is a reply - add it to parent's replies
          const parentComment = commentMap.get(comment.parent_id);
          if (parentComment) {
            parentComment.replies.push(commentMap.get(comment.id));
          }
        } else {
          // This is a top level comment
          topLevelComments.push(commentMap.get(comment.id));
        }
      });

      posts.value[index].commentList = topLevelComments;
    }
  }

    // 获取帖子评论
    const getPostComments = async (postId: number) => {
        try {
            const response = await request.get<ApiResponse<PostComment[]>>(`/community/posts/${postId}/comments`);
            if (response.code === 200) {
                const post = posts.value.find(p => p.id === postId);
                if (post) {
                  getRawData2(postId, response.data[0])
                }
                return response.data[0];
            }
        } catch (error) {
            console.error('获取评论失败:', error);
            throw error;
        }
    };

    return {
        posts,
        clearPosts,
        getPosts,
        addPost,
        toggleLike,
        addComment,
        deletePost,
        getPostComments
    } 
}); 