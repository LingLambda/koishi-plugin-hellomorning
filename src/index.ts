import { Context, h, Schema } from 'koishi'
import { } from '@koishijs/plugin-http'
import { } from 'koishi-plugin-cron'
export const name = 'hellomorning'
//广播需要数据库依赖
export const inject = {
  required: ['cron', 'database']
}

export const usage = `<h1>不只是一个定时打招呼插件!</h1>  
定时例:  
每隔一分钟都发送一次:  
  
      分 时 日 周  
  
      -1,-1,-1,-1  
每天早晨7点30分发送一次:  
  
      分 时 日 周  
  
       30,7,-1,-1 
每周六12点发送一次:  
  
      分 时 日 周  
  
       0,12,-1, 6  
高级定时功能可参考<a href="http://crontab.org/">cron</a>  
不要设置不存在的时间哦  

<small>已经安装服务还提示未加载不用管,能跑就行(</small>
`

const hitokotoTypeDict: Record<string, string> = {
  '动画': 'a',
  '漫画': 'b',
  '游戏': 'c',
  '文学': 'd',
  '原创': 'e',
  '来自网络': 'f',
  '其他': 'g',
  '影视': 'h',
  '诗词': 'i',
  '网易云': 'j',
  '哲学': 'k',
  '抖机灵': 'l'
};

let hitokotoUrl = ""
const hitokotoUrl1 = "https://v1.hitokoto.cn/"//一言
const hitokotoUrl2 = "https://international.v1.hitokoto.cn/"//海外地址
const newsUrl = "https://60s.viki.moe/?v2=1"//60s文本
const newsImgUrl = "https://api.03c3.cn/api/zb"//云综合60s图片
const muoyuCalendarUrl = "https://api.vvhan.com/api/moyu"//韩小韩摸鱼日历
const weiyuUrl = "https://api.03c3.cn/api/oneSentenceADay"//云综合微语

export interface Config {
  min?: number
  hour?: number
  dayOfMonth?: number
  weekDay?: number
  message?: string
  hitokotoType?: string
  hitokotOverseasUrl?: boolean
  addHitokoto?: boolean
  addNews?: boolean
  advancedTimer?: boolean
  cronTime?: string
  newsInterface?: string
  addWeiyu?: boolean
  broad?: boolean
  broadArray?: Array<{ adapter: string, botId: string, groupId: string }>
}


export const Config: Schema<Config> = Schema.intersect([
  Schema.object({
    message: Schema.string().default("早上好,祝你度过美好的一天!!＼(＾▽＾)／").description("配置定时发送的自定义消息"),
    min: Schema.number().default(50).max(59).min(-1).description('每小时的第几分钟(0-59)'),
    hour: Schema.number().default(7).max(23).min(-1).description('每天的第几小时(0-23)'),
    dayOfMonth: Schema.number().default(-1).max(31).min(-1).description('每个月的第几天(0-31)'),
    weekDay: Schema.number().default(-1).max(7).min(-1).description('周几(1-7)'),
    advancedTimer: Schema.boolean().default(false).description('该选项启用后上述基础定时设置将无效'),
  }).description('基础设置'),
  Schema.union([
    Schema.object({
      advancedTimer: Schema.const(true).required(),
      cronTime: Schema.string().description("cron").default('50 7 * * *'),
    }),
    Schema.object({}),
  ]),
  Schema.object({
    addHitokoto: Schema.boolean().default(true).description('是否添加一言'),
  }).description('一言设置'),
  Schema.union([
    Schema.object({
      addHitokoto: Schema.const(true),
      hitokotOverseasUrl: Schema.boolean().default(false).description("启用一言海外API"),
      hitokotoType: Schema.union(['动画', '漫画', '游戏', '文学', '原创', '来自网络', '其他', '影视', '诗词', '网易云', '哲学', '抖机灵']).default('原创').description('配置一言的类型'),
    }),
    Schema.object({}),
  ]),
  Schema.object({
    addNews: Schema.boolean().default(false).description('是否添加资讯'),
  }).description('资讯设置'),
  Schema.union([
    Schema.object({
      addNews: Schema.const(true).required(),
      newsInterface: Schema.union(['60s(文本)', '60s(图片)', '摸鱼日历(图片)']).default('60s(图片)').description('资讯接口(每个内容都不同)')
    }),
    Schema.object({}),
  ]),
  Schema.object({
    addWeiyu: Schema.boolean().default(false).description('是否添加每日微语'),
  }).description('微语设置'),
  Schema.object({
    broad: Schema.boolean().default(true).description('在所有群聊广播,关闭后可指定群配置'),
  }).description('全局广播'),
  Schema.union([
    Schema.object({
      broad: Schema.const(false).required(),
      broadArray: Schema.array(Schema.object({
        adapter: Schema.string().default("onebot").description("适配器名"),
        botId: Schema.string().default("552487878").description("机器人账号"),
        groupId: Schema.string().default("1145141919").description("群组号")
      })).role('table')
    }),
    Schema.object({}),
  ])
])


declare module 'koishi' {
  interface Events {
    // 方法名称对应自定义事件的名称
    // 方法签名对应事件的回调函数签名
    'hellomorning/moring-event'(massage: string): void
  }
}

interface HitokotoRet {
  id: number
  hitokoto: string
  type: string
  from: string
  from_who: string | null
  creator: string
  creator_uid: number
  reviewer: number
  uuid: string
  commit_from: string
  created_at: string
  length: number
}

interface NewsRet {
  id: number
  message: string
  data: {
    news: string[]
    tip: string
    updated: number
    url: string
    cover: string | null
  }
}

export function apply(ctx: Context, config: Config) {
  hitokotoUrl = config.hitokotOverseasUrl ? hitokotoUrl2 : hitokotoUrl1
  const morntime = config.advancedTimer ? config.cronTime : `${formatValue(config.min)} ${formatValue(config.hour)} ${formatValue(config.dayOfMonth)} * ${formatValue(config.weekDay)}`
  try {
    //定时触发事件
    ctx.cron(morntime, async () => {
      ctx.emit('hellomorning/moring-event', config.message)
    })
  } catch (error) {
    //捕获配置错误
    ctx.logger("hellomorningTimeConfig").warn(error)
  }
  //响应事件
  ctx.on('hellomorning/moring-event', async (message: string) => {
    if (config.addNews) {
      if (config.newsInterface == "60s(文本)")
        message = await massageAddNews(message, ctx)
      else if (config.newsInterface == "60s(图片)")
        message = await massageAddNewsImg(message, ctx)
      else if (config.newsInterface == "摸鱼日历(图片)")
        message = await massageAddMuoyuImg(message, ctx)
    }
    if (config.addWeiyu)
      message = await massageAddWeiyu(message, ctx)
    if (config.addHitokoto)
      message = await massageAddHitokoto(message, ctx, config)
    //是否全局广播,否则循环选择的群
    if (config.broad) await ctx.broadcast(message)
    else {
      for (const broad of config.broadArray) {
        ctx.bots[`${broad.adapter}:${broad.botId}`].sendMessage(`${broad.groupId}`, message);
        ctx.sleep(2000);
      }
    }
  })
}
//检查配置的时间中是否有空或-1,这个if没什么用但是为了防止我自己铸币导致传入空导致bug还是加了
function formatValue(value: number): string {
  if (!value)
    return '*'
  return value === -1 ? '*' : value.toString()
}
//拼接一言字符串
async function massageAddHitokoto(string: string, ctx: Context, config: Config) {
  try {
    const result: HitokotoRet = await ctx.http.get<HitokotoRet>(
      hitokotoUrl,
      {
        params: { c: `${hitokotoTypeDict[config.hitokotoType]}` }
      }
    )
    ctx.logger("hitokoto").info(result);
    return string + `\n    ${result.hitokoto}\n                              ---${result.from}`
  } catch (error) {
    ctx.logger("hitokoto").warn(error);
    return string + "一言请求失败"
  }
}
//拼接每日微语字符串
async function massageAddWeiyu(string: string, ctx: Context) {
  try {
    const result = await ctx.http.get(weiyuUrl)
    ctx.logger("weiyu").info(result);
    return string + `\n    ${result.data}\n`
  } catch (error) {
    ctx.logger("weiyu").warn(error);
    return string + "微语请求失败"
  }
}

//拼接新闻(文本)
async function massageAddNews(string: string, ctx: Context) {
  try {
    const result: NewsRet = await ctx.http.get<NewsRet>(newsUrl)
    ctx.logger("newstext").info(result);
    return string + `\n${result.data.news.join("\n")}`
  } catch (error) {
    ctx.logger("newstext").warn(error);
    return string + "新闻消息请求失败。"
  }
}
//拼接新闻(图片)
async function massageAddNewsImg(string: string, ctx: Context) {
  try {
    const result = await ctx.http.get(newsImgUrl);
    //h.image用来发二进制图片
    return string + h.image(result, 'image/png')
  } catch (error) {
    ctx.logger("newsImg").warn(error);
    return string + "新闻图片请求失败。"
  }
}
//拼接摸鱼日历
async function massageAddMuoyuImg(string: string, ctx: Context) {
  try {
    const result = await ctx.http.get(muoyuCalendarUrl);
    return string + h.image(result, 'image/png')
  } catch (error) {
    ctx.logger("muoyu").warn(error);
    return string + "摸鱼日历请求失败。"
  }
}
