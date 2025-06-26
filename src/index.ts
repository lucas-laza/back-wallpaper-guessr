import express from "express";
import "reflect-metadata";
import { DataSource } from "typeorm";
import { Wallpaper } from "./Wallpaper";
import { User } from "./User";
import * as dotenv from 'dotenv';
import { gameRouter } from "./GameController"; // Nouveau contrôleur unifié
import { authenticateToken, AuthenticatedRequest } from "./auth-middleware";
import * as path from 'path';
import { Game } from "./Game";
import { Party } from "./Party";
import { Round } from "./Round";
import { WebSocketService } from "./WebSocketService";
import { createServer } from 'http';
const cors = require('cors');

dotenv.config();

const dataSource = new DataSource({
  type: "sqlite",
  database: "./sqlite.db",
  entities: [Wallpaper, User, Game, Party, Round],
  synchronize: true,
});

const PORT = 3300;

async function main() {
  await dataSource.initialize();
  const app = express();
  const httpServer = createServer(app);

  // Initialiser le service WebSocket
  const webSocketService = new WebSocketService(httpServer);

  app.use(cors({ origin: '*' }));
  app.use(express.json());
  app.use('/dist/images', express.static(path.join(__dirname, 'images')));

  const secretKey = process.env.JWT_SECRET;
  if (!secretKey) {
    console.error("La clé secrète JWT n'est pas définie.");
    process.exit(1);
  }

  // Routes publiques (sans authentification)
  app.get("/", (req, res) => res.send("Hello world!!!! v3 - With Party Support"));

  // Routes d'authentification (publiques)
  app.post("/user/register", async (req, res) => {
    try {
      const { name, email, password, repassword } = req.body;
      
      if (!name && !email && !password && !repassword) {
        return res.status(400).json({ 
          error: "All fields are required: name, email, password, repassword" 
        });
      }

      const result = await User.verifyUserCreation(name, email, password, repassword);
      
      if (result.code) {
        return res.status(result.code).json({ error: result.message });
      }
      
      const { password: _, ...userWithoutPassword } = result;
      res.status(201).json({
        message: "User created successfully",
        user: userWithoutPassword
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.post("/user/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      
      const token = await User.loginUser(email, password);
      
      if (!token) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      const userInfo = User.getUserFromToken(token);
      
      res.json({
        message: "Login successful",
        token,
        user: {
          id: userInfo?.userId,
          email: userInfo?.email,
          name: userInfo?.name
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Routes protégées (avec authentification)
  app.get("/user/profile", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;
      const user = await User.findOneBy({ id: userId });
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { password: _, ...userProfile } = user;
      res.json(userProfile);
    } catch (error) {
      console.error("Profile error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.get("/user/token", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      res.json({
        message: "Token is valid",
        user: req.user
      });
    } catch (error) {
      console.error("Token validation error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Routes wallpaper (peuvent être protégées ou non selon vos besoins)
  app.post("/wallpaper", async (req, res) => {
    try {
      await Wallpaper.fetchFromSpotlightV4();
      res.json({ message: "Wallpaper fetched and saved successfully." });
    } catch (error) {
      console.error("Error fetching wallpaper:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.post("/wallpaper/bulk", async (req, res) => {
    const times = req.body.times ?? 10;
    try {
      for (let i = 0; i < times; i++) await Wallpaper.fetchFromSpotlightV4();
      res.json({ message: `${times} wallpapers fetched and saved.` });
    } catch (error) {
      console.error("Error in bulk wallpaper fetch:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Nouvelle route pour mettre à jour les tags
  app.post("/wallpaper/update-tags", async (req, res) => {
    try {
      await Wallpaper.updateAllTags();
      res.json({ message: "All wallpaper tags updated successfully." });
    } catch (error) {
      console.error("Error updating tags:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Route pour récupérer les wallpapers par tags
  app.get("/wallpaper/by-tags", async (req, res) => {
    try {
      const { tags } = req.query;
      if (!tags) {
        return res.status(400).json({ error: "Tags parameter is required" });
      }
      
      const tagArray = typeof tags === 'string' ? tags.split(',') : tags as string[];
      const wallpapers = await Wallpaper.getByTags(tagArray);
      
      res.json({
        tags: tagArray,
        count: wallpapers.length,
        wallpapers: wallpapers.map(w => Wallpaper.formatWallpaperInfo(w))
      });
    } catch (error) {
      console.error("Error fetching wallpapers by tags:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Route pour récupérer les wallpapers par continent
  app.get("/wallpaper/by-continent/:continent", async (req, res) => {
    try {
      const { continent } = req.params;
      const wallpapers = await Wallpaper.getByContinent(continent);
      
      res.json({
        continent,
        count: wallpapers.length,
        wallpapers: wallpapers.map(w => Wallpaper.formatWallpaperInfo(w))
      });
    } catch (error) {
      console.error("Error fetching wallpapers by continent:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Route pour récupérer tous les tags disponibles
  app.get("/wallpaper/tags", async (req, res) => {
    try {
      const wallpapers = await Wallpaper.getAll();
      const allTags = new Set<string>();
      
      wallpapers.forEach(wallpaper => {
        if (wallpaper.tags) {
          wallpaper.tags.forEach(tag => allTags.add(tag));
        }
      });
      
      const tagsByCategory = {
        continents: ['Europe', 'Americas', 'Asia', 'Africa', 'Oceania', 'World'],
        countries: Array.from(allTags).filter(tag => 
          !['Europe', 'Americas', 'Asia', 'Africa', 'Oceania', 'World'].includes(tag)
        ).sort(),
        all: Array.from(allTags).sort()
      };
      
      res.json(tagsByCategory);
    } catch (error) {
      console.error("Error fetching tags:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Route pour récupérer les maps disponibles
  app.get("/maps", async (req, res) => {
    try {
      const wallpapers = await Wallpaper.getAll();
      const regionCounts = new Map<string, number>();
      
      wallpapers.forEach(wallpaper => {
        if (wallpaper.tags) {
          wallpaper.tags.forEach(tag => {
            if (['Europe', 'Americas', 'Asia', 'Africa', 'Oceania', 'World'].includes(tag)) {
              regionCounts.set(tag, (regionCounts.get(tag) || 0) + 1);
            }
          });
        }
      });

      const maps = Array.from(regionCounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => {
          if (a.name === 'World') return -1;
          if (b.name === 'World') return 1;
          return b.count - a.count;
        });
      
      res.json(maps);
    } catch (error) {
      console.error("Error fetching maps:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.get("/wallpaper/test", async (req, res) => {
    try {
      const wallpaper = await Wallpaper.buildRandomWallpaper();
      res.json(wallpaper);
    } catch (error) {
      console.error("Error fetching test wallpaper:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Routes du jeu (solo et party) - Nouveau contrôleur unifié
  app.use("/game", gameRouter);

  // Route pour les statistiques WebSocket
  app.get("/websocket/stats", (req, res) => {
    res.json(webSocketService.getStats());
  });

  // Route de santé pour vérifier le statut du serveur
  app.get("/health", (req, res) => {
    res.json({
      status: "OK",
      timestamp: new Date().toISOString(),
      services: {
        database: "connected",
        websocket: "active"
      }
    });
  });

  httpServer.listen(PORT, () => {
    console.log(`🚀 Server v3 listening on port ${PORT}`);
    console.log(`📡 WebSocket server active`);
    console.log(`🎮 Solo and Party games supported`);
    console.log(`🗄️ Database connected`);
  });
}

main().catch(error => {
  console.error("Failed to start server:", error);
  process.exit(1);
});