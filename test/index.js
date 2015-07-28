var Child = require('./child');
var Wreck = require('wreck');
var Path = require('path');

var path = Path.resolve(__dirname, '../');

var child = new Child(path);

['stdout', 'stderr'].forEach(function (io) { child[io].pipe(process[io]); });

child.on('message', function (msg) {
  if (msg.evt === 'listening') {
    setImmediate(function () {
      var seconds = 0;
      var url = 'http://127.0.0.1:' + msg.address.port;
      var reqUrl = url + '/timeout';
      var reqOpts = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      };

      primeShutdown(url, function () {
        var complete, reqs, jobs, cb, current;
        complete = 0;
        reqs = 6;

        jobs = reqs;
        cb = killChildProc.bind(this, child);

        while (jobs--) {
          current = reqs - jobs;
          console.log('Sending req #' + current + '...');

          reqOpts.payload = 'seconds=' + seconds++;

          Wreck.request('POST', reqUrl, reqOpts, function (err, res) {
            if (res.statusCode !== 200) { err = new Error('non-200'); }
            if (!err) {
              Wreck.read(res, null, function (err, content) {
                if (!err) {
                  console.log('response received: %s', content);
                }
              });
            }
            done(err);
          })
        }

        function done(err) {
          if (++complete===reqs/2) {
            Wreck.request('POST', reqUrl, reqOpts, function (err, res) {
              if (err) {
                console.log('New request refused! %s', err);
              };
            });
            cb();
          } 
          if (err) {
            cb(err);
          }
        }
      });
    });
  }
});

function primeShutdown(url, done) {
  console.log('priming shutdown middleware with a request ...');
  Wreck.get(url, done);
}

function killChildProc(child) {
  console.log('sending SIGINT to child ...');
  child.proc.kill('SIGINT');
}
