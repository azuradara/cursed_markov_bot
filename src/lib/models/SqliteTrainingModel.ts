import sqlite3 from 'sqlite3';
import { Limit, TrainingModel } from '../interfaces/TrainingModel';

export class SqLiteTrainingModel implements TrainingModel {
  private readonly db: sqlite3.Database;

  constructor(db_path: string) {
    this.db = new sqlite3.Database(db_path);
  }

  public init(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.exec(
        `
        CREATE TABLE IF NOT EXISTS llimit (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          count INTEGER NOT NULL,
          is_start INTEGER NOT NULL,
          is_end INTEGER NOT NULL,
          entity TEXT NOT NULL,
          sequence TEXT NOT NULL,
          token TEXT NOT NULL,

          CONSTRAINT llimit UNIQUE (is_end, entity, sequence, is_start, token)
        );
      `,
        (err) => {
          if (err) return reject(err);

          this.db.exec(
            `CREATE TABLE IF NOT EXISTS latest_uniq_frag (
              uniq_frag TEXT NOT NULL
            );`,
            (err) => {
              if (err) return reject(err);

              this.db.exec(
                `INSERT INTO latest_uniq_frag VALUES(
                 '000000000000000000'  
                );
              `,
                (err) => {
                  if (err) return reject(err);
                  else return resolve();
                }
              );
            }
          );
        }
      );
    });
  }
  /** Don't mind the nesting hell */

  public getLatestUniqFrag(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.db.get(`SELECT uniq_frag FROM latest_uniq_frag`, (err, row) => {
        if (err) return reject(err);
        else return resolve(row.uniq_frag);
      });
    });
  }

  public upsertLimit(
    entity: string,
    grams: string[],
    uniq_frag: string,
    is_start: boolean,
    is_end: boolean
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const order = grams.length;

      this.db.run(
        `
        INSERT INTO llimit (count, is_end, entity, sequence, is_start, token)
        VALUES(1, ?, ?, ?, ?, ?)
        ON CONFLICT(is_end, entity, sequence, is_start, token)
        DO UPDATE SET count = count + 1;
      `,
        [
          is_end,
          entity,
          JSON.stringify(grams.slice(0, order - 1)),
          is_start,
          grams[order - 1],
        ],
        (err) => {
          if (err) return reject(err);

          this.db.run(
            `UPDATE latest_uniq_frag SET uniq_frag = ?;`,
            uniq_frag,
            (err) => {
              if (err) return reject(err);
              else return resolve();
            }
          );
        }
      );
    });
  }

  public getStartFrags(entity: string): Promise<Limit[]> {
    return new Promise((resolve, reject) => {
      const start_frags: Limit[] = [];

      this.db.each(
        `
        SELECT * FROM llimit WHERE
        is_start = 1 AND
        is_end = 0 AND
        entity= ?
      `,
        entity,
        (err, row) => {
          if (err) return reject(err);

          start_frags.push({
            count: row.count,
            entity: row.entity,
            sequence: JSON.parse(row.sequence),
            is_start: row.is_starter ? true : false,
            is_end: row.is_ender ? true : false,
            token: row.token,
          });
        },
        (err) => {
          if (err) return reject(err);
          else return resolve(start_frags);
        }
      );
    });
  }

  public getNextFrags(entity: string, sequence: string[]): Promise<Limit[]> {
    return new Promise((resolve, reject) => {
      const appendices: Limit[] = [];

      this.db.each(
        `
        SELECT * FROM llimit WHERE
        sequence = ? AND
        entity = ?
      `,
        [JSON.stringify(sequence), entity],
        (err, row) => {
          if (err) return reject(err);

          appendices.push({
            count: row.count,
            entity: row.entity,
            sequence: JSON.parse(row.sequence),
            is_start: row.is_starter ? true : false,
            is_end: row.is_ender ? true : false,
            token: row.token,
          });
        },
        (err) => {
          if (err) return reject(err);
          else return resolve(appendices);
        }
      );
    });
  }
}
