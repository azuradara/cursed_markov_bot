import _ from 'lodash';
import { TrainingModel, Limit } from '../interfaces/TrainingModel.js';

export class MemoryTrainingModel implements TrainingModel {
  private limits: Limit[] = [];
  private latest_uniq_frag: string = '000000000000000000';

  public getLatestUniqFrag(): Promise<string> {
    return new Promise((resolve, reject) => {
      return resolve(this.latest_uniq_frag);
    });
  }

  public upsertLimit(
    entity: string,
    gram: string[],
    uniq_frag: string,
    is_start: false,
    is_end: true
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const order = gram.length;
      const idx = this.limits.findIndex((limit) => {
        return (
          limit.entity === entity &&
          _.isEqual(limit.sequence, gram.slice(0, order - 1)) &&
          limit.token === gram[order - 1] &&
          limit.is_start === is_start &&
          limit.is_end === is_end
        );
      });

      if (idx === -1) {
        this.limits.push({
          count: 1,
          entity: entity,
          is_end: is_end,
          is_start: is_start,
          sequence: gram.slice(0, order - 1),
          token: gram[order - 1],
        });
      } else {
        this.limits[idx].count++;
      }

      this.latest_uniq_frag = uniq_frag;
      return resolve;
    });
  }
  public getStartFrags(entity: string): Promise<Limit[]> {
    return new Promise((resolve) => {
      const start_frags = this.limits.filter((limit) => {
        return (
          limit.is_start === true &&
          limit.is_end === false &&
          limit.entity === entity
        );
      });

      return resolve(start_frags);
    });
  }

  public getNextFrags(entity: string, sequence: string[]): Promise<Limit[]> {
    return new Promise((resolve) => {
      const appendices = this.limits.filter((limit) => {
        return _.isEqual(limit.sequence, sequence) && limit.entity === entity;
      });

      return resolve(appendices);
    });
  }
}
