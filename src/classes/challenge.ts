import { Snowflake } from "discord.js";
import { Connection, FieldPacket, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import Demon from "./demon";


export default class Challenge {
    levels: string[];
    constructor(public connection: Connection, public id: number, public owner: Snowflake, public status: ChallengeStatus, levels: string, public filter: ChallengeFilter, public currSkips: number, public maxSkips: number, public createDate: Date, public score: number) {
        this.levels = levels ? levels.split(",") : [];
    }

    static async create(connection: Connection, user: Snowflake, filter: ChallengeFilter, skips: number = 0) {
        const [result] = <[ResultSetHeader, FieldPacket[]]> await connection.query(
            `INSERT INTO challenges (demon_filter, user, max_skips) VALUES ('${filter}', '${user}', '${skips}')`
        );
        return new Challenge(connection, +result.insertId, user, ChallengeStatus.PROCESS, "", filter, 0, skips, new Date(), 0);
    }
    static async findById(connection: Connection, id: number) {
        const [result] = <RowDataPacket[][]> await connection.query(
            `SELECT * FROM challenges WHERE challenge_id = '${id}'`
        );
        if (result.length) {
            return new Challenge(connection, id, result[0].user, result[0].status, result[0].levels, result[0].demon_filter, result[0].current_skips, result[0].max_skips, new Date(Date.parse(result[0].created_timestamp)), result[0].score);
        } else {
            return undefined;
        }
    }
    static async findCurrentByUser(connection: Connection, user: Snowflake) {
        const [result] = <RowDataPacket[][]> await connection.query(
            `SELECT * FROM challenges WHERE user = '${user}' AND status = '${ChallengeStatus.PROCESS}'`
        );
        if (result.length) {
            return new Challenge(connection, result[0].challenge_id, user, result[0].status, result[0].levels, result[0].demon_filter, result[0].current_skips, result[0].max_skips, new Date(Date.parse(result[0].created_timestamp)), result[0].score);
        } else {
            return undefined;
        }
    }
    static filterToString(type: ChallengeFilter) {
        if (type == ChallengeFilter.ALL) return "All";
        if (type == ChallengeFilter.POINTERCRATE) return "Pointercrate List";
        else return Demon.getDifficultyFullText(type);
    }

    private getFilterString() {
        if (this.filter == ChallengeFilter.ALL) {
            return '1';
        } else if (this.filter == ChallengeFilter.POINTERCRATE) {
            return `rank_pointercrate > 0`
        } else {
            return `difficulty = ${this.filter}`
        }
    }

    private async getNewLevel(isSkip: boolean) {
        const [[resultDemons]] = <RowDataPacket[][]> await this.connection.query(
            `SELECT level_id FROM gd_demons 
             WHERE level_id NOT IN (${this.levels.join(",") || "0"}) AND ${this.getFilterString()} ORDER BY RAND() LIMIT 1`
            );
        this.levels.push(resultDemons.level_id);
        if (isSkip) this.currSkips++;
        await this.connection.query(
            `UPDATE challenges SET levels = '${this.levels.join(",")}'${isSkip ? ", current_skips = current_skips + 1" : ""}, score = '${this.score}'
             WHERE challenge_id = ${this.id}`
            );
    }

    async rerollLevel(count: boolean = true) {
        if (count && this.currSkips == this.maxSkips) return;
        if (this.levels.length) {
            this.levels.pop();
            await this.getNewLevel(count);
        }
    }

    async nextLevel() {
        await this.updateScore();
        if (this.levels.length == 100) {
            this.status = ChallengeStatus.COMPLETE;
            await this.connection.query(
                `UPDATE challenges SET status = '${this.status}' WHERE challenge_id = ${this.id}`
            );
            return;
        } 
        await this.getNewLevel(false);
    }

    async stopChallenge() {
        this.status = ChallengeStatus.STOP;
        await this.connection.query(
            `UPDATE challenges SET status = '${this.status}' WHERE challenge_id = ${this.id}`
        );
    }

    remainSkips() {
        return this.maxSkips - this.currSkips;
    }

    private async updateScore() {
        if (this.levels.length) {
            const [[resultDemons]] = <RowDataPacket[][]> await this.connection.query(
                `SELECT difficulty, rank_pointercrate FROM gd_demons 
                 WHERE level_id = '${[...this.levels].reverse()[0]}'`
                );
            if (resultDemons.difficulty == 3) this.score += 0.7;
            if (resultDemons.difficulty == 4) this.score += 0.85;
            if (resultDemons.difficulty == 0) this.score += 1.0;
            if (resultDemons.difficulty == 5) this.score += 1.25;
            if (resultDemons.difficulty == 6) this.score += 1.5;
            if (resultDemons.rank_pointercrate) this.score += 1-(resultDemons.rank_pointercrate/151);
        }
    }
}

export enum ChallengeStatus {
    PROCESS = 0, STOP = 1, COMPLETE = 2
}
export enum ChallengeFilter {
    HARD = 0, ALL = 1, POINTERCRATE = 2, EASY = 3, MEDIUM = 4, INSANE = 5, EXTREME = 6 
}