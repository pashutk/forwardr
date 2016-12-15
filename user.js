const config = require('./config');
const Store = require('nedb');
const tumblr = require('tumblr.js');
const tumblrOAuth = require('./oauth');

let store = null;

module.exports = class User {
  constructor(data) {
    if (!data.id) {
      throw new Error('User without id');
    }

    this.id = data.id + '';
    this.token = data.token || '';
    this.secret = data.secret || '';
    this.isAuthorized = data.isAuthorized || false;
    this.oAuthRequestToken = data.oAuthRequestToken || '';
    this.oAuthRequestSecret = data.oAuthRequestSecret || '';
    this.oAuthToken = data.oAuthToken || '';
    this.oAuthSecret = data.oAuthSecret || '';
    this.defaultBlog = data.defaultBlog || '';
  }

  serialize() {
    return {
      id: this.id,
      token: this.token,
      secret: this.secret,
      isAuthorized: this.isAuthorized,
      oAuthRequestToken: this.oAuthRequestToken,
      oAuthRequestSecret: this.oAuthRequestSecret,
      oAuthToken: this.oAuthToken,
      oAuthSecret: this.oAuthSecret,
      defaultBlog: this.defaultBlog,
    }
  }

  async update() {
    try {
      return await new Promise((resolve, reject) => {
        const query = {
          id: this.id
        }

        store.update(query, this.serialize(), { upsert: true }, (err, numAffected, affectedDocuments, upsert) => {
          if (err) {
            reject(err);
            return;
          }

          resolve(null);
        });
      });
    } catch(err) {
      console.log('Update error');
      console.log(err);
    }
  }

  /**
   * @param {string} token
   * @param {string} secret
   * @return {Promise}
   */
  async setOAuthData(token, secret) {
    this.isAuthorized = true;
    this.oAuthToken = token;
    this.oAuthSecret = secret;
    return await this.update();
  }

  async getOAuthRequestToken() {
    const options = {
      oauth_callback: `${config.FORWARDR_SERVER_AUTH_HOST}/callback?id=${this.id}`,
    };

    return await new Promise((resolve, reject) => {
      tumblrOAuth.getOAuthRequestToken(options, (err, token, secret, results) => {
        if (err) {
          reject(err);
          return;
        }

        resolve({ token, secret });
      });
    });
  }

  async setOAuthRequestToken() {
    const oAuthRequestData = await this.getOAuthRequestToken();
    this.oAuthRequestToken = oAuthRequestData.token;
    this.oAuthRequestSecret = oAuthRequestData.secret;
    return await this.update();
  }

  async getOAuthAccessToken() {
    return await new Promise((resolve, reject) => {
      tumblrOAuth.getOAuthAccessToken(
          this.oAuthToken,
          this.oAuthRequestSecret,
          this.oAuthSecret,
          (err, token, secret) => {
            if (err) {
              console.error('\tValidation failed with error', err);
              reject(err);
              return;
            }

            resolve({ token, secret });
          }
      );
    });
  }

  async setOAuthAccessToken() {
    const credentials = await this.getOAuthAccessToken();
    this.token = credentials.token;
    this.secret = credentials.secret;
    return await this.update();
  }

  get tumblrClient() {
    return tumblr.createClient({
      credentials: {
        consumer_key: config.FORWARDR_TUMBLR_CONSUMER_KEY,
        consumer_secret: config.FORWARDR_TUMBLR_CONSUMER_SECRET,
        token: this.token,
        token_secret: this.secret,
      },
      returnPromises: true,
    })
  }

  get signUrl() {
    return tumblrOAuth.signUrl(config.FORWARDR_TUMBLR_AUTH_URL, this.oAuthRequestToken, this.oAuthRequestSecret);
  }

  /** @return {Promise} */
  get info() {
    return this.tumblrClient.userInfo();
  }

  /** @return {Promise} */
  get blogPosts() {
    return this.tumblrClient.blogPosts(this.defaultBlog);
  }

  async getPostLink(id) {
    const filteredData = await this.tumblrClient.blogPosts(this.defaultBlog, { id });
    if (!filteredData.posts.length) {
      return;
    }

    return filteredData.posts[0].post_url;
  }

  async setDefaultBlog() {
    // TODO: support multiple blogs
    const info = await this.info;

    if (info.user.blogs.length === 0) {
      return;
    }

    this.defaultBlog = info.user.blogs[0].name;
    return await this.update();
  }

  /**
   * @param {string} text
   * @return {Promise}
   */
  async postText(text) {
    return await this.tumblrClient.createTextPost(this.defaultBlog, {
      body: text
    });
  }

  /**
   * @param {string} link
   * @return {Promise}
   */
  async postPhoto(link) {
    return await this.tumblrClient.createPhotoPost(this.defaultBlog, {
      source: link
    });
  }

  async removeLast() {
    const data = await this.blogPosts;
    const posts = data.posts;
    if (posts.length === 0) {
      throw new Error('No posts');
    }

    return await this.tumblrClient.deletePost(this.defaultBlog, posts[0].id);
  }

  /**
   * @param {number|string} id
   * @return {User}
   */
  static createNew(id) {
    return new User({
      id,
      token: '',
      secret: '',
      isAuthorized: false,
      oAuthRequestToken: '',
      oAuthRequestSecret: '',
      oAuthToken: '',
      oAuthSecret: '',
    });
  }

  /**
   * @param {number|string} id
   * @return {User}
   */
  static async getUserById(id) {
    if (typeof id === 'number') {
      id += '';
    }

    return await new Promise((resolve, reject) => {
      if (!store) {
        reject('No store');
        return;
      }

      const query = { id };
      store.findOne(query, function (err, doc) {
        if (err) {
          reject(err);
          return;
        }

        if (doc) {
          resolve(new User(doc));
        } else {
          resolve(User.createNew(id));
        }
      });
    });
  }

  /** @return {Promise} */
  static async initStore() {
    return await new Promise((resolve, reject) => {
      const options = {
        filename: 'db'
      }
      store = new Store(options);
      store.loadDatabase(function(err) {
        if (err) {
          reject(err);
          return;
        }

        console.log('Store inited');
        resolve(null);
      });
    });
  }
}
