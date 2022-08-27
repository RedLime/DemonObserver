import { MessageActionRow, MessageButton, MessageEmbed, MessageSelectMenu, Permissions } from "discord.js";
import { ButtonUserInteraction, CommandUserInteraction, MenuUserInteraction } from "../../classes/interaction.js";
import { updateLocale } from "../localize.js";
import notifyChannels from '../../../config/channels.json' assert {type: "json"};


let notificationCommandId = 0;


export class ConfigCommand extends CommandUserInteraction {

    async execute() {
        if (!this.interaction.inGuild()) return;
        
        const [[serverConfig]] = await this.connection.query(
            `SELECT * FROM guild_settings WHERE guild_id = '${this.interaction.guildId}'`
        );
        const member = this.interaction.member;
        
        if (!member.permissions.has(Permissions.FLAGS.ADMINISTRATOR) && !(serverConfig.admin_role && member.roles.cache.has(serverConfig.admin_role))) {
            const title = serverConfig.admin_role && serverConfig.admin_role != "0" ? await this.localeMessage("MESSAGE_INVAILD_PERMISSION_ROLE", [serverConfig.admin_role]) : await this.localeMessage("MESSAGE_INVAILD_PERMISSION");
            this.interaction.editReply({ embeds: [new MessageEmbed()
                .setTitle(await this.localeMessage("ERROR")).setDescription(title).setColor([255,0,0])]})
            return;
        }


        if (this.interaction.options.getSubcommand() == "language") {
            const target = this.interaction.options.getString("set");
            if (target == undefined || target == null) {
                const embed = new MessageEmbed()
                    .setTitle(await this.localeMessage("MESSAGE_CURRENT_LANGUAGE") + ": " 
                    + (!serverConfig.language ? "English" : "한국어"));
                this.interaction.editReply({embeds: [embed]});
            } else {
                try {
                    updateLocale(this.connection, this.interaction.guildId, +target);
                    await this.connection.query(
                        `UPDATE guild_settings SET language = '${target}' WHERE guild_id = '${this.interaction.guildId}'`
                    );
                    
                    const embed = new MessageEmbed()
                        .setTitle(await this.localeMessage("MESSAGE_SUCCESS_CHANGE_LANGUAGE"))
                        .setColor([0,255,0]);
                    this.interaction.editReply({embeds: [embed]});
                } catch {
                    this.interaction.editReply({ embeds: [new MessageEmbed()
                        .setTitle(await this.localeMessage("ERROR")).setColor([255,0,0])]});
                }
            }
        }

        if (this.interaction.options.getSubcommand() == "adminrole") {
            const target = this.interaction.options.getRole("role", true);
            await this.connection.query(
                `UPDATE guild_settings SET admin_role = '${target.id}' WHERE guild_id = '${this.interaction.guildId}'`
            );
            
            const embed = new MessageEmbed()
                .setTitle(await this.localeMessage("MESSAGE_SUCCESS_SET_ADMINROLE"))
                .setColor([0,255,0]);
            this.interaction.editReply({embeds: [embed]});
        }

        if (this.interaction.options.getSubcommand() == "list") {
            if (!notificationCommandId) {
                const commands = await this.interaction.client.application.commands.fetch();
                notificationCommandId = commands.find(command => command.name == 'config').id
            }

            const embed = new MessageEmbed()
                .setTitle(await this.localeMessage("MESSAGE_CURRENT_CONFIGURATION"))
                .addFields(
                    {
                        name: await this.localeMessage("MESSAGE_CURRENT_LANGUAGE"), 
                        value: !serverConfig.language ? "English" : "한국어"
                    },
                    {
                        name: await this.localeMessage("MESSAGE_CURRENT_ADMINROLE"), 
                        value: serverConfig.admin_role && serverConfig.admin_role != "0" ? `<@&${serverConfig.admin_role}>` : await this.localeMessage("NOTHING")
                    },
                    {
                        name: await this.localeMessage("MESSAGE_CURRENT_NOTIFICATIONS_CHANNEL"),
                        value: `</config notification:${notificationCommandId}>`
                    }
                );
            this.interaction.editReply({embeds: [embed]});
        }

        if (this.interaction.options.getSubcommand() == "help") {
            const embed = new MessageEmbed()
                .setTitle(await this.localeMessage("CONFIGURATION_HELP"))
                .addFields(
                    {
                        name: await this.localeMessage("CHANGE_LANGUAGE"), 
                        value: `**__/config language__** - ${await this.localeMessage("MESSAGE_HELP_CONFIG_LANGUAGE")}`
                            + `\n**__/config language <${await this.localeMessage("LANGUAGE")}>__** -  ${await this.localeMessage("MESSAGE_HELP_CONFIG_LANGUAGE_CHANGE")}`
                    },
                    {
                        name: await this.localeMessage("CHANGE_ADMINROLE"),
                        value: `**__/config adminrole <${await this.localeMessage("ROLE")}>__** - ${await this.localeMessage("MESSAGE_HELP_CONFIG_ADMINROLE")}`
                    },
                    {
                        name: await this.localeMessage("CHANGE_NOTIFICATIONS_CHANNEL"), 
                        value: `**__/config notification__** - ${await this.localeMessage("MESSAGE_HELP_CONFIG_NOTIFICATIONS_CHANNEL")}`
                    },
                    {
                        name: await this.localeMessage("SHOW_ALL_CONFIGURATIONS"),
                        value: `**__/config list__** - ${await this.localeMessage("MESSAGE_HELP_CONFIG_LIST")}`
                    }
                )
            this.interaction.editReply({embeds: [embed]});
        }

        if (this.interaction.options.getSubcommand() == "notification") {
            if (this.interaction.guild.me.permissions.has("MANAGE_WEBHOOKS")) {
                this.interaction.editReply(await loadNotificationConfig(this, 0, undefined, 0));
            } else {
                this.interaction.editReply({content: await this.localeMessage("MESSAGE_NOTIFICATIONS_INVAILD_PERMISSION", ['DemonObserver'])});
            }
        }
    }
    
}

export class ConfigButton extends ButtonUserInteraction {

    async execute() {
        if (this.customData[0] == "notification") {
            if (this.customData[1] == "channel") {
                await this.interaction.editReply(await loadNotificationConfig(this, +this.customData[3], 
                    this.interaction.client.channels.cache.get(this.customData[4]), +this.customData[2]));
            }

            if (this.customData[1] == "enable" || this.customData[1] == "disable") {
                const score = +this.customData[2]
                const channel = this.customData.length > 3 ? this.customData[3] : "0"
                const isEnable = this.customData[1] == 'enable';
                
                if (score && channel) {
                    const diff = ['updated', 'extreme', 'insane', 'hard', 'medium', 'easy', 'unrated', 'awarded'];

                    const webhooks = await this.interaction.guild.fetchWebhooks();
                    let member = this.interaction.guild.me;
                    
                    if (member?.permissions?.has("MANAGE_WEBHOOKS")) {
                        try {
                            for await (const d of diff) {
                                if (isEnableNotification(score, d)) {
                                    const webhookArray = webhooks.filter((webhook) => notifyChannels[d].find(c => c == webhook?.sourceChannel?.id));
                                    for await (const [id, targetWebhook] of webhookArray) {
                                        await targetWebhook.delete().catch(err => {});
                                    }
                                    if (isEnable) {
                                        for await (const noticeChannelId of notifyChannels[d]) {
                                            let noticeChannel = this.interaction.client.channels.cache.get(noticeChannelId);
                                            if (!noticeChannel && noticeChannelId != "0") {
                                                noticeChannel = await this.interaction.client.channels.fetch(noticeChannelId);
                                            }

                                            if (noticeChannel?.type == "GUILD_NEWS") {
                                                await noticeChannel.addFollower(channel, 'DemonObserver Notification');
                                            }
                                        }
                                    }
                                }
                            }
                        } catch (e) {
                            await this.interaction.editReply({ content: `Added Failed, try again later with delete all webhooks in <#${channel}>` });
                            return;
                        }
                    }

                }

                await this.interaction.editReply(await loadNotificationConfig(this, 0, undefined, 0));
            }
        }
    }
    
}

export class ConfigMenu extends MenuUserInteraction {

    async execute() {
        if (this.customData[0] == "notification") {
            if (this.customData[1] == "channel") {
                await this.interaction.editReply(await loadNotificationConfig(this, +this.customData[2], 
                    this.interaction.client.channels.cache.get(this.interaction.values[0]), 0));
            }

            if (this.customData[1] == "type") {
                let score = 0; this.interaction.values.forEach(v => score += +v);

                await this.interaction.editReply(await loadNotificationConfig(this, score, 
                    this.interaction.client.channels.cache.get(this.customData[2]), 0));
            }
        }
    }
    
}

function isEnableNotification(score, type) {
    let total = score;
    if (total >= 128) {
        total -= 128;
        if (type == 'updated') return true
    }
    if (total >= 64) {
        total -= 64;
        if (type == 'extreme') return true
    }
    if (total >= 32) {
        total -= 32;
        if (type == 'insane') return true
    }
    if (total >= 16) {
        total -= 16;
        if (type == 'hard') return true
    }
    if (total >= 8) {
        total -= 8;
        if (type == 'medium') return true
    }
    if (total >= 4) {
        total -= 4;
        if (type == 'easy') return true
    }
    if (total >= 2) {
        total -= 2;
        if (type == 'unrated') return true
    }
    if (total >= 1) {
        total -= 1;
        if (type == 'awarded') return true
    }
    return false
}


async function loadNotificationConfig(interaction, selectScore, channel, page) {
    if (!interaction.interaction.guild) {
        return {embeds: [new MessageEmbed()
            .setTitle(await interaction.localeMessage("ERROR"))
            .setColor([255,0,0])]};
    }

    const me = interaction.interaction.guild.me;
    const webhooks = await interaction.interaction.guild.fetchWebhooks();
    const isSelect = (demonType) => isEnableNotification(selectScore, demonType);
    const checkSelectMark = (demonType) => isSelect(demonType) ? '✅ ' : '◻ ';
    const checkChannel = (demonType) => {
        const webhook = webhooks.find((webhook) => notifyChannels[demonType].find(c => c == webhook?.sourceChannel?.id));
        return webhook ? webhook.channelId : 0;
    }


    const embed = new MessageEmbed()
        .setTitle(await interaction.localeMessage("MESSAGE_CURRENT_NOTIFICATIONS_CHANNEL"))
        .addFields(
            {
                name: await interaction.localeMessage("CONFIGURATIONS"), 
                value: `**`+checkSelectMark('awarded')+await interaction.localeMessage("RATED_DEMON")+`**:　<#${checkChannel("awarded")}>\n`
                        +`**`+checkSelectMark('unrated')+await interaction.localeMessage("UNRATED_DEMON")+`**:　<#${checkChannel("unrated")}>\n`
                        +`**`+checkSelectMark('easy')+"Easy Demon"+`**:　 <#${checkChannel("easy")}>\n`
                        +`**`+checkSelectMark('medium')+"Medium Demon"+`**:　<#${checkChannel("medium")}>\n`
                        +`**`+checkSelectMark('hard')+"Hard Demon"+`**:　<#${checkChannel("hard")}>\n`
                        +`**`+checkSelectMark('insane')+"Insane Demon"+`**:　<#${checkChannel("insane")}>\n`
                        +`**`+checkSelectMark('extreme')+"Extreme Demon"+`**:　<#${checkChannel("extreme")}>\n`
                        +`**`+checkSelectMark('updated')+await interaction.localeMessage("UPDATED_DEMON")+`**:　<#${checkChannel("updated")}>`
            },
            {
                name: await interaction.localeMessage("SELECTED_CHANNEL"), 
                value: channel && me ? 
                        `<#${channel.id}>` + ((me.permissions.has("MANAGE_WEBHOOKS") 
                        ? "" 
                        : `\n⚠**${await interaction.localeMessage('WARNING')}**: ${await interaction.localeMessage('MESSAGE_NOTIFICATIONS_INVAILD_PERMISSION', [me.nickname || interaction.interaction.user.username])}`)) : await interaction.localeMessage("NOTHING")
            }
        );
    
    const ratedDemon = {
        label: await interaction.localeMessage("RATED_DEMON"), 
        emoji: isSelect('awarded') ? '✅' : interaction.emojis.convertToID(interaction.emojis.RATED),
        value: ""+1,
        default: isSelect('awarded'),
        description: await interaction.localeMessage("MESSAGE_NOTIFICATION_RATED_DEMON")
    }
    const unratedDemon = {
        label: await interaction.localeMessage("UNRATED_DEMON"), 
        emoji: isSelect('unrated') ? '✅' : interaction.emojis.convertToID(interaction.emojis.UNRATED),
        value: ""+2,
        default: isSelect('unrated'),
        description: await interaction.localeMessage("MESSAGE_NOTIFICATION_UNRATED_DEMON")
    }
    const easyDemon = {
        label: "Easy Demon", 
        emoji: isSelect('easy') ? '✅' : interaction.emojis.convertToID(interaction.emojis.EASY_DEMON),
        value: ""+4,
        default: isSelect('easy'),
        description: await interaction.localeMessage("MESSAGE_NOTIFICATION_RERATED_DEMON", ['Easy'])
    }
    const mediumDemon = {
        label: "Medium Demon", 
        emoji: isSelect('medium') ? '✅' : interaction.emojis.convertToID(interaction.emojis.MEDIUM_DEMON),
        value: ""+8,
        default: isSelect('medium'),
        description: await interaction.localeMessage("MESSAGE_NOTIFICATION_RERATED_DEMON", ['Medium'])
    }
    const hardDemon = {
        label: "Hard Demon", 
        emoji: isSelect('hard') ? '✅' : interaction.emojis.convertToID(interaction.emojis.HARD_DEMON),
        value: ""+16,
        default: isSelect('hard'),
        description: await interaction.localeMessage("MESSAGE_NOTIFICATION_RERATED_DEMON", ['Hard'])
    }
    const insaneDemon = {
        label: "Insane Demon", 
        emoji: isSelect('insane') ? '✅' : interaction.emojis.convertToID(interaction.emojis.INSANE_DEMON),
        value: ""+32,
        default: isSelect('insane'),
        description: await interaction.localeMessage("MESSAGE_NOTIFICATION_RERATED_DEMON", ['Insane'])
    }
    const extremeDemon = {
        label: "Extreme Demon", 
        emoji: isSelect('extreme') ? '✅' : interaction.emojis.convertToID(interaction.emojis.EXTREME_DEMON),
        value: ""+64,
        default: isSelect('extreme'),
        description: await interaction.localeMessage("MESSAGE_NOTIFICATION_RERATED_DEMON", ['Extreme'])
    }
    const updatedDemon = {
        label: await interaction.localeMessage("UPDATED_DEMON"), 
        emoji: isSelect('updated') ? '✅' : interaction.emojis.convertToID(interaction.emojis.EDIT),
        value: ""+128,
        default: isSelect('updated'),
        description: await interaction.localeMessage("MESSAGE_NOTIFICATION_UPDATED_DEMON")
    }

    const optionMenu = new MessageSelectMenu()
        .setCustomId(interaction.interaction.user.id+'||config:notification:type:'+(channel ? channel.id : ""))
        .setMaxValues(8).setMinValues(0)
        .setPlaceholder(await interaction.localeMessage("MESSAGE_SELECT_NOTIFICATION_TYPE"))
        .addOptions(ratedDemon, unratedDemon, easyDemon, mediumDemon, hardDemon, insaneDemon, extremeDemon, updatedDemon);
    const enableButton = new MessageButton().setLabel(await interaction.localeMessage("ENABLE")).setEmoji('✅').setStyle('SUCCESS').setCustomId(interaction.interaction.user.id+'||config:notification:enable:'+selectScore+":"+(channel ? channel.id : "")).setDisabled(!(channel && selectScore));
    const disableButton = new MessageButton().setLabel(await interaction.localeMessage("DISABLE")).setEmoji('❌').setStyle('DANGER').setCustomId(interaction.interaction.user.id+'||config:notification:disable:'+selectScore).setDisabled(!selectScore);
    

    const channelMenu = new MessageSelectMenu()
        .setCustomId(interaction.interaction.user.id+'||config:notification:channel:'+selectScore)
        .setPlaceholder(await interaction.localeMessage("MESSAGE_SELECT_NOTIFICATION_CHANNEL"));

    const channels = [];
    interaction.interaction.guild.channels.cache.filter((c) => c.type == "GUILD_TEXT" && c.isText()).forEach((c) => {
        channels.push(c);
    })

    const selectChannels = []
    channels.sort((a, b) => {
        return a.rawPosition - b.rawPosition
    }).slice(page*25, (page+1)*25).forEach((value, index) => {
        selectChannels.push({
            label: `#${value.name.length > 40 ? value.name.substring(0, 40) + ".." : value.name}`,
            value: value.id,
            emoji: channel == value ? "✅" : undefined,
            default: channel == value
        });
    });
    channelMenu.addOptions(selectChannels);

    const result = {embeds: [embed], components: [new MessageActionRow().addComponents(optionMenu)]};
    if (channelMenu.options.length > 0) {
        result.components?.push(new MessageActionRow().addComponents(channelMenu));
    }
    if (channels.length > 25) {
        const buttonComponent = new MessageActionRow()
        const previousPage = new MessageButton()
            .setStyle('SECONDARY')
            .setEmoji(interaction.emojis.id.PREVIOUS_PAGE)
            .setLabel(await interaction.localeMessage("PREVIOUS_CHANNELS_PAGE"))
            .setDisabled(page <= 0)
            .setCustomId(`${interaction.interaction.user.id}||config:notification:channel:${page-1}:${selectScore}:${channel ? channel.id : ""}`);
        const nextPage = new MessageButton()
            .setStyle('SECONDARY')
            .setEmoji(interaction.emojis.id.NEXT_PAGE)
            .setLabel(await interaction.localeMessage("NEXT_CHANNELS_PAGE"))
            .setDisabled(page+1 >= Math.ceil(channels.length/25.0))
            .setCustomId(`${interaction.interaction.user.id}||config:notification:channel:${page+1}:${selectScore}:${channel ? channel.id : ""}`);
            
        buttonComponent.addComponents(previousPage, nextPage);
        result.components?.push(buttonComponent);
    }
    result.components?.push(new MessageActionRow().addComponents(enableButton, disableButton));
    return result;
}