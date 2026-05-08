const ML_SERVICE_URL = (process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

const requestPrediction = async (path, payload) => {
  const response = await fetch(`${ML_SERVICE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'ML service request failed');
  }

  return data;
};

module.exports = {
  requestPrediction,
};
