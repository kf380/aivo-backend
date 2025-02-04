import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Request, RequestDocument } from './schemas/request.schema';

@Injectable()
export class RequestsService {
  constructor(
    @InjectModel(Request.name) private requestModel: Model<RequestDocument>,
  ) {}


  async create(text: string, response: Record<string, any>): Promise<Request> {
    const newRequest = new this.requestModel({ text, response });
    return newRequest.save();
  }


  async findAll(): Promise<Request[]> {
    return this.requestModel.find().sort({ createdAt: -1 }).exec();
  }
}
