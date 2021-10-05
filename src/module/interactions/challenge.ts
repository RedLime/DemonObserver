
import { MessageActionRow, MessageButton, MessageEmbed, MessageOptions, MessageSelectOptionData, MessageSelectMenu } from "discord.js";
import { RowDataPacket } from "mysql2/promise";
import Challenge, { ChallengeStatus } from "../../classes/challenge";
import Demon from "../../classes/demon";
import { ButtonUserInteraction, CommandUserInteraction, MenuUserInteraction, UserInteraction } from "../../classes/interaction";



export class ChallengeCommand extends CommandUserInteraction {

    async execute(): Promise<void> {
        const subCommand = this.interaction.options.getSubcommand();
        if (subCommand == "create") {
            const filter = +(this.interaction.options.getString("filter") ?? "1"), skips = Math.max(Math.min(this.interaction.options.getInteger("skips") || 0, 10), 0);
            const lastChallenge = await Challenge.findCurrentByUser(this.connection, this.interaction.user.id);
            if (!lastChallenge) {
                const embed = new MessageEmbed()
                    .setTitle(await this.localeMessage("MESSAGE_CHALLENGE_START"))
                    .setDescription(await this.localeMessage("MESSAGE_CHALLENGE_LEVEL_DESCRIPTION") + "\n\n" + await this.localeMessage("MESSAGE_PRESS_NEXT_CHALLENGE_BUTTON"))
                    .setColor([0, 153, 255]);
                const nextChallenge = new MessageButton()
                    .setStyle('SUCCESS')
                    .setLabel(await this.localeMessage("NEXT_CHALLENGE"))
                    .setCustomId(`${this.interaction.user.id}||challenge:create:${filter}:${skips}`);
                const actionRow = new MessageActionRow().addComponents([nextChallenge]);
                this.interaction.reply({ embeds: [embed], components: [actionRow] });
            } else {
                const embed = new MessageEmbed()
                    .setTitle(await this.localeMessage("WARNING"))
                    .setDescription(await this.localeMessage("MESSAGE_OVERRIDE_NEW_CHALLENGE", [lastChallenge.id]))
                    .setColor([255, 153, 0]);
                const createChallenge = new MessageButton()
                    .setStyle('SUCCESS')
                    .setLabel(await this.localeMessage("START"))
                    .setCustomId(`${this.interaction.user.id}||challenge:creat:${filter}:${skips}`);
                const loadChallenge = new MessageButton()
                    .setStyle('DANGER')
                    .setLabel(await this.localeMessage("LOAD_PREVIOUS_CHALLENGE"))
                    .setCustomId(`${this.interaction.user.id}||challenge:last`);
                const actionRow = new MessageActionRow()
                    .addComponents([createChallenge, loadChallenge]);
                this.interaction.reply({ embeds: [embed], components: [actionRow] });
            }
        }
        if (subCommand == "current") {
            const lastChallenge = await Challenge.findCurrentByUser(this.connection, this.interaction.user.id);
            if (!lastChallenge) {
                const errorEmbed = new MessageEmbed()
                    .setTitle(await this.localeMessage("ERROR"))
                    .setColor([255,0,0])
                    .setDescription(await this.localeMessage("MESSAGE_ERROR_NOT_FOUND_CHALLENGE"));
                this.interaction.reply({ embeds: [errorEmbed] });
            } else {
                this.interaction.reply(await loadChallengeProcess(this, lastChallenge));
            }
        }
        if (subCommand == "info") {
            this.interaction.reply(await loadChallengeInfo(this, this.interaction.options.getInteger("id") ?? 0, 0));
        }
    }
    
}

export class ChallengeButton extends ButtonUserInteraction {

    async execute(): Promise<void> {
        if (this.customData[0] == "create") {
            const lastChallenge = await Challenge.findCurrentByUser(this.connection, this.interaction.user.id);
            if (lastChallenge) lastChallenge.stopChallenge();

            const challenge = await Challenge.create(this.connection, this.interaction.user.id, +this.customData[1], +this.customData[2]);
            await challenge.nextLevel();
            await this.interaction.deferUpdate();
            this.interaction.editReply(await loadChallengeProcess(this, challenge));
        }
        if (this.customData[0] == "last") {
            const lastChallenge = await Challenge.findCurrentByUser(this.connection, this.interaction.user.id);
            await this.interaction.deferUpdate();
            if (lastChallenge) {
                this.interaction.editReply(await loadChallengeProcess(this, lastChallenge));
            }
        }
        if (this.customData[0] == "next") {
            const lastChallenge = await Challenge.findCurrentByUser(this.connection, this.interaction.user.id);
            if (lastChallenge) {
                await lastChallenge.nextLevel();
                await this.interaction.deferUpdate();
                if (lastChallenge.status == ChallengeStatus.COMPLETE) {
                    const embed = new MessageEmbed()
                        .setTitle(await this.localeMessage("MESSAGE_COMPLETED_CHALLENGE", [lastChallenge.score, lastChallenge.id]))
                        .setColor([0, 255, 0])
                    const infoChallenge = new MessageButton()
                        .setStyle('PRIMARY')
                        .setLabel(await this.localeMessage("SHOW_CHALLENGE_INFO"))
                        .setCustomId(`${lastChallenge.owner}||challenge:info:${lastChallenge.id}`);
                    const actionRow = new MessageActionRow()
                        .addComponents([infoChallenge]);
                    this.interaction.editReply({ embeds: [embed], components: [actionRow] });
                } else {
                    this.interaction.editReply(await loadChallengeProcess(this, lastChallenge));
                }
            } else {
                this.interaction.deferUpdate();
            }
        }
        if (this.customData[0] == "skip") {
            const lastChallenge = await Challenge.findCurrentByUser(this.connection, this.interaction.user.id);
            await this.interaction.deferUpdate();
            if (lastChallenge) {
                await lastChallenge.rerollLevel();
                this.interaction.editReply(await loadChallengeProcess(this, lastChallenge));
            }
        }
        if (this.customData[0] == "end") {
            const lastChallenge = await Challenge.findCurrentByUser(this.connection, this.interaction.user.id);
            if (lastChallenge) {
                await lastChallenge.stopChallenge();
                await this.interaction.deferUpdate();
                const embed = new MessageEmbed()
                    .setTitle(await this.localeMessage("MESSAGE_ENDED_CHALLENGE", [lastChallenge.score, lastChallenge.id]))
                    .setColor([255, 0, 0])
                const infoChallenge = new MessageButton()
                    .setStyle('PRIMARY')
                    .setLabel(await this.localeMessage("SHOW_CHALLENGE_INFO"))
                    .setCustomId(`${lastChallenge.owner}||challenge:info:${lastChallenge.id}`);
                const actionRow = new MessageActionRow()
                    .addComponents([infoChallenge]);
                this.interaction.editReply({ embeds: [embed], components: [actionRow] });
            } else {
                this.interaction.deferUpdate();
            }
        }
        if (this.customData[0] == "info") {
            const targetId = +this.customData[1], targetPage = (this.customData.length > 2 ? +this.customData[2] : 0) ?? 0;
            await this.interaction.deferUpdate();
            this.interaction.editReply(await loadChallengeInfo(this, targetId, targetPage));
        }
    }
    
}

export class ChallengeMenu extends MenuUserInteraction {

    async execute(): Promise<void> {
        if (this.customData[0] == "info") {
            const targetId = +this.customData[1], targetPage = +this.interaction.values[0]
            await this.interaction.deferUpdate();
            this.interaction.editReply(await loadChallengeInfo(this, targetId, targetPage));
        }
    }
    
}


async function loadChallengeProcess(interaction: UserInteraction, challenge: Challenge) {
    const [[resultDemon]] = <RowDataPacket[][]> await interaction.connection.query(
        `SELECT level_id, level_name, author_name, difficulty, creator_points, rank_pointercrate FROM gd_demons WHERE level_id = '${[...challenge.levels].reverse()[0]}'`
    );

    const result: MessageOptions = {};
    
    if (!resultDemon) {
        const errorEmbed = new MessageEmbed()
            .setTitle(await interaction.localeMessage("ERROR"))
            .setColor([255,0,0])
            .setDescription(await interaction.localeMessage("MESSAGE_ERROR_NOT_FOUND_CHALLENGE"));
        result.embeds = [errorEmbed]
        return result;
    }

    const embed = new MessageEmbed()
        .setTitle(await interaction.localeMessage("DEMON_CHALLENGE", [challenge.levels.length]))
        .setDescription(await interaction.localeMessage("MESSAGE_CHALLENGE_LEVEL_DESCRIPTION"))
        .setColor([0, 153, 255])
        .setThumbnail(`https://gdbrowser.com/assets/difficulties/${Demon.getRateBrowserText(+resultDemon.difficulty, +resultDemon.creator_points)}.png`)
        .addField(await interaction.localeMessage("LEVEL_INFO"), `ID : __${resultDemon.level_id}__ (**${resultDemon.level_name}** by ${resultDemon.author_name})`)
        .addField(await interaction.localeMessage("DIFFICULTY"), Demon.getDifficultyFullText(+resultDemon.difficulty))
        .setFooter("ID : "+resultDemon.level_id);
    
    if (resultDemon.rank_pointercrate) {
        embed.addField(await interaction.localeMessage("DEMONLIST_RANK"), `${await interaction.localeMessage("POINTERCRATE")} - ${interaction.emojis.GOLD_TROPY} #${resultDemon.rank_pointercrate}`);
    }
    
    const nextChallenge = new MessageButton()
        .setStyle('SUCCESS')
        .setLabel(await interaction.localeMessage("NEXT_CHALLENGE"))
        .setCustomId(`${challenge.owner}||challenge:next:${challenge.id}`);
    const stopChallenge = new MessageButton()
        .setStyle('DANGER')
        .setLabel(await interaction.localeMessage("END_CHALLENGE"))
        .setCustomId(`${challenge.owner}||challenge:end:${challenge.id}`);
    const row = [nextChallenge, stopChallenge];

    if (challenge.remainSkips() != 0) {
        const skipChallenge = new MessageButton()
            .setStyle('PRIMARY')
            .setLabel(await interaction.localeMessage("SKIP_CHALLENGE", [challenge.remainSkips()]))
            .setCustomId(`${challenge.owner}||challenge:skip:${challenge.id}`);
        row.push(skipChallenge);
    }
    const actionRow = new MessageActionRow()
        .addComponents(row);
    
    result.embeds = [embed];
    result.components = [actionRow];

    return result;
}

async function loadChallengeInfo(interaction: UserInteraction, id: number, page: number): Promise<MessageOptions> {
    
    const lastChallenge = await Challenge.findById(interaction.connection, id);

    const result: MessageOptions = {};
    
    const errorEmbed = new MessageEmbed()
    .setTitle(await interaction.localeMessage("ERROR"))
    .setColor([255,0,0])
    .setDescription(await interaction.localeMessage("MESSAGE_ERROR_NOT_FOUND_CHALLENGE"));

    if (!lastChallenge) {
        result.embeds = [errorEmbed]
        return result;
    }

    const perPage = 5;

    const [resultDemons] = <RowDataPacket[][]> await interaction.connection.query(
        `SELECT level_id, level_name, difficulty, creator_points, rank_pointercrate FROM gd_demons WHERE level_id IN (${[...lastChallenge.levels].reverse().slice(page*perPage, (page+1)*perPage).join(",") || "0"})`
    );

    const raw = resultDemons.sort((a, b) => lastChallenge.levels.findIndex(lvl => lvl == b.level_id) - lastChallenge.levels.findIndex(lvl => lvl == a.level_id)).map(d => {
        const percent = lastChallenge.levels.findIndex(lvl => lvl == d.level_id)+1;
        const undoLine = (percent == lastChallenge.levels.length && lastChallenge.status != ChallengeStatus.COMPLETE) ? '~~' : '';
        return `ㆍ ${undoLine}${percent}% - ${interaction.emojis[Demon.getRateEmojiText(+d.difficulty, +d.creator_points)]} ${d.level_name} (__${d.level_id}__)${undoLine}`;
    }).join("\n");

    const totalPage = Math.ceil(lastChallenge.levels.length/(perPage*1.0));

    if (totalPage > 1) {
        const buttonComponent = new MessageActionRow()
        const previousPage = new MessageButton()
            .setStyle('SECONDARY')
            .setEmoji(interaction.emojis.id.PREVIOUS_PAGE)
            .setLabel(await interaction.localeMessage("PREVIOUS_PAGE"))
            .setDisabled(page <= 0)
            .setCustomId(`${interaction.interaction.user.id}||challenge:info:${lastChallenge.id}:${page-1}`);
        const nextPage = new MessageButton()
            .setStyle('SECONDARY')
            .setEmoji(interaction.emojis.id.NEXT_PAGE)
            .setLabel(await interaction.localeMessage("NEXT_PAGE"))
            .setDisabled(page+1 >= totalPage)
            .setCustomId(`${interaction.interaction.user.id}||challenge:info:${lastChallenge.id}:${page+1}`);
        result.components = [buttonComponent.addComponents(previousPage, nextPage)];

        const pageOptions = new MessageSelectMenu().setCustomId(interaction.interaction.user.id+'||challenge:info:'+lastChallenge.id).setPlaceholder(await interaction.localeMessage("MESSAGE_SELECT_PAGE"));
                    
        const options: MessageSelectOptionData[] = []; 
        for (let index = 0; index < totalPage; index++) {
            options.push({ label: `Page : ${index+1}`, value: index.toString(), default: index == page})
        }
        pageOptions.addOptions(options);
        result.components.push(new MessageActionRow().addComponents(pageOptions));
    } else {
        result.components = [];
    }

    const embed = new MessageEmbed()
        .setTitle(await interaction.localeMessage("CHALLENGE_INFO"))
        .addField(await interaction.localeMessage("USER"), `<@${lastChallenge.owner}>`, true)
        .addField(await interaction.localeMessage("SCORE"), ""+lastChallenge.score, true)
        .addField(await interaction.localeMessage("STATUS"), await interaction.localeMessage(lastChallenge.status == ChallengeStatus.STOP ? "ENDED" : lastChallenge.status == ChallengeStatus.COMPLETE ? "COMPLETED" : "IN_PROGRESS"), true)
        .addField(await interaction.localeMessage("FILTER"), Challenge.filterToString(lastChallenge.filter))
        .addField(await interaction.localeMessage("CREATED_DATE"), await interaction.localeTime(lastChallenge.createDate), true)
        .addField(await interaction.localeMessage("SKIPS"), ""+(lastChallenge.maxSkips - lastChallenge.currSkips), true)
        .addField(await interaction.localeMessage("LIST"), raw || await interaction.localeMessage("NOTHING"))
        .setFooter(`Page : ${totalPage == 0 ? "-" : `${page+1}/${totalPage}`} | ID : ${lastChallenge.id}`);
    result.embeds = [embed];

    return result;
}