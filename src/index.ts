import { Context } from "koishi";
import { Config } from "./config";
import { transform } from "koishi-plugin-markdown";
import {} from "@koishijs/plugin-http";
import {} from "koishi-plugin-cron";
import {
  assetsInit,
  getHitokoto,
  getMuoyuImg,
  getNewsImg,
  getNewsText,
} from "./assetsUtil";

declare module "koishi" {
  interface Events {
    // 方法名称对应自定义事件的名称
    // 方法签名对应事件的回调函数签名
    "hellomorning/moring-event"(massage: string): void;
  }
}

export function apply(ctx: Context, config: Config) {
  assetsInit(ctx, config);
  const morntime = config.advancedTimer
    ? config.cronTime
    : `${formatValue(config.min)} ${formatValue(config.hour)} ${formatValue(
        config.dayOfMonth
      )} * ${formatValue(config.weekDay)}`;

  ctx
    .command("hellomorning", "手动触发hellomorning发送到当前会话")
    .action(() => getMorningMsg());

  try {
    //定时触发事件
    ctx.cron(morntime, async () => {
      ctx.emit("hellomorning/moring-event", null);
    });
  } catch (error) {
    ctx.logger.error(error);
  }
  //响应事件
  ctx.on("hellomorning/moring-event", async () => await sendMorningMsg());

  async function sendMorningMsg() {
    const outMsg = await getMorningMsg();
    //是否全局广播,否则循环选择的群
    if (config.broad) await ctx.broadcast(outMsg);
    else {
      for (const broad of config.broadArray) {
        ctx.bots[`${broad.adapter}:${broad.botId}`].sendMessage(
          `${broad.groupId}`,
          outMsg
        );
        ctx.sleep(2000);
      }
    }
  }

  async function getMorningMsg() {
    let { isOutputFormat, formatText, helloMessage, addHitokoto, addNews } =
      config;

    let outMsg = "";
    if (!isOutputFormat) {
      outMsg += transform(helloMessage);
      if (addHitokoto) {
        const hitokoto = await getHitokoto();
        outMsg += hitokoto[0] + "\n                       ---" + hitokoto[1];
      }
      if (addNews) {
        outMsg += await getNewsImg();
      }
      return outMsg;
    }
    const regexList = [
      /\{hello\}/gi,
      /\{hitokoto\}/gi,
      /\{newsText\}/gi,
      /\{newsImg\}/gi,
      /\{muoyuImg\}/gi,
    ];

    const indices = [];
    regexList.forEach((regex) => {
      for (let match of formatText.matchAll(regex)) {
        indices.push({ regex: regex.source, index: match.index });
      }
    });
    indices.sort((a, b) => a.index - b.index);

    let sliptIndex = 0;
    for (let i = 0; i < indices.length; i++) {
      const regIndex = indices[i].index;
      const strSlipt = formatText.slice(sliptIndex, regIndex);
      if (strSlipt) outMsg += strSlipt;
      switch (indices[i].regex) {
        case "\\{hello\\}":
          sliptIndex = regIndex + 7;
          outMsg += transform(helloMessage);
          break;
        case "\\{hitokoto\\}":
          sliptIndex = regIndex + 10;
          const hitokoto = await getHitokoto();
          if (hitokoto === "") break;
          outMsg += hitokoto[0] + "\n                       ---" + hitokoto[1];
          break;
        case "\\{newsText\\}":
          sliptIndex = regIndex + 10;
          outMsg += await getNewsText();
          break;
        case "\\{newsImg\\}":
          sliptIndex = regIndex + 9;
          outMsg += await getNewsImg();
          break;
        case "\\{muoyuImg\\}":
          sliptIndex = regIndex + 10;
          outMsg += await getMuoyuImg();
          break;
      }
    }
    outMsg += formatText.slice(sliptIndex);

    return outMsg;
  }
}
//检查配置的时间中是否有空或-1
function formatValue(value: number): string {
  if (value && value === -1) return "*";
  return value === -1 ? "*" : value.toString();
}

export * from "./config";
