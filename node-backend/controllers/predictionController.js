const Prediction = require('../models/Prediction');
const { requestPrediction } = require('../utils/mlClient');
const { createNotification } = require('../utils/notificationService');

const normalizeLevel = (level, risk) => {
  if (level) {
    return level;
  }

  if (risk < 30) {
    return 'Low';
  }
  if (risk < 60) {
    return 'Moderate';
  }
  return 'High';
};

const createPredictionHandler = (assessmentType, path) => async (req, res, next) => {
  try {
    const mlResult = await requestPrediction(path, req.body);
    const riskPercentage = Number(mlResult.risk);
    const riskLevel = normalizeLevel(mlResult.level, riskPercentage);

    const prediction = await Prediction.create({
      user: req.user._id,
      assessmentType,
      inputPayload: req.body,
      riskPercentage,
      riskLevel,
      recommendation: mlResult.recommendation,
    });

    if (riskLevel === 'High') {
      await createNotification({
        user: req.user._id,
        type: 'prediction',
        title: `${assessmentType.toUpperCase()} risk needs attention`,
        message: 'Your latest assessment indicates a high-risk pattern. Please book a consultation soon.',
        metadata: { predictionId: prediction._id, assessmentType },
      });
    }

    res.status(201).json({
      success: true,
      data: prediction,
    });
  } catch (error) {
    next(error);
  }
};

exports.predictPcos = createPredictionHandler('pcos', '/api/v1/predict/pcos');
exports.predictThyroid = createPredictionHandler('thyroid', '/api/v1/predict/thyroid');

exports.getMyPredictions = async (req, res, next) => {
  try {
    const predictions = await Prediction.listByUser(req.user._id);

    res.status(200).json({
      success: true,
      count: predictions.length,
      data: predictions,
    });
  } catch (error) {
    next(error);
  }
};
