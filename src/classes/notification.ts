import Demon from "./demon";
import config from '../../config/settings.json';
import Discord from "discord.js";
import * as Locale from '../module/localize'
import mysql, { RowDataPacket } from 'mysql2/promise'

export interface Notification {
    demon: Demon | RowDataPacket
    getType(): NotificationType
    convertEmbed(connection: mysql.Pool, guild_id: string | number): Promise<Discord.MessageEmbed>
}
export class AwardNotification implements Notification {
    constructor(public demon: Demon, public count: number) {}
    
    public getType() {
        return NotificationType.AWARDED
    }

    public async convertEmbed(connection: mysql.Pool, guild_id: string | number) {
        return new Discord.MessageEmbed()
        .setAuthor("DemonObserver", config.icon_url)
        .setTitle(await Locale.getLocaleMessageGuild(connection, guild_id, "MESSAGE_NEW_AWARDED_DEMON", [this.count]))
        .addField(await Locale.getLocaleMessageGuild(connection, guild_id, "LEVEL_INFO"), `ID : __${this.demon.id}__ (**${this.demon.name}** by ${this.demon.author})`)
        .addField(await Locale.getLocaleMessageGuild(connection, guild_id, "DIFFICULTY"), this.demon.getDifficultyFullText())
        .setColor('#ffd359')
        .setThumbnail(`https://gdbrowser.com/assets/difficulties/${this.demon.getRateBrowserText()}.png`)
        .setTimestamp();
    }
}
export class UnrateNotification implements Notification {
    constructor(public demon: RowDataPacket) {}
    
    public getType() {
        return NotificationType.UNRATED
    }

    public async convertEmbed(connection: mysql.Pool, guild_id: string | number) {
        return new Discord.MessageEmbed()
        .setAuthor("DemonObserver", config.icon_url)
        .setTitle(await Locale.getLocaleMessageGuild(connection, guild_id, "MESSAGE_UNRATED_DEMON"))
        .addField(await Locale.getLocaleMessageGuild(connection, guild_id, "LEVEL_INFO"), `ID : __${this.demon.level_id}__ (**${this.demon.level_name}** by ${this.demon.author_name})`)
        .setColor('#d32256')
        .setThumbnail(`https://gdbrowser.com/assets/difficulties/unrated.png`)
        .setTimestamp();
    }
}
export class UpdateNotification implements Notification {
    constructor(public demon: Demon, public prevVersion: number, public currVersion: number) {}
    
    public getType() {
        return NotificationType.UPDATED
    }

    public async convertEmbed(connection: mysql.Pool, guild_id: string | number) {
        return new Discord.MessageEmbed()
        .setAuthor("DemonObserver", config.icon_url)
        .setTitle(await Locale.getLocaleMessageGuild(connection, guild_id, "MESSAGE_UPDATED_DEMON"))
        .addField(await Locale.getLocaleMessageGuild(connection, guild_id, "LEVEL_INFO"), `ID : __${this.demon.id}__ (**${this.demon.name}** by ${this.demon.author})`)
        .setColor('#9edb0f')
        .setThumbnail(`https://gdbrowser.com/assets/difficulties/${this.demon.getRateBrowserText()}.png`)
        .setTimestamp();
    }
}
export class RerateNotification implements Notification {
    constructor(public demon: Demon, public prevDifficulty: number, public currDifficulty: number) {}
    
    public getType() {
        return NotificationType.RERATED
    }

    public async convertEmbed(connection: mysql.Pool, guild_id: string | number) {
        return new Discord.MessageEmbed()
        .setAuthor("DemonObserver", config.icon_url)
        .setTitle(await Locale.getLocaleMessageGuild(connection, guild_id, "MESSAGE_CHANGE_DIFFICULTY_RATE_DEMON"))
        .addField(await Locale.getLocaleMessageGuild(connection, guild_id, "LEVEL_INFO"), `ID : __${this.demon.id}__ (**${this.demon.name}** by ${this.demon.author})`)
        .addField(await Locale.getLocaleMessageGuild(connection, guild_id, "DIFFICULTY"), `~~${Demon.getDifficultyFullText(this.prevDifficulty)}~~ <:pointer:861423467119247372> ${Demon.getDifficultyFullText(this.currDifficulty)}`)
        .setColor('#ae52ff')
        .setThumbnail(`https://gdbrowser.com/assets/difficulties/${this.demon.getRateBrowserText()}.png`)
        .setTimestamp();
    }
}
export enum NotificationType {
    AWARDED = "awarded",
    RERATED = "rerated",
    UPDATED = "updated",
    UNRATED = "unrated"
}
export type NotificationTypeKey = keyof typeof NotificationType;