import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/user.service';

@ApiTags('Auth') 
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Registro de un nuevo usuario' })
  @ApiBody({
    schema: {
      properties: {
        username: { type: 'string' },
        password: { type: 'string' },
      },
      required: ['username', 'password'],
    },
  })
  async register(
    @Body() body: { username: string; password: string }
  ): Promise<any> {
    const user = await this.usersService.create(body.username, body.password);
    return { message: 'Usuario creado exitosamente', userId: (user as any)._id };
  }

  @Post('login')
  @ApiOperation({ summary: 'Inicio de sesión' })
  @ApiBody({
    schema: {
      properties: {
        username: { type: 'string' },
        password: { type: 'string' },
      },
      required: ['username', 'password'],
    },
  })
  async login(
    @Body() body: { username: string; password: string }
  ): Promise<any> {
    const user = await this.usersService.validateUser(body.username, body.password);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    return this.authService.login(user);
  }
}
