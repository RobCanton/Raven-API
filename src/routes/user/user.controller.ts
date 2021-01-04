import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request, Response } from 'express';

import { UserService } from './user.service';


@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/account')
  async getAccount(@Req() req: Request) {
    let uid = req['uid'];
    let response = await this.userService.account(uid);
    return response;
  }

  @Get('/watchlist')
  async getWatchlist(@Req() req: Request) {
    let uid = req['uid'];

    let results = await this.userService.watchlist(uid);
    return results;
  }

  @Patch('/watchlist')
  async patchWatchlist(@Req() req: Request, @Query('symbols') symbols: string) {
    let uid = req['uid'];
    let symbolsArray = symbols.split(',');
    return this.userService.patchWatchlist(uid, symbolsArray);
  }



  @Post('/watchlist/:ticker')
  async subscribe(@Req() req: Request, @Param('ticker') ticker: string) {
    let uid = req['uid'];
    let response = await this.userService.subscribe(uid, ticker.toUpperCase());
    return response;
  }

  @Delete('/watchlist/:ticker')
  async unsubscribe(@Req() req: Request, @Param('ticker') ticker: string) {
    let uid = req['uid'];
    let response = await this.userService.unsubscribe(uid, ticker.toUpperCase());
    return response;
  }

  @Get('/pushtoken')
  async getPushToken(@Req() req: Request) {
    let uid = req['uid'];
    let response = await this.userService.getPushToken(uid);
    return response;
  }

  @Post('/pushtoken/:token')
  async registerPushToken(@Req() req: Request, @Param('token') token: string) {
    let uid = req['uid'];

    await this.userService.registerPushToken(uid, token);

    return {
      success: true
    }
  }

  @Get('/stock/:symbol')
  async stockSnapshot(@Param('symbol') symbol: string) {
    let response = await this.userService.stockSnapshot(symbol);
    return response;
  }

  @Get('/alerts')
  async getAlerts(@Req() req: Request) {
    let uid = req['uid'];
    let response = await this.userService.getAlerts(uid);
    return response;
  }

  @Post('/alerts')
  async createAlert(@Req() req: Request,
    @Query('symbol') symbol: string,
    @Query('type') type: number,
    @Query('condition') condition: number,
    @Query('value') value: number,
    @Query('reset') reset: number) {

    let uid = req['uid'];
    let response = await this.userService.createAlert(uid, symbol, type, condition, value, reset);
    return response;
  }

  @Patch('/alerts/:alertID')
  async patchAlert(@Req() req: Request, @Param('alertID') alertID: string,
    @Query('type') type: number,
    @Query('condition') condition: number,
    @Query('value') value: number,
    @Query('reset') reset: number,
    @Query('enabled') enabled: number) {
    let uid = req['uid'];
    let response = await this.userService.patchAlert(uid, alertID, type, condition, value, reset, enabled);
    return response;
  }

  @Delete('/alerts/:alertID')
  async deleteAlert(@Req() req: Request, @Param('alertID') alertID: string) {
    let uid = req['uid'];
    let response = await this.userService.deleteAlert(uid, alertID);
    return response;
  }


  /*@Get('/polygon')
  async poylgon() {
    // let response = await this.userService.polygon();
    // console.log("Controller: ", response);
    let response = await this.userService.polygon();;
    return response;
  }*/

}
