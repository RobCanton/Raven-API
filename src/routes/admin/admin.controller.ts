import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { AdminService } from './admin.service';
import { NewsTopic } from './admin.model';


@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}


  @Get()
  getStatus() {
    return { status: 'operational' }
  }

  @Get('/reset')
  reset() {
    this.adminService.reset();
    return {
      success: true
    }
  }

  @Post('/user/notify')
  async userNotify(@Body('uid') uid: string,
    @Body('title') title: string,
    @Body('body') body: string) {
      console.log(`title: ${title} body: ${body} uid: ${uid}`);
    let response = await this.adminService.userNotify(uid, title, body);
    return response;
  }

  @Post('/alert/:alertID')
  async triggerAlert(@Param('alertID') alertID: string, @Body('price') price: number, @Body('timestamp') timestamp: number) {
    let response = await this.adminService.triggerAlert(alertID, price, timestamp);
    return response;
  }

  @Get('/alerts/:symbol')
  async getAlertsForSymbol(@Param('symbol') symbol: string) {
    let response = await this.adminService.getAlertsForSymbol(symbol);
    return response;
  }

  @Get('/news/topics')
  async getNewsTopics() {
    let response = await this.adminService.getNewsTopics();
    return response;
  }

  @Post('/news/topics')
  async setNewsTopics(@Body('topics') topics:NewsTopic[]) {
    let response = await this.adminService.setNewsTopics(topics);
    return response;
  }

  @Get('/watcher')
  async getWatcherStatus() {
    let response = await this.adminService.getWatcherStatus();
    return response;
  }

}
