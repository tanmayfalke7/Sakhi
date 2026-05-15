const express = require('express');

const router = express.Router();

const CHAT_SERVICE_URL = (process.env.CHAT_SERVICE_URL || process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

router.post('/', async (req, res, next) => {
  try {
    const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const upstream = await fetch(`${CHAT_SERVICE_URL}/api/v1/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        symptoms: Array.isArray(req.body.symptoms) ? req.body.symptoms : undefined,
        history: Array.isArray(req.body.history) ? req.body.history : undefined,
        conversation_id: req.body.conversation_id,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const data = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        success: false,
        message: data.message || data.detail || 'Chat service is temporarily unavailable',
      });
    }

    return res.status(200).json({
      success: true,
      response: typeof data.response === 'string' ? data.response : '',
      metadata: data.metadata || {},
      suggested_actions: Array.isArray(data.suggested_actions) ? data.suggested_actions : [],
      graph_data: Array.isArray(data.graph_data) ? data.graph_data : [],
      image_url: data.image_url || null,
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      return res.status(504).json({
        success: false,
        message: 'Chat service timed out. Please try again.',
      });
    }
    next(error);
  }
});

module.exports = router;
