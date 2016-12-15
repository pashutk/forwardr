const config = require('./config');
const http = require('http');
const url = require('url');

function requestHandler(req, res) {
  const parsedUrl = url.parse(req.url, true);
  if (req.method === 'GET' &&
      parsedUrl.pathname === '/callback' &&
      parsedUrl.query.oauth_token &&
      parsedUrl.query.oauth_verifier &&
      parsedUrl.query.id) {
    this.emit(
        'auth',
        parsedUrl.query.id,
        parsedUrl.query.oauth_token,
        parsedUrl.query.oauth_verifier
    );
    res.end('You can close this page now. Forwardr will submit your authorization soon.');
    return;
  }
  res.end('Something going wrong. Contact me – @pashutk in Telegram.');
}

const createServer = async () => await new Promise((resolve, reject) => {
  const server = http.createServer(requestHandler);
  server.listen(config.FORWARDR_SERVER_PORT, function() {
    console.log(`Server listen on ${config.FORWARDR_SERVER_PORT}`);
    resolve(server);
  });
});

module.exports = {
  createServer
}
