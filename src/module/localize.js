
import english from '../locale/english.json' assert {type: "json"};
import korean from '../locale/korean.json' assert {type: "json"};

const locales = {
    0: english,
    1: korean
};

const localesData = {};

/**
 * 번역된 메세지를 반출합니다.
 * @param {number} language 서버 컨피그
 * @param {string} raw 메세지 코드
 * @param {Array} args 대체 메세지
 * @returns {string} 번역된 메세지
 */
export function getLocaleMessage(language, raw, args = []) {
    var text = (locales[language][raw] ?? raw).toString();
    args.forEach((arg, index) => {
        text = text.split(`{${index}}`).join(arg);
    });
    return text;
}


export async function getLocaleMessageGuild(connection, guild_id, raw, args = []) {
    const language = await getLocale(connection, guild_id);
    return getLocaleMessage(language, raw, args);
}


export async function getLocale(connection, guild_id) {
    if (localesData[guild_id] != null) {
        return localesData[guild_id];
    } else {
        const [[result]] = await connection.query('SELECT language FROM guild_settings WHERE guild_id = ?', [guild_id]);
        if (result) {
            localesData[guild_id] = result.language ?? 0;
            return localesData[guild_id];
        } else {
            return 0;
        }
    }
}


export async function updateLocale(connection, guild_id, language) {
    await connection.query(`UPDATE guild_settings SET language = ${language} WHERE guild_id = '${guild_id}'`);
    localesData[guild_id] = language;
}


export async function getTimeAgoLocaleGuild(connection, guild_id, date) {
    const language = await getLocale(connection, guild_id);
    return getTimeAgoLocale(language, date);
}

/**
 * 일자 전 표기를 현지화합니다.
 * @param {number} language 언어
 * @param {number} date 날짜
 */
export function getTimeAgoLocale(language, date) {
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