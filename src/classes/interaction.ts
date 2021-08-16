import { ButtonInteraction, CommandInteraction, Interaction, SelectMenuInteraction } from "discord.js";
import { Pool } from "mysql2/promise";
import * as Locale from '../module/localize'
import config from '../../config/settings.json';

export abstract class UserInteraction {
    constructor(public connection: Pool, public interaction: Interaction, public emojis: any) {}

    localeMessage(message: string, args: Array<any> = []) {
        return Locale.getLocaleMessageGuild(this.connection, this.interaction.guildId ?? "", message, args);
    }
    localeTime(date: Date) {
        return Locale.getTimeAgoLocaleGuild(this.connection, this.interaction.guildId ?? "", +date);
    }

    config = config;

    abstract execute(): void
}

export abstract class CommandUserInteraction extends UserInteraction {
    constructor(public connection: Pool, public interaction: CommandInteraction, public emojis: any) {
        super(connection, interaction, emojis);
    }
}

export abstract class ButtonUserInteraction extends UserInteraction {
    constructor(public connection: Pool, public interaction: ButtonInteraction, public emojis: any, public customData = interaction.customId.split("||")[1].split(":").slice(1)) {
        super(connection, interaction, emojis);
    }
}

export abstract class MenuUserInteraction extends UserInteraction {
    constructor(public connection: Pool, public interaction: SelectMenuInteraction, public emojis: any, public customData = interaction.customId.split("||")[1].split(":").slice(1)) {
        super(connection, interaction, emojis);
    }
}