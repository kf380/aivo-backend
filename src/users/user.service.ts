import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(username: string, password: string): Promise<User> {
    const existing = await this.userModel.findOne({ username });
    if (existing) {
      throw new ConflictException('El usuario ya existe');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new this.userModel({ username, password: hashedPassword });
    return newUser.save();
  }

  async findOne(username: string): Promise<User | null> {
    return this.userModel.findOne({ username }).exec();
  }

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.findOne(username);
    if (user && await bcrypt.compare(password, user.password)) {
      return user;
    }
    return null;
  }
}
