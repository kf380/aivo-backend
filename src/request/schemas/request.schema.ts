import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RequestDocument = Request & Document;

@Schema()
export class Request {
  @Prop({ required: true })
  text: string;

  @Prop({ required: true, type: Object })
  response: Record<string, any>;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const RequestSchema = SchemaFactory.createForClass(Request);
