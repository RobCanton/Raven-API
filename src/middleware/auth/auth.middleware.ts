import { Injectable, NestMiddleware, UnauthorizedException, Logger } from "@nestjs/common";
import { Request, Response } from 'express';
import { FirebaseService } from '../../shared/firebase/firebase.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger('Auth');

  constructor(private readonly firebaseService: FirebaseService) {}

  async use(req: Request, res: Response, next: () => void) {

    try {
      let token = req.headers.authorization;
      const decodedToken = await this.firebaseService.authenticate(token);
      this.logger.log(`User authorized: ${decodedToken.uid}`);
      req['uid'] = decodedToken.uid;
      next();

    } catch (e) {
      console.log(e);
      this.logger.log(`User not authorized`);
       throw new UnauthorizedException('User not authorized');
    }

  }
}
