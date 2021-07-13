import Discord from 'discord.js';
import { MessageRecord } from '../interfaces/MessageRecord';

export const fetchMessages = async (
  message: Discord.Message
): Promise<MessageRecord[]> => {
  let cache: MessageRecord[] = [];
  let keepOn = true;
  let oldestMessageId: string | undefined;

  while (keepOn) {
    const messageCollection: Discord.Collection<string, Discord.Message> =
      await message.channel.messages.fetch({
        before: oldestMessageId,
        limit: 5,
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

    cache = cache.concat(filteredMessages);

    const lastMessage = messageCollection.last();
    if (!lastMessage || messageCollection.size < 5) {
      keepOn = false;
    } else {
      oldestMessageId = lastMessage.id;
    }
  }

  console.log(`Trained on curses from ${cache.length} messages.`);
  message.reply(`Done. ${cache.length} entries.`);

  return cache;
};
