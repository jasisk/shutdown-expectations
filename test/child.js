var child_process = require('child_process');
var transform = require('stream').Transform;
var events = require('events');
var assert = require('assert');
var chalk = require('chalk');
var util = require('util');

function prefixWith() {
  var stream = new transform();
  var str = util.format.apply(util, arguments);

  stream._transform = function (chunk, encoding, done) {
    chunk = util.format('%s %s', str, chunk).toString(encoding);
    this.push(chunk);
  };

  return stream;
}

function prefix(pid) {
  var identifier = util.format('%s %s', chalk.yellow('CHILD'), chalk.cyan(pid));

  return function (verb /*, args ... */) {
    var pre = util.format('%s %s', identifier, verb);
    var msg = util.format.apply(util, Array.prototype.slice.call(arguments, 1));

    return util.format('%s: %s', pre, msg);
  }
}

function Child(path) {
  var stdio;
  assert(path, 'Child requires a path');

  this.proc = child_process.fork(path, {silent: true});
  this.proc.on('message', this.emit.bind(this, 'message'));

  this.prefix = prefix(this.proc.pid);

  this.stdout = this.proc.stdout.pipe(prefixWith(this.prefix(chalk.green('STDOUT'))));
  this.stderr = this.proc.stderr.pipe(prefixWith(this.prefix(chalk.red('STDERR'))));

  events.EventEmitter.call(this);
  this.on('message', function (msg) {
    this.log('"%s" event captured', msg.evt);
  });
}

util.inherits(Child, events.EventEmitter);

Child.prototype.log = function () {
  var args = Array.prototype.slice.apply(arguments);
  var str = this.prefix.apply(this, [chalk.bold.blue('LOG')].concat(args));
  console.log(str);
};

module.exports = Child;
