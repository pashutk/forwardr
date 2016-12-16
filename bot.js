const config = require('./config');
const TelegramBot = require('node-telegram-bot-api');
const User = require('./user');


function formatInfoMessage(user, data) {
  const header = `Info about *${data.user.name}* account:

_${data.user.likes}_ likes
_${data.user.following}_ following
_${data.user.blogs.length}_ blogs:`;
  
  const blogs = data.user.blogs.map((blog) => `${user.defaultBlog === blog.name ? '_(default blog)_\n' : ''}Blog title: *${blog.title}*
Blog posts: *${blog.posts}*
[Blog url](${blog.url})`);
  
  return `${header}\n\n${blogs.join('\n')}`;
}

async function botMessageHandler(message) {
  const userId = message.chat.id;
  try {
    const user = await User.getUserById(userId);

    const isAuthorized = () => {
      if (!user.isAuthorized) {
        this.sendMessage(userId, `You need to log in your tumblr account. Use /start command.`);
      }

      return user.isAuthorized;
    }

    if (message.text === '/start') {
      this.sendMessage(userId, `One second...`);
      await user.setOAuthRequestToken();
      this.sendMessage(userId, `To authorize follow this link: ${user.signUrl}`);
      return;
    }

    if (message.text === '/info') {
      if (!isAuthorized()) return;

      const infoData = await user.info;
      const response = formatInfoMessage(user, infoData);
      this.sendMarkdown(userId, response);
      return;
    }

    if (message.text === '/rmlast') {
      await user.removeLast();
      this.sendMessage(userId, 'Last post removed.');
      return;
    }

    if (message.text) {
      if (!isAuthorized()) return;

      const newPost = await user.postText(message.text);
      const postLink = await user.getPostLink(newPost.id);
      this.sendMarkdown(userId, `New text post, [post link](${postLink}).`);
      return;
    }
  } catch(err) {
    console.log(err);
    this.sendMessage(userId, `Error: ${err.message}`);
  }
}

async function botPhotoHandler(message) {
  const userId = message.chat.id;
  try {
    const user = await User.getUserById(userId);

    if (!user.isAuthorized) {
      this.sendMessage(userId, `You need to log in your tumblr account. Use /start command.`);
      return;
    }

    const largestPhoto = message.photo.reduce((prev, next) => {
      if (next.width * next.height > prev.width * prev.height) {
        return next;
      }
      
      return prev;
    }, {
      width: 0,
      height: 0,
    });
    const photoLink = await this.getFileLink(largestPhoto.file_id);
    const newPost = await user.postPhoto(photoLink);
    const postLink = await user.getPostLink(newPost.id);
    this.sendMarkdown(userId, `Posted new photo, [post link](${postLink}).`);
  } catch(err) {
    console.log(err);
    this.sendMessage(userId, `Error: ${err.message}`);
  }
}

async function botAudioHandler(message) {
  const userId = message.chat.id;
  try {
    const user = await User.getUserById(userId);
    
    if (!user.isAuthorized) {
      this.sendMessage(userId, `You need to log in your tumblr account. Use /start command.`);
      return;
    }

    const audioLink = await this.getFileLink(message.audio.file_id);
    let trackName = '';
    if (message.audio.performer) {
      trackName += message.audio.performer;
    }

    if (message.audio.title) {
      if (message.audio.performer) {
        trackName += ' - ';
      }
      trackName += message.audio.title;
    }

    const newPost = await user.postAudio(audioLink, trackName);
    const postLink = await user.getPostLink(newPost.id);
    this.sendMarkdown(userId, `Posted new audio, [post link](${postLink}).`);
  } catch(err) {
    console.log(err);
    this.sendMessage(userId, `Error: ${err.message}`);
  }
}

function createBot() {
  const options = { 
    polling: true
  };

  TelegramBot.prototype.sendMarkdown = function(id, text, opt_options) {
    const options = Object.assign({}, opt_options, { parse_mode: 'Markdown' });
    return this.sendMessage(id, text, options);
  };

  const bot = new TelegramBot(config.FORWARDR_TELEGRAM_BOT_TOKEN, options);
  bot.on('message', botMessageHandler);
  bot.on('photo', botPhotoHandler);
  bot.on('audio', botAudioHandler);
  return bot;
}

module.exports = {
  createBot
}
