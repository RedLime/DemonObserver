
import { Client, TextChannel } from 'discord.js';
import settings from '../../config/settings.json';
import Utils from './utils';

export default class Debug {
    client: Client<boolean> | null | undefined = null;
    
    constructor(client: Client) {
        this.client = client;
    }
    
    log(prefix: any, context: any, obj: any = null, send = true) {
        process.stdout.write(`[${this.dateFormat(new Date())}] (${prefix}) ${context}\r`);
        if (send && this.client) {
            const channel = this.client.channels.cache.get(settings.bot_log_channel) as TextChannel;
            if (channel && Utils.isCanSend(this.client, channel)) {
                channel.send(`[${this.dateFormat(new Date())}] (${prefix}) ${context}`);
            }
        }
    };
    
    logRaw(obj: any) {
        console.log(`[${this.dateFormat(new Date())}]`);
        console.log(obj);
        console.log("");
    };
    
    /**
     * 날짜를 String 형식으로 변환합니다.
     * @param {Date} date
     * @returns {string} string으로 변환된 Date
     */
    dateFormat(date: Date): string {
        let month: number | string = date.getMonth() + 1;
        let day: number | string = date.getDate();
        let hour: number | string = date.getHours();
        let minute: number | string = date.getMinutes();
        let second: number | string = date.getSeconds();
    
        month = month >= 10 ? month : '0' + month;
        day = day >= 10 ? day : '0' + day;
        hour = hour >= 10 ? hour : '0' + hour;
        minute = minute >= 10 ? minute : '0' + minute;
        second = second >= 10 ? second : '0' + second;
    
        return date.getFullYear() + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second;
    }
}