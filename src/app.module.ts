import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PlayerProfileModule } from './player-profile/player-profile.module';

@Module({
  imports: [PlayerProfileModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
