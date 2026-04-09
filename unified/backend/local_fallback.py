from typing import Any


FALLBACK_FIGURES: list[dict[str, Any]] = [
    {
        "name": "诸葛亮",
        "era": "三国",
        "traits": ["理性", "谋略", "责任感", "长期规划"],
        "summary": "蜀汉丞相，善于谋划和组织，强调责任与秩序。",
    },
    {
        "name": "王阳明",
        "era": "明代",
        "traits": ["反思", "行动力", "自我觉察", "知行合一"],
        "summary": "思想家与将领，主张知行合一，重视内在修养与实践。",
    },
    {
        "name": "李白",
        "era": "唐代",
        "traits": ["创造力", "感性", "自由", "表达欲"],
        "summary": "浪漫主义诗人，情感充沛，追求自由与想象力。",
    },
    {
        "name": "韩信",
        "era": "汉代",
        "traits": ["执行力", "适应性", "战略", "目标导向"],
        "summary": "西汉名将，善于用兵和应变，强调结果与布局。",
    },
    {
        "name": "苏轼",
        "era": "宋代",
        "traits": ["乐观", "包容", "审美", "平衡感"],
        "summary": "文学家与政治家，兼具现实能力与精神弹性。",
    },
]


FALLBACK_QUESTIONS: list[dict[str, Any]] = [
    {
        "id": "q1",
        "type": "single",
        "question": "面对压力时，你通常会？",
        "options": ["先冷静分析", "找人倾诉", "立刻行动", "暂时回避"],
    },
    {
        "id": "q2",
        "type": "single",
        "question": "团队合作中你更常扮演？",
        "options": ["组织者", "执行者", "协调者", "创意者"],
    },
    {
        "id": "q3",
        "type": "single",
        "question": "你做决定时更依赖？",
        "options": ["数据和逻辑", "直觉和经验", "他人建议", "随机应变"],
    },
    {
        "id": "q4",
        "type": "single",
        "question": "遇到长期目标时你会？",
        "options": ["做详细计划", "边做边调整", "先做短期尝试", "看情况再说"],
    },
    {
        "id": "q5",
        "type": "single",
        "question": "在冲突场景中你更倾向？",
        "options": ["理性沟通", "坚持原则", "顾全关系", "先退一步"],
    },
    {
        "id": "q6",
        "type": "single",
        "question": "你更喜欢哪类任务？",
        "options": ["策略规划", "快速执行", "创意表达", "支持协助"],
    },
    {
        "id": "q7",
        "type": "single",
        "question": "面对不确定性时你会？",
        "options": ["收集信息", "直接尝试", "等更明确后再做", "请教他人"],
    },
    {
        "id": "q8",
        "type": "single",
        "question": "你希望别人如何评价你？",
        "options": ["可靠稳重", "聪明高效", "温暖体贴", "有趣独特"],
    },
    {
        "id": "q9",
        "type": "single",
        "question": "如果失败了你通常会？",
        "options": ["复盘总结", "快速重来", "寻求支持", "换个方向"],
    },
    {"id": "q10", "type": "text", "question": "请简述一段让你最有成就感的经历。", "options": []},
]

