import * as fs from 'fs';
import { BaseEntity, Column, Entity, Long, PrimaryGeneratedColumn } from "typeorm";

interface ApiResponse {
  batchrsp: {
    items: Array<{
      item: string;
    }>;
  };
}

interface ItemDetails {
  ad: {
    title_text: {
      tx: string;
    };
    image_fullscreen_001_landscape: {
      u: string;
    };
    copyright_text: {
      tx: string;
    };
  };
}

@Entity()
export class Wallpaper extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column()
  img!: string;

  @Column()
  copyright!: string;

  @Column({ type: 'json', nullable: false })
  country!: {
    code: string;
    text: string;
  };

  @Column({ type: 'json', nullable: true })
  state?: {
    code: string | undefined;
    text: string | undefined;
  };

  @Column({ type: 'json', nullable: true })
  coords?: {
    lat: string | undefined;
    lon: string | undefined;
  };

  static loadCountryData() {
    const countryDataRaw = fs.readFileSync('countries.json', 'utf8');
    return JSON.parse(countryDataRaw);
  }

  static async createNew(title: string, img: string, copyright: string, country: { code: string; text: string }, state?: { code: string | undefined; text: string | undefined }): Promise<Wallpaper> {
    const wallpaper = new Wallpaper();
    wallpaper.title = title;
    wallpaper.img = img;
    wallpaper.copyright = copyright;
    wallpaper.country = country;
    wallpaper.state = state;

    wallpaper.setCoordinates();

    await wallpaper.save();

    return wallpaper;
  }

  static async getAll(): Promise<Wallpaper[]> {
    return await this.find();
  }

  static async fetchImage(set: number = 209567): Promise<boolean> {
    try {
      const response = await fetch(`https://arc.msn.com/v3/Delivery/Placement?pid=${set}&fmt=json&rafb=0&ua=WindowsShellClient%2F0&cdm=1&disphorzres=9999&dispvertres=9999&lo=80217&pl=en-US&lc=en-US&ctry=us&time=2020-12-31T23:59:59Z`);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json() as ApiResponse;

      for (const item of data.batchrsp.items) {
        const fitem: ItemDetails = JSON.parse(item.item);
        const details = await Wallpaper.getCountryOrStateDetails(fitem.ad.title_text.tx);

        
        if (details.country) {
          const existingWallpaper = await Wallpaper.findOne({
            where: { title: fitem.ad.title_text.tx },
          });
          
          if (!existingWallpaper) {
            await Wallpaper.createNew(
              fitem.ad.title_text.tx,
              fitem.ad.image_fullscreen_001_landscape.u,
              fitem.ad.copyright_text.tx,
              details.country,
              details.state
            );
          }
        }
      }

      return true;
    } catch (error) {
      console.error("Fetch error:", error);
      throw error; 
    }
  }

  static async callFetchImageMultipleTimes(times: number = 300): Promise<string> {
    try {
      const fetchPromises = [];
      for (let i = 0; i < times; i++) {
        fetchPromises.push(Wallpaper.fetchImage());
      } 

      await Promise.all(fetchPromises);

      return "ok";
    } catch (error) {
      console.error("Error during multiple fetchImage calls:", error);
      throw error;
    }
  }

  static async getCountryOrStateDetails(title: string): Promise<{ country: any, state: any | undefined }> {
    const countryData = Wallpaper.loadCountryData();
    
    for (const country of countryData) {
      if (title.includes(country.name)) {
        // Country found, now check for the state
        const foundState = country.states.find((state: { code: string, name: string }) => title.includes(state.name));
  
        return {
          country: { code: country.code3, text: country.name },
          state: foundState ? { code: foundState.code, text: foundState.name } : undefined
        };
      }
    }
  
    return { country: undefined, state: undefined };
  }

  static async addCoords(): Promise<any> {
    const wallpapers = await Wallpaper.getAll();

    for (const wallpaper of wallpapers) {
      await wallpaper.setCoordinates();
      wallpaper.save();
    }
  }

  async setCoordinates(): Promise<any> {
    const query1 = this.title;
    const query2 = this.state?.text ?? this.country.text;

    const queries = [query1, query2];

    for (const query of queries) {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;

        try {
            const response = await fetch(url, { headers: { 'User-Agent': 'WallpaperGuessr-dev' } });
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();

            if (data && data.length > 0) {
                this.coords = {
                    lat: data[0].lat,
                    lon: data[0].lon
                };
                console.log(query1, query2, this.coords);
                
                return true; // Coordonnées trouvées, sortie de la fonction
            }
        } catch (error) {
            console.error("Fetch error:", error);
            // Continue avec la prochaine requête en cas d'erreur
        }
    }

    // Aucun résultat trouvé pour les deux requêtes
    throw new Error('No results found');
  }


  static async buildRandomWallpaper() {
    const wallpapersObject = await Wallpaper.getAll();
    
    // Convertir les valeurs de l'objet en un tableau
    const wallpapersArray = Object.values(wallpapersObject);

    if (wallpapersArray.length === 0) {
        console.log("Aucun fond d'écran trouvé");
        return;
    }

    // Obtenir un élément aléatoire du tableau
    const randomIndex = Math.floor(Math.random() * wallpapersArray.length);
    const randomWallpaper = wallpapersArray[randomIndex];

    const formattedInfo = Wallpaper.formatWallpaperInfo(randomWallpaper);
    return formattedInfo;
  }

  static formatWallpaperInfo(wallpaper: any): any {
    const { title, country, state, img, copyright, coords } = wallpaper;
    const region = state ? `${country.text}, ${state}` : country.text;

    const gmapUrl = `https://www.google.com/maps?q=${coords.lat},${coords.lon}`;

    return {
      name: title,
      countryRegion: region,
      image: img,
      copyright: copyright,
      googleMapsUrl: gmapUrl
    };
  }
}
