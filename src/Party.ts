import {
  BaseEntity,
  Column,
  Entity,
  ManyToOne,
  ManyToMany,
  JoinTable,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./User";

@Entity()
export class Party extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User)
  admin!: User;

  @ManyToMany(() => User)
  @JoinTable()
  players!: User[];

  @Column()
  code!: string;
}
