import { User as TUser } from "twitter-d"

interface Users {
  [id: string]: User
}
interface User {
  following: boolean
  data: TUser
  cheched: boolean
}
interface BlockUsers {
  [id: string]: BlockUser
}
interface BlockUser {
  data?: TUser
  ok: boolean
  statusText: string
}
export { Users, User, BlockUsers, BlockUser }
