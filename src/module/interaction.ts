import { ButtonInteraction, Client, CommandInteraction, SelectMenuInteraction, TextChannel } from 'discord.js'
import { Connection } from 'mysql2/promise'
import AboutCommand from './interactions/about'
import config from '../../config/settings.json';
import sampleEmojis from '../../config/emojis.json';
import DemonsCommand from './interactions/demons';
import Utils from './utils';
import RandomCommand from './interactions/random';
import { RecentButton, RecentCommand, RecentMenu } from './interactions/recent';
import { LevelButton, LevelCommand, LevelMenu } from './interactions/level';
import { ChallengeButton, ChallengeCommand, ChallengeMenu } from './interactions/challenge';
import { ConfigButton, ConfigCommand, ConfigMenu } from './interactions/config';


const lastCmdLog = { id: "0", message: '', count: 0 };

const emojis = {
    RATED: sampleEmojis.RATED,
    UNRATED: sampleEmojis.UNRATED,
    EASY_DEMON: sampleEmojis.EASY_DEMON,
    EASY_DEMON_FEATURED: sampleEmojis.EASY_DEMON_FEATURED,
    EASY_DEMON_EPIC: sampleEmojis.EASY_DEMON_EPIC,
    MEDIUM_DEMON: sampleEmojis.MEDIUM_DEMON,
    MEDIUM_DEMON_FEATURED: sampleEmojis.MEDIUM_DEMON_FEATURED,
    MEDIUM_DEMON_EPIC: sampleEmojis.MEDIUM_DEMON_EPIC,
    HARD_DEMON: sampleEmojis.HARD_DEMON,
    HARD_DEMON_FEATURED: sampleEmojis.HARD_DEMON_FEATURED,
    HARD_DEMON_EPIC: sampleEmojis.HARD_DEMON_EPIC,
    INSANE_DEMON: sampleEmojis.INSANE_DEMON,
    INSANE_DEMON_FEATURED: sampleEmojis.INSANE_DEMON_FEATURED,
    INSANE_DEMON_EPIC: sampleEmojis.INSANE_DEMON_EPIC,
    EXTREME_DEMON: sampleEmojis.EXTREME_DEMON,
    EXTREME_DEMON_FEATURED: sampleEmojis.EXTREME_DEMON_FEATURED,
    EXTREME_DEMON_EPIC: sampleEmojis.EXTREME_DEMON_EPIC,
    ARROW: sampleEmojis.ARROW,
    NEXT_PAGE: sampleEmojis.NEXT_PAGE,
    PREVIOUS_PAGE: sampleEmojis.PREVIOUS_PAGE,
    UP: sampleEmojis.UP,
    DOWN: sampleEmojis.DOWN,
    GOLD_TROPY: sampleEmojis.GOLD_TROPY,
    EDIT: sampleEmojis.EDIT,
    CP: sampleEmojis.CP,
    id: {
        NEXT_PAGE: config.emoji_next_page,
        PREVIOUS_PAGE: config.emoji_prev_page
    },
    convertToID: (emoji: string) => {
        return emoji.replace('>','').split(":")[2];
    }
}


export default class InteractionManager {

    constructor(private client: Client, private connection: Connection) {}

    async onCommand(interaction: CommandInteraction) {
        // Command log
        const logMessage = this.client.guilds.cache.get(interaction.guildId ?? "")?.name + '`('+interaction.guildId  +')`' + " perform command `/"+interaction.commandName+"`";
        const logChannel = this.client.channels.cache.get(config.log_channel) as TextChannel | undefined
        if (logChannel && Utils.isCanSend(this.client, logChannel)) {
            if (lastCmdLog.message == logMessage) {
                logChannel?.messages.cache.get(lastCmdLog.id)?.edit(logMessage + ` [x${++lastCmdLog.count}]`);
            } else {
                lastCmdLog.id = (await logChannel?.send(logMessage))?.id ?? '0';
                lastCmdLog.message = logMessage;
                lastCmdLog.count = 1;
            }
        }

        // about , help
        if (interaction.commandName == "about" || interaction.commandName == "help") {
            new AboutCommand(this.connection, interaction, emojis).execute();
        }

        // demons
        if (interaction.commandName == "demons") {
            new DemonsCommand(this.connection, interaction, emojis).execute();
        }

        // random
        if (interaction.commandName == "random") {
            new RandomCommand(this.connection, interaction, emojis).execute();
        }

        // recent
        if (interaction.commandName == "recent") {
            new RecentCommand(this.connection, interaction, emojis).execute();
        }

        // level , demon
        if (interaction.commandName == "level" || interaction.commandName == "demon") {
            new LevelCommand(this.connection, interaction, emojis).execute();
        }

        // challenge
        if (interaction.commandName == "challenge") {
            new ChallengeCommand(this.connection, interaction, emojis).execute();
        }

        // config
        if (interaction.commandName == "config") {
            new ConfigCommand(this.connection, interaction, emojis).execute();
        }
    }

    async onClickedButton(interaction: ButtonInteraction) {
        
        if (interaction.user.id != interaction.customId.split("||")[0]) {
            interaction.deferUpdate();
            return;
        } 
        
        const interactionData = interaction.customId.split("||")[1].split(":");
        if (interactionData[0] == "recent") {
            new RecentButton(this.connection, interaction, emojis).execute();
        }
        if (interactionData[0] == "level") {
            new LevelButton(this.connection, interaction, emojis).execute();
        }
        if (interactionData[0] == "challenge") {
            new ChallengeButton(this.connection, interaction, emojis).execute();
        }
        if (interactionData[0] == "config") {
            new ConfigButton(this.connection, interaction, emojis).execute();
        }
    }

    async onClickedMenu(interaction: SelectMenuInteraction) {
        
        if (interaction.user.id != interaction.customId.split("||")[0]) {
            interaction.deferUpdate();
            return;
        } 
        
        const interactionData = interaction.customId.split("||")[1].split(":");
        if (interactionData[0] == "recent") {
            new RecentMenu(this.connection, interaction, emojis).execute();
        }
        if (interactionData[0] == "level") {
            new LevelMenu(this.connection, interaction, emojis).execute();
        }
        if (interactionData[0] == "challenge") {
            new ChallengeMenu(this.connection, interaction, emojis).execute();
        }
        if (interactionData[0] == "config") {
            new ConfigMenu(this.connection, interaction, emojis).execute();
        }
    }
} 