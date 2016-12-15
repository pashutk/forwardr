const fs = require('fs');

let config = {};

try {
	config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
} catch(err) {};

Object.assign(config, {
  FORWARDR_SERVER_HOST: 'http://localhost',
  FORWARDR_SERVER_PORT: 8000,
  FORWARDR_TUMBLR_AUTH_URL: 'https://www.tumblr.com/oauth/authorize',
  FORWARDR_TUMBLR_REQUEST_TOKEN_URL: 'https://www.tumblr.com/oauth/request_token',
  FORWARDR_TUMBLR_ACCESS_TOKEN_URL: 'https://www.tumblr.com/oauth/access_token',
  FORWARDR_TUMBLR_OAUTH_VERSION: '1.0A',
  FORWARDR_TUMBLR_SIGNATURE_METHOD: 'HMAC-SHA1',
}, process.env);

module.exports = config;