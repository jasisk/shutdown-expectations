var kraken = require('kraken-js');
var express = require('express');

var EVENTS = ['start', 'shutdown', 'stop'];
var app = express();

app.use(kraken());

app.on('start', function () {
  app.listen(0).once('listening', function () {
    console.log('listening on %s ...', this.address().port || this.address());
    if (process.send) {
      process.send({
        evt: 'listening',
        address: this.address()
      });
    }
  });
});

if (process.send) {
  EVENTS.forEach(function (evt) {
    app.on(evt, function () { process.send({evt: evt}); });
  });
}
