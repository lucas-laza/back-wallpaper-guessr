import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import fetch from 'node-fetch';
import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Wallpaper extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column()
  img!: string;

  @Column({ nullable: true })
  image_link?: string;

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

  // Nouveau champ tags pour les maps/continents
  @Column({ type: 'json', nullable: false, default: '[]' })
  tags!: string[];

  // Mapping des pays vers les continents
  private static readonly COUNTRY_TO_CONTINENT: { [key: string]: string } = {
    // Europe
    'FRA': 'Europe', 'DEU': 'Europe', 'ITA': 'Europe', 'ESP': 'Europe', 'GBR': 'Europe',
    'PRT': 'Europe', 'NLD': 'Europe', 'BEL': 'Europe', 'CHE': 'Europe', 'AUT': 'Europe',
    'GRC': 'Europe', 'POL': 'Europe', 'CZE': 'Europe', 'HUN': 'Europe', 'SVK': 'Europe',
    'SVN': 'Europe', 'HRV': 'Europe', 'SRB': 'Europe', 'BGR': 'Europe', 'ROU': 'Europe',
    'UKR': 'Europe', 'BLR': 'Europe', 'LTU': 'Europe', 'LVA': 'Europe', 'EST': 'Europe',
    'RUS': 'Europe', 'NOR': 'Europe', 'SWE': 'Europe', 'FIN': 'Europe', 'DNK': 'Europe',
    'ISL': 'Europe', 'IRL': 'Europe', 'MKD': 'Europe', 'ALB': 'Europe', 'MNE': 'Europe',
    'BIH': 'Europe', 'LUX': 'Europe', 'MLT': 'Europe', 'CYP': 'Europe', 'AND': 'Europe',
    'MCO': 'Europe', 'SMR': 'Europe', 'VAT': 'Europe', 'LIE': 'Europe',

    // Americas
    'USA': 'Americas', 'CAN': 'Americas', 'MEX': 'Americas', 'BRA': 'Americas', 'ARG': 'Americas',
    'CHL': 'Americas', 'COL': 'Americas', 'PER': 'Americas', 'VEN': 'Americas', 'ECU': 'Americas',
    'BOL': 'Americas', 'PRY': 'Americas', 'URY': 'Americas', 'GUY': 'Americas', 'SUR': 'Americas',
    'GUF': 'Americas', 'CRI': 'Americas', 'PAN': 'Americas', 'NIC': 'Americas', 'HND': 'Americas',
    'GTM': 'Americas', 'BLZ': 'Americas', 'SLV': 'Americas', 'CUB': 'Americas', 'JAM': 'Americas',
    'HTI': 'Americas', 'DOM': 'Americas', 'PRI': 'Americas', 'TTO': 'Americas', 'BRB': 'Americas',

    // Asia
    'CHN': 'Asia', 'IND': 'Asia', 'JPN': 'Asia', 'KOR': 'Asia', 'PRK': 'Asia', 'THA': 'Asia',
    'VNM': 'Asia', 'MYS': 'Asia', 'IDN': 'Asia', 'PHL': 'Asia', 'SGP': 'Asia', 'KHM': 'Asia',
    'LAO': 'Asia', 'MMR': 'Asia', 'BGD': 'Asia', 'PAK': 'Asia', 'AFG': 'Asia', 'IRN': 'Asia',
    'IRQ': 'Asia', 'SYR': 'Asia', 'TUR': 'Asia', 'ARM': 'Asia', 'AZE': 'Asia', 'GEO': 'Asia',
    'KAZ': 'Asia', 'KGZ': 'Asia', 'TJK': 'Asia', 'TKM': 'Asia', 'UZB': 'Asia', 'MNG': 'Asia',
    'NPL': 'Asia', 'BTN': 'Asia', 'LKA': 'Asia', 'MDV': 'Asia', 'BRN': 'Asia', 'TWN': 'Asia',
    'HKG': 'Asia', 'MAC': 'Asia', 'ISR': 'Asia', 'PSE': 'Asia', 'JOR': 'Asia', 'LBN': 'Asia',
    'SAU': 'Asia', 'ARE': 'Asia', 'QAT': 'Asia', 'BHR': 'Asia', 'KWT': 'Asia', 'OMN': 'Asia',
    'YEM': 'Asia',

    // Africa
    'EGY': 'Africa', 'LBY': 'Africa', 'TUN': 'Africa', 'DZA': 'Africa', 'MAR': 'Africa',
    'SDN': 'Africa', 'SSD': 'Africa', 'ETH': 'Africa', 'ERI': 'Africa', 'DJI': 'Africa',
    'SOM': 'Africa', 'KEN': 'Africa', 'UGA': 'Africa', 'TZA': 'Africa', 'RWA': 'Africa',
    'BDI': 'Africa', 'COD': 'Africa', 'COG': 'Africa', 'CAF': 'Africa', 'TCD': 'Africa',
    'CMR': 'Africa', 'NGA': 'Africa', 'NER': 'Africa', 'MLI': 'Africa', 'BFA': 'Africa',
    'GHA': 'Africa', 'CIV': 'Africa', 'LBR': 'Africa', 'SLE': 'Africa', 'GIN': 'Africa',
    'GNB': 'Africa', 'SEN': 'Africa', 'GMB': 'Africa', 'MRT': 'Africa', 'ZAF': 'Africa',
    'ZWE': 'Africa', 'BWA': 'Africa', 'NAM': 'Africa', 'AGO': 'Africa', 'ZMB': 'Africa',
    'MWI': 'Africa', 'MOZ': 'Africa', 'MDG': 'Africa', 'MUS': 'Africa', 'SYC': 'Africa',
    'COM': 'Africa', 'CPV': 'Africa', 'STP': 'Africa', 'GNQ': 'Africa', 'GAB': 'Africa',
    'LSO': 'Africa', 'SWZ': 'Africa',

    // Oceania
    'AUS': 'Oceania', 'NZL': 'Oceania', 'PNG': 'Oceania', 'FJI': 'Oceania', 'SLB': 'Oceania',
    'VUT': 'Oceania', 'NCL': 'Oceania', 'PYF': 'Oceania', 'WSM': 'Oceania', 'TON': 'Oceania',
    'KIR': 'Oceania', 'TUV': 'Oceania', 'NRU': 'Oceania', 'PLW': 'Oceania', 'FSM': 'Oceania',
    'MHL': 'Oceania', 'GUM': 'Oceania', 'COK': 'Oceania', 'NIU': 'Oceania'
  };

  static loadCountryData() {
    const countryDataRaw = fs.readFileSync('countries.json', 'utf8');
    return JSON.parse(countryDataRaw);
  }

  static async createNew(
    title: string,
    img: string,
    copyright: string,
    country: { code: string; text: string },
    state?: { code: string | undefined; text: string | undefined },
    imageLink?: string
  ): Promise<Wallpaper> {
    const wallpaper = new Wallpaper();
    wallpaper.title = title;
    wallpaper.img = img;
    wallpaper.image_link = imageLink;
    wallpaper.copyright = copyright;
    wallpaper.country = country;
    wallpaper.state = state;

    console.log("[CREATE] 🏷️ Génération des tags...");
    wallpaper.tags = wallpaper.generateTags();
    console.log("[CREATE] ✅ Tags générés:", wallpaper.tags);

    console.log("[CREATE] 💾 Enregistrement en base...");
    await wallpaper.save();
    console.log("[CREATE] ✅ Wallpaper enregistré avec ID:", wallpaper.id);

    return wallpaper;
  }

  /**
   * Génère automatiquement les tags basés sur le pays et l'état
   */
  private generateTags(): string[] {
    const tags: string[] = [];

    // Ajouter le continent basé sur le code pays
    const continent = Wallpaper.COUNTRY_TO_CONTINENT[this.country.code];
    if (continent) {
      tags.push(continent);
    } else {
      console.warn(`[TAGS] Continent non trouvé pour le pays: ${this.country.code} (${this.country.text})`);
      tags.push('World'); // Fallback
    }

    // Ajouter le nom du pays
    tags.push(this.country.text);

    // Ajouter l'état si disponible
    if (this.state && this.state.text) {
      tags.push(this.state.text);
    }

    // Ajouter le tag "World" pour tous les wallpapers
    if (!tags.includes('World')) {
      tags.push('World');
    }

    return tags;
  }

  /**
   * Met à jour les tags d'un wallpaper existant
   */
  async updateTags(): Promise<void> {
    this.tags = this.generateTags();
    await this.save();
  }

  static async fetchFromSpotlightV4(): Promise<void> {
    console.log("[SPOTLIGHT] 🔄 Lancement du fetch...");

    const imageDir = path.resolve(__dirname, '..', 'dist', 'images');
    if (!fs.existsSync(imageDir)) {
      console.log("[SPOTLIGHT] 📁 Création du dossier d'images...");
      fs.mkdirSync(imageDir, { recursive: true });
    }

    const response = await fetch(
      'https://fd.api.iris.microsoft.com/v4/api/selection?placement=88000820&bcnt=1&country=US&locale=en-US&fmt=json'
    );
    const data = await response.json();
    console.log("[SPOTLIGHT] ✅ Données API reçues");

    const rawItem = data?.batchrsp?.items?.[0]?.item;
    if (!rawItem) {
      console.error("[SPOTLIGHT] ❌ Aucun item trouvé dans la réponse API");
      throw new Error("No item found in API response");
    }

    const parsed = JSON.parse(rawItem);
    const ad = parsed.ad;

    const title = ad.title || "Untitled";
    const imgUrl = ad.landscapeImage?.asset;
    const copyright = ad.copyright || "© Microsoft";
    const hoverText = ad.iconHoverText || ad.description || title;

    console.log(`[SPOTLIGHT] 🖼️ Titre: ${title}`);
    console.log(`[SPOTLIGHT] 🌍 Texte de localisation : ${hoverText}`);
    console.log(`[SPOTLIGHT] 🔗 Image URL: ${imgUrl}`);

    if (!imgUrl) {
      console.error("[SPOTLIGHT] ❌ Pas d'URL image trouvée");
      throw new Error("Image URL not found");
    }

    const filename = path.basename(imgUrl.split('?')[0]);
    const localPath = path.join('dist/images', filename);
    const fullPath = path.resolve(__dirname, '..', localPath);

    console.log(`[SPOTLIGHT] 💾 Téléchargement de l'image vers ${localPath}`);
    await this.downloadImage(imgUrl, fullPath);

    const details = await this.getCountryOrStateDetails(hoverText);

    if (!details.country) {
      console.warn(`[SPOTLIGHT] ⚠️ Aucun pays détecté dans : "${hoverText}"`);
      return;
    }

    console.log(`[SPOTLIGHT] ✅ Pays détecté: ${details.country.text}`);
    if (details.state) {
      console.log(`[SPOTLIGHT] ✅ État détecté: ${details.state.text}`);
    }

    const existingWallpaper = await Wallpaper.findOne({ where: { title } });

    if (existingWallpaper) {
      console.log("[SPOTLIGHT] ⏩ Wallpaper déjà existant en base. Insertion ignorée.");
    } else {
      console.log("[SPOTLIGHT] ➕ Insertion du nouveau wallpaper...");
      const inserted = await this.createNew(title, localPath, copyright, details.country, details.state, imgUrl);
      console.log("[SPOTLIGHT] 🎉 Wallpaper inséré :", inserted);
    }
  }

  static async downloadImage(url: string, destination: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(destination);
      https.get(url, (response) => {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      }).on('error', (err) => {
        fs.unlink(destination, () => {});
        reject(err.message);
      });
    });
  }

  static async getAll(): Promise<Wallpaper[]> {
    return await this.find();
  }

  static async getCountryOrStateDetails(title: string): Promise<{ country: any, state: any | undefined }> {
    const countryData = Wallpaper.loadCountryData();
    
    for (const country of countryData) {
      if (title.includes(country.name)) {
        const foundState = country.states.find((state: { code: string, name: string }) => title.includes(state.name));
        return {
          country: { code: country.code3, text: country.name },
          state: foundState ? { code: foundState.code, text: foundState.name } : undefined
        };
      }
    }
  
    return { country: undefined, state: undefined };
  }

  // Méthodes de recherche par tags
  static async getByTags(tags: string[]): Promise<Wallpaper[]> {
    const wallpapers = await this.find();
    return wallpapers.filter(wallpaper => 
      tags.some(tag => wallpaper.tags.includes(tag))
    );
  }

  static async getByContinent(continent: string): Promise<Wallpaper[]> {
    return this.getByTags([continent]);
  }

  static async getByCountry(country: string): Promise<Wallpaper[]> {
    return this.getByTags([country]);
  }

  // Méthode pour mettre à jour tous les wallpapers existants avec les tags
  static async updateAllTags(): Promise<void> {
    console.log("[UPDATE_TAGS] 🔄 Mise à jour des tags pour tous les wallpapers...");
    const wallpapers = await this.find();
    
    for (const wallpaper of wallpapers) {
      await wallpaper.updateTags();
      console.log(`[UPDATE_TAGS] ✅ Tags mis à jour pour: ${wallpaper.title} - ${wallpaper.tags.join(', ')}`);
    }
    
    console.log(`[UPDATE_TAGS] 🎉 Terminé! ${wallpapers.length} wallpapers mis à jour.`);
  }

  static async buildRandomWallpaper(): Promise<Wallpaper | null> {
    const wallpapers = await Wallpaper.getAll();

    if (wallpapers.length === 0) {
      console.log("Aucun fond d'écran trouvé");
      return null;
    }

    const randomIndex = Math.floor(Math.random() * wallpapers.length);
    const randomWallpaper = wallpapers[randomIndex];

    // Retourner l'instance Wallpaper directement, pas un objet formaté
    return randomWallpaper;
  }

  static formatWallpaperInfo(wallpaper: any): any {
    const { title, country, state, img, copyright, tags } = wallpaper;
    const region = state ? `${country.text}, ${state.text}` : country.text;

    return {
      name: title,
      countryRegion: region,
      image: img,
      copyright,
      tags: tags || [],
      country: country.text,
      state: state?.text
    };
  }
}