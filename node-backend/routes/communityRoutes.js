const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  listPosts,
  createPost,
  toggleLike,
  deletePost,
} = require('../controllers/communityController');

const router = express.Router();

router.get('/posts', listPosts);
router.post('/posts', protect, createPost);
router.patch('/posts/:id/like', protect, toggleLike);
router.delete('/posts/:id', protect, deletePost);

module.exports = router;
