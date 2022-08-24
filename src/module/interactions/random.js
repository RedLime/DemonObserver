import { MessageEmbed, MessagePayload } from "discord.js";
import Demon from "../../classes/demon.js";
import { CommandUserInteraction } from "../../classes/interaction.js";

export default class RandomCommand extends CommandUserInteraction {

    async execute() {

        const option = this.interaction.options.getString("filter");
        let drawOption = this.interaction.options.getInteger("draw") ?? 1;
        drawOption = (drawOption < 1 ? 1 : drawOption > 10 ? 10 : drawOption);
        const dlOption = this.interaction.options.getString("demonlist");

        var demonListRange = undefined;
        if (dlOption) {
            const [ dlType, dlRange ] = dlOption.split("-");
            const listType = `rank_${dlType}`;
            demonListRange = () => {
                if (dlRange == "all") return `${listType} > 0`;
                if (dlRange == "main") return `${listType} > 0 AND ${listType} < 76`;
                if (dlRange == "extended") return `${listType} > 75 AND ${listType} < 151`;
                if (dlRange == "legacy") return `${listType} > 150`;
                else return ``;
            }
        }
        
        const [resultDemons] = await this.connection.query(
            `SELECT level_id, level_name, difficulty, creator_points, author_name, rank_pointercrate FROM gd_demons 
             WHERE ${option ? 'difficulty='+Demon.getDifficultyNumber(option) : 1} ${demonListRange ? 'AND '+demonListRange() : ''} ORDER BY RAND() LIMIT ${drawOption}`
            );
            

        if (resultDemons.length == 0) {
            const errorEmbed = new MessageEmbed()
                .setTitle(await this.localeMessage("ERROR"))
                .setColor([255,0,0])
                .setDescription(await this.localeMessage("MESSAGE_ERROR_RANDOM_DEMON_TOO_FEW"))
            this.interaction.editReply(MessagePayload.create(this.interaction, {embeds: [errorEmbed]}));
        } else if (drawOption > 1) {
            const resultContent = resultDemons.map(demon => {
                let rawLogs = `- ${this.emojis[Demon.getRateEmojiText(+demon.difficulty, +demon.creator_points)]} __${demon.level_id}__ (**${demon.level_name}** by ${demon.author_name})`;
                if (dlOption) {
                    rawLogs += ` [#${demon.rank_pointercrate}]`;
                }
                return rawLogs;
            }).join('\n');

            const embed = new MessageEmbed()
                .setTitle(await this.localeMessage("MESSAGE_RANDOM_DEMON"))
                .addFields(
                    {
                        name: await this.localeMessage("LIST"), 
                        value: resultContent
                    }
                );
            this.interaction.editReply(MessagePayload.create(this.interaction, {embeds: [embed]}));
        } else {
            const [resultDemon] = resultDemons;
            const embed = new MessageEmbed()
                .setTitle(await this.localeMessage("MESSAGE_RANDOM_DEMON"))
                .setThumbnail(`https://gdbrowser.com/assets/difficulties/${Demon.getRateBrowserText(resultDemon.difficulty, resultDemon.creator_points)}.png`)
                .addFields(
                    {
                        name: await this.localeMessage("LEVEL_INFO"),
                        value: `ID : __${resultDemon.level_id}__ (**${resultDemon.level_name}** by ${resultDemon.author_name})`
                    },
                    {
                        name: await this.localeMessage("DIFFICULTY"), 
                        value: Demon.getDifficultyFullText(resultDemon.difficulty)
                    }
                );
            if (dlOption) {
                const dlData = async (demon) => {
                    let raw = ``;
                    if (demon.rank_pointercrate) raw += await this.localeMessage("POINTERCRATE") + ` - ${this.emojis.GOLD_TROPY} #${demon.rank_pointercrate}\n`
                    //if (demon.rank_another_list) raw += await this.localeMessage("ANOTHER_LIST") + ` - ${this.emojis.GOLD_TROPY} #${demon.rank_another_list}\n`
                    if (raw.length > 0) raw = raw.substring(0, raw.length-1);
                    return raw;
                };
                embed.addFields(
                    {
                        name: await this.localeMessage("DEMONLIST_RANK"), 
                        value: await dlData(resultDemon)
                    }
                );
            }
            this.interaction.editReply(MessagePayload.create(this.interaction, {embeds: [embed]}));
        }
    }
}
