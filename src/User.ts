import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { IsEmail, Validate } from "class-validator";
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: false })
  name!: string;

  @Column({ nullable: false, unique: true })
  @Validate(IsEmail, { message: "Invalid email" })
  email!: string;

  @Column({ nullable: false })
  password!: string;


  private static async createNew(name: string, email: string, _password: string) {
    const user = new User();
    user.name = name;
    user.email = email;
    user.password = await User.hashPassword(_password);
    await user.save()
    return user
  }
  static async getALL(){
    return await this.find();
  }

  static async verifyUserCreation(_name: string, _email: string, _password: string, _repassword: string): Promise<any> {
    // Validate name length
    if (_name.length < 3 || _name.length > 32) {
      return {
        "code": 400,
        "message": "Name must have at least 3 characters and at most 32 characters"
      };
    }

    // Validate email format using regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(_email)) {
      return {
        "code": 400,
        "message": "Invalid email format"
      };
    }

    // Check email uniqueness
    const existingUser = await User.findOneBy({ email: _email });
    if (existingUser) {
      return {
        "code": 400,
        "message": "Email is already in use"
      };
    }
    
    
    if (!User.testPasswordRegex(_password)) {
      return {
        "code": 400,
        "message": "Your password must contain at least 8 characters, including at least one lowercase letter, one uppercase letter, one digit, and one special character"
      }
    }
    if (_password !== _repassword) {
      return {
        "code": 400,
        "message": "Passwords don't match"
      }
    }
    return await User.createNew(_name, _email, _password);
  }

  static testPasswordRegex(_password:string) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    
    if (!passwordRegex.test(_password)) {
      return false;
    }
    return true;
  }

  private static async hashPassword(password: string): Promise<string> {
    const saltRounds = 11;
    try {
      const salt = await bcrypt.genSalt(saltRounds);
      const hashedPassword = await bcrypt.hash(password, salt);
      return hashedPassword;
    } catch (error) {
      throw new Error('Error hashing password');
    }
  }

  static async loginUser(email: string, password: string): Promise<string | null> {
    const secretKey = process.env.JWT_SECRET ;
    if (secretKey == undefined) {
      throw new Error("Token cannot be created, contact your admin");
    }
    const user = await this.findOne({ where: { email } });

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    const token = jwt.sign({ userId: user.id, email: user.email, name: user.name }, secretKey, { expiresIn: '1h' });

    return token;
  }

  static getUserFromToken(token: string): { userId: number, email: string, name: string } | null {
    const secretKey = process.env.JWT_SECRET ;
    if (secretKey == undefined) {
      throw new Error("Token cannot be created, contact your admin");
    }
    try {
      const decodedToken = jwt.verify(token, secretKey) as { userId: number, email: string, name: string };
      return decodedToken;
    } catch (error) {
      // En cas d'erreur lors du décodage du token
      return null;
    }
  }
}
