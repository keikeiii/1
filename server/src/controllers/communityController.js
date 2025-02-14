const Post = require('../models/postModel');
const Comment = require('../models/commentModel');

exports.getPosts = async (req, res) => {
    try {
        const posts = await Post.findAll();
        res.json({
            code: 200,
            msg: 'success',
            data: posts
        });
    } catch (error) {
        console.error('获取帖子列表失败:', error);
        res.status(500).json({
            code: 500,
            msg: '获取帖子列表失败'
        });
    }
};

exports.createPost = async (req, res) => {
    try {
        const post = await Post.create({
            ...req.body,
            userId: req.user.id,
            createTime: new Date()
        });
        res.json({
            code: 200,
            msg: 'success',
            data: post
        });
    } catch (error) {
        console.error('创建帖子失败:', error);
        res.status(500).json({
            code: 500,
            msg: '创建帖子失败'
        });
    }
};
// 在 communityController.js 中添加
exports.getPostComments = async (req, res) => {
  try {
    const comments = await Comment.findByPostId(req.params.id);
    res.json({
      code: 200,
      msg: 'success',
      data: comments
    });
  } catch (error) {
    console.error('获取评论失败:', error);
    res.status(500).json({
      code: 500,
      msg: '获取评论失败'
    });
  }
};
exports.likePost = async (req, res) => {
    try {
        const post = await Post.incrementLike(req.params.id, req.body.like_id);
        res.json({
            code: 200,
            msg: 'success',
            data: { likeCount: post.likeCount, like_id: req.body.like_id }
        });
    } catch (error) {
        console.error('点赞失败:', error);
        res.status(500).json({
            code: 500,
            msg: '点赞失败'
        });
    }
};

exports.addComment = async (req, res) => {
    try {
        const comment = await Comment.create({
            ...req.body,
            createTime: new Date()
        });
        await Post.incrementCommentCount(req.params.id);
        res.json({
            code: 200,
            msg: 'success',
            data: comment
        });
    } catch (error) {
        console.error('评论失败:', error);
        res.status(500).json({
            code: 500,
            msg: '评论失败'
        });
    }
};

exports.deletePost = async (req, res) => {
    try {
        await Post.delete(req.params.id);
        res.json({
            code: 200,
            msg: 'success'
        });
    } catch (error) {
        console.error('删除帖子失败:', error);
        res.status(500).json({
            code: 500,
            msg: '删除帖子失败'
        });
    }
}; 