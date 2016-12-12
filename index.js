const config = require('./config');
const OAuth = require('oauth');
const TelegramBot = require('node-telegram-bot-api');

const errorLogger = (err) => console.error(err);

const TUMBLR_REQUEST_TOKEN_URL = 'https://www.tumblr.com/oauth/request_token';
const TUMBLR_AUTH_URL = 'https://www.tumblr.com/oauth/authorize';
const TUMBLR_ACCESS_TOKEN_URL = 'https://www.tumblr.com/oauth/access_token';
const TUMBLR_OAUTH_VERSION = '1.0A';
const TUMBLR_SIGNATURE_METHOD = 'HMAC-SHA1';

const tumblrOAuth = new OAuth.OAuth(
  TUMBLR_REQUEST_TOKEN_URL,
  TUMBLR_ACCESS_TOKEN_URL,
  config.NODE_TUMBLR_CONSUMER_KEY,
  config.NODE_TUMBLR_CONSUMER_SECRET,
  TUMBLR_OAUTH_VERSION,
  null,
  TUMBLR_SIGNATURE_METHOD
);

botMessageHandler = function(message) {
  console.log(message);
  console.log('\n');
  if (message.text === '/start') {
    getSignLink(tumblrOAuth).then(function(link) {
      this.sendMessage(message.chat.id, `To authorize follow this link: ${link}`);
    }.bind(this), errorLogger)
  }
}

const bot = new TelegramBot(config.NODE_TELEGRAM_BOT_TOKEN, { polling: true });
bot.on('message', botMessageHandler);

const getSignLink = (oauth) => new Promise((resolve, reject) => {
  oauth.getOAuthRequestToken(function(err, token, secret, results) {
    if (err) {
      reject(err);
      return;
    }

    const signUrl = oauth.signUrl(TUMBLR_AUTH_URL, token, secret);
    resolve(signUrl);
  });
});

