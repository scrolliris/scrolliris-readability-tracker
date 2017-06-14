import Client from './index';


let ScrollirisReadabilityTracker = {
  Client: Client
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ScrollirisReadabilityTracker;
}
window.ScrollirisReadabilityTracker = ScrollirisReadabilityTracker;
