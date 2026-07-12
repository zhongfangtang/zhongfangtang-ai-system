/**
 * 知识库页面 - 中芳堂15大知识库 + 公司简介
 */
export async function render(el) {
  const kbs = [
    { name:'🏛️ 中芳堂品牌简介', ref:'品牌简介与全域系统化经营计划书', count:'三主体架构+四大代理+六套方案+商业闭环' },
    { name:'🔬 王琦院士九体辨识', ref:'王琦《中医体质学》2005; ZYYXH/T157-2009', count:'9种体质完整辨证+60题测评' },
    { name:'🌿 芳香疗法精油(50种)', ref:'《精油图鉴》温佑君; AEUA教材; IFPA/NAHA', count:'50精油+20纯露+20基础油' },
    { name:'📜 屈原香草文化', ref:'《离骚》《九歌》《诗经》《本草纲目》', count:'23种香草+7000年脉络·屈原是中医芳香疗法鼻祖' },
    { name:'🧴 屈兵九体复方精油配方', ref:'中芳堂自研·屈兵配方', count:'9体质专属复方精油配方' },
    { name:'🌸 屈兵28养复方精油配方', ref:'中芳堂自研·屈兵配方', count:'28天生理周期养肤精油配方' },
    { name:'🍄 美罗国际·真菌多糖内调', ref:'美罗国际产品手册·授权经销商屈兵', count:'灵芝/松花粉/猴头菇/冬虫夏草4大系列' },
    { name:'🌱 纤姿达·本草植萃外养', ref:'纤姿达产品手册·抖音云连锁', count:'植萃液+平衡霜+养护套组+盐包4大产品' },
    { name:'💆 屈氏美容美体服务', ref:'屈氏美容服务目录·终端体验中心', count:'美容+美体+仪器+外治4大类服务' },
    { name:'⌚ 腕家H1中医AI手表', ref:'湖南云医链·屈氏美容独家授权', count:'九体辨识+五脏+五气+多维体征监测' },
    { name:'🍯 伍申堂草本九体膏方', ref:'伍申堂产品手册', count:'8种体质膏方·一质一方' },
    { name:'🎓 AEUA国际芳香疗法', ref:'AEUA欧洲芳香疗法学会教材', count:'国际认证体系·高级讲师' },
    { name:'📖 1+X芳香疗法师', ref:'教育部1+X证书制度·考评员培训', count:'师资+考评员培养体系' },
  ];

  el.innerHTML = `
    <div class="card"><h3>📚 中芳堂知识库体系（15大知识库）</h3><div class="hint">所有知识库均附参考资料，严谨可追溯 | 中芳堂学术护城河</div></div>

    <!-- 公司简介 -->
    <div class="card mt16" style="border-color:var(--gold);background:linear-gradient(135deg,rgba(212,168,83,.06),transparent)">
      <h3>🏛️ 中芳堂品牌简介</h3>
      <div class="meta" style="line-height:2">
        <b>品牌定位：</b>以中医九种体质辨证体系为根基、中医芳香疗法植物配伍技术为核心、AI智能大数据监测为工具、草本外养+真菌多糖内调为双赛道的新型科技康养美业品牌。<br>
        <b>核心理念：</b>不千人一方、不盲目养护、不夸大功效、不医疗化宣传。<br>
        <b>三主体架构：</b>宜昌屈氏美业健康管理有限公司【管理总部】+ 湖北中芳堂美业生物科技发展有限责任公司【研发营运总部】+ 宜昌市伍家岗区屈氏美容美体服务部【终端体验】<br>
        <b>法人：</b>屈兵 | 美罗国际全系康养产品官方授权经销商 | 九体复方精油+28养复方精油自研配方<br>
        <b>四大代理品牌：</b>纤姿达(流量端) + 嘟嘟瓜(人才端) + 腕家H1(监测端) + 美罗国际(内调端)<br>
        <b>商业闭环：</b>自主研发产品与技术 → AI+人工双体质测评 → 私人定制方案 → 到店外养 → 居家内调 → 私域终身锁客<br>
        <b>品牌愿景：</b>以屈原香草文化+中医九体养生+AI智能监测为三维核心，打造国内领先、标准化、数据化、合规化、可规模化的新式中式芳疗康养标杆品牌。
      </div>
    </div>

    <!-- 知识库列表 -->
    <div class="grid2 mt16">
      ${kbs.map(k=>`<div class="card"><h3>${k.name}</h3><div class="meta">📖 ${k.ref}</div><div class="hint mt12">📊 ${k.count}</div></div>`).join('')}
    </div>

    <!-- 发展脉络 -->
    <div class="card mt16"><h3>🏛️ 中医芳香疗法发展脉络（7000年）</h3>
      <div class="row"><div class="grow"><b>公元前340年 · 屈原</b></div><span style="color:var(--gold)">香草文化起源·中医芳香疗法鼻祖</span></div>
      <div class="row"><div class="grow"><b>汉代 · 神农本草经</b></div><span>芳香药物体系建立</span></div>
      <div class="row"><div class="grow"><b>唐代 · 孙思邈《千金要方》</b></div><span>芳香药物临床成熟+域外香料传入</span></div>
      <div class="row"><div class="grow"><b>宋代 · 太平惠民和剂局方</b></div><span>芳香方剂标准化+香药贸易高峰</span></div>
      <div class="row"><div class="grow"><b>明代1590 · 李时珍《本草纲目》</b></div><span>芳香药物学集大成·1892种药物</span></div>
      <div class="row"><div class="grow"><b>1928年 · 盖特福塞(法国)</b></div><span>现代"芳香疗法"概念诞生（比中国晚2200年）</span></div>
      <div class="row"><div class="grow"><b>当代 · 中芳堂(屈兵)</b></div><span style="color:var(--gold);font-weight:bold">中医芳香疗法体系·千年香草文化当代传承</span></div>
    </div>`;
}
