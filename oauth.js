const config = require('./config');
const OAuth = require('oauth');


module.exports = new OAuth.OAuth(
  config.FORWARDR_TUMBLR_REQUEST_TOKEN_URL,
  config.FORWARDR_TUMBLR_ACCESS_TOKEN_URL,
  config.FORWARDR_TUMBLR_CONSUMER_KEY,
  config.FORWARDR_TUMBLR_CONSUMER_SECRET,
  config.FORWARDR_TUMBLR_OAUTH_VERSION,
  null,
  config.FORWARDR_TUMBLR_SIGNATURE_METHOD
);
