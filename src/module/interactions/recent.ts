
import { MessageActionRow, MessageButton, MessageEmbed, MessageOptions, MessageSelectOptionData, MessageSelectMenu } from "discord.js";
import { RowDataPacket } from "mysql2/promise";
import Demon from "../../classes/demon";
import { ButtonUserInteraction, CommandUserInteraction, MenuUserInteraction, UserInteraction } from "../../classes/interaction";
import { NotificationTypeKey, NotificationType } from "../../classes/notification";



export class RecentCommand extends CommandUserInteraction {

    async execute(): Promise<void> {
        const filter = <NotificationTypeKey | "all" | null> this.interaction.options.getString("filter");
        this.interaction.reply(await loadRecentArchives(this, filter || "all", 0));
    }
    
}

export class RecentButton extends ButtonUserInteraction {

    async execute(): Promise<void> {
        const filter = <NotificationTypeKey | "all" | null> this.customData[1], page = +this.customData[0];
        await this.interaction.deferUpdate();
        this.interaction.editReply(await loadRecentArchives(this, filter || "all", page));
    }
    
}

export class RecentMenu extends MenuUserInteraction {

    async execute(): Promise<void> {
        const filter = <NotificationTypeKey | "all" | null> this.customData[0];
        await this.interaction.deferUpdate();
        this.interaction.editReply(await loadRecentArchives(this, filter || "all", +this.interaction.values[0]));
    }
    
}


async function loadRecentArchives(interaction: UserInteraction, filter: NotificationTypeKey | "all", page: number) {
    const perPage = 6;
    
    const [resultLogs] = <RowDataPacket[][]> await interaction.connection.query(
        `SELECT gd_demons.level_name, gd_changelogs.type, gd_changelogs.log_timestamp, gd_changelogs.data1, gd_changelogs.data2
        FROM gd_changelogs LEFT JOIN gd_demons ON gd_changelogs.level_id = gd_demons.level_id
        ${(filter && filter != "all") ? `WHERE gd_changelogs.type = '${filter.toLowerCase()}'` : ''}
        ORDER BY gd_changelogs.log_timestamp DESC LIMIT ${page*perPage}, ${perPage}`
    );
    
    const [[logCount]] = <RowDataPacket[][]> await interaction.connection.query(
        `SELECT COUNT(*) as total FROM gd_changelogs ${(filter && filter != "all") ? `WHERE gd_changelogs.type = '${filter.toLowerCase()}'` : ''}`
    );
        
    const archiveToString = async (archive: RowDataPacket) => {
        let raw = `[${await interaction.localeTime(new Date(Date.parse(archive.log_timestamp)))}] **${await interaction.localeMessage(archive.type.toUpperCase())}**`;
        if (archive.type == NotificationType.AWARDED) {
            raw += ` - ${interaction.emojis.RATED}`;
        } else if (archive.type == NotificationType.UNRATED) {
            raw += ` - ${interaction.emojis.UNRATED}`;
        } else if (archive.type == NotificationType.RERATED) {
            raw += ` - ${interaction.emojis[Demon.getDifficultyText(+archive.data1).toUpperCase() + "_DEMON"]} ${interaction.emojis.ARROW} `
                + `${interaction.emojis[Demon.getDifficultyText(+archive.data2).toUpperCase() + "_DEMON"]}`;
        } else if (archive.type == NotificationType.UPDATED) {
            raw += ` - ${await interaction.localeMessage("VERSION")} ${archive.data1}`;
        }
        return raw;
    }

    const resultLogString: string[] = [];
    for await (const log of resultLogs) {
        const result = `???${await archiveToString(log)} (__${log.level_name}__)`;
        resultLogString.push(result);
    }
    const rawLogs = resultLogString.join("\n");


    const result: MessageOptions = {};
    const totalPage = Math.min(Math.ceil((+logCount.total)/(perPage*1.0)), 25);
    const embed = new MessageEmbed()
        .setTitle(await interaction.localeMessage("MESSAGE_RECENT_DEMON_ARCHIVES"))
        .addField(await interaction.localeMessage("FILTER") + ": " + await interaction.localeMessage(filter ? filter.toUpperCase() : "ALL"), rawLogs || await interaction.localeMessage("NOTHING"))
        .setFooter(`Page : ${totalPage == 0 ? 0 : page+1}/${totalPage}`)
    result.embeds = [embed];

    if (totalPage > 1) {
        const buttonComponent = new MessageActionRow()
        const previousPage = new MessageButton()
            .setStyle('SECONDARY')
            .setEmoji(interaction.emojis.id.PREVIOUS_PAGE)
            .setLabel(await interaction.localeMessage("PREVIOUS_PAGE"))
            .setCustomId(`${interaction.interaction.user.id}||recent:${page-1}:${filter}`)
            .setDisabled(page <= 0);
        const nextPage = new MessageButton()
            .setStyle('SECONDARY')
            .setEmoji(interaction.emojis.id.NEXT_PAGE)
            .setLabel(await interaction.localeMessage("NEXT_PAGE"))
            .setCustomId(`${interaction.interaction.user.id}||recent:${page+1}:${filter}`)
            .setDisabled(page+1 >= totalPage);
        result.components = [buttonComponent.addComponents(previousPage, nextPage)];

        const pageOptions = new MessageSelectMenu().setCustomId(interaction.interaction.user.id+'||recent:'+filter).setPlaceholder(await interaction.localeMessage("MESSAGE_SELECT_PAGE"));
        
        const pageOption: MessageSelectOptionData[] = [];
        for (let index = 0; index < totalPage; index++) {
            const pageMenu: MessageSelectOptionData = {label: `Page : ${index+1}`, value: index.toString()};
            pageMenu.default = index == page
            pageOption.push(pageMenu);
        }
        pageOptions.addOptions(pageOption);

        result.components.push(new MessageActionRow().addComponents(pageOptions));
    }
    return result;
}