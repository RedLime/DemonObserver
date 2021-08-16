
import english from '../locale/english.json';
import korean from '../locale/korean.json';
import mysql, { RowDataPacket } from 'mysql2/promise'

type LocaleType = 0 | 1
type LocaleString = {[key: string]: string}
const locales = {
    0: <LocaleString> english,
    1: <LocaleString> korean
};

type LocaleData = {[key: string]: LocaleType}
const localesData: LocaleData = {};

/**
 * 번역된 메세지를 반출합니다.
 * @param {number} language 서버 컨피그
 * @param {string} raw 메세지 코드
 * @param {Array} args 대체 메세지
 * @returns {string} 번역된 메세지
 */
export function getLocaleMessage(language: LocaleType, raw: string, args: Array<any> = []): string {
    var text = (locales[language][raw] ?? raw).toString();
    args.forEach((arg, index) => {
        text = text.split(`{${index}}`).join(arg);
    });
    return text;
}


export async function getLocaleMessageGuild(connection: mysql.Pool, guild_id: string | number, raw: string, args: Array<any> = []): Promise<string> {
    const language = await getLocale(connection, guild_id);
    return getLocaleMessage(language, raw, args);
}


export async function getLocale(connection: mysql.Pool, guild_id: string | number): Promise<LocaleType> {
    if (localesData[guild_id] != null) {
        return localesData[guild_id];
    } else {
        const [[result]] = <RowDataPacket[][]> await connection.query('SELECT language FROM guild_settings');
        if (result) {
            localesData[guild_id] = result.language ?? 0;
            return localesData[guild_id];
        } else {
            return 0;
        }
    }
}


export async function updateLocale(connection: mysql.Pool, guild_id: string | number, language: LocaleType) {
    await connection.query(`UPDATE guild_settings SET language = ${language} WHERE guild_id = '${guild_id}'`);
    localesData[guild_id] = language;
}


export async function getTimeAgoLocaleGuild(connection: mysql.Pool, guild_id: string | number, date: number): Promise<string> {
    const language = await getLocale(connection, guild_id);
    return getTimeAgoLocale(language, date);
}

/**
 * 일자 전 표기를 현지화합니다.
 * @param {number} language 언어
 * @param {number} date 날짜
 */
export function getTimeAgoLocale(language: LocaleType, date: number): string {
    const malDate = Date.now() - date;

    if (malDate < 1000) {
        return getLocaleMessage(language, "TIME_MOMENT");
    } else if (malDate < 60*1000) {
        return getLocaleMessage(language, "TIME_SECONDS", [Math.floor(malDate / 1000),
            Math.floor(malDate / 1000) != 1 ? getLocaleMessage(language, "TIME_MULTIPLE") : ""]);
    } else if (malDate < 60*60*1000) {
        return getLocaleMessage(language, "TIME_MINUTES", [Math.floor(malDate / (60*1000)),
            Math.floor(malDate / (60*1000)) != 1 ? getLocaleMessage(language, "TIME_MULTIPLE") : ""]);
    } else if (malDate < 24*60*60*1000) {
        return getLocaleMessage(language, "TIME_HOURS", [Math.floor(malDate / (60*60*1000)),
            Math.floor(malDate / (60*60*1000)) != 1 ? getLocaleMessage(language, "TIME_MULTIPLE") : ""]);
    } else {
        return getLocaleMessage(language, "TIME_DAYS", [Math.floor(malDate / (24*60*60*1000)),
            Math.floor(malDate / (24*60*60*1000)) != 1 ? getLocaleMessage(language, "TIME_MULTIPLE") : ""]);
    }
}