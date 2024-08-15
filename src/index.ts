import {Context, Schema } from 'koishi'
import {} from '@koishijs/plugin-console'
import {} from '@koishijs/plugin-http'
import {} from 'koishi-plugin-cron'

export const name = 'hellomorning'

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


const hitokotoUrl="https://v1.hitokoto.cn/"
const hitokotoUrl2="https://international.v1.hitokoto.cn/"//海外地址
const newsUrl="https://60s.viki.moe/?v2=1"
export interface Config {
  min?: number
  hour?: number
  dayOfMonth?: number
  weekDay?: number
  message?: string
  hitokotoType? : string
  addHitokoto?:boolean
  addNews?:boolean
}

export const Config: Schema<Config> = Schema.object({
  min: Schema.number().default(0).max(59).min(-1).description('每小时的第几分钟(0-59)(设为-1表示每小时的每分钟都允许触发) '),
  hour: Schema.number().default(7).max(23).min(-1).description('每天的第几小时(0-23)(设为-1表示每天的每个小时都允许触发)'),
  dayOfMonth: Schema.number().default(-1).max(31).min(-1).description('每个月的第几天(0-31)(设为-1表示每月的每天都允许触发)'),
  weekDay: Schema.number().default(-1).max(7).min(-1).description('周几(1-7)(设为-1表示每周的每天都允许触发)'),
  message: Schema.string().default("早上好,祝你度过美好的一天!!＼(＾▽＾)／").description("配置定时发送的自定义消息"),
  hitokotoType: Schema.union(['动画', '漫画', '游戏', '文学','原创','来自网络','其他','影视','诗词','网易云','哲学','抖机灵']).default('原创').description('配置一言的类型'),
  addHitokoto: Schema.boolean().default(true).description('是否添加一言'),
  addNews: Schema.boolean().default(false).description('是否添加新闻'),
})

export const inject = {
  required: ['cron','database'],
}

declare module 'koishi' {
interface Events {
  // 方法名称对应自定义事件的名称
  // 方法签名对应事件的回调函数签名
  'hellomorning/moring-event' ( massage : string): void
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
  message:string
  data:{
    news:string[]
    tip:string
    updated:number
    url:string
    cover:string|null
  }
}

export function apply(ctx: Context, config: Config) {
    //定时触发事件
    ctx.cron(`${formatValue(config.min)} ${formatValue(config.hour)} ${formatValue(config.dayOfMonth)} * ${formatValue(config.weekDay)}`, async () => {
      ctx.emit('hellomorning/moring-event' ,config.message)
    })
    //响应事件
    ctx.on('hellomorning/moring-event', async (message: string ) => {
      if(config.addNews)
        message=await massageAddNews(message,ctx)
      if(config.addHitokoto)
        message=await massageAddHitokoto(message,ctx,config)
      await ctx.broadcast(message)
    })
}
//检查配置的时间中是否有空或-1,这个函数没什么用但是为了防止我自己铸币导致传入空导致bug还是加了
function formatValue(value: number): string {
  if(!value)
    return '*'
  return value === -1 ? '*' : value.toString()
}
//拼接一言字符串
async function massageAddHitokoto(string: string, ctx: Context, config: Config){
try {
    const results: HitokotoRet =await ctx.http.get<HitokotoRet>(
      hitokotoUrl,
      {
        params: { c: `${hitokotoTypeDict[config.hitokotoType]}` }
      }
    )
    console.log(`${results.uuid+" "+results.type+" "+results.from+" "+results.from_who}`)
    return string+`\n\n    ${results.hitokoto}\n\t\t\t\t\t\t---${results.from}`
} catch (error) {
  return string+`${error.getMessage().toString()}`
}
}
//拼接新闻字符串
async function massageAddNews(string: string, ctx: Context){
  try {
    const results: NewsRet =await ctx.http.get<NewsRet>(
      newsUrl
    )
    console.log(`${results.data.url+" "+results.data.cover}`)
    return string+`\n${results.data.news.join("\n")}`
  }catch (error) {
    return string+`${error.getMessage().toString()}`
  }
}