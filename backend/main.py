import json
import os
from typing import Any

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from data import HISTORICAL_FIGURES

load_dotenv()

app = FastAPI(title="AI心理测评 API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AssessmentRequest(BaseModel):
    answers: dict[str, Any]


class ChatRequest(BaseModel):
    character: str
    user_message: str
    chat_history: list[dict[str, str]] = []


def build_analysis_prompt(answers: dict[str, Any]) -> str:
    return f"""
你是心理专家和历史学者。请根据以下用户回答分析其性格，并匹配最像的中国古代人物。
请严格输出 JSON，不要输出其他内容。

候选人物列表:
{json.dumps(HISTORICAL_FIGURES, ensure_ascii=False)}

用户答案:
{json.dumps(answers, ensure_ascii=False, indent=2)}

输出格式:
{{
  "personality_summary": "一句话性格总结",
  "core_traits": ["特质1", "特质2", "特质3"],
  "matched_figure": {{
    "name": "人物名",
    "era": "朝代",
    "reason": "匹配原因"
  }},
  "story_report": "故事化解读，150-250字"
}}
""".strip()


async def call_deepseek(messages: list[dict[str, str]]) -> str:
    api_key = os.getenv("DEEPSEEK_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="DEEPSEEK_API_KEY 未配置")

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            "https://api.deepseek.com/chat/completions",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={"model": "deepseek-chat", "messages": messages, "temperature": 0.7},
        )
        if resp.status_code >= 400:
            raise HTTPException(status_code=502, detail=f"DeepSeek 调用失败: {resp.text}")
        return resp.json()["choices"][0]["message"]["content"]


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/questions")
async def questions() -> list[dict[str, Any]]:
    return [
        {"id": "q1", "type": "single", "question": "面对压力时，你通常会？", "options": ["先冷静分析", "找人倾诉", "立刻行动", "暂时回避"]},
        {"id": "q2", "type": "single", "question": "团队合作中你更常扮演？", "options": ["组织者", "执行者", "协调者", "创意者"]},
        {"id": "q3", "type": "single", "question": "你做决定时更依赖？", "options": ["数据和逻辑", "直觉和经验", "他人建议", "随机应变"]},
        {"id": "q4", "type": "single", "question": "遇到长期目标时你会？", "options": ["做详细计划", "边做边调整", "先做短期尝试", "看情况再说"]},
        {"id": "q5", "type": "single", "question": "在冲突场景中你更倾向？", "options": ["理性沟通", "坚持原则", "顾全关系", "先退一步"]},
        {"id": "q6", "type": "single", "question": "你更喜欢哪类任务？", "options": ["策略规划", "快速执行", "创意表达", "支持协助"]},
        {"id": "q7", "type": "single", "question": "面对不确定性时你会？", "options": ["收集信息", "直接尝试", "等更明确后再做", "请教他人"]},
        {"id": "q8", "type": "single", "question": "你希望别人如何评价你？", "options": ["可靠稳重", "聪明高效", "温暖体贴", "有趣独特"]},
        {"id": "q9", "type": "single", "question": "如果失败了你通常会？", "options": ["复盘总结", "快速重来", "寻求支持", "换个方向"]},
        {"id": "q10", "type": "text", "question": "请简述一段让你最有成就感的经历。"},
    ]


@app.post("/api/analyze")
async def analyze(req: AssessmentRequest) -> dict[str, Any]:
    content = await call_deepseek(
        [
            {"role": "system", "content": "你是心理专家和历史学者，擅长将人格特征映射到古代历史人物。"},
            {"role": "user", "content": build_analysis_prompt(req.answers)},
        ]
    )
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        return {
            "personality_summary": "模型返回非JSON，已按文本回退。",
            "core_traits": [],
            "matched_figure": {"name": "未知", "era": "未知", "reason": "请重试"},
            "story_report": content,
        }


@app.post("/api/chat")
async def chat(req: ChatRequest) -> dict[str, str]:
    content = await call_deepseek(
        [
            {"role": "system", "content": f"你现在扮演中国古代人物「{req.character}」，用该人物风格进行简洁回答。"},
            *req.chat_history[-6:],
            {"role": "user", "content": req.user_message},
        ]
    )
    return {"reply": content}
import json
import os
from typing import Any

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from data import HISTORICAL_FIGURES

load_dotenv()

app = FastAPI(title="AI心理测评 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AssessmentRequest(BaseModel):
    answers: dict[str, Any]


class ChatRequest(BaseModel):
    character: str
    user_message: str
    chat_history: list[dict[str, str]] = []


def build_analysis_prompt(answers: dict[str, Any]) -> str:
    return f"""
你是心理专家和历史学者。请根据以下用户回答分析其性格，并匹配最像的中国古代人物。
请严格输出 JSON，不要输出其他内容。

候选人物列表（可优先从中选择）:
{json.dumps(HISTORICAL_FIGURES, ensure_ascii=False)}

用户答案:
{json.dumps(answers, ensure_ascii=False, indent=2)}

输出格式:
{{
  "personality_summary": "一句话性格总结",
  "core_traits": ["特质1", "特质2", "特质3"],
  "matched_figure": {{
    "name": "人物名",
    "era": "朝代",
    "reason": "匹配原因"
  }},
  "story_report": "故事化解读，150-250字"
}}
""".strip()


async def call_deepseek(messages: list[dict[str, str]]) -> str:
    api_key = os.getenv("DEEPSEEK_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="DEEPSEEK_API_KEY 未配置")

    url = "https://api.deepseek.com/chat/completions"
    payload = {"model": "deepseek-chat", "messages": messages, "temperature": 0.7}
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(url, json=payload, headers=headers)
        if resp.status_code >= 400:
            raise HTTPException(status_code=502, detail=f"DeepSeek 调用失败: {resp.text}")
        data = resp.json()
        return data["choices"][0]["message"]["content"]


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/questions")
async def questions() -> list[dict[str, Any]]:
    return [
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
        {"id": "q10", "type": "text", "question": "请简述一段让你最有成就感的经历。"},
    ]


@app.post("/api/analyze")
async def analyze(req: AssessmentRequest) -> dict[str, Any]:
    system_msg = {
        "role": "system",
        "content": "你是心理专家和历史学者，擅长将人格特征映射到古代历史人物。",
    }
    user_msg = {"role": "user", "content": build_analysis_prompt(req.answers)}

    content = await call_deepseek([system_msg, user_msg])
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        return {
            "personality_summary": "模型返回了非标准JSON，已转为文本展示。",
            "core_traits": [],
            "matched_figure": {"name": "未知", "era": "未知", "reason": "请重试获取结构化结果"},
            "story_report": content,
        }


@app.post("/api/chat")
async def chat(req: ChatRequest) -> dict[str, str]:
    system_prompt = f"""
你现在扮演中国古代人物「{req.character}」。
要求:
1) 使用符合人物气质的表达风格。
2) 内容友好、积极，不提供危险或违法建议。
3) 回答长度控制在 80-160 字。
""".strip()

    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(req.chat_history[-6:])
    messages.append({"role": "user", "content": req.user_message})

    content = await call_deepseek(messages)
    return {"reply": content}
