import { Module } from '@nestjs/common';
import { PlayerProfileService } from './player-profile.service';
import { PrismaService } from 'src/database/PrismaService.service';
import { LeaderBoardService } from './leaderboard.service';
import { PlayerProfileController } from './player-profile.controller';

@Module({
  controllers: [PlayerProfileController],
  providers: [PlayerProfileService, PrismaService, LeaderBoardService],
  exports: [PlayerProfileService],
})
export class PlayerProfileModule {}
