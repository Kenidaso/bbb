const Bot = require('node-telegram-bot-api');
const _ = require('lodash');
const async = require('async');

const RedisService = require('../services/RedisService');

let TOKEN = process.env.TELEGRAM_TOKEN; //cky_tele_bot
let NODE_ENV = process.env.NODE_ENV || 'development';
let NGROK_TUNNEL = process.env.NGROK_TUNNEL;
let APP_URL = process.env.APP_URL || 'https://<app-name>.herokuapp.com:443';
let PORT = process.env.PORT;
const options = {
  webHook: {
    port: PORT
  }
};

let group_chatbot = '-333271843';
let group_monitor_worker = '-373758728';
let user_chickyky = '749655058';

let bot = new Bot(TOKEN);
let urlWebhook = process.env.URL_TELEGRAM_WEBHOOK;

if (NODE_ENV === 'production') {
	// nothing
} else {
  // urlWebhook = `${NGROK_TUNNEL}/tele/webhook/cky-tele-bot`; // setting here
}

bot.setWebHook(urlWebhook);

console.log ('environment: %s all set at webhook %s', NODE_ENV, urlWebhook);
console.log('telegram-bot server started...');

bot.GROUP_CHATBOT = group_chatbot;

// Matches "/echo [whatever]"
bot.onText(/\/echo (.+)/, (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message

  const chatId = msg.chat.id;
  const resp = match[1]; // the captured "whatever"

  // send back the matched "whatever" to the chat
  bot.sendMessage(chatId, resp, { reply_to_message_id: msg.message_id });
});

// /redis_set <key> <value>
bot.onText(/^\/redis_set/, (msg, match) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  let split = text.split(' ');

  if (split.length != 3) return bot.sendMessage(chatId, `please use format "/redis_set <key> <value>"`, { reply_to_message_id: msg.message_id });

  let key = split[1];
  let value = split[2];

  RedisService.set(key, value, 60 * 60 * 2, () => {
    return bot.sendMessage(chatId, `set redis success`, { reply_to_message_id: msg.message_id });
  });
});

bot.onText(/^\/redis_get/, (msg, match) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  let split = text.split(' ');

  if (split.length != 2) return bot.sendMessage(chatId, `please use format "/redis_get <key>"`, { reply_to_message_id: msg.message_id });

  let key = split[1];

  RedisService.get(key, (err, value) => {
    if (value && value.length >= 100) {
      let _chunks = _.chunk(value, 100);
      return async.eachLimit(_chunks, 1, (chunk, cb) => {
        bot.sendMessage(chatId, chunk.join(''), { reply_to_message_id: msg.message_id });
        return cb(null);
      }, (err, result) => {
        console.log('send chunk done');
      });
    }

    return bot.sendMessage(chatId, `value= ${value}`, { reply_to_message_id: msg.message_id });
  });
});


/*
{
  message_id: 27,
  from: {
    id: 749655058,
    is_bot: false,
    first_name: 'Chickyky',
    last_name: 'Lee',
    username: 'Chickyky',
    language_code: 'en'
  },
  chat: {
    id: -333271843,
    title: 'Chat Bot Group',
    type: 'group',
    all_members_are_administrators: true
  },
  date: 1564558196,
  text: '/echo abc',
  entities: [{
    offset: 0,
    length: 5,
    type: 'bot_command'
  }]
}
*/
bot.on('message', (msg) => {
	// console.log('on message: ', msg);
});

bot.on('webhook_error', (error) => {
  console.error('webhook_error error=', error);  // => 'EPARSE'
});

module.exports = bot;