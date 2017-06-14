import test from 'tape';

import Client from '../../lib/index';


test('The constructor of the Client', (t) => {
  t.equal(typeof Client === 'function', true, 'should be function');
  t.end();
});
