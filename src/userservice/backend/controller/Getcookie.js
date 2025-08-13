exports.getCookie = async (req, res) => {
  const cookieName = req.body.name; // name sent from frontend
  const cookieValue = req.cookies[cookieName]; // dynamic access
  if (!cookieValue) return res.status(204).json({ error: "Cookie not found" });
  return res.status(200).json({ cookie: cookieValue });
};
