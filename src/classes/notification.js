import Demon from "./demon.js";
import config from '../../config/settings.json' assert {type: "json"};
import Discord from "discord.js";
import * as Locale from '../module/localize.js'

// export interface Notification {
//     demon: Demon | RowDataPacket
//     getType(): NotificationType
//     convertEmbed(connection: mysql.Pool, guild_id: string | number): Promise<Discord.MessageEmbed>
// }

export class AwardNotification {
    constructor(demon, count) {
        this.demon = demon;
        this.count = count;
    }
    
    getType() {
        return NotificationType.AWARDED
    }

    async convertEmbed(connection, guild_id) {
        return new Discord.MessageEmbed()
        .setAuthor({ name: 'DemonObserver', iconURL: config.icon_url})
        .setTitle(await Locale.getLocaleMessageGuild(connection, guild_id, "MESSAGE_NEW_AWARDED_DEMON", [this.count]))
        .addFields(
            {
                name: await Locale.getLocaleMessageGuild(connection, guild_id, "LEVEL_INFO"),
                value: `ID : __${this.demon.id}__ (**${this.demon.name}** by ${this.demon.author})`
            },
            {
                name: await Locale.getLocaleMessageGuild(connection, guild_id, "DIFFICULTY"),
                value: this.demon.getDifficultyFullText()
            },
        )
        .setColor('#ffd359')
        .setThumbnail(`https://gdbrowser.com/assets/difficulties/${this.demon.getRateBrowserText()}.png`)
        .setTimestamp();
    }
}
export class UnrateNotification {
    constructor(demon) {
        this.demon = demon;
    }
    
    getType() {
        return NotificationType.UNRATED
    }

    async convertEmbed(connection, guild_id) {
        return new Discord.MessageEmbed()
        .setAuthor({ name: 'DemonObserver', iconURL: config.icon_url})
        .setTitle(await Locale.getLocaleMessageGuild(connection, guild_id, "MESSAGE_UNRATED_DEMON"))
        .addFields(
            {
                name: await Locale.getLocaleMessageGuild(connection, guild_id, "LEVEL_INFO"), 
                value: `ID : __${this.demon.level_id}__ (**${this.demon.level_name}** by ${this.demon.author_name})`
            }
        )
        .setColor('#d32256')
        .setThumbnail(`https://gdbrowser.com/assets/difficulties/unrated.png`)
        .setTimestamp();
    }
}
export class UpdateNotification {
    constructor(demon, prevVersion, currVersion) {
        this.demon = demon;
        this.prevVersion = prevVersion;
        this.currVersion = currVersion;
    }
    
    getType() {
        return NotificationType.UPDATED
    }

    async convertEmbed(connection, guild_id) {
        return new Discord.MessageEmbed()
        .setAuthor({ name: 'DemonObserver', iconURL: config.icon_url})
        .setTitle(await Locale.getLocaleMessageGuild(connection, guild_id, "MESSAGE_UPDATED_DEMON"))
        .addFields(
            {
                name: await Locale.getLocaleMessageGuild(connection, guild_id, "LEVEL_INFO"), 
                value: `ID : __${this.demon.id}__ (**${this.demon.name}** by ${this.demon.author})`
            }
        )
        .setColor('#9edb0f')
        .setThumbnail(`https://gdbrowser.com/assets/difficulties/${this.demon.getRateBrowserText()}.png`)
        .setTimestamp();
    }
}
export class RerateNotification {
    constructor(demon, prevDifficulty, currDifficulty) {
        this.demon = demon;
        this.prevDifficulty = prevDifficulty;
        this.currDifficulty = currDifficulty;
    }
    
    getType() {
        return NotificationType.RERATED
    }

    async convertEmbed(connection, guild_id) {
        return new Discord.MessageEmbed()
        .setAuthor({ name: 'DemonObserver', iconURL: config.icon_url})
        .setTitle(await Locale.getLocaleMessageGuild(connection, guild_id, "MESSAGE_CHANGE_DIFFICULTY_RATE_DEMON"))
        .addFields(
            {
                name: await Locale.getLocaleMessageGuild(connection, guild_id, "LEVEL_INFO"), 
                value: `ID : __${this.demon.id}__ (**${this.demon.name}** by ${this.demon.author})`
            },
            {
                name: await Locale.getLocaleMessageGuild(connection, guild_id, "DIFFICULTY"),
                value: `~~${Demon.getDifficultyFullText(this.prevDifficulty)}~~ <:pointer:861423467119247372> ${Demon.getDifficultyFullText(this.currDifficulty)}`
            }
        )
        .setColor('#ae52ff')
        .setThumbnail(`https://gdbrowser.com/assets/difficulties/${this.demon.getRateBrowserText()}.png`)
        .setTimestamp();
    }
}

export const NotificationType = {
    AWARDED: "awarded",
    RERATED: "rerated",
    UPDATED: "updated",
    UNRATED: "unrated"
}
// export type NotificationTypeKey = keyof typeof NotificationType;