exports.getCookie = async (req, res) => {
  const cookieName = req.body.name; // name sent from frontend
  const cookieValue = req.cookies[cookieName]; // dynamic access
if (!cookieValue) return res.sendStatus(204);;
  return res.status(200).json({ cookie: cookieValue });
};
