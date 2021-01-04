import { Injectable, NotFoundException } from '@nestjs/common';
import { TwitterService } from '../../shared/twitter/twitter.service';


@Injectable()
export class SocialService {

  constructor(private readonly twitterService: TwitterService) { }

  async twitterSearch(query:string) {
    let response = await this.twitterService.search(query);
    return response;
  }

}
