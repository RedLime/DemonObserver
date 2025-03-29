import AboutCommand from './interactions/about.js'
import config from '../../config/settings.json' assert {type: "json"};
import sampleEmojis from '../../config/emojis.json' assert {type: "json"};
import DemonsCommand from './interactions/demons.js';
import Utils from './utils.js';
import RandomCommand from './interactions/random.js';
import { RecentButton, RecentCommand, RecentMenu } from './interactions/recent.js';
import { LevelButton, LevelCommand, LevelMenu } from './interactions/level.js';
import { ChallengeButton, ChallengeCommand, ChallengeMenu } from './interactions/challenge.js';
import { ConfigButton, ConfigCommand, ConfigMenu } from './interactions/config.js';

var lastLogMessage = ``;

const emojis = {
    ...sampleEmojis,
    id: {
        NEXT_PAGE: sampleEmojis.NEXT_PAGE,
        PREVIOUS_PAGE: sampleEmojis.PREVIOUS_PAGE
    },
    convertToID: (emoji) => {
        return emoji.replace('>','').split(":")[2];
    }
}


export default class InteractionManager {

    constructor(client, connection) {
        this.client = client;
        this.connection = connection;
    }

    async onCommand(interaction) {
        // Command log
        const logMessage = this.client.guilds.cache.get(interaction.guildId ?? "")?.name + '`('+interaction.guildId  +')`' + " perform command `/"+interaction.commandName+"`";
        const logChannel = this.client.channels.cache.get(config.command_log_channel)
        if (logChannel && Utils.isCanSend(this.client, logChannel) && lastLogMessage != logMessage) {
            logChannel.send(logMessage);
            lastLogMessage = logMessage;
        }

        await interaction.deferReply();

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
        if (interaction.commandName == "challenge" && interaction.guild) {
            new ChallengeCommand(this.connection, interaction, emojis).execute();
        }

        // config
        if (interaction.commandName == "config" && interaction.guild) {
            new ConfigCommand(this.connection, interaction, emojis).execute();
        }
    }

    async onClickedButton(interaction) {
        if (interaction.user.id != interaction.customId.split("||")[0]) {
            return;
        } 

        await interaction.deferUpdate();
        
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

    async onClickedMenu(interaction) {
        if (interaction.user.id != interaction.customId.split("||")[0]) {
            return;
        } 
        
        await interaction.deferUpdate();
        
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