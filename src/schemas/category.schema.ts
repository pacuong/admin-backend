// src/categories/schemas/category.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CategoryDocument = Category & Document;

@Schema()
export class Category {
  @Prop({ required: true }) name: string;
  @Prop({ default: Date.now }) create_at: Date;
  @Prop({ default: true }) is_active: boolean;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
