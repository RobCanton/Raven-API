import { Controller, Get, Post, Patch, Delete, Body, Param, Req } from '@nestjs/common';
import { ReferenceService } from './reference.service';

@Controller('ref')
export class ReferenceController {
  constructor(private readonly referenceService: ReferenceService) {}


  @Get()
  getStatus() {
    return { status: 'reference' }
  }

  @Get('/market/status')
  async marketStatus() {
    let response = this.referenceService.marketStatus();
    return response;
  }

  @Get('/search/stocks/:fragment')
  async search(@Param('fragment') fragment: string) {
    let response = await this.referenceService.search(fragment);
    return response;
  }

  @Get('stocks/aggregate/preset/:symbol/:timeframe')
  async aggregatePreset(@Param('symbol') symbol: string, @Param('timeframe') timeframe: string) {
    switch (timeframe.toUpperCase()) {
      case '1D':
      return this.referenceService.stockAggregateOneDay(symbol);
      case '1W':
      return this.referenceService.stockAggregateOneWeek(symbol);
      case '1M':
      return this.referenceService.stockAggregateOneMonth(symbol);
      case '3M':
      return this.referenceService.stockAggregateThreeMonths(symbol);
      case '6M':
      return this.referenceService.stockAggregateSixMonths(symbol);
      case 'YTD':
      return this.referenceService.stockAggregateYearToDate(symbol);
      case '1Y':
      return this.referenceService.stockAggregateOneYear(symbol);
      case '2Y':
      return this.referenceService.stockAggregateTwoYears(symbol);
      case '5Y':
      return this.referenceService.stockAggregateFiveYears(symbol);
      default:
      break;
    }
    return true;
  }


  @Post('/polygon-enabled')
  async polygonEnabled(@Body('symbols') symbols: Array<string>) {
    console.log(`check polygon enabled: ${symbols}`)
    let response = await this.referenceService.polygonEnabled(symbols);
    return response;
  }

  @Get('/news/:symbol/:count')
  async getNews(@Param('symbol') symbol: string, @Param('count') count: number) {
    let response = await this.referenceService.getNews(symbol, count);
    return response;
  }

  @Get('/search/forex/:fragment')
  async searchForex(@Param('fragment') fragment: string) {
    let response = await this.referenceService.searchForex(fragment);
    return response;
  }

  @Get('/search/crypto/:fragment')
  async searchCrypto(@Param('fragment') fragment: string) {
    let response = await this.referenceService.searchCrypto(fragment);
    return response;
  }
}
/*
function(req, res) {
  let fragment = req.query.fragment;

  var searchResults = [];
  var searchSymbols = [];

  var validSymbols = {};

  return iexAPI.search(fragment).then(_searchResults => {

    searchResults = _searchResults;

    _searchResults.forEach(result => {
      if (result.region === 'US') {
        searchSymbols.push(result.symbol);
      }
    })

    return getPolygonEnabledSymbols(searchSymbols);
  }).then(validSymbols => {
    var response = [];

    for (var k = 0; k < searchResults.length; k++) {
      let searchResult = searchResults[k];
      if (validSymbols[searchResult.symbol]) {
        response.push(searchResult);
      }
    }
    console.log("validSymbols: ", validSymbols);
    return res.send(response);
  })
}*/
