import test from 'tape';

import tracker from '../../src/browser';
import Client from '../../src/index';


test('typeof tracker', (t) => {
  t.equal(typeof tracker === 'object', true, 'should be object');
  t.end();
});

test('Client property', (t) => {
  t.equal(tracker.Client === Client, true, 'should be Client');
  t.end();
});
