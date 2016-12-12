const fs = require('fs');

let config = {};

try {
	config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
} catch(err) {};

Object.assign(config, process.env);

module.exports = config;