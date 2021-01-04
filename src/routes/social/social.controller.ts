import { Controller, Get, Post, Patch, Delete, Body, Param, Req, Query } from '@nestjs/common';
import { SocialService } from './social.service';

@Controller('social')
export class SocialController {
  constructor(private readonly socialService: SocialService) {}


  @Get()
  getStatus() {
    return { status: 'social' }
  }

  @Get('/twitter/search')
  twitterSearch(@Query('query') query: string) {
    console.log("query: ", query);
    return this.socialService.twitterSearch(query);
  }


}
