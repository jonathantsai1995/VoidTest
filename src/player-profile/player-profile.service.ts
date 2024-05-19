import { Injectable } from '@nestjs/common';
import { Match } from './match.interface';
import axios from 'axios';
import { PlayerStats } from './playerstats.interface';
import { LeaderBoardService } from './leaderboard.service';
@Injectable()
export class PlayerProfileService {
  private readonly apiKey: string =
    'RGAPI-478fae32-94db-4cec-9908-187f9d6064f6';

  constructor(private readonly leaderboardService: LeaderBoardService) {}

  async getRecentMatches(
    gameName: string,
    tagName: string,
    size: number,
    limit: number,
    queueId: number,
  ): Promise<Match[]> {
    try {
      //retrieves puuid using gamename and tagline
      const puuidUrl = `https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${gameName}/${tagName}`;
      const puuidResponse = await axios.get(puuidUrl, {
        headers: { 'X-Riot-Token': this.apiKey },
      });
      const puuid: string = puuidResponse.data.puuid;

      // Retrieves match ID's using puuid
      const matchUrl = `https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=${(size - 1) * limit}&count=${limit}&queue=${queueId}`;
      const matchUrlResponse = await axios.get(matchUrl, {
        headers: { 'X-Riot-Token': this.apiKey },
      });
      const arrayMatchId: string[] = matchUrlResponse.data;

      //retrieve match details using match ID
      const arrayMatchDetails = arrayMatchId.map(async (matchId: string) => {
        const matchUrl = `https://americas.api.riotgames.com/lol/match/v5/matches/${matchId}`;
        const matchUrlResponse = await axios.get(matchUrl, {
          headers: { 'X-Riot-Token': this.apiKey },
        });
        return matchUrlResponse.data;
      });

      const playerStatistics = await Promise.all(arrayMatchDetails);

      //map over each match detail
      const specificPlayerStatistics: Match[] = playerStatistics.map(
        (match: any) => {
          // Find the participant with matching puuid
          const participant = match.info.participants.find(
            (participant: any) => participant.puuid === puuid,
          );
          return {
            championUsed: participant.championName,
            win: participant.win,
            kda: `${participant.kills}/${participant.deaths}/${participant.assists}`,
            kills: participant.kills,
            csPerMinute:
              participant.totalMinionsKilled / (match.info.gameDuration / 60),
            runes: participant.perks,
            assists: participant.assists,
            spells: [participant.spell1Id, participant.spell2Id],
          };
        },
      );

      return specificPlayerStatistics;
    } catch (error) {
      throw new Error('Failed to retrieve match statistics');
    }
  }

  async getPlayerStatistics(
    gameName: string,
    tagName: string,
    size: number,
    limit: number,
    queueId: string,
  ): Promise<PlayerStats> {
    let rank = 'N/A';
    let leaguePoints = 'N/A';
    let totalWins = 0;
    let totalLosses = 0;
    let totalCSPerMin = 0;
    let totalVisionScore = 0;
    let matchCount = 0;

    try {
      // Retrieve puuid using game name and tagline
      const puuidUrl = `https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${gameName}/${tagName}`;
      const puuidResponse = await axios.get(puuidUrl, {
        headers: { 'X-Riot-Token': this.apiKey },
      });
      const puuid: string = puuidResponse.data.puuid;

      // Retrieve encrypted summoner ID using puuid
      const summonerIDUrl = `https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`;
      const summonerIDResponse = await axios.get(summonerIDUrl, {
        headers: { 'X-Riot-Token': this.apiKey },
      });
      const summonerID: string = summonerIDResponse.data.id;

      // Retrieve player rank and LP using summonerID
      const playerStatsUrl = `https://na1.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerID}`;
      const playerStatsResponse = await axios.get(playerStatsUrl, {
        headers: { 'X-Riot-Token': this.apiKey },
      });
      const playerStatsData: any[] = playerStatsResponse.data;

      if (queueId === '420') {
        const soloDuoStats = playerStatsData.find(
          (stats) => stats.queueType === 'RANKED_SOLO_5x5',
        );
        if (soloDuoStats) {
          rank = `${soloDuoStats.tier} ${soloDuoStats.rank}`;
          leaguePoints = soloDuoStats.leaguePoints;
        }
      } else if (queueId === '440') {
        const rankedFlexStats = playerStatsData.find(
          (stats) => stats.queueType === 'RANKED_FLEX_SR',
        );
        if (rankedFlexStats) {
          rank = `${rankedFlexStats.tier} ${rankedFlexStats.rank}`;
          leaguePoints = rankedFlexStats.leaguePoints;
        }
      }

      // Retrieves match IDs using puuid,size, limit, and queueid
      const matchUrl = `https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=${(size - 1) * limit}&count=${limit}&queue=${queueId}`;
      const matchUrlResponse = await axios.get(matchUrl, {
        headers: { 'X-Riot-Token': this.apiKey },
      });
      const arrayMatchId: string[] = matchUrlResponse.data;

      // Retrieve match details using match IDs
      const arrayMatchDetails = await Promise.all(
        arrayMatchId.map(async (matchId: string) => {
          const matchUrl = `https://americas.api.riotgames.com/lol/match/v5/matches/${matchId}`;
          const matchUrlResponse = await axios.get(matchUrl, {
            headers: { 'X-Riot-Token': this.apiKey },
          });
          return matchUrlResponse.data;
        }),
      );
      // iterate over each match
      arrayMatchDetails.forEach((match: any) => {
        // Find the participant with matching puuid
        const participant = match.info.participants.find(
          (participant: any) => participant.puuid === puuid,
        );

        // If participant is found, assign statistics needed
        if (participant) {
          totalWins += participant.win ? 1 : 0;
          totalLosses += participant.win ? 0 : 1;
          totalCSPerMin +=
            participant.totalMinionsKilled / (match.info.gameDuration / 60);
          totalVisionScore += participant.visionScore;
          matchCount++;
        }
      });
      // Calculate averages and winrate
      const averageCsPerMin = totalCSPerMin / matchCount;
      const averageVisionScore = totalVisionScore / matchCount;
      const winRate = totalWins / matchCount;

      // Construct PlayerStats object
      const playerStats: PlayerStats = {
        rank: rank,
        leaguePoints: parseInt(leaguePoints, 10),
        wins: totalWins,
        losses: totalLosses,
        averageCSPerMin: averageCsPerMin,
        averageVisionScore: averageVisionScore,
        winRate: winRate,
      };
      console.log('before user');
      //create user in Prisma database
      const user = await this.leaderboardService.createUser({
        gameName,
        tagName,
        rank,
        leaguePoints: parseInt(leaguePoints, 10),
        winRate,
      });

      return playerStats;
    } catch (error) {
      throw new Error('Failed to retrieve player statistics');
    }
  }

  async getLeaderBoard(
    gameName: string,
    tagName: string,
  ): Promise<{ leaguePointsRank: number; winRateRank: number }> {
    try {
      console.log('leader');

      return await this.leaderboardService.getUserRankings(gameName, tagName);
    } catch (error) {
      throw new Error(`Failed to fetch player ranking`);
    }
  }
}
