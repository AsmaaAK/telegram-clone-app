function errorHandler(err, req, res, next) {
      const status = err.status || 500;
      const code = err.code || 'INTERNAL_ERROR';
      const message = err.message || 'Something went wrong';
      if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.error(err);
      }
      res.status(status).json({ message, code });
}

function notFound(req, res, next) {
      res.status(404).json({ message: 'Not Found', code: 'NOT_FOUND' });
}

module.exports = { errorHandler, notFound };


