import { Controller, Get, Param, Query } from '@nestjs/common';
import { PlayerProfileService } from './player-profile.service';
import { Match } from './match.interface';
import { PlayerStats } from './playerstats.interface';

@Controller('/')
export class PlayerProfileController {
  constructor(private readonly playerProfile: PlayerProfileService) {}

  @Get('/recent-matches')
  async getRecentMatches(
    @Query('gameName') gameName: string,
    @Query('tagName') tagName: string,
    @Query('size') size: number,
    @Query('limit') limit: number,
    @Query('queueId') queueId: number,
  ): Promise<Match[]> {
    console.log('hi');
    return this.playerProfile.getRecentMatches(
      gameName,
      tagName,
      size,
      limit,
      queueId,
    );
  }

  @Get('/player-statistics')
  async getPlayerStatistics(
    @Query('gameName') gameName: string,
    @Query('tagName') tagName: string,
    @Query('size') size: number,
    @Query('limit') limit: number,
    @Query('queueId') queueId: string,
  ): Promise<PlayerStats> {
    console.log('hi');
    const playerStatistics = await this.playerProfile.getPlayerStatistics(
      gameName,
      tagName,
      size,
      limit,
      queueId,
    );
    return playerStatistics;
  }

  @Get('/leaderboard/:gameName/:tagName')
  async getPlayerRanking(
    @Param('gameName') gameName: string,
    @Param('tagName') tagName: string,
  ): Promise<{ leaguePointsRank: number; winRateRank: number }> {
    return this.playerProfile.getLeaderBoard(gameName, tagName);
  }
}
