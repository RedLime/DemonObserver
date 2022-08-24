import { MessageActionRow, MessageButton, MessageEmbed, MessagePayload } from "discord.js";
import { CommandUserInteraction } from "../../classes/interaction.js";

export default class AboutCommand extends CommandUserInteraction {

    async execute() {
        const embed = new MessageEmbed()
            .setTitle(await this.localeMessage("ABOUT_DEMON_OBSERVER"))
            .setDescription(await this.localeMessage("MESSAGE_ABOUT_DESCRIPTION"))
            .setThumbnail(this.config.icon_url)
            .addFields(
                {
                    name: await this.localeMessage("AUTHOR") + ` (${await this.localeMessage("CONTACT_AND_FEEDBACK")})`,
                    value: 'RedLime#0817',
                    inline: true
                }, 
                {
                    name: await this.localeMessage("AVAILABLE_LANGUAGES"),
                    value: 'Command: `/config language <?>`\nEnglish, 한국어(Korean)',
                },
                {
                    name: await this.localeMessage("COMMANDS"),
                    value: await this.localeMessage("MESSAGE_COMMANDS_HELP")
                }
            )
        const inviteButton = new MessageButton()
            .setStyle("LINK")
            .setLabel(await this.localeMessage("INVITE_BOT"))
            .setURL(this.config.invite_url);
        const inviteServerButton = new MessageButton()
            .setStyle("LINK")
            .setLabel("DemonObserver Discord Server")
            .setURL(this.config.server_url);
        const donateButton = new MessageButton()
            .setStyle("LINK")
            .setLabel(await this.localeMessage("DONATE_DEV"))
            .setURL('https://www.patreon.com/join/redlimerl/checkout?rid=0&cadence=1');
        const buttonComponent = new MessageActionRow()
            .addComponents(inviteButton, inviteServerButton, donateButton);
        this.interaction.editReply(MessagePayload.create(this.interaction, {embeds: [embed], components: [buttonComponent]}));
    }
}
