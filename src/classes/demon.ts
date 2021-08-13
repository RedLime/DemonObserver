import { GDLevelData } from "../module/notify";


type DifficultyText = 'hard' | 'easy' | 'medium' | 'insane' | 'extreme';

export default class Demon {
    id: number;
    name: String;
    description: String;
    version: number;
    author: String;
    playerID: number;
    downloads: number;
    likes: number;
    length: number;
    gameVersion: number;
    coins: number;
    verifiedCoins: boolean;
    difficulty: number;
    cp: number;
    isDemon: boolean;
    
    constructor(lvl: GDLevelData, authorName: String) {
        const creatorPoint = (+lvl[18] > 0 ? 1 : 0) + (+lvl[19] > 0 ? 1 : 0) + (+lvl[42] > 0 ? 1 : 0);
        this.id = +lvl[1];
        this.name = lvl[2];
        this.description = Buffer.from((lvl[3] || ""), "base64").toString() || "";
        this.version = +lvl[5];
        this.author = authorName;
        this.playerID = +lvl[6];
        this.downloads = +lvl[10];
        this.likes = +lvl[14];
        this.length = +lvl[15];
        this.gameVersion = +lvl[13];
        this.coins = +lvl[37];
        this.verifiedCoins = (+lvl[38] > 0);
        this.difficulty = +lvl[43];
        this.cp = creatorPoint;
        this.isDemon = lvl[17] ? true : false;
    }

    
    static getIngameVersion(version: number) {
        if (version > 17) return (version / 10).toFixed(1);
        else if (version == 11) return "1.8";
        else if (version == 10) return "1.7";
        else return "1."+(version-1);
    }

    getIngameVersion() {
        return Demon.getIngameVersion(this.version);
    }

    static getDifficultyText(difficulty: number): DifficultyText {
        switch (difficulty) {
            case 3: return 'easy';
            case 4: return 'medium';
            case 5: return 'insane';
            case 6: return 'extreme';
            default: return 'hard';
        }
    }

    static getRateEmojiText(difficulty: number, cp: number): string {
        return (Demon.getDifficultyText(difficulty) + "_DEMON" + (cp < 2 ? "" : "_"+Demon.getRateText(cp))).toUpperCase();
    }


    static getDifficultyNumber(string: string): 0 | 3 | 4 | 5 | 6 {
        switch (string) {
            case 'easy': return 3;
            case 'medium': return 4;
            case 'insane': return 5;
            case 'extreme': return 6;
            default: return 0;
        }
    }

    getDifficultyText() {
        return Demon.getDifficultyText(this.difficulty);
    }

    static getDifficultyFullText(difficulty: number): string {
        const diff = Demon.getDifficultyText(difficulty);
        return diff.substring(0, 1).toUpperCase() + diff.substring(1, diff.length) + " Demon";
    }

    getDifficultyFullText() {
        return Demon.getDifficultyFullText(this.difficulty);
    }

    static getLengthText(length: number): string {
        return ['Tiny', 'Short', 'Medium', 'Long', 'XL'][length];
    }

    getLengthText() {
        return Demon.getLengthText(this.length);
    }

    static getRateText(cp: number): string {
        return ['', '', 'Featured', 'Epic'][cp];
    }

    getRateText() {
        return Demon.getRateText(this.cp);
    }

    static getRateBrowserText(difficulty: number, cp: number) {
        return "demon-"+Demon.getDifficultyText(difficulty)+(cp > 1 ? "-"+Demon.getRateText(cp).toLowerCase() : "");
    }

    getRateBrowserText() {
        return Demon.getRateBrowserText(this.difficulty, this.cp);
    }
}