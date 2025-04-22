import { Schema } from "koishi";

export const name = "hellomorning";
//广播需要数据库依赖
export const inject = {
  required: ["cron", "database"],
  optional: ["rainbow"],
};

export const usage = `
# 不只是一个定时打招呼插件!

### 定时发送:

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

### 格式化输出:

**开启格式化输出会使单独设置的一言，新闻等开关失效**
可用转义(不区分大小写)：

| 转义原字符 | 转义后|
|---|----|
|{hello} | 问候语|
|{hitokoto} | 一言|
|{newsImg} | 60s(图片)|
|{newsText} | 60s(文本)|
|{muoyuImg} | 摸鱼日历(图片)|
|{{}} | 转义大括号|

例:
\`\`\`
{hello}
{hitokoto}
\`\`\`
会输出类似:

\`\`\`
早上好,祝你度过美好的一天!!＼(＾▽＾)／

(我是一句一言)
\`\`\`

### 其他:
已经安装服务还提示未加载不用管,能跑就行
启用全局广播时建议将全局设置的delay.broadcast设置为2000以上
`;
export interface Config {
  min?: number;
  hour?: number;
  dayOfMonth?: number;
  weekDay?: number;
  helloMessage?: string;
  hitokotoTypeArray?: Array<string>;
  hitokotOverseasUrl?: boolean;
  addHitokoto?: boolean;
  addNews?: boolean;
  advancedTimer?: boolean;
  cronTime?: string;
  newsInterface?: string;
  // addWeiyu?: boolean;
  broad?: boolean;
  broadArray?: Array<{ adapter: string; botId: string; groupId: string }>;
  isOutputFormat?: boolean;
  formatText?: string;
  enableRainbow?: boolean;
  city?: string;
  debugModel?: boolean;
}

export const Config: Schema<Config> = Schema.intersect([
  Schema.object({
    helloMessage: Schema.string()
      .role("textarea", { rows: [2, 4] })
      .default("早上好,祝你度过美好的一天!!＼(＾▽＾)／")
      .description(
        "配置定时发送的自定义消息(支持markdown(主要用来嵌入自定义的图片))"
      ),
    min: Schema.number()
      .default(50)
      .max(59)
      .min(-1)
      .description("每小时的第几分钟(0-59)"),
    hour: Schema.number()
      .default(7)
      .max(23)
      .min(-1)
      .description("每天的第几小时(0-23)"),
    dayOfMonth: Schema.number()
      .default(-1)
      .max(31)
      .min(-1)
      .description("每个月的第几天(0-31)"),
    weekDay: Schema.number()
      .default(-1)
      .max(7)
      .min(-1)
      .description("周几(1-7)"),
    advancedTimer: Schema.boolean()
      .default(false)
      .description("该选项启用后上述基础定时设置将无效"),
  }).description("基础设置"),
  Schema.object({
    isOutputFormat: Schema.boolean()
      .default(false)
      .description("格式化输出格式"),
  }).description("格式化输出"),
  Schema.union([
    Schema.object({
      isOutputFormat: Schema.const(true).required(),
      formatText: Schema.string()
        .role("textarea", { rows: [2, 4] })
        .default(""),
    }),
    Schema.object({}),
  ]).description("格式化设置"),
  Schema.union([
    Schema.object({
      advancedTimer: Schema.const(true).required(),
      cronTime: Schema.string().description("cron").default("50 7 * * *"),
    }),
    Schema.object({}),
  ]),
  Schema.object({
    addHitokoto: Schema.boolean().default(true).description("是否添加一言"),
  }).description("一言设置"),
  Schema.union([
    Schema.object({
      addHitokoto: Schema.const(true),
      hitokotOverseasUrl: Schema.boolean()
        .default(false)
        .description("启用一言海外API"),
      hitokotoTypeArray: Schema.array(
        Schema.union([
          "动画",
          "漫画",
          "游戏",
          "文学",
          "原创",
          "来自网络",
          "其他",
          "影视",
          "诗词",
          "网易云",
          "哲学",
          "抖机灵",
        ])
      )
        .default(["原创"])
        .description("配置一言的类型")
        .role("select"),
    }),
    Schema.object({}),
  ]),
  Schema.object({
    addNews: Schema.boolean().default(false).description("是否添加资讯"),
  }).description("资讯设置"),
  Schema.union([
    Schema.object({
      addNews: Schema.const(true).required(),
      newsInterface: Schema.union(["60s(文本)", "60s(图片)", "摸鱼日历(图片)"])
        .default("60s(图片)")
        .description("资讯接口(每个内容都不同)"),
    }),
    Schema.object({}),
  ]),
  // Schema.object({
  //   addWeiyu: Schema.boolean().default(false).description('是否添加每日微语'),
  // }).description('微语设置'),
  Schema.object({
    broad: Schema.boolean()
      .default(true)
      .description("在所有群聊广播,关闭后可指定群配置"),
  }).description("全局广播"),
  Schema.union([
    Schema.object({
      broad: Schema.const(false).required(),
      broadArray: Schema.array(
        Schema.object({
          adapter: Schema.string().default("onebot").description("适配器名"),
          botId: Schema.string().default("552487878").description("机器人账号"),
          groupId: Schema.string().default("1145141919").description("群组号"),
        })
      ).role("table"),
    }),
    Schema.object({}),
  ]),
  Schema.object({
    enableRainbow: Schema.boolean()
      .default(false)
      .description("启用 hello-rainbow 服务"),
  }).description("资讯设置"),
  Schema.union([
    Schema.object({
      enableRainbow: Schema.const(true).required(),
      city: Schema.string().default("北京").description("城市名"),
    }),
    Schema.object({}),
  ]),
  Schema.object({
    debugModel: Schema.boolean()
      .default(false)
      .description("开启后会输出详细日志"),
  }).description("调试模式"),
]);
