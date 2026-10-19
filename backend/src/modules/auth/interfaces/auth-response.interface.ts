import { AuthenticatedUserDto, TokensDto } from '../dto/auth-response.dto';

export interface AuthResponse {
  user: AuthenticatedUserDto;
  tokens: TokensDto;
}
