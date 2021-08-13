
import { MessageActionRow, MessageButton, MessageEmbed, MessageOptions, MessageSelectOptionData, MessageSelectMenu } from "discord.js";
import { RowDataPacket } from "mysql2/promise";
import Demon from "../../classes/demon";
import { ButtonUserInteraction, CommandUserInteraction, MenuUserInteraction, UserInteraction } from "../../classes/interaction";
import { NotificationType } from "../../classes/notification";
import Utils from "../utils";



export class LevelCommand extends CommandUserInteraction {

    async execute(): Promise<void> {
        const level_id = this.interaction.options.getInteger("id"), level_name = this.interaction.options.getString("name");

        const errorEmbed = new MessageEmbed()
            .setTitle(await this.localeMessage("ERROR"))
            .setColor([255,0,0])
            .setDescription(await this.localeMessage("MESSAGE_ERROR_NOT_FOUND_DEMON_INFO"))

        if (!level_id && !level_name) {
            this.interaction.reply({embeds: [errorEmbed]});
            return;
        }
        
        const [resultDemon] = <RowDataPacket[][]> await this.connection.query(
            `SELECT level_id, level_name, author_name, level_description, difficulty, creator_points, rank_pointercrate, level_version, ingame_version FROM gd_demons
             WHERE ${level_id ? `level_id = ${level_id}` : level_name ? `level_name LIKE '${level_name}'` : "level_id = 0"} LIMIT 10`
        );

        if (!resultDemon.length) {
            if (!level_id && level_name) {
                const [searchDemons] = <RowDataPacket[][]> await this.connection.query(
                    `SELECT level_id, level_name, author_name FROM gd_demons
                     WHERE level_name LIKE '%${level_name}%' LIMIT 10`
                );
                
                if (searchDemons.length) {
                    const embed = new MessageEmbed()
                        .setTitle(await this.localeMessage("ERROR"))
                        .setDescription(await this.localeMessage("MESSAGE_ERROR_NOT_FOUND_DEMON_INFO") + "\n" + await this.localeMessage("MESSAGE_RECOMMEND_OTHER_OPTION"))
                        .setColor([255,0,0])
                        .addField(await this.localeMessage("LIST"), 
                            searchDemons.sort((a,b) => Utils.similarity(level_name, b.level_name) - Utils.similarity(level_name, a.level_name))
                                .map(demon => `- **${demon.level_name}** by *${demon.author_name}* (ID : __${demon.level_id}__)`).join("\n"));
                    this.interaction.reply({embeds: [embed]});
                } else {
                    this.interaction.reply({embeds: [errorEmbed]});
                }
            } else {
                this.interaction.reply({embeds: [errorEmbed]});
            }
        } else {
            if (resultDemon.length > 1) {
                const levelOptions = new MessageSelectMenu()
                    .setCustomId(this.interaction.user.id+'||level:name_list')
                    .setPlaceholder(await this.localeMessage("MESSAGE_SELECT_LEVEL"));
                
                const levelOpt: MessageSelectOptionData[] = [];
                resultDemon.forEach(d => {
                    const levelMenu: MessageSelectOptionData = {
                        label: `ID : ${d.level_id}`,
                        description: `${d.level_name} by ${d.author_name}`,
                        emoji: this.emojis.convertToID(this.emojis[Demon.getRateEmojiText(+d.difficulty, +d.creator_points)]),
                        value: d.level_id
                    };
                    levelOpt.push(levelMenu);
                });
                levelOptions.addOptions(levelOpt);
                
                const embed = new MessageEmbed()
                    .setTitle(await this.localeMessage("MESSAGE_SAME_NAME_LEVELS"))
                    .setDescription(await this.localeMessage("MESSAGE_SELECT_LEVEL"));
                this.interaction.reply({embeds: [embed], components: [new MessageActionRow().addComponents(levelOptions)]});
            } else {
                this.interaction.reply(await loadLevelInfo(this, resultDemon[0], 0));
            }
        }
    }
    
}

export class LevelButton extends ButtonUserInteraction {

    async execute(): Promise<void> {
        const page = +this.customData[0], level_id = +this.customData[1];
        const [[resultDemon]] = <RowDataPacket[][]> await this.connection.query(
            `SELECT level_id, level_name, author_name, level_description, difficulty, creator_points, rank_pointercrate, level_version, ingame_version FROM gd_demons WHERE level_id = '${level_id}'`
        );
        await this.interaction.deferUpdate();
        this.interaction.editReply(await loadLevelInfo(this, resultDemon, page));
    }
    
}

export class LevelMenu extends MenuUserInteraction {

    async execute(): Promise<void> {
        if (this.customData[0] == "level_list") {
            const level_id = +this.interaction.values[0];
            const [[resultDemon]] = <RowDataPacket[][]> await this.connection.query(
                `SELECT level_id, level_name, author_name, level_description, difficulty, creator_points, rank_pointercrate, level_version, ingame_version FROM gd_demons WHERE level_id = '${level_id}'`
            );
            await this.interaction.deferUpdate();
            this.interaction.editReply(await loadLevelInfo(this, resultDemon, 0));
        }
        if (this.customData[0] == "page") {
            const level_id = +this.customData[1];
            const [[resultDemon]] = <RowDataPacket[][]> await this.connection.query(
                `SELECT level_id, level_name, author_name, level_description, difficulty, creator_points, rank_pointercrate, level_version, ingame_version FROM gd_demons WHERE level_id = '${level_id}'`
            );
            await this.interaction.deferUpdate();
            this.interaction.editReply(await loadLevelInfo(this, resultDemon, +this.interaction.values[0]));
        }
    }
    
}


async function loadLevelInfo(interaction: UserInteraction, level: RowDataPacket, page: number) {
    const perPage = 6;
    
    const [resultLogs] = <RowDataPacket[][]> await interaction.connection.query(
        `SELECT type, log_timestamp, data1, data2
        FROM gd_changelogs WHERE level_id = '${level.level_id}'
        ORDER BY log_timestamp DESC LIMIT ${page*perPage}, ${perPage}`
    );
    
    const [[logCount]] = <RowDataPacket[][]> await interaction.connection.query(
        `SELECT COUNT(*) as total FROM gd_changelogs WHERE gd_changelogs.level_id = '${level.level_id}'`
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
        const result = `ㆍ${await archiveToString(log)}`;
        resultLogString.push(result);
    }
    const rawLogs = resultLogString.join("\n");

    const result: MessageOptions = {};
    const totalPage = Math.ceil((+logCount.total)/(perPage*1.0));
    
    const embed = new MessageEmbed()
        .setTitle(await interaction.localeMessage("MESSAGE_DEMON_INFO", [level.level_name]))
        .setThumbnail(`https://gdbrowser.com/assets/difficulties/${Demon.getRateBrowserText(+level.difficulty, +level.creator_points)}.png`)
        .addField(await interaction.localeMessage("LEVEL_INFO"), `ID : __${level.level_id}__ (**${level.level_name}** by ${level.author_name})`)
        .addField(await interaction.localeMessage("LEVEL_DESCRIPTION"), level.level_description || await interaction.localeMessage("NOTHING"))
        .addField(await interaction.localeMessage("DIFFICULTY"), Demon.getDifficultyFullText(level.difficulty))
        .addField(await interaction.localeMessage("VERSION"), "GD "+Demon.getIngameVersion(+level.ingame_version), true)
        .addField(await interaction.localeMessage("LEVEL_VERSION"), level.level_version.toString(), true)
        .addField(await interaction.localeMessage("ARCHIVE"), rawLogs)
        .setFooter(`${await interaction.localeMessage("ARCHIVE")} Page : ${totalPage == 0 ? "-" : (page+1)+"/"+totalPage}`)
        .setTimestamp();
    if (level.rank_pointercrate) {
        embed.addField(await interaction.localeMessage("DEMONLIST_RANK"), 
            await interaction.localeMessage("POINTERCRATE") + ` - ${interaction.emojis.GOLD_TROPY} #${level.rank_pointercrate}\n`);
    }
        
    result.embeds = [embed];

    if (totalPage > 1) {
        const buttonComponent = new MessageActionRow()
        const previousPage = new MessageButton()
            .setStyle('SECONDARY')
            .setEmoji(interaction.emojis.id.PREVIOUS_PAGE)
            .setLabel(await interaction.localeMessage("PREVIOUS_PAGE"))
            .setCustomId(`${interaction.interaction.user.id}||level:${page-1}:${level.level_id}`)
            .setDisabled(page <= 0);
        const nextPage = new MessageButton()
            .setStyle('SECONDARY')
            .setEmoji(interaction.emojis.id.NEXT_PAGE)
            .setLabel(await interaction.localeMessage("NEXT_PAGE"))
            .setCustomId(`${interaction.interaction.user.id}||level:${page+1}:${level.level_id}`)
            .setDisabled(page+1 >= totalPage);
        result.components = [buttonComponent.addComponents(previousPage, nextPage)];

        const pageOptions = new MessageSelectMenu().setCustomId(interaction.interaction.user.id+'||level:page:'+level.level_id).setPlaceholder(await interaction.localeMessage("MESSAGE_SELECT_PAGE"));
        
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