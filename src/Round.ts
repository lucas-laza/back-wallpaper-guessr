import {
  BaseEntity,
  Column,
  Entity,
  ManyToOne,
  ManyToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Game } from "./Game";
import { User } from "./User";
import { Wallpaper } from "./Wallpaper";
import { Party } from "./Party";

@Entity()
export class Round extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Game, { nullable: false })
  game!: Game;

  @ManyToOne(() => Party, { nullable: false })
  party!: Party;

  @ManyToMany(() => User)
  players!: User[];

  @ManyToOne(() => Wallpaper, { nullable: false })
  wallpaper!: Wallpaper;

  @Column({ nullable: false, default: 0 })
  guesses!: number;
}