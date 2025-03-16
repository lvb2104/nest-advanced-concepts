import { Coffee } from '../entities/coffee.entity';

export interface CoffeesDataSource {
  [index: number]: Coffee;
}

export const COFFEES_DATA_SOURCE = Symbol('COFFEES_DATA_SOURCE');
