import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './app.model';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot({
    envFilePath: `.env`,
  }),
  MongooseModule.forRoot(process.env.DB_HOST),
  MongooseModule.forFeature([{
    name: User.name,
    schema: UserSchema,
    collection: "users"
  }]),

  ],
  controllers: [],
  providers: [AppService],
})
export class AppModule { }
