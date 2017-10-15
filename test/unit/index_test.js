import test from 'tape';

import Client from '../../src/index';


test('The constructor of the Client', (t) => {
  t.equal(typeof Client === 'function', true, 'should be function');
  t.end();
});
