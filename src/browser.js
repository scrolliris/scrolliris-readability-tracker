import Client from './index';

let tracker = ((Client) => {
  return {
    Client: Client
  };
})(Client);

((t) => {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = t;
  }
  if (typeof window !== 'undefined') {
    window.ScrollirisReadabilityTracker = t;
  }
})(tracker);
