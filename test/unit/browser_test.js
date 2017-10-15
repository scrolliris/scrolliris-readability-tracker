import test from 'tape';

import tracker from '../../src/browser';
import Client from '../../src/index';


test('tracker is object', (t) => {
  t.equal(typeof tracker === 'object', true, 'should be object');
  t.end();
});

test('tracker has Client property', (t) => {
  t.equal(tracker.Client === Client, true, 'should be Client');
  t.end();
});
