namespace Express {
  interface Request {
    user?: import('src/modules/user/entities/user.entity').UserEntity;
  }
}
