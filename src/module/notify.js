import fetch from 'node-fetch';
import Demon from '../classes/demon.js';
import config from '../../config/settings.json' assert {type: "json"};

// export interface GDFilter {
//     secret?: string
//     gameVersion?: number
//     binaryVersion?: number
//     gdw?: number
//     diff?: number
//     page?: number
//     type?: number
//     str?: string
//     count?: number
//     len?: string
//     total?: number
//     uncompleted?: number
//     onlyCompleted?: number
//     featured?: number
//     original?: number
//     twoPlayer?: number
//     coins?: number
//     epic?: number
//     noStar?: number
//     completedLevels?: string

// }

function GDFilterToURLSearchParams(filter) {

    const result = new URLSearchParams();
    for (const [key, value] of Object.entries(filter)) {
        result.append(key, value);
    }

    return result;
}

// export interface GDAuthor {
//     [details: number] : string;
// } 

// export interface GDLevelData {
//     [details: number] : any;
// } 

// interface GJLevelsResult {
//     total: number
//     offset: number
//     levels: Array<Demon>
//     result: "block" | "error" | "success"
// } 

export default class Notify {

    static async getGJLevels(filter) {
        filter.secret = 'Wmfd2893gb7';
        filter.gameVersion ||= 21;
        filter.binaryVersion ||= 35;
        filter.gdw ||= 0;
        filter.len ||= "-";
        filter.total ||= 0;
        filter.uncompleted ||= 0;
        filter.onlyCompleted ||= 0;
        filter.featured ||= 0;
        filter.original ||= 0;
        filter.twoPlayer ||= 0;
        filter.coins ||= 0;
        filter.epic ||= 0;
    
        try {
            let rawData = await (await fetch(config.gd_server_search_url, { method: 'POST', body: GDFilterToURLSearchParams(filter) })).text();
            if (rawData.startsWith("<br />")) rawData = rawData.split("<br />").slice(2).join("<br />").trim();
            if (!rawData) {
                return { total: 0, offset: 0, levels: [], result: "block" };
            }
            if ( rawData == "-1") {
                return { total: 0, offset: 0, levels: [], result: "error" };
            }
    
            const gjData = rawData.split("#");
            const pageInfo = gjData[3].split(":");
    
            const result = { total: +pageInfo[0], offset: +pageInfo[1], result: "success", levels: [] };
            if (!gjData[0]) return result;
    
            const authors = gjData[1].split("|"), authorList = {};
            authors.forEach((x) => {
                if (x.startsWith('~')) return;
                let arr = x.split(':');
                authorList[+arr[0]] = arr[1];
            });
    
            result.levels = gjData[0].split("|").map((lvl) => {
                const levelRaw = lvl.split(":");
                let levelData = {};
                for (let i = 0; i < levelRaw.length; i += 2) {
                    levelData[+levelRaw[i]] = levelRaw[i+1];
                }
                return levelData;
            }).map((lvl) => new Demon(lvl, authorList[lvl[6]] ?? "-")).filter((lvl) => lvl != null);
    
            return result;
        } catch (err) {
            return { total: 0, offset: 0, levels: [], result: "error" };
        }
    }

    static async getPointercrateLevel(rank) {
        try {
            return await (await fetch('https://pointercrate.com/api/v2/demons/listed/?limit=100&after='+(rank*100))).json();
        } catch (err) {
            return [];
        }
    }
    
}