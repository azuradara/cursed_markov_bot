import { MarkovChain } from '../lib/MarkovChain';
import { SqLiteTrainingModel } from '../lib/models/SqliteTrainingModel';

const samples = [
  'Pattern is a cross-platform desktop and the number of a lightweight jQuery is a way of documents',
  'Applications such a library for Web analytics, ad tracking, personalization or other projects',
  'Chai is an assertion library with first-class functions, making an API that HTML',
  'BEM is a design pattern conceptually based on the result of the client and update the DOM of the page',
  'SpiderMonkey, is a class to ease React Native development environment',
  'Gulp is used by Nitobi',
  'Lodash is a JavaScript developer',
  'Pattern is a pattern that gets called immediately after declaration',
  'Revealing Module Pattern is running, but more responsive',
  'CouchDB is a JavaScript code linter',
];

test('Training the Markov module', async () => {
  expect.assertions(1);

  const store = new SqLiteTrainingModel(':memory:');
  await store.init();

  const markov = new MarkovChain(store);
  samples.map(async (message) => {
    await markov.train('000000000000000001', 'user', message, 2);
  });

  await markov.concoct('user', [], 2);
  const uniq_frag = await store.getLatestUniqFrag();

  expect(uniq_frag).toEqual('000000000000000001');
});
