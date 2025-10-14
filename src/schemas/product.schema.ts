import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema()
export class Product {
  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  category_id: Types.ObjectId;
  @Prop({ required: true }) name: string;
  @Prop() description: string;
  @Prop() img_url: string;
  @Prop() img_public_id: string;
  @Prop({ required: true }) price: number;
  @Prop() sale_price: number;
  @Prop({ default: true }) available: boolean;
  @Prop({ default: Date.now }) create_at: Date;
  @Prop({ default: 0 }) total_reviews: number;
  @Prop({ default: 0 }) rating: number;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
