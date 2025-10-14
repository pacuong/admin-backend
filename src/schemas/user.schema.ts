import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = Document & {
  _id: Types.ObjectId;
} & User;

@Schema({ timestamps: true })
export class User {
  @Prop()
  name?: string;

  @Prop()
  phone?: string;

  @Prop({ default: false }) consent_user_info?: boolean;
  @Prop({ default: false }) consent_phone?: boolean;
  @Prop({ default: false }) consent_location?: boolean;

  @Prop({
    type: {
      provider: { type: String },
      latitude: { type: Number },
      longitude: { type: Number },
      timestamp: { type: Number },
    },
    _id: false,
  })
  last_location?: {
    provider?: string;
    latitude?: number;
    longitude?: number;
    timestamp?: number;
  };

  @Prop()
  email?: string;

  @Prop()
  password?: string;

  @Prop({ unique: true, sparse: true })
  zalo_id?: string;

  @Prop()
  avatar?: string;

  @Prop({ enum: ['male', 'female', 'other'] })
  gender?: 'male' | 'female' | 'other';

  @Prop()
  birthday?: string;

  @Prop({ default: 'local' })
  source: 'local' | 'zalo';

  @Prop({ default: 'user' })
  role: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ email: 1 }, { unique: true, sparse: true });
