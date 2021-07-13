import Discord from 'discord.js';
const dotenv = require('dotenv');
import pino from 'pino';

import { MarkovChain } from './lib/MarkovChain';
import { SqLiteTrainingModel } from './lib/models/SqliteTrainingModel';

async function main() {
  dotenv.config();

  const logger = pino();
  const client = new Discord.Client();

  const store = new SqLiteTrainingModel('store.db');
  await store.init();

  const markov = new MarkovChain(store);

  client.once('ready', () => {
    logger.info('Up.');
  });

  client.on('error', () => {
    client.login(process.env.DISCORD_BOT_TOKEN);
  });

  client.on('message', async (message) => {
    if (message.isMentioned(client.user)) {
      const entity = message.mentions.users.find((user) => {
        return user.bot === false;
      });

      if (entity) {
        try {
          const m = await markov.concoct(
            entity.id,
            [],
            Number(process.env.MARKOV_CHAIN_ORDER)
          );
          message.channel.send(m);
        } catch (e) {
          message.channel.send('Not enough cursed material yet.');
          logger.warn(e);
        }
      } else {
        message.channel.send('Invalid mention.');
      }
    } else {
      markov.train(
        message.id,
        message.author.id,
        message.content,
        Number(process.env.MARKOV_CHAIN_ORDER)
      );
    }
  });

  client.login(process.env.DISCORD_BOT_TOKEN);
}

main();
