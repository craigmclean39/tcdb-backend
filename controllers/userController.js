exports.user = function (req, res, next) {
  console.log(req.user);
  console.log(req.isAuthenticated());
  res.end();
};
