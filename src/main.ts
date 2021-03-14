import * as https from "https";
import * as querystring from "querystring";
import md5 = require("md5");
import { appId, appSecret } from "./private";
import {BaiduResult} from "./types";

type ErrorMap = {
    [k: string]: string | undefined
}

const errorMap: ErrorMap = {
    52003: '用户认证失败'
}

export const translate = (word: string) => {
    const salt = Math.random()
    const sign = md5(appId + word + salt + appSecret)
    let from, to
    if (/[a-zA-Z]/.test(word[0])) {
        from = 'en'
        to = 'zh'
    } else {
        from = 'zh'
        to = 'en'
    }

    const query: string = querystring.stringify({
        q: word,
        appid: appId,
        from,
        to,
        salt,
        sign
    })

    const options = {
        hostname: 'fanyi-api.baidu.com',
        port: 443,
        path: '/api/trans/vip/translate?' + query,
        method: 'GET'
    };

    const request = https.request(options, (response) => {
        const chunks: Buffer[] = []
        response.on('data', (chunk) => {
            chunks.push(chunk)
        });
        response.on('end', () => {
            const string = Buffer.concat(chunks).toString()
            const object: BaiduResult = JSON.parse(string)
            if (object.error_code) {
                console.error(errorMap[object.error_code] || object.error_msg)
                process.exit(2)
            } else {
                object.trans_result.forEach(item => {
                    console.log(item.dst)
                })
                process.exit(0)
            }
        })
    });

    request.on('error', (e) => {
        console.error(e);
    });
    request.end();
}