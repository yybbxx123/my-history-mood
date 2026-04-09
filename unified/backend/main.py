import json
import os
from typing import Any

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from db import fetch_figures
from local_fallback import FALLBACK_FIGURES, FALLBACK_QUESTIONS

load_dotenv()

app = FastAPI(title="Unified AI心理测评 API")
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


def _get_questions() -> list[dict[str, Any]]:
    # 口径「第一个」：题库固定在后端本地，避免数据库维护成本；
    # 云数据库仅用于人物库（故事页/分析候选人物）。
    return FALLBACK_QUESTIONS


def _get_figures() -> list[dict[str, Any]]:
    figs = fetch_figures()
    return figs if figs else FALLBACK_FIGURES


def build_analysis_prompt(answers: dict[str, Any], figures: list[dict[str, Any]]) -> str:
    return f"""
你是心理专家和历史学者。请根据以下用户回答分析其性格，并匹配最像的中国古代人物。
请严格输出 JSON，不要输出其他内容。

候选人物列表:
{json.dumps(figures, ensure_ascii=False)}

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
    return _get_questions()


@app.get("/api/figures")
async def figures() -> list[dict[str, Any]]:
    return _get_figures()


@app.post("/api/analyze")
async def analyze(req: AssessmentRequest) -> dict[str, Any]:
    figures_list = _get_figures()
    content = await call_deepseek(
        [
            {"role": "system", "content": "你是心理专家和历史学者，擅长将人格特征映射到古代历史人物。"},
            {"role": "user", "content": build_analysis_prompt(req.answers, figures_list)},
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
    system_prompt = f"""
你现在扮演中国古代人物「{req.character}」。
要求:
1) 使用符合人物气质的表达风格。
2) 内容友好、积极，不提供危险或违法建议。
3) 回答长度控制在 80-160 字。
""".strip()

    content = await call_deepseek(
        [
            {"role": "system", "content": system_prompt},
            *req.chat_history[-6:],
            {"role": "user", "content": req.user_message},
        ]
    )
    return {"reply": content}

