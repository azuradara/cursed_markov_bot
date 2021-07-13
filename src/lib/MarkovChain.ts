import _, { uniq } from 'lodash';
import natural from 'natural';
import weighted from 'weighted';
import { TrainingModel } from './interfaces/TrainingModel.js';

export class MarkovChain {
  private tk = new natural.RegexpTokenizer({ pattern: /\s/ });
  private gr = natural.NGrams;

  constructor(private readonly model: TrainingModel) {}

  public train(
    uniq_frag: string,
    entity: string,
    message: string,
    order: number
  ): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const grams = this.gr.ngrams(this.tk.tokenize(message), order);

      if (grams.length === 1) {
        try {
          await this.model.upsertLimit(entity, grams[0], uniq_frag, true, true);
        } catch (e) {
          return reject(e);
        }
      } else {
        grams.map(async (gram, idx) => {
          try {
            switch (idx) {
              case 0:
                await this.model.upsertLimit(
                  entity,
                  gram,
                  uniq_frag,
                  true,
                  false
                );
                break;

              case grams.length - 1:
                await this.model.upsertLimit(
                  entity,
                  gram,
                  uniq_frag,
                  false,
                  true
                );
                break;

              default:
                await this.model.upsertLimit(
                  entity,
                  gram,
                  uniq_frag,
                  false,
                  false
                );
                break;
            }
          } catch (e) {
            return reject(e);
          }
        });
      }
    });
  }

  public agnosticConcoct(chain: string[], order: number): Promise<string> {
    return new Promise(async (resolve, reject) => {
      if (_.isEmpty(chain)) {
        try {
          const start_frags = await this.model.getEntityAgnosticStartFrags();
          const sample = _.sample(start_frags);

          if (sample) {
            try {
              return resolve(
                await this.agnosticConcoct(
                  sample.sequence.concat(sample.token),
                  order
                )
              );
            } catch (e) {
              return reject(e);
            }
          } else {
            return reject(new Error('No starter fragments found.'));
          }
        } catch (e) {
          return reject(e);
        }
      }

      try {
        const appendices = await this.model.getEntityAgnosticNextFrags(
          chain.slice(1 - order)
        );

        if (_.isEmpty(appendices)) {
          return reject(new Error('No sequences to append.'));
        } else {
          // idk
          const weights = appendices.map((limit) => {
            return limit.count;
          });

          const appendix = weighted.select(appendices, weights);

          if (appendix.is_end) {
            return resolve(chain.concat(appendix.token).join(' '));
          } else {
            try {
              return resolve(
                await this.agnosticConcoct(chain.concat(appendix.token), order)
              );
            } catch (e) {
              return resolve(e);
            }
          }
        }
      } catch (e) {
        return reject(e);
      }
    });
  }

  public concoct(
    entity: string,
    chain: string[],
    order: number
  ): Promise<string> {
    return new Promise(async (resolve, reject) => {
      if (_.isEmpty(chain)) {
        try {
          const start_frags = await this.model.getStartFrags(entity);
          const sample = _.sample(start_frags);

          if (sample) {
            try {
              return resolve(
                await this.concoct(
                  entity,
                  sample.sequence.concat(sample.token),
                  order
                )
              );
            } catch (e) {
              return reject(e);
            }
          } else {
            return reject(new Error('No starter fragments found.'));
          }
        } catch (e) {
          return reject(e);
        }
      }

      try {
        const appendices = await this.model.getNextFrags(
          entity,
          chain.slice(1 - order)
        );

        if (_.isEmpty(appendices)) {
          return reject(new Error('No sequences to append.'));
        } else {
          // idk
          const weights = appendices.map((limit) => {
            return limit.count;
          });

          const appendix = weighted.select(appendices, weights);

          if (appendix.is_end) {
            return resolve(chain.concat(appendix.token).join(' '));
          } else {
            try {
              return resolve(
                await this.concoct(entity, chain.concat(appendix.token), order)
              );
            } catch (e) {
              return resolve(e);
            }
          }
        }
      } catch (e) {
        return reject(e);
      }
    });
  }
}
