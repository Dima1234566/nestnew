/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Model } from "mongoose";

export type UserDocument = User & Document;

@Schema({ versionKey: false, timestamps: true })
export class User extends Model<User> {
    @Prop({ type: Array, default: [] })
    settings: [];

    @Prop({ type: String })
    firstName: string;

    @Prop({ type: Number })
    tgId: number;

    @Prop({ type: Boolean, default: false })
    activity: boolean;
}


export const UserSchema = SchemaFactory.createForClass(User);

