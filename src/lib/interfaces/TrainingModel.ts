export interface TrainingModel {
  getLatestUniqFrag(): Promise<string>;
  getStartFrags(entity: string): Promise<Limit[]>;
  getNextFrags(entity: string, sequence: string[]): Promise<Limit[]>;

  upsertLimit(
    entity: string,
    grams: string[],
    uniq_frag: string,
    start_frag: boolean,
    end_frag: boolean
  ): Promise<void>;
}

export interface Limit {
  count: number;

  readonly entity: string;
  readonly is_end: boolean;
  readonly is_start: boolean;
  readonly sequence: string[];
  readonly token: string;
}
