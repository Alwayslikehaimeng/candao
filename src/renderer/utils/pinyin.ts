// 简单拼音映射（常用字）
const PINYIN_MAP: Record<string, string> = {
  '阿': 'a', '啊': 'a', '锕': 'a', '嗄': 'a', '哎': 'ai', '哀': 'ai', '唉': 'ai', '埃': 'ai', '挨': 'ai', '癌': 'ai',
  '矮': 'ai', '艾': 'ai', '爱': 'ai', '碍': 'ai', '隘': 'ai', '安': 'an', '氨': 'an', '庵': 'an', '谙': 'an', '鞍': 'an',
  '俺': 'an', '岸': 'an', '按': 'an', '案': 'an', '暗': 'an', '黯': 'an', '肮': 'ang', '昂': 'ang', '盎': 'ang', '凹': 'ao',
  '熬': 'ao', '翱': 'ao', '袄': 'ao', '傲': 'ao', '奥': 'ao', '澳': 'ao', '懊': 'ao', '八': 'ba', '巴': 'ba', '扒': 'ba',
  '吧': 'ba', '芭': 'ba', '疤': 'ba', '拔': 'ba', '跋': 'ba', '把': 'ba', '靶': 'ba', '坝': 'ba', '爸': 'ba', '罢': 'ba',
  '霸': 'ba', '白': 'bai', '百': 'bai', '柏': 'bai', '摆': 'bai', '败': 'bai', '拜': 'bai', '班': 'ban', '般': 'ban',
  '颁': 'ban', '斑': 'ban', '搬': 'ban', '板': 'ban', '版': 'ban', '办': 'ban', '半': 'ban', '伴': 'ban', '扮': 'ban',
  '拌': 'ban', '绊': 'ban', '瓣': 'ban', '邦': 'bang', '帮': 'bang', '绑': 'bang', '榜': 'bang', '膀': 'bang', '棒': 'bang',
  '磅': 'bang', '包': 'bao', '胞': 'bao', '剥': 'bao', '褒': 'bao', '薄': 'bao', '宝': 'bao', '保': 'bao', '堡': 'bao',
  '饱': 'bao', '抱': 'bao', '报': 'bao', '暴': 'bao', '爆': 'bao', '卑': 'bei', '杯': 'bei', '悲': 'bei', '碑': 'bei',
  '北': 'bei', '贝': 'bei', '备': 'bei', '背': 'bei', '倍': 'bei', '被': 'bei', '辈': 'bei', '奔': 'ben', '本': 'ben',
  '笨': 'ben', '崩': 'beng', '绷': 'beng', '泵': 'beng', '蹦': 'beng', '逼': 'bi', '鼻': 'bi', '比': 'bi', '彼': 'bi',
  '笔': 'bi', '鄙': 'bi', '币': 'bi', '必': 'bi', '毕': 'bi', '闭': 'bi', '庇': 'bi', '毙': 'bi', '秘': 'bi', '敝': 'bi',
  '弊': 'bi', '碧': 'bi', '蔽': 'bi', '壁': 'bi', '避': 'bi', '臂': 'bi', '边': 'bian', '编': 'bian', '鞭': 'bian',
  '扁': 'bian', '便': 'bian', '变': 'bian', '遍': 'bian', '辨': 'bian', '辩': 'bian', '辫': 'bian', '标': 'biao', '彪': 'biao',
  '表': 'biao', '憋': 'bie', '别': 'bie', '宾': 'bin', '滨': 'bin', '缤': 'bin', '冰': 'bing', '兵': 'bing', '丙': 'bing',
  '秉': 'bing', '饼': 'bing', '并': 'bing', '病': 'bing', '拨': 'bo', '波': 'bo', '玻': 'bo', '剥': 'bo', '菠': 'bo',
  '播': 'bo', '伯': 'bo', '驳': 'bo', '泊': 'bo', '勃': 'bo', '博': 'bo', '搏': 'bo', '膊': 'bo', '薄': 'bo', '卜': 'bu',
  '补': 'bu', '捕': 'bu', '不': 'bu', '布': 'bu', '步': 'bu', '怖': 'bu', '部': 'bu', '擦': 'ca', '猜': 'cai', '才': 'cai',
  '材': 'cai', '财': 'cai', '裁': 'cai', '采': 'cai', '彩': 'cai', '踩': 'cai', '菜': 'cai', '蔡': 'cai', '参': 'can',
  '餐': 'can', '残': 'can', '蚕': 'can', '惭': 'can', '惨': 'can', '灿': 'can', '仓': 'cang', '苍': 'cang', '舱': 'cang',
  '藏': 'cang', '操': 'cao', '曹': 'cao', '草': 'cao', '册': 'ce', '厕': 'ce', '侧': 'ce', '测': 'ce', '策': 'ce',
  '层': 'ceng', '曾': 'ceng', '叉': 'cha', '插': 'cha', '查': 'cha', '茶': 'cha', '察': 'cha', '拆': 'chai', '柴': 'chai',
  '产': 'chan', '阐': 'chan', '颤': 'chan', '昌': 'chang', '长': 'chang', '肠': 'chang', '尝': 'chang', '偿': 'chang',
  '常': 'chang', '厂': 'chang', '场': 'chang', '畅': 'chang', '唱': 'chang', '抄': 'chao', '超': 'chao', '巢': 'chao',
  '朝': 'chao', '嘲': 'chao', '潮': 'chao', '吵': 'chao', '炒': 'chao', '车': 'che', '扯': 'che', '彻': 'che', '撤': 'che',
  '尘': 'chen', '臣': 'chen', '沉': 'chen', '陈': 'chen', '晨': 'chen', '衬': 'chen', '称': 'chen', '趁': 'chen', '撑': 'cheng',
  '成': 'cheng', '呈': 'cheng', '承': 'cheng', '诚': 'cheng', '城': 'cheng', '乘': 'cheng', '惩': 'cheng', '程': 'cheng',
  '澄': 'cheng', '橙': 'cheng', '吃': 'chi', '痴': 'chi', '池': 'chi', '驰': 'chi', '迟': 'chi', '持': 'chi', '尺': 'chi',
  '齿': 'chi', '耻': 'chi', '斥': 'chi', '赤': 'chi', '翅': 'chi', '充': 'chong', '冲': 'chong', '虫': 'chong', '重': 'chong',
  '崇': 'chong', '宠': 'chong', '抽': 'chou', '仇': 'chou', '绸': 'chou', '愁': 'chou', '筹': 'chou', '酬': 'chou',
  '丑': 'chou', '臭': 'chou', '初': 'chu', '出': 'chu', '除': 'chu', '厨': 'chu', '锄': 'chu', '础': 'chu', '储': 'chu',
  '楚': 'chu', '处': 'chu', '触': 'chu', '川': 'chuan', '穿': 'chuan', '传': 'chuan', '船': 'chuan', '喘': 'chuan',
  '串': 'chuan', '窗': 'chuang', '床': 'chuang', '创': 'chuang', '吹': 'chui', '垂': 'chui', '锤': 'chui', '春': 'chun',
  '纯': 'chun', '唇': 'chun', '蠢': 'chun', '词': 'ci', '辞': 'ci', '慈': 'ci', '磁': 'ci', '雌': 'ci', '此': 'ci',
  '次': 'ci', '刺': 'ci', '从': 'cong', '匆': 'cong', '葱': 'cong', '聪': 'cong', '丛': 'cong', '凑': 'cou', '粗': 'cu',
  '促': 'cu', '醋': 'cu', '窜': 'cuan', '催': 'cui', '摧': 'cui', '脆': 'cui', '粹': 'cui', '翠': 'cui', '村': 'cun',
  '存': 'cun', '寸': 'cun', '搓': 'cuo', '错': 'cuo', '搭': 'da', '达': 'da', '答': 'da', '打': 'da', '大': 'da', '呆': 'dai',
  '歹': 'dai', '代': 'dai', '带': 'dai', '待': 'dai', '袋': 'dai', '戴': 'dai', '丹': 'dan', '单': 'dan', '担': 'dan',
  '耽': 'dan', '胆': 'dan', '旦': 'dan', '但': 'dan', '诞': 'dan', '弹': 'dan', '淡': 'dan', '蛋': 'dan', '氮': 'dan',
  '当': 'dang', '挡': 'dang', '党': 'dang', '荡': 'dang', '刀': 'dao', '导': 'dao', '岛': 'dao', '倒': 'dao', '捣': 'dao',
  '蹈': 'dao', '到': 'dao', '道': 'dao', '盗': 'dao', '得': 'de', '德': 'de', '的': 'de', '灯': 'deng', '登': 'deng',
  '等': 'deng', '邓': 'deng', '低': 'di', '堤': 'di', '滴': 'di', '迪': 'di', '敌': 'di', '笛': 'di', '底': 'di',
  '抵': 'di', '地': 'di', '弟': 'di', '帝': 'di', '递': 'di', '第': 'di', '颠': 'dian', '典': 'dian', '点': 'dian',
  '电': 'dian', '店': 'dian', '垫': 'dian', '殿': 'dian', '雕': 'diao', '吊': 'diao', '钓': 'diao', '调': 'diao',
  '跌': 'die', '叠': 'die', '丁': 'ding', '盯': 'ding', '钉': 'ding', '顶': 'ding', '鼎': 'ding', '订': 'ding', '定': 'ding',
  '丢': 'diu', '东': 'dong', '冬': 'dong', '懂': 'dong', '动': 'dong', '冻': 'dong', '栋': 'dong', '洞': 'dong', '兜': 'dou',
  '斗': 'dou', '抖': 'dou', '陡': 'dou', '豆': 'dou', '逗': 'dou', '都': 'du', '督': 'du', '毒': 'du', '独': 'du',
  '读': 'du', '堵': 'du', '赌': 'du', '杜': 'du', '肚': 'du', '度': 'du', '渡': 'du', '端': 'duan', '短': 'duan',
  '段': 'duan', '断': 'duan', '堆': 'dui', '队': 'dui', '对': 'dui', '吨': 'dun', '敦': 'dun', '蹲': 'dun', '盾': 'dun',
  '顿': 'dun', '多': 'duo', '夺': 'duo', '朵': 'duo', '躲': 'duo', '阿': 'e', '俄': 'e', '鹅': 'e', '额': 'e', '恶': 'e',
  '饿': 'e', '恩': 'en', '而': 'er', '儿': 'er', '耳': 'er', '尔': 'er', '二': 'er', '发': 'fa', '乏': 'fa', '伐': 'fa',
  '罚': 'fa', '阀': 'fa', '法': 'fa', '番': 'fan', '翻': 'fan', '凡': 'fan', '烦': 'fan', '繁': 'fan', '反': 'fan',
  '返': 'fan', '犯': 'fan', '泛': 'fan', '饭': 'fan', '范': 'fan', '贩': 'fan', '方': 'fang', '芳': 'fang', '防': 'fang',
  '妨': 'fang', '房': 'fang', '仿': 'fang', '访': 'fang', '纺': 'fang', '放': 'fang', '飞': 'fei', '非': 'fei', '啡': 'fei',
  '肥': 'fei', '匪': 'fei', '废': 'fei', '沸': 'fei', '肺': 'fei', '费': 'fei', '分': 'fen', '纷': 'fen', '芬': 'fen',
  '坟': 'fen', '粉': 'fen', '份': 'fen', '奋': 'fen', '愤': 'fen', '粪': 'fen', '丰': 'feng', '风': 'feng', '枫': 'feng',
  '封': 'feng', '疯': 'feng', '峰': 'feng', '锋': 'feng', '蜂': 'feng', '逢': 'feng', '缝': 'feng', '讽': 'feng', '凤': 'feng',
  '奉': 'feng', '佛': 'fo', '否': 'fou', '夫': 'fu', '肤': 'fu', '孵': 'fu', '敷': 'fu', '伏': 'fu', '扶': 'fu',
  '服': 'fu', '浮': 'fu', '符': 'fu', '幅': 'fu', '福': 'fu', '辐': 'fu', '抚': 'fu', '府': 'fu', '辅': 'fu', '腐': 'fu',
  '父': 'fu', '付': 'fu', '妇': 'fu', '负': 'fu', '附': 'fu', '复': 'fu', '副': 'fu', '傅': 'fu', '富': 'fu', '腹': 'fu',
  '覆': 'fu', '该': 'gai', '改': 'gai', '概': 'gai', '钙': 'gai', '盖': 'gai', '干': 'gan', '甘': 'gan', '杆': 'gan',
  '肝': 'gan', '柑': 'gan', '竿': 'gan', '赶': 'gan', '敢': 'gan', '感': 'gan', '刚': 'gang', '岗': 'gang', '纲': 'gang',
  '钢': 'gang', '港': 'gang', '高': 'gao', '搞': 'gao', '稿': 'gao', '告': 'gao', '哥': 'ge', '歌': 'ge', '阁': 'ge',
  '格': 'ge', '隔': 'ge', '个': 'ge', '各': 'ge', '给': 'gei', '根': 'gen', '跟': 'gen', '更': 'geng', '耕': 'geng',
  '工': 'gong', '弓': 'gong', '公': 'gong', '功': 'gong', '攻': 'gong', '供': 'gong', '宫': 'gong', '恭': 'gong', '巩': 'gong',
  '拱': 'gong', '共': 'gong', '贡': 'gong', '勾': 'gou', '沟': 'gou', '钩': 'gou', '狗': 'gou', '构': 'gou', '购': 'gou',
  '够': 'gou', '估': 'gu', '孤': 'gu', '姑': 'gu', '谷': 'gu', '股': 'gu', '骨': 'gu', '鼓': 'gu', '固': 'gu', '故': 'gu',
  '顾': 'gu', '瓜': 'gua', '刮': 'gua', '挂': 'gua', '乖': 'guai', '拐': 'guai', '怪': 'guai', '关': 'guan', '观': 'guan',
  '官': 'guan', '冠': 'guan', '管': 'guan', '馆': 'guan', '贯': 'guan', '惯': 'guan', '灌': 'guan', '罐': 'guan', '光': 'guang',
  '广': 'guang', '归': 'gui', '龟': 'gui', '规': 'gui', '硅': 'gui', '轨': 'gui', '鬼': 'gui', '柜': 'gui', '贵': 'gui',
  '桂': 'gui', '跪': 'gui', '滚': 'gun', '棍': 'gun', '锅': 'guo', '国': 'guo', '果': 'guo', '裹': 'guo', '过': 'guo',
  '哈': 'ha', '孩': 'hai', '海': 'hai', '害': 'hai', '含': 'han', '函': 'han', '寒': 'han', '韩': 'han', '罕': 'han',
  '喊': 'han', '汉': 'han', '汗': 'han', '旱': 'han', '杭': 'hang', '航': 'hang', '毫': 'hao', '豪': 'hao', '好': 'hao',
  '号': 'hao', '浩': 'hao', '喝': 'he', '合': 'he', '何': 'he', '和': 'he', '河': 'he', '核': 'he', '荷': 'he', '盒': 'he',
  '贺': 'he', '黑': 'hei', '很': 'hen', '狠': 'hen', '恨': 'hen', '恒': 'heng', '横': 'heng', '衡': 'heng', '轰': 'hong',
  '哄': 'hong', '红': 'hong', '宏': 'hong', '洪': 'hong', '虹': 'hong', '鸿': 'hong', '侯': 'hou', '喉': 'hou', '猴': 'hou',
  '吼': 'hou', '后': 'hou', '厚': 'hou', '候': 'hou', '乎': 'hu', '呼': 'hu', '忽': 'hu', '壶': 'hu', '湖': 'hu',
  '葫': 'hu', '糊': 'hu', '蝴': 'hu', '虎': 'hu', '互': 'hu', '户': 'hu', '护': 'hu', '花': 'hua', '华': 'hua', '滑': 'hua',
  '化': 'hua', '划': 'hua', '画': 'hua', '话': 'hua', '怀': 'huai', '坏': 'huai', '欢': 'huan', '还': 'huan', '环': 'huan',
  '缓': 'huan', '幻': 'huan', '唤': 'huan', '换': 'huan', '患': 'huan', '荒': 'huang', '慌': 'huang', '皇': 'huang',
  '黄': 'huang', '煌': 'huang', '晃': 'huang', '灰': 'hui', '挥': 'hui', '辉': 'hui', '回': 'hui', '悔': 'hui', '汇': 'hui',
  '会': 'hui', '绘': 'hui', '惠': 'hui', '毁': 'hui', '慧': 'hui', '昏': 'hun', '婚': 'hun', '魂': 'hun', '混': 'hun',
  '活': 'huo', '火': 'huo', '伙': 'huo', '或': 'huo', '货': 'huo', '获': 'huo', '祸': 'huo', '惑': 'huo', '击': 'ji',
  '饥': 'ji', '机': 'ji', '肌': 'ji', '鸡': 'ji', '积': 'ji', '基': 'ji', '绩': 'ji', '激': 'ji', '及': 'ji', '吉': 'ji',
  '级': 'ji', '即': 'ji', '极': 'ji', '急': 'ji', '疾': 'ji', '集': 'ji', '辑': 'ji', '籍': 'ji', '几': 'ji', '己': 'ji',
  '挤': 'ji', '脊': 'ji', '计': 'ji', '记': 'ji', '纪': 'ji', '技': 'ji', '忌': 'ji', '际': 'ji', '剂': 'ji', '季': 'ji',
  '既': 'ji', '济': 'ji', '继': 'ji', '寂': 'ji', '寄': 'ji', '加': 'jia', '夹': 'jia', '佳': 'jia', '家': 'jia', '嘉': 'jia',
  '甲': 'jia', '价': 'jia', '驾': 'jia', '架': 'jia', '假': 'jia', '嫁': 'jia', '尖': 'jian', '奸': 'jian', '坚': 'jian',
  '间': 'jian', '肩': 'jian', '艰': 'jian', '兼': 'jian', '监': 'jian', '煎': 'jian', '拣': 'jian', '俭': 'jian', '茧': 'jian',
  '减': 'jian', '剪': 'jian', '简': 'jian', '碱': 'jian', '见': 'jian', '件': 'jian', '建': 'jian', '剑': 'jian', '荐': 'jian',
  '贱': 'jian', '健': 'jian', '舰': 'jian', '渐': 'jian', '践': 'jian', '鉴': 'jian', '键': 'jian', '箭': 'jian', '江': 'jiang',
  '姜': 'jiang', '将': 'jiang', '浆': 'jiang', '僵': 'jiang', '疆': 'jiang', '讲': 'jiang', '奖': 'jiang', '桨': 'jiang',
  '匠': 'jiang', '酱': 'jiang', '降': 'jiang', '交': 'jiao', '郊': 'jiao', '浇': 'jiao', '骄': 'jiao', '胶': 'jiao',
  '焦': 'jiao', '蕉': 'jiao', '角': 'jiao', '脚': 'jiao', '搅': 'jiao', '缴': 'jiao', '叫': 'jiao', '教': 'jiao', '阶': 'jie',
  '皆': 'jie', '接': 'jie', '揭': 'jie', '街': 'jie', '节': 'jie', '杰': 'jie', '洁': 'jie', '结': 'jie', '捷': 'jie',
  '截': 'jie', '姐': 'jie', '解': 'jie', '介': 'jie', '戒': 'jie', '届': 'jie', '界': 'jie', '借': 'jie', '巾': 'jin',
  '今': 'jin', '斤': 'jin', '金': 'jin', '津': 'jin', '筋': 'jin', '仅': 'jin', '紧': 'jin', '锦': 'jin', '尽': 'jin',
  '劲': 'jin', '近': 'jin', '进': 'jin', '晋': 'jin', '禁': 'jin', '京': 'jing', '经': 'jing', '茎': 'jing', '惊': 'jing',
  '晶': 'jing', '睛': 'jing', '精': 'jing', '井': 'jing', '颈': 'jing', '景': 'jing', '警': 'jing', '净': 'jing', '径': 'jing',
  '竞': 'jing', '竟': 'jing', '敬': 'jing', '境': 'jing', '静': 'jing', '镜': 'jing', '纠': 'jiu', '究': 'jiu', '九': 'jiu',
  '久': 'jiu', '酒': 'jiu', '旧': 'jiu', '救': 'jiu', '就': 'jiu', '局': 'ju', '菊': 'ju', '橘': 'ju', '举': 'ju',
  '巨': 'ju', '句': 'ju', '拒': 'ju', '具': 'ju', '俱': 'ju', '剧': 'ju', '据': 'ju', '距': 'ju', '聚': 'ju', '卷': 'juan',
  '倦': 'juan', '决': 'jue', '绝': 'jue', '觉': 'jue', '军': 'jun', '均': 'jun', '君': 'jun', '菌': 'jun', '俊': 'jun',
  '卡': 'ka', '开': 'kai', '凯': 'kai', '慨': 'kai', '刊': 'kan', '堪': 'kan', '砍': 'kan', '看': 'kan', '康': 'kang',
  '抗': 'kang', '考': 'kao', '靠': 'kao', '科': 'ke', '棵': 'ke', '颗': 'ke', '壳': 'ke', '咳': 'ke', '可': 'ke',
  '渴': 'ke', '克': 'ke', '刻': 'ke', '客': 'ke', '课': 'ke', '肯': 'ken', '坑': 'keng', '空': 'kong', '孔': 'kong',
  '恐': 'kong', '控': 'kong', '口': 'kou', '扣': 'kou', '枯': 'ku', '哭': 'ku', '苦': 'ku', '库': 'ku', '裤': 'ku',
  '酷': 'ku', '夸': 'kua', '块': 'kuai', '快': 'kuai', '宽': 'kuan', '款': 'kuan', '狂': 'kuang', '况': 'kuang',
  '矿': 'kuang', '亏': 'kui', '葵': 'kui', '溃': 'kui', '昆': 'kun', '困': 'kun', '扩': 'kuo', '括': 'kuo', '阔': 'kuo',
  '垃': 'la', '拉': 'la', '啦': 'la', '辣': 'la', '蜡': 'la', '来': 'lai', '赖': 'lai', '兰': 'lan', '蓝': 'lan',
  '篮': 'lan', '览': 'lan', '懒': 'lan', '烂': 'lan', '滥': 'lan', '郎': 'lang', '狼': 'lang', '廊': 'lang', '朗': 'lang',
  '浪': 'lang', '捞': 'lao', '劳': 'lao', '牢': 'lao', '老': 'lao', '乐': 'le', '雷': 'lei', '蕾': 'lei', '泪': 'lei',
  '类': 'lei', '累': 'lei', '冷': 'leng', '厘': 'li', '梨': 'li', '离': 'li', '莉': 'li', '犁': 'li', '黎': 'li',
  '礼': 'li', '李': 'li', '里': 'li', '理': 'li', '力': 'li', '历': 'li', '厉': 'li', '立': 'li', '丽': 'li', '利': 'li',
  '励': 'li', '例': 'li', '隶': 'li', '栗': 'li', '粒': 'li', '俩': 'lia', '连': 'lian', '帘': 'lian', '怜': 'lian',
  '莲': 'lian', '联': 'lian', '廉': 'lian', '脸': 'lian', '练': 'lian', '炼': 'lian', '恋': 'lian', '链': 'lian', '良': 'liang',
  '凉': 'liang', '梁': 'liang', '粮': 'liang', '两': 'liang', '亮': 'liang', '辆': 'liang', '量': 'liang', '辽': 'liao',
  '疗': 'liao', '聊': 'liao', '了': 'liao', '料': 'liao', '列': 'lie', '劣': 'lie', '烈': 'lie', '猎': 'lie', '裂': 'lie',
  '林': 'lin', '临': 'lin', '淋': 'lin', '磷': 'lin', '灵': 'ling', '铃': 'ling', '陵': 'ling', '零': 'ling', '龄': 'ling',
  '领': 'ling', '令': 'ling', '另': 'ling', '溜': 'liu', '刘': 'liu', '流': 'liu', '留': 'liu', '硫': 'liu', '柳': 'liu',
  '六': 'liu', '龙': 'long', '笼': 'long', '隆': 'long', '垄': 'long', '拢': 'long', '楼': 'lou', '漏': 'lou', '露': 'lou',
  '卢': 'lu', '芦': 'lu', '炉': 'lu', '鲁': 'lu', '陆': 'lu', '录': 'lu', '鹿': 'lu', '路': 'lu', '铝': 'lu', '旅': 'lu',
  '律': 'lu', '率': 'lu', '绿': 'lu', '卵': 'luan', '乱': 'luan', '掠': 'lue', '略': 'lue', '轮': 'lun', '论': 'lun',
  '罗': 'luo', '萝': 'luo', '逻': 'luo', '螺': 'luo', '裸': 'luo', '洛': 'luo', '络': 'luo', '骆': 'luo', '落': 'luo',
  '妈': 'ma', '麻': 'ma', '马': 'ma', '码': 'ma', '蚂': 'ma', '骂': 'ma', '吗': 'ma', '买': 'mai', '迈': 'mai',
  '麦': 'mai', '卖': 'mai', '脉': 'mai', '蛮': 'man', '瞒': 'man', '满': 'man', '曼': 'man', '慢': 'man', '漫': 'man',
  '忙': 'mang', '芒': 'mang', '盲': 'mang', '茫': 'mang', '猫': 'mao', '毛': 'mao', '矛': 'mao', '茅': 'mao', '茂': 'mao',
  '冒': 'mao', '帽': 'mao', '貌': 'mao', '么': 'me', '没': 'mei', '枚': 'mei', '玫': 'mei', '眉': 'mei', '梅': 'mei',
  '媒': 'mei', '煤': 'mei', '霉': 'mei', '每': 'mei', '美': 'mei', '妹': 'mei', '昧': 'mei', '门': 'men', '闷': 'men',
  '们': 'men', '萌': 'meng', '盟': 'meng', '猛': 'meng', '蒙': 'meng', '孟': 'meng', '梦': 'meng', '迷': 'mi', '米': 'mi',
  '秘': 'mi', '密': 'mi', '蜜': 'mi', '眠': 'mian', '棉': 'mian', '免': 'mian', '勉': 'mian', '面': 'mian', '苗': 'miao',
  '描': 'miao', '秒': 'miao', '妙': 'miao', '庙': 'miao', '灭': 'mie', '民': 'min', '敏': 'min', '名': 'ming', '明': 'ming',
  '鸣': 'ming', '命': 'ming', '摸': 'mo', '模': 'mo', '膜': 'mo', '摩': 'mo', '磨': 'mo', '魔': 'mo', '抹': 'mo',
  '末': 'mo', '沫': 'mo', '莫': 'mo', '漠': 'mo', '墨': 'mo', '默': 'mo', '谋': 'mou', '某': 'mou', '母': 'mu', '木': 'mu',
  '目': 'mu', '牧': 'mu', '墓': 'mu', '幕': 'mu', '慕': 'mu', '暮': 'mu', '拿': 'na', '哪': 'na', '那': 'na', '纳': 'na',
  '乃': 'nai', '奶': 'nai', '耐': 'nai', '男': 'nan', '南': 'nan', '难': 'nan', '囊': 'nang', '恼': 'nao', '脑': 'nao',
  '闹': 'nao', '呢': 'ne', '内': 'nei', '嫩': 'nen', '能': 'neng', '你': 'ni', '年': 'nian', '念': 'nian', '娘': 'niang',
  '酿': 'niang', '鸟': 'niao', '尿': 'niao', '捏': 'nie', '您': 'nin', '宁': 'ning', '凝': 'ning', '牛': 'niu', '扭': 'niu',
  '纽': 'niu', '农': 'nong', '浓': 'nong', '弄': 'nong', '奴': 'nu', '努': 'nu', '怒': 'nu', '女': 'nu', '暖': 'nuan',
  '挪': 'nuo', '诺': 'nuo', '哦': 'o', '欧': 'ou', '偶': 'ou', '趴': 'pa', '爬': 'pa', '怕': 'pa', '拍': 'pai',
  '排': 'pai', '牌': 'pai', '派': 'pai', '攀': 'pan', '盘': 'pan', '判': 'pan', '盼': 'pan', '旁': 'pang', '胖': 'pang',
  '抛': 'pao', '跑': 'pao', '泡': 'pao', '炮': 'pao', '配': 'pei', '喷': 'pen', '盆': 'pen', '朋': 'peng', '棚': 'peng',
  '蓬': 'peng', '膨': 'peng', '捧': 'peng', '碰': 'peng', '批': 'pi', '披': 'pi', '皮': 'pi', '疲': 'pi', '脾': 'pi',
  '匹': 'pi', '屁': 'pi', '偏': 'pian', '篇': 'pian', '片': 'pian', '骗': 'pian', '飘': 'piao', '票': 'piao', '拼': 'pin',
  '贫': 'pin', '频': 'pin', '品': 'pin', '平': 'ping', '评': 'ping', '凭': 'ping', '瓶': 'ping', '萍': 'ping', '坡': 'po',
  '泼': 'po', '婆': 'po', '迫': 'po', '破': 'po', '魄': 'po', '扑': 'pu', '铺': 'pu', '仆': 'pu', '葡': 'pu', '蒲': 'pu',
  '朴': 'pu', '浦': 'pu', '普': 'pu', '谱': 'pu', '七': 'qi', '妻': 'qi', '戚': 'qi', '期': 'qi', '欺': 'qi', '漆': 'qi',
  '齐': 'qi', '其': 'qi', '奇': 'qi', '歧': 'qi', '骑': 'qi', '棋': 'qi', '旗': 'qi', '企': 'qi', '岂': 'qi', '启': 'qi',
  '起': 'qi', '气': 'qi', '弃': 'qi', '汽': 'qi', '契': 'qi', '砌': 'qi', '器': 'qi', '千': 'qian', '迁': 'qian',
  '牵': 'qian', '铅': 'qian', '谦': 'qian', '签': 'qian', '前': 'qian', '钱': 'qian', '潜': 'qian', '浅': 'qian',
  '遣': 'qian', '欠': 'qian', '枪': 'qiang', '腔': 'qiang', '强': 'qiang', '墙': 'qiang', '抢': 'qiang', '敲': 'qiao',
  '桥': 'qiao', '乔': 'qiao', '巧': 'qiao', '切': 'qie', '茄': 'qie', '且': 'qie', '窃': 'qie', '亲': 'qin', '侵': 'qin',
  '琴': 'qin', '勤': 'qin', '青': 'qing', '轻': 'qing', '氢': 'qing', '倾': 'qing', '清': 'qing', '情': 'qing', '晴': 'qing',
  '请': 'qing', '庆': 'qing', '穷': 'qiong', '秋': 'qiu', '求': 'qiu', '球': 'qiu', '区': 'qu', '曲': 'qu', '驱': 'qu',
  '屈': 'qu', '趋': 'qu', '取': 'qu', '趣': 'qu', '去': 'quan', '圈': 'quan', '全': 'quan', '权': 'quan', '泉': 'quan',
  '拳': 'quan', '犬': 'quan', '劝': 'quan', '券': 'quan', '缺': 'que', '却': 'que', '确': 'que', '群': 'qun', '然': 'ran',
  '燃': 'ran', '染': 'ran', '让': 'rang', '绕': 'rao', '热': 're', '人': 'ren', '仁': 'ren', '忍': 'ren', '认': 'ren',
  '任': 'ren', '韧': 'ren', '仍': 'reng', '日': 'ri', '荣': 'rong', '容': 'rong', '溶': 'rong', '熔': 'rong', '融': 'rong',
  '柔': 'rou', '肉': 'rou', '如': 'ru', '乳': 'ru', '入': 'ru', '软': 'ruan', '锐': 'rui', '瑞': 'rui', '润': 'run',
  '若': 'ruo', '弱': 'ruo', '撒': 'sa', '洒': 'sa', '萨': 'sa', '塞': 'sai', '三': 'san', '伞': 'san', '散': 'san',
  '桑': 'sang', '嗓': 'sang', '丧': 'sang', '扫': 'sao', '嫂': 'sao', '色': 'se', '森': 'sen', '杀': 'sha', '沙': 'sha',
  '纱': 'sha', '刹': 'sha', '砂': 'sha', '傻': 'sha', '啥': 'sha', '晒': 'shai', '山': 'shan', '删': 'shan', '衫': 'shan',
  '珊': 'shan', '闪': 'shan', '陕': 'shan', '善': 'shan', '扇': 'shan', '伤': 'shang', '商': 'shang', '赏': 'shang',
  '上': 'shang', '尚': 'shang', '捎': 'shao', '烧': 'shao', '稍': 'shao', '少': 'shao', '绍': 'shao', '哨': 'shao',
  '舌': 'she', '蛇': 'she', '舍': 'she', '设': 'she', '社': 'she', '射': 'she', '涉': 'she', '摄': 'she', '申': 'shen',
  '伸': 'shen', '身': 'shen', '深': 'shen', '神': 'shen', '审': 'shen', '甚': 'shen', '肾': 'shen', '慎': 'shen', '升': 'sheng',
  '生': 'sheng', '声': 'sheng', '省': 'sheng', '圣': 'sheng', '胜': 'sheng', '剩': 'sheng', '师': 'shi', '失': 'shi',
  '诗': 'shi', '施': 'shi', '湿': 'shi', '十': 'shi', '石': 'shi', '时': 'shi', '识': 'shi', '实': 'shi', '拾': 'shi',
  '食': 'shi', '史': 'shi', '使': 'shi', '始': 'shi', '驶': 'shi', '士': 'shi', '世': 'shi', '市': 'shi', '示': 'shi',
  '式': 'shi', '事': 'shi', '侍': 'shi', '势': 'shi', '视': 'shi', '试': 'shi', '饰': 'shi', '室': 'shi', '是': 'shi',
  '适': 'shi', '释': 'shi', '收': 'shou', '手': 'shou', '守': 'shou', '首': 'shou', '寿': 'shou', '受': 'shou', '售': 'shou',
  '兽': 'shou', '授': 'shou', '瘦': 'shou', '书': 'shu', '抒': 'shu', '叔': 'shu', '枢': 'shu', '殊': 'shu', '疏': 'shu',
  '输': 'shu', '蔬': 'shu', '熟': 'shu', '暑': 'shu', '署': 'shu', '鼠': 'shu', '属': 'shu', '术': 'shu', '束': 'shu',
  '述': 'shu', '树': 'shu', '竖': 'shu', '数': 'shu', '刷': 'shua', '帅': 'shuai', '双': 'shuang', '谁': 'shui',
  '水': 'shui', '睡': 'shui', '顺': 'shun', '说': 'shuo', '司': 'si', '丝': 'si', '私': 'si', '思': 'si', '斯': 'si',
  '撕': 'si', '死': 'si', '四': 'si', '寺': 'si', '似': 'si', '松': 'song', '宋': 'song', '送': 'song', '搜': 'sou',
  '苏': 'su', '俗': 'su', '诉': 'su', '素': 'su', '速': 'su', '宿': 'su', '塑': 'su', '酸': 'suan', '算': 'suan',
  '虽': 'sui', '随': 'sui', '岁': 'sui', '碎': 'sui', '穗': 'sui', '孙': 'sun', '损': 'sun', '笋': 'sun', '缩': 'suo',
  '所': 'suo', '索': 'suo', '锁': 'suo', '他': 'ta', '她': 'ta', '它': 'ta', '塔': 'ta', '踏': 'ta', '台': 'tai',
  '抬': 'tai', '太': 'tai', '态': 'tai', '泰': 'tai', '贪': 'tan', '摊': 'tan', '滩': 'tan', '坛': 'tan', '谈': 'tan',
  '弹': 'tan', '坦': 'tan', '叹': 'tan', '炭': 'tan', '探': 'tan', '汤': 'tang', '唐': 'tang', '堂': 'tang', '塘': 'tang',
  '糖': 'tang', '躺': 'tang', '趟': 'tang', '掏': 'tao', '逃': 'tao', '桃': 'tao', '陶': 'tao', '淘': 'tao', '讨': 'tao',
  '套': 'tao', '特': 'te', '疼': 'teng', '腾': 'teng', '提': 'ti', '题': 'ti', '蹄': 'ti', '体': 'ti', '替': 'ti',
  '天': 'tian', '添': 'tian', '田': 'tian', '甜': 'tian', '填': 'tian', '挑': 'tiao', '条': 'tiao', '跳': 'tiao', '贴': 'tie',
  '铁': 'tie', '厅': 'ting', '听': 'ting', '廷': 'ting', '亭': 'ting', '庭': 'ting', '停': 'ting', '挺': 'ting', '通': 'tong',
  '同': 'tong', '铜': 'tong', '童': 'tong', '统': 'tong', '桶': 'tong', '筒': 'tong', '痛': 'tong', '偷': 'tou', '头': 'tou',
  '投': 'tou', '透': 'tou', '突': 'tu', '图': 'tu', '徒': 'tu', '涂': 'tu', '途': 'tu', '土': 'tu', '吐': 'tu', '团': 'tuan',
  '推': 'tui', '腿': 'tui', '退': 'tui', '拖': 'tuo', '托': 'tuo', '脱': 'tuo', '驼': 'tuo', '妥': 'tuo', '挖': 'wa',
  '哇': 'wa', '娃': 'wa', '瓦': 'wa', '袜': 'wa', '歪': 'wai', '外': 'wai', '弯': 'wan', '湾': 'wan', '丸': 'wan',
  '完': 'wan', '玩': 'wan', '顽': 'wan', '挽': 'wan', '晚': 'wan', '碗': 'wan', '万': 'wan', '汪': 'wang', '亡': 'wang',
  '王': 'wang', '网': 'wang', '往': 'wang', '望': 'wang', '忘': 'wang', '旺': 'wang', '危': 'wei', '威': 'wei', '微': 'wei',
  '为': 'wei', '围': 'wei', '违': 'wei', '唯': 'wei', '维': 'wei', '伟': 'wei', '伪': 'wei', '尾': 'wei', '委': 'wei',
  '卫': 'wei', '未': 'wei', '位': 'wei', '味': 'wei', '畏': 'wei', '胃': 'wei', '谓': 'wei', '喂': 'wei', '慰': 'wei',
  '温': 'wen', '文': 'wen', '纹': 'wen', '闻': 'wen', '蚊': 'wen', '吻': 'wen', '稳': 'wen', '问': 'wen', '翁': 'weng',
  '我': 'wo', '沃': 'wo', '卧': 'wo', '握': 'wo', '乌': 'wu', '污': 'wu', '屋': 'wu', '无': 'wu', '吴': 'wu',
  '五': 'wu', '午': 'wu', '伍': 'wu', '武': 'wu', '舞': 'wu', '务': 'wu', '物': 'wu', '误': 'wu', '悟': 'wu', '雾': 'wu',
  '夕': 'xi', '西': 'xi', '吸': 'xi', '希': 'xi', '析': 'xi', '息': 'xi', '牺': 'xi', '悉': 'xi', '惜': 'xi', '稀': 'xi',
  '溪': 'xi', '锡': 'xi', '熙': 'xi', '嘻': 'xi', '习': 'xi', '席': 'xi', '袭': 'xi', '媳': 'xi', '洗': 'xi', '喜': 'xi',
  '系': 'xi', '细': 'xi', '虾': 'xia', '瞎': 'xia', '峡': 'xia', '狭': 'xia', '下': 'xia', '吓': 'xia', '夏': 'xia',
  '厦': 'xia', '仙': 'xian', '先': 'xian', '纤': 'xian', '掀': 'xian', '鲜': 'xian', '闲': 'xian', '弦': 'xian',
  '贤': 'xian', '咸': 'xian', '显': 'xian', '险': 'xian', '现': 'xian', '线': 'xian', '限': 'xian', '宪': 'xian',
  '陷': 'xian', '献': 'xian', '腺': 'xian', '乡': 'xiang', '相': 'xiang', '香': 'xiang', '箱': 'xiang', '湘': 'xiang',
  '详': 'xiang', '祥': 'xiang', '享': 'xiang', '响': 'xiang', '想': 'xiang', '向': 'xiang', '巷': 'xiang', '项': 'xiang',
  '象': 'xiang', '像': 'xiang', '橡': 'xiang', '削': 'xiao', '消': 'xiao', '宵': 'xiao', '销': 'xiao', '小': 'xiao',
  '晓': 'xiao', '孝': 'xiao', '效': 'xiao', '校': 'xiao', '笑': 'xiao', '些': 'xie', '歇': 'xie', '协': 'xie', '胁': 'xie',
  '斜': 'xie', '谐': 'xie', '携': 'xie', '鞋': 'xie', '写': 'xie', '泄': 'xie', '泻': 'xie', '卸': 'xie', '屑': 'xie',
  '心': 'xin', '辛': 'xin', '欣': 'xin', '新': 'xin', '薪': 'xin', '信': 'xin', '兴': 'xing', '星': 'xing', '腥': 'xing',
  '刑': 'xing', '行': 'xing', '形': 'xing', '型': 'xing', '醒': 'xing', '杏': 'xing', '姓': 'xing', '幸': 'xing', '性': 'xing',
  '兄': 'xiong', '凶': 'xiong', '胸': 'xiong', '雄': 'xiong', '熊': 'xiong', '休': 'xiu', '修': 'xiu', '羞': 'xiu',
  '秀': 'xiu', '绣': 'xiu', '袖': 'xiu', '虚': 'xu', '需': 'xu', '徐': 'xu', '许': 'xu', '序': 'xu', '叙': 'xu',
  '畜': 'xu', '绪': 'xu', '续': 'xu', '蓄': 'xu', '宣': 'xuan', '悬': 'xuan', '旋': 'xuan', '选': 'xuan', '穴': 'xue',
  '学': 'xue', '雪': 'xue', '血': 'xue', '寻': 'xun', '巡': 'xun', '询': 'xun', '训': 'xun', '讯': 'xun', '迅': 'xun',
  '压': 'ya', '呀': 'ya', '牙': 'ya', '芽': 'ya', '崖': 'ya', '哑': 'ya', '雅': 'ya', '亚': 'ya', '咽': 'yan',
  '烟': 'yan', '淹': 'yan', '延': 'yan', '严': 'yan', '言': 'yan', '岩': 'yan', '沿': 'yan', '炎': 'yan', '研': 'yan',
  '盐': 'yan', '颜': 'yan', '衍': 'yan', '掩': 'yan', '眼': 'yan', '演': 'yan', '厌': 'yan', '宴': 'yan', '艳': 'yan',
  '验': 'yan', '焰': 'yan', '雁': 'yan', '燕': 'yan', '央': 'yang', '扬': 'yang', '杨': 'yang', '洋': 'yang', '阳': 'yang',
  '养': 'yang', '氧': 'yang', '痒': 'yang', '样': 'yang', '腰': 'yao', '邀': 'yao', '摇': 'yao', '遥': 'yao', '咬': 'yao',
  '药': 'yao', '要': 'yao', '耀': 'yao', '也': 'ye', '冶': 'ye', '野': 'ye', '业': 'ye', '叶': 'ye', '页': 'ye',
  '夜': 'ye', '液': 'ye', '一': 'yi', '衣': 'yi', '医': 'yi', '依': 'yi', '仪': 'yi', '宜': 'yi', '移': 'yi', '遗': 'yi',
  '疑': 'yi', '乙': 'yi', '已': 'yi', '以': 'yi', '蚁': 'yi', '倚': 'yi', '椅': 'yi', '亿': 'yi', '义': 'yi', '艺': 'yi',
  '忆': 'yi', '议': 'yi', '亦': 'yi', '异': 'yi', '役': 'yi', '译': 'yi', '易': 'yi', '疫': 'yi', '益': 'yi', '谊': 'yi',
  '意': 'yi', '毅': 'yi', '翼': 'yi', '因': 'yin', '阴': 'yin', '音': 'yin', '银': 'yin', '引': 'yin', '饮': 'yin',
  '隐': 'yin', '印': 'yin', '英': 'ying', '婴': 'ying', '鹰': 'ying', '迎': 'ying', '盈': 'ying', '营': 'ying', '赢': 'ying',
  '影': 'ying', '应': 'ying', '映': 'ying', '硬': 'ying', '哟': 'yo', '拥': 'yong', '庸': 'yong', '永': 'yong', '咏': 'yong',
  '泳': 'yong', '勇': 'yong', '涌': 'yong', '用': 'yong', '优': 'you', '悠': 'you', '尤': 'you', '由': 'you', '犹': 'you',
  '邮': 'you', '油': 'you', '游': 'you', '友': 'you', '有': 'you', '又': 'you', '右': 'you', '幼': 'you', '诱': 'you',
  '于': 'yu', '余': 'yu', '鱼': 'yu', '娱': 'yu', '渔': 'yu', '愉': 'yu', '愚': 'yu', '与': 'yu', '予': 'yu', '宇': 'yu',
  '羽': 'yu', '雨': 'yu', '语': 'yu', '玉': 'yu', '育': 'yu', '域': 'yu', '欲': 'yu', '御': 'yu', '遇': 'yu', '愈': 'yu',
  '元': 'yuan', '园': 'yuan', '员': 'yuan', '原': 'yuan', '圆': 'yuan', '袁': 'yuan', '援': 'yuan', '源': 'yuan', '缘': 'yuan',
  '远': 'yuan', '院': 'yuan', '愿': 'yuan', '怨': 'yuan', '曰': 'yue', '约': 'yue', '月': 'yue', '岳': 'yue', '悦': 'yue',
  '跃': 'yue', '越': 'yue', '云': 'yun', '匀': 'yun', '允': 'yun', '运': 'yun', '晕': 'yun', '韵': 'yun', '杂': 'za',
  '灾': 'zai', '栽': 'zai', '载': 'zai', '再': 'zai', '在': 'zai', '咱': 'zan', '暂': 'zan', '赞': 'zan', '脏': 'zang',
  '葬': 'zang', '遭': 'zao', '早': 'zao', '枣': 'zao', '澡': 'zao', '造': 'zao', '噪': 'zao', '燥': 'zao', '则': 'ze',
  '择': 'ze', '泽': 'ze', '责': 'ze', '贼': 'zei', '怎': 'zen', '曾': 'zeng', '增': 'zeng', '赠': 'zeng', '扎': 'zha',
  '渣': 'zha', '轧': 'zha', '闸': 'zha', '眨': 'zha', '诈': 'zha', '炸': 'zha', '摘': 'zhai', '宅': 'zhai', '窄': 'zhai',
  '债': 'zhai', '寨': 'zhai', '占': 'zhan', '沾': 'zhan', '粘': 'zhan', '展': 'zhan', '盏': 'zhan', '崭': 'zhan',
  '战': 'zhan', '站': 'zhan', '张': 'zhang', '章': 'zhang', '彰': 'zhang', '掌': 'zhang', '涨': 'zhang', '丈': 'zhang',
  '仗': 'zhang', '帐': 'zhang', '账': 'zhang', '障': 'zhang', '招': 'zhao', '找': 'zhao', '召': 'zhao', '兆': 'zhao',
  '照': 'zhao', '罩': 'zhao', '遮': 'zhe', '折': 'zhe', '哲': 'zhe', '者': 'zhe', '这': 'zhe', '浙': 'zhe', '针': 'zhen',
  '侦': 'zhen', '珍': 'zhen', '真': 'zhen', '诊': 'zhen', '阵': 'zhen', '振': 'zhen', '镇': 'zhen', '震': 'zhen', '争': 'zheng',
  '征': 'zheng', '挣': 'zheng', '睁': 'zheng', '蒸': 'zheng', '整': 'zheng', '正': 'zheng', '证': 'zheng', '郑': 'zheng',
  '政': 'zheng', '症': 'zheng', '之': 'zhi', '支': 'zhi', '汁': 'zhi', '芝': 'zhi', '枝': 'zhi', '知': 'zhi', '织': 'zhi',
  '肢': 'zhi', '脂': 'zhi', '蜘': 'zhi', '执': 'zhi', '直': 'zhi', '值': 'zhi', '职': 'zhi', '植': 'zhi', '殖': 'zhi',
  '止': 'zhi', '只': 'zhi', '旨': 'zhi', '址': 'zhi', '纸': 'zhi', '指': 'zhi', '至': 'zhi', '志': 'zhi', '制': 'zhi',
  '帜': 'zhi', '治': 'zhi', '质': 'zhi', '秩': 'zhi', '智': 'zhi', '置': 'zhi', '中': 'zhong', '忠': 'zhong', '终': 'zhong',
  '钟': 'zhong', '肿': 'zhong', '种': 'zhong', '重': 'zhong', '众': 'zhong', '舟': 'zhou', '州': 'zhou', '周': 'zhou',
  '洲': 'zhou', '轴': 'zhou', '宙': 'zhou', '皱': 'zhou', '骤': 'zhou', '朱': 'zhu', '珠': 'zhu', '株': 'zhu', '诸': 'zhu',
  '猪': 'zhu', '蛛': 'zhu', '竹': 'zhu', '烛': 'zhu', '逐': 'zhu', '主': 'zhu', '属': 'zhu', '助': 'zhu', '住': 'zhu',
  '注': 'zhu', '驻': 'zhu', '柱': 'zhu', '祝': 'zhu', '著': 'zhu', '筑': 'zhu', '抓': 'zhua', '专': 'zhuan', '砖': 'zhuan',
  '转': 'zhuan', '赚': 'zhuan', '装': 'zhuang', '壮': 'zhuang', '状': 'zhuang', '撞': 'zhuang', '追': 'zhui', '准': 'zhun',
  '捉': 'zhuo', '桌': 'zhuo', '着': 'zhuo', '仔': 'zi', '资': 'zi', '姿': 'zi', '滋': 'zi', '子': 'zi', '紫': 'zi',
  '字': 'zi', '自': 'zi', '宗': 'zong', '综': 'zong', '棕': 'zong', '踪': 'zong', '总': 'zong', '纵': 'zong', '走': 'zou',
  '奏': 'zou', '租': 'zu', '足': 'zu', '族': 'zu', '祖': 'zu', '组': 'zu', '钻': 'zuan', '嘴': 'zui', '最': 'zui',
  '罪': 'zui', '醉': 'zui', '尊': 'zun', '遵': 'zun', '昨': 'zuo', '左': 'zuo', '作': 'zuo', '坐': 'zuo', '座': 'zuo',
  '做': 'zuo',
  // 常用特殊字
  '乳': 'ru', '臀': 'tun', '尻': 'kao', '淫': 'yin', '荡': 'dang', '骚': 'sao', '浪': 'lang', '媚': 'mei',
  '妖': 'yao', '艳': 'yan', '娇': 'jiao', '嫩': 'nen', '柔': 'rou', '甜': 'tian', '纯': 'chun', '清': 'qing',
  '诱': 'you', '惑': 'huo', '性': 'xing', '爱': 'ai', '欲': 'yu', '肉': 'rou', '体': 'ti', '身': 'shen',
  '胸': 'xiong', '臀': 'tun', '腿': 'tui', '足': 'zu', '脚': 'jiao', '手': 'shou', '口': 'kou', '唇': 'chun',
  '舌': 'she', '眼': 'yan', '脸': 'lian', '发': 'fa', '黑': 'hei', '白': 'bai', '红': 'hong', '粉': 'fen',
  '制': 'zhi', '服': 'fu', '女': 'nv', '男': 'nan', '学': 'xue', '生': 'sheng', '姐': 'jie', '妹': 'mei',
  '人': 'ren', '妻': 'qi', '母': 'mu', '娘': 'niang', '嫂': 'sao', '姨': 'yi', '姑': 'gu', '婶': 'shen',
  '少': 'shao', '老': 'lao', '大': 'da', '小': 'xiao', '美': 'mei', '丑': 'chou', '好': 'hao', '坏': 'huai',
  '新': 'xin', '旧': 'jiu', '多': 'duo', '少': 'shao', '长': 'chang', '短': 'duan', '高': 'gao', '低': 'di',
  '深': 'shen', '浅': 'qian', '宽': 'kuan', '窄': 'zhai', '厚': 'hou', '薄': 'bao', '硬': 'ying', '软': 'ruan',
  '湿': 'shi', '干': 'gan', '热': 're', '冷': 'leng', '紧': 'jin', '松': 'song', '快': 'kuai', '慢': 'man',
  '强': 'qiang', '弱': 'ruo', '粗': 'cu', '细': 'xi', '浓': 'nong', '淡': 'dan', '香': 'xiang', '臭': 'chou',
}

// 获取单个汉字的拼音
function getCharPinyin(char: string): string {
  return PINYIN_MAP[char] || char.toLowerCase()
}

// 获取整个字符串的拼音
export function getPinyin(text: string): string {
  return Array.from(text).map(getCharPinyin).join('')
}

// 生成搜索键（用于模糊匹配）
export function generateSearchKeys(text: string): string[] {
  const keys: Set<string> = new Set()
  const chars = Array.from(text)
  const pinyin = getPinyin(text)

  // 完整拼音
  keys.add(pinyin)

  // 每个字的拼音
  const charPinyins = chars.map(getCharPinyin)
  charPinyins.forEach(p => keys.add(p))

  // 首字母组合
  const initials = charPinyins.map(p => p[0])
  keys.add(initials.join(''))

  // 每个首字母
  initials.forEach(i => keys.add(i))

  // 双字组合（连续两个字的拼音）
  for (let i = 0; i < charPinyins.length - 1; i++) {
    keys.add(charPinyins[i] + charPinyins[i + 1])
  }

  // 三字组合
  for (let i = 0; i < charPinyins.length - 2; i++) {
    keys.add(charPinyins[i] + charPinyins[i + 1] + charPinyins[i + 2])
  }

  // 部分拼音（从第二个字开始）
  for (let i = 1; i < charPinyins.length; i++) {
    keys.add(charPinyins.slice(i).join(''))
  }

  // 原文
  keys.add(text.toLowerCase())

  return Array.from(keys).filter(k => k.length > 0)
}

// 预生成标签索引
export interface TagSearchIndex {
  tag: { id: number; name: string; count: number }
  searchKeys: string[]
}

export function buildTagSearchIndex(tags: { id: number; name: string; count: number }[]): TagSearchIndex[] {
  return tags.map(tag => ({
    tag,
    searchKeys: generateSearchKeys(tag.name)
  }))
}

// 搜索匹配
export function matchTag(index: TagSearchIndex, keyword: string): boolean {
  const lowerKeyword = keyword.toLowerCase()
  // 匹配原文
  if (index.tag.name.toLowerCase().includes(lowerKeyword)) return true
  // 匹配拼音键
  return index.searchKeys.some(key => key.includes(lowerKeyword))
}
