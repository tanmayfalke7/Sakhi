const CommunityPost = require('../models/CommunityPost');

exports.listPosts = async (req, res, next) => {
  try {
    const posts = await CommunityPost.listActive();

    res.status(200).json({
      success: true,
      count: posts.length,
      data: posts,
    });
  } catch (error) {
    next(error);
  }
};

exports.createPost = async (req, res, next) => {
  try {
    const { content, imageUrl } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Post content is required',
      });
    }

    const post = await CommunityPost.create({
      author: req.user._id,
      content: content.trim(),
      imageUrl: imageUrl?.trim() || '',
    });

    res.status(201).json({
      success: true,
      data: post,
    });
  } catch (error) {
    next(error);
  }
};

exports.toggleLike = async (req, res, next) => {
  try {
    const post = await CommunityPost.findById(req.params.id);

    if (!post || post.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    const populated = await CommunityPost.toggleLike(req.params.id, req.user._id);

    res.status(200).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

exports.deletePost = async (req, res, next) => {
  try {
    const post = await CommunityPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    const isOwner = post.author.toString() === req.user._id.toString();
    const isDoctor = req.user.role === 'doctor';

    if (!isOwner && !isDoctor) {
      return res.status(403).json({
        success: false,
        message: 'You are not allowed to remove this post',
      });
    }

    if (isDoctor && !isOwner) {
      await CommunityPost.moderate(req.params.id, {
        reason: req.body.reason?.trim() || 'Removed by doctor moderation',
        moderatedBy: req.user._id,
      });
    } else {
      await CommunityPost.remove(req.params.id);
    }

    res.status(200).json({
      success: true,
      message: 'Post removed successfully',
    });
  } catch (error) {
    next(error);
  }
};
