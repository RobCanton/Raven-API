import { Injectable, NotFoundException } from '@nestjs/common';
import axios, {AxiosResponse} from 'axios';

export interface Extract {
  article: ExtractArticle
}

export interface ExtractArticle {
  articleBody: string
  headlone: string
  author: string
  mainImage: string
  description: string
  url: string
  canonicalUrl: string
  probability: number
}

@Injectable()
export class ExtractorService {
  private apiKey = 'c0de98e147744c4a824ad5b9708c0c76';
  private url = "https://autoextract.scrapinghub.com/v1/extract";

  constructor() {

  }

  async extract(url:string): Promise<Extract> {

    try {
      let response:AxiosResponse = await axios.post(this.url, [
        {
          'url': url,
          'pageType': 'article'
        }
      ], {
        auth: {
          username: this.apiKey,
          password: ''
        }
      });
      //console.log("extract: ", response.data);
      let extracts:Extract[] = response.data;
      if (extracts.length == 0) {
        return null
      }
      return extracts[0];
    } catch (exception) {
      //console.log("Error: ", exception);
      return null
    }
  }
}
