import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  findByEmail(email: string, includeCredentials = false): Promise<User | null> {
    const query = this.usersRepository
      .createQueryBuilder('user')
      .where('user.email = :email', { email: email.trim().toLowerCase() });

    if (includeCredentials) {
      query.addSelect(['user.passwordHash', 'user.refreshTokenHash']);
    }

    return query.getOne();
  }

  findById(id: string, includeCredentials = false): Promise<User | null> {
    const query = this.usersRepository.createQueryBuilder('user').where('user.id = :id', { id });

    if (includeCredentials) {
      query.addSelect(['user.passwordHash', 'user.refreshTokenHash']);
    }

    return query.getOne();
  }

  create(user: Partial<User>): User {
    return this.usersRepository.create(user);
  }

  save(user: User): Promise<User> {
    return this.usersRepository.save(user);
  }
}
