import Discord from 'discord.js';
import dotenv from 'dotenv';
import pino from 'pino';

import { fetchMessages } from './lib/helpers/messageHelpers.js';
import { MarkovChain } from './lib/MarkovChain.js';
import { SqLiteTrainingModel } from './lib/models/SqliteTrainingModel.js';

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
    if (message.author.bot) return;

    if (message.content === '$train') {
      message.channel.send('Starting training..');
      const messages = await fetchMessages(message);

      messages.forEach((msg) => {
        markov.train(
          msg.id,
          msg.authorId,
          msg.content,
          Number(process.env.MARKOV_CHAIN_ORDER)
        );
      });
    }

    if (message.content.startsWith('$')) {
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
        try {
          const m = await markov.agnosticConcoct(
            [],
            Number(process.env.MARKOV_CHAIN_ORDER)
          );
          message.channel.send(m);
        } catch (e) {
          message.channel.send('# idk what happened bro just try again');
          logger.warn(e);
        }
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
