import { UserSelectModel } from "../interface/user.interface";

export class UserEntity {
  id: string;

  constructor(data: UserSelectModel){
    this.id = data.id
  }
}
