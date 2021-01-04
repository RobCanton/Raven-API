import { Injectable, Inject, HttpService, InternalServerErrorException } from '@nestjs/common';
import * as rp from 'request-promise';
import * as Twitter from 'twitter-app-only-auth';

@Injectable()
export class TwitterService {

  private twitter;

  private consumer_key: string;
  private consumer_secret: string;
  constructor(@Inject('CONFIG_OPTIONS') private options, private httpService: HttpService) {
    this.consumer_key = options.consumer_key;
    this.consumer_secret = options.consumer_secret;
    this.twitter = new Twitter(
      this.consumer_key,
      this.consumer_secret
    );
  }

  async search(query:string) {

    const results = await this.twitter.get(`search/tweets.json?q=${query}`);
    let response = results.data.statuses;
    return response;
  }

}
