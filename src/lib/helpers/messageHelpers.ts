import Discord from 'discord.js';
import { MessageRecord } from '../interfaces/MessageRecord';
import dotenv from 'dotenv';
import { MarkovChain } from '../MarkovChain.js';
import { SqLiteTrainingModel } from '../models/SqliteTrainingModel.js';

dotenv.config();

export const fetchMessages = async (
  message: Discord.Message
): Promise<number> => {
  const store = new SqLiteTrainingModel('store.db');
  await store.init();

  const markov = new MarkovChain(store);
  let cache: number = 0;
  let keepOn = true;
  let oldestMessageId: string | undefined;

  while (keepOn) {
    const messageCollection: Discord.Collection<string, Discord.Message> =
      await message.channel.messages.fetch({
        before: oldestMessageId,
        limit: 100,
      });

    const filteredMessages = messageCollection
      .filter((msg) => !msg.author.bot)
      .map((msg) => {
        const msgObj: MessageRecord = {
          id: msg.id,
          authorId: msg.author.id,
          content: msg.content,
        };
        return msgObj;
      });

    filteredMessages.forEach((msg) => {
      markov.train(
        msg.id,
        msg.authorId,
        msg.content,
        Number(process.env.MARKOV_CHAIN_ORDER)
      );
    });

    cache += filteredMessages.length;

    const lastMessage = messageCollection.last();
    // console.log(messageCollection.size);
    console.log('cached', cache, 'messages..');
    if (!lastMessage || messageCollection.size < 100) {
      keepOn = false;
    } else {
      oldestMessageId = lastMessage.id;
    }
  }

  console.log(`Trained on curses from ${cache} messages.`);
  message.reply(`Done. ${cache} entries.`);

  return cache;
};
