import { Context, h, HTTP, Logger } from "koishi";
import { Config } from "./index";

const hitokotoUrl1 = "https://v1.hitokoto.cn/"; //一言
const hitokotoUrl2 = "https://international.v1.hitokoto.cn/"; //海外地址
const newsUrl = "https://60s.viki.moe/?v2=1"; //60s文本
const newsImgUrl = "https://api.03c3.cn/api/zb"; //云综合60s图片
const muoyuCalendarUrl = "https://api.vvhan.com/api/moyu"; //韩小韩摸鱼日历
const weiyuUrl = "https://api.03c3.cn/api/oneSentenceADay"; //云综合微语 已失效

export const hitokotoTypeDict: Record<string, string> = {
  动画: "a",
  漫画: "b",
  游戏: "c",
  文学: "d",
  原创: "e",
  来自网络: "f",
  其他: "g",
  影视: "h",
  诗词: "i",
  网易云: "j",
  哲学: "k",
  抖机灵: "l",
};

interface HitokotoRet {
  id: number;
  hitokoto: string;
  type: string;
  from: string;
  from_who: string | null;
  creator: string;
  creator_uid: number;
  reviewer: number;
  uuid: string;
  commit_from: string;
  created_at: string;
  length: number;
}

interface NewsRet {
  id: number;
  message: string;
  data: {
    news: string[];
    tip: string;
    updated: number;
    url: string;
    cover: string | null;
  };
}

let conf: Config;
let http: HTTP;
let hitokotoUrl: string;
let log: Logger;
export async function assetsInit(ctx: Context, config: Config) {
  conf = config;
  http = ctx.http;
  log = ctx.logger("helloMorningUtil");
  hitokotoUrl = conf.hitokotOverseasUrl ? hitokotoUrl2 : hitokotoUrl1;
  if (conf.debugModel) {
    log.level = Logger.DEBUG;
  } else {
    log.level = Logger.INFO;
  }
}

export async function getHitokoto() {
  try {
    const randomIndex = Math.floor(
      Math.random() * conf.hitokotoTypeArray.length
    );
    const typeName = conf.hitokotoTypeArray[randomIndex];
    const response: HitokotoRet = await http.get<HitokotoRet>(hitokotoUrl, {
      params: {
        c: `${hitokotoTypeDict[typeName]}`,
      },
    });
    log.debug("hitokoto:", JSON.stringify(response));
    log.debug(response);
    return [response.hitokoto, response.from];
  } catch (error) {
    if (
      error.name === "ForbiddenError" ||
      (error.response && error.response.status === 403)
    ) {
      log.error("hitokoto: 403 Forbidden");
      return "";
    }
    log.error(error);
    return "";
  }
}

export async function getWeiyu(): Promise<string> {
  try {
    return await http.get(weiyuUrl);
  } catch (error) {
    log.error(error);
    return "";
  }
}

export async function getNewsText(): Promise<string> {
  try {
    const response: NewsRet = await http.get(newsUrl);
    log.debug("newsText:", response.data.news);
    return response.data.news.join("\n");
  } catch (error) {
    log.error(error);
    return "";
  }
}

export async function getNewsImg(): Promise<h | string> {
  try {
    const response = await http.get(newsImgUrl);
    log.debug("newsImg:", response);
    //h.image用来发二进制图片
    return h.image(response, "image/png");
  } catch (error) {
    log.error(error);
    return "";
  }
}

export async function getMuoyuImg(): Promise<h | string> {
  try {
    const response = await http.get(muoyuCalendarUrl);
    log.debug("muoyuImg:", response);
    return h.image(response, "image/png");
  } catch (error) {
    log.error(error);
    return "";
  }
}
