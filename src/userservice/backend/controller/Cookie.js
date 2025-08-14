const isProduction = process.env.NODE_ENV === "production";
exports.getCookie = async (req, res) => {
  const cookieName = req.body.name;
  const cookieValue = req.cookies[cookieName];
  if (!cookieValue) return res.sendStatus(204);
  return res.status(200).json({ cookie: cookieValue });
};

exports.deleteCookie = async (req, res) => {
  const cookieName = req.body.name;
  const cookieValue = req.cookies[cookieName];
  if (!cookieValue) return res.sendStatus(204);
  res.clearCookie(cookieName, {
    path: "/",
    domain: isProduction ? ".weefly.africa" : undefined,
    secure: true,
    httpOnly: true,
    sameSite: "None",
  });
  return res.status(200).send("Deleted");
};
