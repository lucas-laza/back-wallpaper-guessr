import {
  BaseEntity,
  Column,
  Entity,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./User";
import { Party } from "./Party";

enum GameStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  ABORTED = "aborted",
  COMPLETED = "completed",
}

enum GameMode {
  STANDARD = "standard",
}

@Entity()
export class Game extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Party, { nullable: true })
  party!: Party | null;

  @ManyToMany(() => User)
  players!: User[];

  @Column({
    type: "enum",
    enum: GameStatus,
    default: GameStatus.PENDING,
  })
  status!: GameStatus;

  @Column({
    type: "enum",
    enum: GameMode,
    default: GameMode.STANDARD,
  })
  gamemode!: GameMode;

  @Column()
  map!: string;

  @Column({ default: 3, nullable: false, unsigned: true})
  rounds_number!: number;

  @Column()
  modifiers!: {};

  @ManyToOne(() => User, { nullable: true })
  winner!: User | null;

  @Column()
  time!: number;
}
