const createServer = require('./server').createServer;
const createBot = require('./bot').createBot;
const User = require('./user');

function getWelcomeMessage(user) {
  let string = `Now you can use Forwardr.\n`;
  if (user.defaultBlog) {
    string += `Default blog now is *${user.defaultBlog}*.\n`;
    string += `Just send me any message and I will post it to your Tumblr blog.`;
  } else {
    string += `You don't have blogs. Blog specific methods are unavailable.`;
  }

  string += '\n';
  return string;
}

async function authHandler(id, token, secret) {
  const user = await User.getUserById(id);
  await user.setOAuthData(token, secret);
  await user.setOAuthAccessToken();
  await user.setDefaultBlog();
  this.sendMarkdown(id, getWelcomeMessage(user));
}

async function main() {
  await User.initStore();
  const server = await createServer();
  const bot = createBot();

  server.on('auth', authHandler.bind(bot));
}

main();
