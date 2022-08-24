import * as Locale from '../module/localize.js'
import config from '../../config/settings.json' assert {type: "json"};

export class UserInteraction {
    constructor(connection, interaction, emojis) {
        this.connection = connection;
        this.interaction = interaction;
        this.emojis = emojis;
    }

    localeMessage(message, args = []) {
        return Locale.getLocaleMessageGuild(this.connection, this.interaction.guildId ?? "", message, args);
    }
    localeTime(date) {
        return Locale.getTimeAgoLocaleGuild(this.connection, this.interaction.guildId ?? "", +date);
    }

    config = config;
}

export class CommandUserInteraction extends UserInteraction {
    constructor(connection, interaction, emojis) {
        super(connection, interaction, emojis);
    }
}

export class ButtonUserInteraction extends UserInteraction {
    constructor(connection, interaction, emojis, customData = interaction.customId.split("||")[1].split(":").slice(1)) {
        super(connection, interaction, emojis);
        this.customData = customData;
    }
}

export class MenuUserInteraction extends UserInteraction {
    constructor(connection, interaction, emojis, customData = interaction.customId.split("||")[1].split(":").slice(1)) {
        super(connection, interaction, emojis);
        this.customData = customData;
    }
}