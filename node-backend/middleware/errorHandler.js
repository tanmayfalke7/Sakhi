const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
  }

  if (err.code === 11000 || err.code === 'ER_DUP_ENTRY') {
    statusCode = 400;
    const field = err.keyValue ? Object.keys(err.keyValue)[0] : 'value';
    message = `${field} already exists`;
  }

  if (err.name === 'CastError' || err.code === 'ER_TRUNCATED_WRONG_VALUE') {
    statusCode = 400;
    message = 'Invalid ID format';
  }

  if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Invalid JSON body';
  }

  if (statusCode >= 500 && process.env.NODE_ENV !== 'development') {
    message = 'Internal Server Error';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && {
      error: {
        name: err.name,
        code: err.code,
        stack: err.stack,
      },
    }),
  });
};

module.exports = errorHandler;
