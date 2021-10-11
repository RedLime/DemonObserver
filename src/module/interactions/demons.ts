import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import { MessageAttachment, MessageEmbed, MessagePayload } from "discord.js";
import { RowDataPacket } from "mysql2/promise";
import Demon from "../../classes/demon";
import { CommandUserInteraction } from "../../classes/interaction";
import { NotificationType } from "../../classes/notification";

export default class DemonsCommand extends CommandUserInteraction {
    async execute(): Promise<void> {
        const demonData = {
            easy: { amount: 0, change: 0},
            medium: { amount: 0, change: 0},
            hard: { amount: 0, change: 0},
            insane: { amount: 0, change: 0},
            extreme: { amount: 0, change: 0},
            total: { amount: 0, change: 0}
        }

        const [[demonCounts]] = <RowDataPacket[][]> await this.connection.query('SELECT COUNT(case when difficulty=0 then 1 end) as `hard`, '
            +'COUNT(case when difficulty=3 then 1 end) as `easy`, COUNT(case when difficulty=4 then 1 end) as `medium`, '
            +'COUNT(case when difficulty=5 then 1 end) as `insane`, COUNT(case when difficulty=6 then 1 end) as `extreme`, COUNT(*) as `total` FROM gd_demons');

        demonData.easy = { amount: demonCounts.easy, change: 0 };
        demonData.medium = { amount: demonCounts.medium, change: 0 };
        demonData.hard = { amount: demonCounts.hard, change: 0 };
        demonData.insane = { amount: demonCounts.insane, change: 0 };
        demonData.extreme = { amount: demonCounts.extreme, change: 0 };
        demonData.total = { amount: demonCounts.total, change: 0 };

        const result = async (description: string, easy: string, medium: string, hard: string, insane: string, extreme: string, total: string) => {
            return new MessageEmbed()
                .setTitle(await this.localeMessage("DEMONS_STATUS"))
                .addField(description,
                    `** **\n**ㆍ ${this.emojis.EASY_DEMON} ${demonData.easy.amount}　[${easy}]\n`
                    + `ㆍ ${this.emojis.MEDIUM_DEMON} ${demonData.medium.amount}　[${medium}]\n`
                    + `ㆍ ${this.emojis.HARD_DEMON} ${demonData.hard.amount}　[${hard}]\n`
                    + `ㆍ ${this.emojis.INSANE_DEMON} ${demonData.insane.amount}　[${insane}]\n`
                    + `ㆍ ${this.emojis.EXTREME_DEMON} ${demonData.extreme.amount}　[${extreme}]**\n`
                    + `\nㆍ **__Total : ${this.emojis.HARD_DEMON} ${demonData.total.amount}__　[${total}]**`)
                .setTimestamp()
        }

        const type = +(this.interaction.options.getString("type") || "0");
        if (!type) {
            //Type: 7일 변동추이
            const date = new Date();
            date.setDate(date.getDate() - 7);

            const toChangeString = (target: {amount: number, change: number}) => target.change == 0 ? '-' : (target.change > 0 ? this.emojis.UP : this.emojis.DOWN) + Math.abs(target.change);
            const [diffChanges] = <RowDataPacket[][]> await this.connection.query('SELECT type, data1, data2 FROM `gd_changelogs` WHERE log_timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)');

            diffChanges.forEach(rec => {
                if (rec.type == NotificationType.AWARDED) {
                    demonData.total.change++;
                    demonData[Demon.getDifficultyText(+rec.data1)].change++;
                }
                if (rec.type == NotificationType.UNRATED) {
                    demonData[Demon.getDifficultyText(+rec.data2)].change--;
                }
                if (rec.type == NotificationType.RERATED) {
                    demonData[Demon.getDifficultyText(+rec.data1)].change--;
                    demonData[Demon.getDifficultyText(+rec.data2)].change++;
                }
            });

            const chart = this.getPieChart();
            chart.chartConfig.data.datasets[0].data.push(demonData.easy.amount);
            chart.chartConfig.data.datasets[0].data.push(demonData.medium.amount);
            chart.chartConfig.data.datasets[0].data.push(demonData.hard.amount);
            chart.chartConfig.data.datasets[0].data.push(demonData.insane.amount);
            chart.chartConfig.data.datasets[0].data.push(demonData.extreme.amount);

            const image = await chart.chart.renderToBuffer(chart.chartConfig, 'image/jpeg');
            const file = new MessageAttachment(image, "info.jpeg");
            
            const resultEmbed = await result(await this.localeMessage("MESSAGE_LAST_WEEK_DEMONS_CHANGE_AMOUNT"), toChangeString(demonData.easy), toChangeString(demonData.medium), toChangeString(demonData.hard), toChangeString(demonData.insane), toChangeString(demonData.extreme), toChangeString(demonData.total));
            this.interaction.reply(MessagePayload.create(this.interaction, {embeds: [resultEmbed.setImage("attachment://info.jpeg")], files: [file]}));
        } else if (type == 1) {
            //레이팅 종류
            const [demonCounts] = <RowDataPacket[][]> await this.connection.query('SELECT creator_points, COUNT(case when difficulty=0 then 1 end) as `hard`, '
            +'COUNT(case when difficulty=3 then 1 end) as `easy`, COUNT(case when difficulty=4 then 1 end) as `medium`, '
            +'COUNT(case when difficulty=5 then 1 end) as `insane`, COUNT(case when difficulty=6 then 1 end) as `extreme`, COUNT(*) as `total` FROM gd_demons GROUP BY creator_points ORDER BY creator_points');

            const toChangeString = (data: string) => {
                return demonCounts.map(element => `**${element.creator_points}: **${element[data]}`).join('　');
            }

            const chart = this.getStackedChart();
            demonCounts.forEach((element, index) => {
                chart.chartConfig.data.datasets.push({ label: ""+element.creator_points, data: [element['easy'], element['medium'], element['hard'], element['insane'], element['extreme']], backgroundColor: chart.backgroundColor[index] });
            });

            const image = await chart.chart.renderToBuffer(chart.chartConfig, 'image/jpeg');
            const file = new MessageAttachment(image, "info.jpeg");
            
            const resultEmbed = await result(await this.localeMessage("MESSAGE_CP_DEMONS_AMOUNT"), toChangeString('easy'), toChangeString('medium'), toChangeString('hard'), toChangeString('insane'), toChangeString('extreme'), toChangeString('total'));
            this.interaction.reply(MessagePayload.create(this.interaction, {embeds: [resultEmbed.setImage("attachment://info.jpeg")], files: [file]}));
        } else if (type == 2) {
            //길이
            const [demonCounts] = <RowDataPacket[][]> await this.connection.query('SELECT level_length, COUNT(case when difficulty=0 then 1 end) as `hard`, '
            +'COUNT(case when difficulty=3 then 1 end) as `easy`, COUNT(case when difficulty=4 then 1 end) as `medium`, '
            +'COUNT(case when difficulty=5 then 1 end) as `insane`, COUNT(case when difficulty=6 then 1 end) as `extreme`, COUNT(*) as `total` FROM gd_demons GROUP BY level_length ORDER BY level_length');

            const toChangeString = (data: string) => {
                return demonCounts.map(element => `**${Demon.getLengthText(+element.level_length)}: **${element[data]}`).join('　');
            }

            const chart = this.getStackedChart();
            demonCounts.forEach((element, index) => {
                chart.chartConfig.data.datasets.push({ label: Demon.getLengthText(+element.level_length), data: [element['easy'], element['medium'], element['hard'], element['insane'], element['extreme']], backgroundColor: chart.backgroundColor[index] });
            });

            const image = await chart.chart.renderToBuffer(chart.chartConfig, 'image/jpeg');
            const file = new MessageAttachment(image, "info.jpeg");
            
            const resultEmbed = await result(await this.localeMessage("MESSAGE_LENGTH_DEMONS_AMOUNT"), toChangeString('easy'), toChangeString('medium'), toChangeString('hard'), toChangeString('insane'), toChangeString('extreme'), toChangeString('total'));
            this.interaction.reply(MessagePayload.create(this.interaction, {embeds: [resultEmbed.setImage("attachment://info.jpeg")], files: [file]}));
        } else {
            //업로드된 버전
            const [demonCounts] = <RowDataPacket[][]> await this.connection.query('SELECT ingame_version, COUNT(case when difficulty=0 then 1 end) as `hard`, '
            +'COUNT(case when difficulty=3 then 1 end) as `easy`, COUNT(case when difficulty=4 then 1 end) as `medium`, '
            +'COUNT(case when difficulty=5 then 1 end) as `insane`, COUNT(case when difficulty=6 then 1 end) as `extreme`, COUNT(*) as `total` FROM gd_demons GROUP BY ingame_version ORDER BY ingame_version');

            const toChangeString = (demon: string) => {
                return demonCounts.map(element => `**${Demon.getIngameVersion(+element.ingame_version)}: **${element[demon]}`).join('　');
            }

            const chart = this.getStackedChart();
            demonCounts.forEach((element, index) => {
                chart.chartConfig.data.datasets.push({ label: Demon.getIngameVersion(+element.ingame_version), data: [element['easy'], element['medium'], element['hard'], element['insane'], element['extreme']], backgroundColor: chart.backgroundColor[index] });
            });

            const image = await chart.chart.renderToBuffer(chart.chartConfig, 'image/jpeg');
            const file = new MessageAttachment(image, "info.jpeg");
            
            const resultEmbed = await result(await this.localeMessage("MESSAGE_VERSION_DEMONS_AMOUNT"),toChangeString('easy'), toChangeString('medium'),toChangeString('hard'), toChangeString('insane'),toChangeString('extreme'), toChangeString('total'));
            this.interaction.reply(MessagePayload.create(this.interaction, {embeds: [resultEmbed.setImage("attachment://info.jpeg")], files: [file]}));
        }
    }

    private getStackedChart() {
        const chart = new ChartJSNodeCanvas({ width: 800, height: 450, chartCallback: (ChartJS) => {
            ChartJS.defaults.global.defaultFontColor = '#FFF';
        } });
        const backgroundColor = [
            'rgb(255, 99, 132)',
            'rgb(54, 162, 235)',
            'rgb(255, 206, 86)',
            'rgb(75, 192, 192)',
            'rgb(153, 102, 255)',
            'rgb(255, 159, 64)',
            'rgb(255, 102, 255)'
        ];
        const chartConfig = {
            type: 'bar',
            data: {
                labels: [
                    'Easy Demon',
                    'Medium Demon',
                    'Hard Demon',
                    'Insane Demon',
                    'Extreme Demon'
                ],
                datasets: [
                    {
                        label: '1.6',
                        data: [1, 2, 3, 4, 5],
                        backgroundColor: backgroundColor[0]
                    },
                ]
            },
            options: {
                scales: {
                    xAxes: [{
                        stacked: true
                    }],
                    yAxes: [{
                        stacked: true
                    }]
                }
            }
        };
        chartConfig.data.datasets.length = 0;
        return { chart, backgroundColor, chartConfig};
    }

    private getPieChart() {
        const chart = new ChartJSNodeCanvas({ width: 800, height: 450, chartCallback: (ChartJS) => {
            ChartJS.defaults.global.defaultFontColor = '#FFF';
        } });
        const backgroundColor = [
            'rgb(255, 99, 132)',
            'rgb(54, 162, 235)',
            'rgb(255, 206, 86)',
            'rgb(75, 192, 192)',
            'rgb(153, 102, 255)',
            'rgb(255, 159, 64)',
            'rgb(255, 102, 255)'
        ];
        const chartConfig = {
            type: 'pie',
            data: {
                labels: [
                    'Easy Demon',
                    'Medium Demon',
                    'Hard Demon',
                    'Insane Demon',
                    'Extreme Demon'
                ],
                datasets: [
                    {
                        label: 'dataset',
                        data: [1, 2, 3, 4, 5],
                        backgroundColor: backgroundColor
                    }
                ]
            }
        };
        chartConfig.data.datasets[0].data.length = 0;
        return { chart, backgroundColor, chartConfig};
    }
}
