import express, { response } from "express";
import "reflect-metadata"
import { DataSource } from "typeorm";
import { Wallpaper } from "./Wallpaper";
import { User } from "./User";
import * as jwt from 'jsonwebtoken';
import * as expressJwt from 'express-jwt';
import * as dotenv from 'dotenv'

dotenv.config();

const dataSource = new DataSource({
  type: "sqlite",
  database: "./sqlite.db",
  entities: [Wallpaper, User],
  synchronize: true,

});
const PORT = 3300;

async function main() {
  await dataSource.initialize();
  const server = express();
  server.use(express.json());

  // Récupérer la clé secrète depuis les variables d'environnement
  const secretKey = process.env.JWT_SECRET;

  // Vérifier si la clé secrète est définie
  if (!secretKey) {
    console.error("La clé secrète JWT n'est pas définie.");
    process.exit(1);
  }

  const auth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];
    console.log('Token:', token);
  
    if (!token) {
      return res.status(401).json({ message: 'Token missing' });
    }
  
    expressJwt.expressjwt({ 
      secret: secretKey,
      algorithms: ['HS256'],
    })(req, res, (err) => {
      if (err) {
        // Gérer les erreurs de vérification du JWT ici
        console.error('JWT Verification Error:', err);
        return res.status(401).json({ message: 'Unauthorized' });
      }
      // Passez à la prochaine fonction middleware ou route
      next();
    });
  };
  

  server.get("/", (request, response) => {
    return response.send("Hello world!!!!");
  });

  server.post("/wallpaper", async (request, response) => {
    try {
      const imageData = await Wallpaper.fetchImage();
      return response.send(imageData);
    } catch (error) {
      console.error("Error fetching image:", error);
      response.status(500).send("Internal Server Error");
    }
  });

  server.post("/wallpaper/bulk", async (request, response) => {
    try {
      const imageData = await Wallpaper.callFetchImageMultipleTimes();
      response.json(imageData);
    } catch (error) {
      console.error("Error fetching image:", error);
      response.status(500).send("Internal Server Error");
    }
  });

  server.post("/wallpaper/coords", async (request, response) => {
    try {
      const coords = await Wallpaper.addCoords();
      response.json(coords);
    } catch (error) {
      console.error("Error fetching image:", error);
      response.status(500).send("Internal Server Error");
    }
  });

  server.get("/wallpaper/test", async (request, response) => {
    try {
      const wallpaper = await Wallpaper.buildRandomWallpaper();
      response.json(wallpaper);
    } catch (error) {
      console.error("Error fetching image:", error);
      response.status(500).send("Internal Server Error");
    }
  });

  server.post("/user/register", async (request, response) => {
    try {
      const { name, email, password, repassword } = request.body;
      const user = await User.verifyUserCreation(name, email, password, repassword);
      response.json(user);
    } catch (error) {
      console.error(error);
      response.status(500).send("Internal Server Error");
    }
  });

  server.get("/user/login", async (request, response) => {
    try {
      const { email, password } = request.body;
      const user = await User.loginUser(email, password);
      response.json(user);
    } catch (error) {
      console.error(error);
      response.status(500).send("Internal Server Error");
    }
  });
  
  server.get("/user/token", auth, async (request, response) => {
    try {
      const token = request.headers.authorization?.split(' ')[1];
      if (token == undefined) {
        throw new Error("");
      }
      const user = await User.getUserFromToken(token);
      response.json(user);
    } catch (error) {
      console.error(error);
      response.status(500).send("Internal Server Error");
    }
  });

  // server.get("/coords/test", async (request, response) => {
  //   try {
  //     const dataInstance = new Data();
  //     const imageData = await dataInstance.testCoords();
  //     response.json(imageData);
  //   } catch (error) {
  //     console.error("Error fetching image:", error);
  //     response.status(500).send("Internal Server Error");
  //   }
  // });

  // server.get("/image/:set/test", async (request, response) => {
  //   try {
  //     const set = parseInt(request.params.set);
  //     const dataInstance = new Data(set);
  //     const imageData = await dataInstance.displayFetchedImages();
  //     response.json(imageData);
  //   } catch (error) {
  //     console.error("Error fetching image:", error);
  //     response.status(500).send("Internal Server Error");
  //   }
  // });

  server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}.`);
  });
}

main();