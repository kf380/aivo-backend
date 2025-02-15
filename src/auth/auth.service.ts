import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async login(user: User): Promise<any> {
    const payload = { username: user.username, sub: (user as any)._id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
