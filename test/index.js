var fs = require('fs');
var path = require('path');
var t = require('tap');
var TOML = require('@iarna/toml');

var Smb2 = require('../');

function pFinally(promise, fn) {
  return promise.then(fn, fn).then(function() {
    return promise;
  });
}

var dir = 'smb2-tests-' + Date.now();
var data = Buffer.from(
  Array.from({ length: 1024 }, function() {
    return Math.round(Math.random() * 255);
  })
);

function mkdir(client) {
  return client.mkdir(dir);
}

function writeFile(client) {
  return client.writeFile(dir + '\\file.txt', data);
}

function readFile(client) {
  return client.readFile(dir + '\\file.txt').then(function(result) {
    t.same(result, data);
  });
}

function unlink(client) {
  return client.unlink(dir + '\\file.txt');
}
function rmdir(client) {
  return client.rmdir(dir);
}

function main() {
  var options = TOML.parse(
    fs.readFileSync(path.join(__dirname, 'config.toml'))
  );
  options.autoCloseTimeout = 0;
  var client = new Smb2(options);

  return pFinally(
    [mkdir, writeFile, readFile, unlink, rmdir].reduce(function(prev, fn) {
      return prev.then(function(result) {
        return t.test(fn.name, function() {
          return fn(client, result);
        });
      });
    }, Promise.resolve()),
    function() {
      return client.disconnect();
    }
  );
}
main().catch(t.threw);
