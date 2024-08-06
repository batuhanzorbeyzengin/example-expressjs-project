const handleRequest = (fn) => async (req, res) => {
    try {
      const result = await fn(req, res);
      res.status(200).json(result);
    } catch (error) {
      console.error(error);
      res.status(error.status || 400).json({ error: error.message });
    }
  };
  
  module.exports = handleRequest;