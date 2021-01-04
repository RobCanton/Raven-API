import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import algoliasearch from 'algoliasearch';
import axios from 'axios';

@Injectable()
export class AlgoliaService {

  private client;
  private forexIndex;
  private cryptoIndex;

  constructor(@Inject('CONFIG_OPTIONS') private options) {
    this.client = algoliasearch('J0PSFDMNOG', '8f13a38771fa3311cf44714087746885');
    this.forexIndex = this.client.initIndex('Forex');
    this.cryptoIndex = this.client.initIndex('Crypto');
    this.cryptoIndex.setSettings({
      attributesForFaceting: [
        'currency', 'active' // or 'filterOnly(brand)' for filtering purposes only
      ]
    })
  }

  async searchForex(fragment: string) {
    let hits = await this.forexIndex.search(fragment);
    return hits;
  }


  async searchCrypto(fragment: string) {
    let hits = await this.cryptoIndex.search(fragment, {
      filters: 'currency:USD AND active:true'
    });
    return hits;
  }

  async getForexObject(objectID:string) {
    let obj = await this.forexIndex.getObject(objectID);
    return obj;
  }

  async getCryptoObject(objectID:string) {
    let obj = await this.cryptoIndex.getObject(objectID);
    return obj;
  }

}
