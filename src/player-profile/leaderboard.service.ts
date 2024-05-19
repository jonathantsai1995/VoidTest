import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/PrismaService.service';
import { LeaderBoard, Prisma } from '@prisma/client';

@Injectable()
export class LeaderBoardService {
  constructor(private prisma: PrismaService) {}

  async createUser(data: Prisma.LeaderBoardCreateInput): Promise<LeaderBoard> {
    try {
      const newUser = await this.prisma.leaderBoard.create({
        data: {
          gameName: data.gameName,
          tagName: data.tagName,
          rank: data.rank,
          leaguePoints: data.leaguePoints,
          winRate: data.winRate,
        },
      });
      console.log('New user created:', newUser);
      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }
  async logAllUsers(): Promise<void> {
    try {
      const allUsers = await this.prisma.leaderBoard.findMany();
      console.log('All users:', allUsers);
    } catch (error) {
      console.error('Error retrieving users:', error);
    }
  }
  async getUserRankings(
    gameName: string,
    tagName: string,
  ): Promise<{ leaguePointsRank: number; winRateRank: number }> {
    const user = await this.prisma.leaderBoard.findFirst({
      where: { gameName, tagName },
    });
    console.log('this is the user' + user);
    console.log(user);
    if (!user) {
      throw new Error(
        `User with gameName ${gameName} and tagName ${tagName} not found.`,
      );
    }

    // Get ranking based on leaguePoints
    const leaguePointsRank = await this.prisma.leaderBoard.count({
      where: { leaguePoints: { gt: user.leaguePoints } },
    });

    // Get ranking based on winRate
    const winRateRank = await this.prisma.leaderBoard.count({
      where: {
        leaguePoints: user.leaguePoints,
        winRate: { gt: user.winRate },
      },
    });

    return {
      leaguePointsRank: leaguePointsRank + 1,
      winRateRank: winRateRank + 1,
    };
  }
}
