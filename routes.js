module.exports = function routes(router) {
  router.post('/timeout', function (req, res) {
    var seconds = req.body.seconds || 10;
    setTimeout(function () {
      res.status(200).send({seconds: seconds});
    }, seconds * 1000);
  });
};
