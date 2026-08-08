import hmac
import json
import os
import re
import subprocess
from pathlib import Path
from datetime import datetime, timedelta
from typing import Any, Literal
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from uuid import uuid4

from fastapi import Depends, FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlalchemy import select, text
from sqlalchemy.orm import Session, selectinload

from app.auth import (
    create_access_token,
    create_oauth_state,
    get_current_user,
    get_optional_current_user,
    hash_password,
    require_admin,
    verify_oauth_state,
    verify_password,
)
from app.database import SessionLocal, get_db, init_db
from app.github_oauth import fetch_github_identity, get_github_authorize_url
from app.models import AdminAuditLog, AiGeneration, Article, Comment, ReactionCounter, SummerPlan, Tag, User, UserReaction
from app.seed import REACTION_TYPES, seed_database


FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://127.0.0.1:5173").rstrip("/")
AI_PROVIDER_NAME = os.getenv("AI_PROVIDER_NAME", "local-placeholder").strip() or "local-placeholder"
AI_API_STYLE = os.getenv("AI_API_STYLE", "openai").strip().lower() or "openai"
AI_BASE_URL = os.getenv("AI_BASE_URL", "").strip()
AI_MODEL = os.getenv("AI_MODEL", "").strip()
AI_API_KEY = os.getenv("AI_API_KEY", "").strip()
AI_SETTINGS_FILE = Path(os.getenv("AI_SETTINGS_FILE", "data/ai-settings.json"))
try:
    AI_REQUEST_TIMEOUT = float(os.getenv("AI_REQUEST_TIMEOUT", "25") or "25")
except ValueError:
    AI_REQUEST_TIMEOUT = 25.0
ADMIN_SETUP_TOKEN = os.getenv("ADMIN_SETUP_TOKEN", "").strip()
COMMENT_MAX_LENGTH = 300
COMMENT_COOLDOWN_SECONDS = 20
ADMIN_COMMENTS_REQUIRE_APPROVAL = os.getenv("ADMIN_COMMENTS_REQUIRE_APPROVAL", "false").strip().lower() in {"1", "true", "yes", "on"}
ALLOW_PUBLIC_EMAIL_REGISTRATION = os.getenv("ALLOW_PUBLIC_EMAIL_REGISTRATION", "false").strip().lower() in {"1", "true", "yes", "on"}
ALLOW_READER_EMAIL_LOGIN = os.getenv("ALLOW_READER_EMAIL_LOGIN", "false").strip().lower() in {"1", "true", "yes", "on"}
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "uploads"))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/svg+xml": ".svg",
}
MAX_UPLOAD_BYTES = 5 * 1024 * 1024
IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"}


app = FastAPI(title="FelixFu Blog API", version="0.8.0")
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


PROFILE = {
    "name": "付江樊",
    "englishName": "Felix Fu",
    "school": "浙江大学",
    "role": "Web 前端 & Python",
    "interests": ["Web 全栈", "AI 自动化", "安全与运维", "长跑", "游戏"],
    "summary": "普通大学生，正在努力把“想做的事”变成“会做的事”。从一行代码开始，一路把课程笔记、AI 工具、小游戏和运维后台慢慢接到这个小站里。",
    "metrics": [
        {"label": "技能方向", "value": "3+"},
        {"label": "线上项目", "value": "1+"},
        {"label": "好奇心", "value": "100%"},
    ],
}

AI_NEWS = [
    {
        "title": "前后端分离项目优先打通接口契约",
        "source": "Daily Tech Digest",
        "summary": "先固定页面、数据结构和 API 路由，可以降低后续接入数据库和鉴权时的改动成本。",
    },
    {
        "title": "AI 总结模块适合从文章摘要开始",
        "source": "AI Workflow",
        "summary": "可以先从文章摘要、标题候选和写作续写开始，逐步把模型能力沉淀成日常工作流。",
    },
]

DEFAULT_SUMMER_PLAN: dict[str, Any] = {
    "profile": {
        "name": "付江樊",
        "identity": "浙江大学准大二",
        "range": "2026-08-04 至 2026-08-15",
        "theme": "期末冲刺式预习 + 规律生活记录",
    },
    "goals": {
        "study": "穿插预习高级数据结构与算法分析、计算机组成、大学物理（乙）Ⅱ、概率论与数理统计，按期末冲刺节奏推进。",
        "body": "游泳、快走、室内燃脂轮换，保持体重、饮食、睡眠可追踪。",
        "life": "保留游戏、看番、阅读时间，严格控制 B 站和小红书。"
    },
    "daily": [
        {"id": "day-0804", "date": "8月4日", "study": "高级数据结构与算法分析：复杂度、堆、并查集预热", "exercise": "快走 40 分钟", "rest": "红与黑 30 页", "note": ""},
        {"id": "day-0805", "date": "8月5日", "study": "计算机组成：数据表示、定点与浮点运算", "exercise": "室内燃脂 25 分钟", "rest": "葬送的芙莉莲 1 集", "note": ""},
        {"id": "day-0806", "date": "8月6日", "study": "概率论与数理统计：随机变量、分布函数", "exercise": "游泳", "rest": "以撒的结合 45 分钟", "note": ""},
        {"id": "day-0807", "date": "8月7日", "study": "大学物理（乙）Ⅱ：电场、电势、电容", "exercise": "快走 45 分钟", "rest": "红与黑 30 页", "note": ""},
        {"id": "day-0808", "date": "8月8日", "study": "高级数据结构与算法分析：图论基础、最短路预习", "exercise": "室内燃脂 25 分钟", "rest": "第五人格 45 分钟", "note": ""},
        {"id": "day-0809", "date": "8月9日", "study": "计算机组成：指令系统、CPU 数据通路", "exercise": "游泳", "rest": "葬送的芙莉莲 1 集", "note": ""},
        {"id": "day-0810", "date": "8月10日", "study": "概率论与数理统计：期望、方差、常见分布", "exercise": "快走 40 分钟", "rest": "红与黑 30 页", "note": ""},
        {"id": "day-0811", "date": "8月11日", "study": "大学物理（乙）Ⅱ：稳恒磁场、电磁感应", "exercise": "室内燃脂 30 分钟", "rest": "以撒的结合 45 分钟", "note": ""},
        {"id": "day-0812", "date": "8月12日", "study": "高级数据结构与算法分析：平衡树、哈希、摊还分析", "exercise": "游泳", "rest": "葬送的芙莉莲 1 集", "note": ""},
        {"id": "day-0813", "date": "8月13日", "study": "计算机组成：流水线、存储层次", "exercise": "快走 45 分钟", "rest": "第五人格 45 分钟", "note": ""},
        {"id": "day-0814", "date": "8月14日", "study": "概率论与数理统计 + 大物：做一轮综合回顾", "exercise": "室内燃脂 25 分钟", "rest": "红与黑 30 页", "note": ""},
        {"id": "day-0815", "date": "8月15日", "study": "四门课整理清单：下学期第一周预习交接", "exercise": "轻松快走 30 分钟", "rest": "自由复盘", "note": ""},
    ],
    "courses": [
        {"id": "course-ads", "name": "高级数据结构与算法分析", "target": "先建立期末冲刺式目录感，能看懂主要题型", "progress": "0%"},
        {"id": "course-co", "name": "计算机组成", "target": "理解数据表示、指令、CPU、存储层次主线", "progress": "0%"},
        {"id": "course-physics", "name": "大学物理（乙）Ⅱ", "target": "电磁学核心概念先过一轮", "progress": "0%"},
        {"id": "course-prob", "name": "概率论与数理统计", "target": "随机变量、分布、期望方差、统计基础预热", "progress": "0%"},
    ],
    "apps": [
        {"id": "app-wechat", "name": "微信", "limit": "90 分钟", "actual": ""},
        {"id": "app-bilibili", "name": "B 站", "limit": "30 分钟", "actual": ""},
        {"id": "app-rednote", "name": "小红书", "limit": "20 分钟", "actual": ""},
    ],
    "expenses": [
        {"id": "expense-1", "date": "8月4日", "item": "餐饮", "amount": "", "note": ""},
    ],
    "meals": [
        {"id": "meal-1", "date": "8月4日", "breakfast": "", "lunch": "", "dinner": "", "snack": ""},
    ],
    "bodyMetrics": [
        {"id": "body-1", "date": "8月4日", "weight": "", "exercise": "", "mood": ""},
    ],
    "sleep": [
        {"id": "sleep-1", "date": "8月4-5日", "bed": "", "wake": "", "hours": "", "quality": ""},
    ],
}

DEFAULT_SUMMER_PLAN["daily"] = [
    {"id": "slot-0730", "time": "07:30 - 08:00", "activity": "起床、洗漱、早餐", "focus": "不刷短视频，先把一天启动起来。", "type": "生活"},
    {"id": "slot-0800", "time": "08:00 - 10:00", "activity": "课程预习 1", "focus": "高级数据结构与算法分析 / 计算机组成轮换，按期末冲刺式看目录、抓概念、做例题。", "type": "学习"},
    {"id": "slot-1000", "time": "10:00 - 10:30", "activity": "弹性时间", "focus": "补水、走动、处理临时消息；有额外活动可以直接改这一格。", "type": "弹性"},
    {"id": "slot-1030", "time": "10:30 - 12:00", "activity": "课程预习 2", "focus": "大学物理（乙）Ⅱ / 概率论与数理统计轮换，目标是先建立知识框架。", "type": "学习"},
    {"id": "slot-1200", "time": "12:00 - 14:00", "activity": "午餐 + 午休", "focus": "吃饭、短休，不把 B 站和小红书刷成无底洞。", "type": "生活"},
    {"id": "slot-1400", "time": "14:00 - 15:30", "activity": "题目/笔记整理", "focus": "上午内容收束：整理公式、数据结构模板、组成原理图、概率概念。", "type": "学习"},
    {"id": "slot-1530", "time": "15:30 - 16:30", "activity": "运动", "focus": "游泳、快走、室内燃脂三选一；按身体状态调强度。", "type": "运动"},
    {"id": "slot-1630", "time": "16:30 - 17:30", "activity": "弹性时间", "focus": "外出、家务、临时安排、补觉都放这里；也可挪给学习追进度。", "type": "弹性"},
    {"id": "slot-1730", "time": "17:30 - 19:00", "activity": "晚餐 + 记录", "focus": "填饮食、体重/状态、记账；当天花销随手记。", "type": "记录"},
    {"id": "slot-1900", "time": "19:00 - 20:30", "activity": "轻学习 / 复盘", "focus": "复盘今日预习，列明天任务；不适合硬刚时改成阅读。", "type": "学习"},
    {"id": "slot-2030", "time": "20:30 - 21:30", "activity": "娱乐时间", "focus": "以撒的结合 / 第五人格 / 葬送的芙莉莲 / 红与黑，控制 B 站和小红书。", "type": "娱乐"},
    {"id": "slot-2130", "time": "21:30 - 22:30", "activity": "洗漱 + 睡眠准备", "focus": "填睡眠记录，尽量 22:30 前进入休息状态。", "type": "睡眠"},
]

BASE_SUMMER_TIME_SLOTS = DEFAULT_SUMMER_PLAN["daily"]


def _summer_day_plan(date: str, label: str, theme: str, overrides: dict[str, dict[str, str]]) -> dict[str, Any]:
    return {
        "id": date,
        "date": date,
        "label": label,
        "theme": theme,
        "slots": [
            {
                **slot,
                **overrides.get(slot["id"], {}),
                "id": f"{date}-{slot['id']}",
            }
            for slot in BASE_SUMMER_TIME_SLOTS
        ],
    }


DEFAULT_SUMMER_PLAN["dailyPlans"] = [
    _summer_day_plan("2026-08-04", "8月4日", "启动日：数据结构 + 大物框架", {
        "slot-0800": {"activity": "高级数据结构与算法分析", "focus": "复杂度、堆、并查集预热；先建立期末冲刺目录。"},
        "slot-1030": {"activity": "大学物理（乙）Ⅱ", "focus": "电场、电势、电容先过概念和公式。"},
        "slot-1400": {"activity": "数据结构题目整理", "focus": "整理复杂度常见坑，写 3-5 道基础题。"},
        "slot-1530": {"activity": "快走", "focus": "40 分钟，低压力启动。"},
        "slot-2030": {"activity": "红与黑", "focus": "阅读 30 页，B 站和小红书只保留应用限时。"},
    }),
    _summer_day_plan("2026-08-05", "8月5日", "计组启动 + 概率基础", {
        "slot-0800": {"activity": "计算机组成", "focus": "数据表示、定点数、浮点数和补码。"},
        "slot-1030": {"activity": "概率论与数理统计", "focus": "随机变量、分布函数、离散/连续分布。"},
        "slot-1400": {"activity": "计组笔记整理", "focus": "把数制转换、补码、浮点表示整理成速查表。"},
        "slot-1530": {"activity": "室内燃脂", "focus": "25 分钟，控制强度但要出汗。"},
        "slot-2030": {"activity": "葬送的芙莉莲", "focus": "看 1 集，结束后填睡眠记录。"},
    }),
    _summer_day_plan("2026-08-06", "8月6日", "概率推进 + 数据结构图论", {
        "slot-0800": {"activity": "概率论与数理统计", "focus": "期望、方差、常见分布，先抓公式适用条件。"},
        "slot-1030": {"activity": "高级数据结构与算法分析", "focus": "图论基础、BFS/DFS、最短路预习。"},
        "slot-1400": {"activity": "概率题目训练", "focus": "做随机变量与期望方差例题，整理错因。"},
        "slot-1530": {"activity": "游泳", "focus": "以恢复和舒展为主。"},
        "slot-2030": {"activity": "以撒的结合", "focus": "45 分钟内收住，避免顺手刷视频。"},
    }),
    _summer_day_plan("2026-08-07", "8月7日", "大物电磁 + 计组指令", {
        "slot-0800": {"activity": "大学物理（乙）Ⅱ", "focus": "稳恒电流、磁场基础和典型公式。"},
        "slot-1030": {"activity": "计算机组成", "focus": "指令系统、寻址方式、CPU 数据通路。"},
        "slot-1400": {"activity": "大物公式卡片", "focus": "把电场/磁场公式按场景归类。"},
        "slot-1530": {"activity": "快走", "focus": "45 分钟，顺便复盘上午知识点。"},
        "slot-2030": {"activity": "红与黑", "focus": "阅读 30 页，做一句话摘要。"},
    }),
    _summer_day_plan("2026-08-08", "8月8日", "数据结构强化日", {
        "slot-0800": {"activity": "高级数据结构与算法分析", "focus": "平衡树、哈希、摊还分析先看概念。"},
        "slot-1030": {"activity": "高级数据结构与算法分析", "focus": "图论最短路和数据结构应用题型。"},
        "slot-1400": {"activity": "算法题练习", "focus": "做 2-3 道图论/并查集/堆相关题。"},
        "slot-1530": {"activity": "室内燃脂", "focus": "25 分钟，结束后记录体重和状态。"},
        "slot-2030": {"activity": "第五人格", "focus": "45 分钟，结束即停。"},
    }),
    _summer_day_plan("2026-08-09", "8月9日", "计组主线日", {
        "slot-0800": {"activity": "计算机组成", "focus": "CPU 数据通路、控制器、流水线概念。"},
        "slot-1030": {"activity": "计算机组成", "focus": "存储层次、Cache 基础和命中率理解。"},
        "slot-1400": {"activity": "计组结构图整理", "focus": "画 CPU/存储层次结构图，建立整体感。"},
        "slot-1530": {"activity": "游泳", "focus": "放松肩颈，控制疲劳。"},
        "slot-2030": {"activity": "葬送的芙莉莲", "focus": "看 1 集，顺手记今天花销。"},
    }),
    _summer_day_plan("2026-08-10", "8月10日", "概率统计推进日", {
        "slot-0800": {"activity": "概率论与数理统计", "focus": "二维随机变量、边缘分布、条件分布。"},
        "slot-1030": {"activity": "概率论与数理统计", "focus": "大数定律、中心极限定理先看直觉。"},
        "slot-1400": {"activity": "概率错题整理", "focus": "做 3-5 道分布与期望相关题。"},
        "slot-1530": {"activity": "快走", "focus": "40 分钟，保持稳定运动量。"},
        "slot-2030": {"activity": "红与黑", "focus": "阅读 30 页，睡前不刷信息流。"},
    }),
    _summer_day_plan("2026-08-11", "8月11日", "大物电磁推进日", {
        "slot-0800": {"activity": "大学物理（乙）Ⅱ", "focus": "电磁感应、法拉第定律、楞次定律。"},
        "slot-1030": {"activity": "大学物理（乙）Ⅱ", "focus": "典型题型：感应电动势、磁通量变化。"},
        "slot-1400": {"activity": "大物题目训练", "focus": "把公式代入和方向判断分开练。"},
        "slot-1530": {"activity": "室内燃脂", "focus": "30 分钟，练完补水。"},
        "slot-2030": {"activity": "以撒的结合", "focus": "45 分钟；如果白天进度落后，改为红与黑。"},
    }),
    _summer_day_plan("2026-08-12", "8月12日", "算法 + 计组交叉复盘", {
        "slot-0800": {"activity": "高级数据结构与算法分析", "focus": "平衡树、哈希、图算法回顾。"},
        "slot-1030": {"activity": "计算机组成", "focus": "流水线和存储层次复盘。"},
        "slot-1400": {"activity": "综合笔记整理", "focus": "把数据结构模板和计组结构图归档。"},
        "slot-1530": {"activity": "游泳", "focus": "中等强度，避免过累。"},
        "slot-2030": {"activity": "葬送的芙莉莲", "focus": "看 1 集，记录当天应用使用时间。"},
    }),
    _summer_day_plan("2026-08-13", "8月13日", "概率 + 大物交叉复盘", {
        "slot-0800": {"activity": "概率论与数理统计", "focus": "常见分布、期望方差、CLT 回顾。"},
        "slot-1030": {"activity": "大学物理（乙）Ⅱ", "focus": "电磁学公式和题型串联。"},
        "slot-1400": {"activity": "综合题目训练", "focus": "概率和大物各做一组基础题。"},
        "slot-1530": {"activity": "快走", "focus": "45 分钟，轻松一点。"},
        "slot-2030": {"activity": "第五人格", "focus": "45 分钟，结束后填睡眠计划。"},
    }),
    _summer_day_plan("2026-08-14", "8月14日", "四门课总复盘", {
        "slot-0800": {"activity": "四门课清单复盘", "focus": "列出每门课“已懂/半懂/没懂”三栏。"},
        "slot-1030": {"activity": "薄弱点补齐", "focus": "优先补最影响开学听课的概念。"},
        "slot-1400": {"activity": "下学期第一周准备", "focus": "整理资料、课程文件夹、预习目录。"},
        "slot-1530": {"activity": "室内燃脂", "focus": "25 分钟，轻量收尾。"},
        "slot-2030": {"activity": "红与黑 / 自由娱乐", "focus": "优先阅读；如果完成度高再游戏。"},
    }),
    _summer_day_plan("2026-08-15", "8月15日", "收尾日：整理与调整", {
        "slot-0800": {"activity": "暑期计划收尾", "focus": "总结 8/4-8/15 完成情况和遗留问题。"},
        "slot-1030": {"activity": "开学预习交接", "focus": "给四门课写下一步任务清单。"},
        "slot-1400": {"activity": "自由调整 / 补漏", "focus": "哪里欠账补哪里；没有欠账就整理博客记录。"},
        "slot-1530": {"activity": "轻松快走", "focus": "30 分钟，恢复为主。"},
        "slot-2030": {"activity": "自由复盘", "focus": "可以看番/阅读/游戏，但把应用时长记上。"},
    }),
]
DEFAULT_SUMMER_PLAN["daily"] = DEFAULT_SUMMER_PLAN["dailyPlans"][0]["slots"]
DEFAULT_SUMMER_PLAN["completionDays"] = [
    {
        "id": day["date"],
        "date": day["date"],
        "label": day["label"],
        "theme": day["theme"],
        "tasks": [
            {
                "id": f"{day['date']}-done-{slot['id']}",
                "time": slot["time"],
                "planned": slot["activity"],
                "actual": "",
                "status": "未开始",
                "note": "",
            }
            for slot in day["slots"]
        ],
    }
    for day in DEFAULT_SUMMER_PLAN["dailyPlans"]
]
DEFAULT_SUMMER_PLAN["appUsageDays"] = [
    {
        "id": day["date"],
        "date": day["date"],
        "label": day["label"],
        "theme": day["theme"],
        "apps": [
            {
                **app,
                "id": f"{day['date']}-{app['id']}",
                "actual": "",
            }
            for app in DEFAULT_SUMMER_PLAN["apps"]
        ],
    }
    for day in DEFAULT_SUMMER_PLAN["dailyPlans"]
]
DEFAULT_SUMMER_PLAN["apps"] = DEFAULT_SUMMER_PLAN["appUsageDays"][0]["apps"]


class CommentIn(BaseModel):
    content: str
    authorName: str | None = None
    parentId: int | None = None


class ReactionIn(BaseModel):
    type: Literal["like", "favorite", "downvote", "question"]
    active: bool = True


class ArticleIn(BaseModel):
    title: str
    summary: str
    content: str
    coverUrl: str = ""
    tags: list[str] = []
    date: str | None = None
    readTime: str = "3 min"
    status: Literal["published", "draft"] = "published"
    category: str = "学习笔记"
    pinned: bool = False


class SummerPlanIn(BaseModel):
    payload: dict[str, Any]


class RegisterIn(BaseModel):
    email: str
    password: str
    displayName: str = "Felix Fu"
    setupToken: str = ""


class LoginIn(BaseModel):
    email: str
    password: str


class AiWorkbenchIn(BaseModel):
    mode: Literal["ideas", "summary", "titles"]
    topic: str = ""
    content: str = ""
    tone: str = "技术学习"
    tags: list[str] = []


class AiEditorIn(BaseModel):
    task: Literal["polish", "continue", "outline"]
    title: str = ""
    summary: str = ""
    content: str = ""
    selectedText: str = ""
    tone: str = "技术学习"


class AiTestIn(BaseModel):
    providerName: str = ""
    apiStyle: str = ""
    baseUrl: str = ""
    model: str = ""
    apiKey: str = ""


class AiSettingsIn(BaseModel):
    providerName: str = "OpenAI Compatible"
    apiStyle: str = "openai"
    baseUrl: str = ""
    model: str = ""
    apiKey: str = ""
    timeout: float = 25.0
    enabled: bool = True


@app.on_event("startup")
def on_startup() -> None:
    init_db()
    with SessionLocal() as db:
        seed_database(db)


@app.get("/api/health")
def health(db: Session = Depends(get_db)) -> dict[str, str | int]:
    article_count = len(db.scalars(select(Article.id)).all())
    return {"status": "ok", "version": "0.8.0", "articles": article_count}


@app.get("/api/profile")
def get_profile() -> dict:
    return PROFILE


@app.get("/api/summer-plan")
def get_summer_plan(db: Session = Depends(get_db)) -> dict[str, Any]:
    plan = db.get(SummerPlan, "current")
    return plan.payload if plan else DEFAULT_SUMMER_PLAN


@app.put("/api/admin/summer-plan")
def update_summer_plan(
    payload: SummerPlanIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> dict[str, Any]:
    plan = db.get(SummerPlan, "current")
    if not plan:
        plan = SummerPlan(key="current", payload=payload.payload)
        db.add(plan)
    else:
        plan.payload = payload.payload
    db.commit()
    db.refresh(plan)
    _record_admin_event(db, current_user, "更新学习计划", "summer-plan", "current", "保存暑假计划云端数据")
    return plan.payload


@app.get("/api/articles")
def list_articles(
    q: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
) -> list[dict]:
    articles = _load_articles(db)
    if not current_user or current_user.role != "admin":
        articles = [article for article in articles if article.status == "published"]
    if not q:
        return [_article_to_dict(article, current_user) for article in articles]

    keyword = q.strip().lower()
    filtered = [
        article
        for article in articles
        if keyword
        in " ".join(
            [
                article.title,
                article.summary,
                article.content,
                " ".join(tag.name for tag in article.tags),
            ]
        ).lower()
    ]
    return [_article_to_dict(article, current_user) for article in filtered]


@app.get("/api/articles/{article_id}")
def get_article(
    article_id: str,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
) -> dict:
    article = _get_article_or_404(db, article_id)
    _ensure_article_visible(article, current_user)
    if not current_user or current_user.role != "admin":
        article.view_count = (article.view_count or 0) + 1
        db.commit()
        db.refresh(article)
    return _article_to_dict(article, current_user)


@app.post("/api/articles/{article_id}/comments")
def create_comment(
    article_id: str,
    comment: CommentIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    article = _get_article_or_404(db, article_id)
    _ensure_article_visible(article, current_user)
    content = comment.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="Comment content is required")
    if len(content) > COMMENT_MAX_LENGTH:
        raise HTTPException(status_code=400, detail=f"Comment must be {COMMENT_MAX_LENGTH} characters or fewer")
    recent_comment = db.scalar(
        select(Comment)
        .where(Comment.user_id == current_user.id)
        .order_by(Comment.created_at.desc())
    )
    if recent_comment and datetime.utcnow() - recent_comment.created_at < timedelta(seconds=COMMENT_COOLDOWN_SECONDS):
        raise HTTPException(status_code=429, detail=f"评论太快了，请 {COMMENT_COOLDOWN_SECONDS} 秒后再试")

    parent_id = None
    if comment.parentId:
        parent = db.get(Comment, comment.parentId)
        if not parent or parent.article_id != article.id:
            raise HTTPException(status_code=400, detail="Reply target is invalid")
        parent_id = parent.id

    comment_status = "pending" if current_user.role != "admin" or ADMIN_COMMENTS_REQUIRE_APPROVAL else "approved"
    db.add(
        Comment(
            article_id=article.id,
            user_id=current_user.id,
            parent_id=parent_id,
            author_name=(current_user.display_name or current_user.email or "访客").strip() or "访客",
            content=content,
            status=comment_status,
        )
    )
    db.commit()
    db.refresh(article)
    article = _get_article_or_404(db, article_id)
    return {
        "articleId": article_id,
        "comments": [_comment_to_dict(item) for item in _public_comments(article)],
        "message": "管理员评论已直接公开" if comment_status == "approved" else "评论已提交，审核通过后会公开显示",
    }


@app.post("/api/articles/{article_id}/reaction")
def create_reaction(
    article_id: str,
    reaction: ReactionIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    article = _get_article_or_404(db, article_id)
    _ensure_article_visible(article, current_user)
    existing = db.scalar(
        select(UserReaction).where(
            UserReaction.user_id == current_user.id,
            UserReaction.article_id == article.id,
            UserReaction.reaction_type == reaction.type,
        )
    )

    if reaction.active and not existing:
        db.add(
            UserReaction(
                user_id=current_user.id,
                article_id=article.id,
                reaction_type=reaction.type,
            )
        )
    elif not reaction.active and existing:
        db.delete(existing)

    db.commit()
    _sync_reaction_counters(db, article.id)
    article = _get_article_or_404(db, article_id)
    return {
        "articleId": article_id,
        "reactions": _reaction_counts(article),
        "viewerReactions": _viewer_reactions(article, current_user),
    }

@app.post("/api/auth/register")
def register_reader(payload: RegisterIn, db: Session = Depends(get_db)) -> dict:
    if not ALLOW_PUBLIC_EMAIL_REGISTRATION:
        raise HTTPException(status_code=403, detail="Email registration is disabled")

    email = _normalize_email(payload.email)
    password = _validate_password(payload.password)
    display_name = payload.displayName.strip() or email.split("@", 1)[0]

    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(status_code=409, detail="Email is already registered")

    user = User(
        email=email,
        display_name=display_name,
        password_hash=hash_password(password),
        role="reader",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"token": create_access_token(user), "user": _user_to_dict(user)}


@app.post("/api/auth/admin/register")
def register_admin(payload: RegisterIn, db: Session = Depends(get_db)) -> dict:
    if db.scalar(select(User.id).where(User.role == "admin")):
        raise HTTPException(status_code=403, detail="Admin account is already initialized")

    _verify_admin_setup_token(payload.setupToken)

    email = _normalize_email(payload.email)
    password = _validate_password(payload.password)
    display_name = payload.displayName.strip() or "Felix Fu"

    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(status_code=409, detail="Email is already registered")

    user = User(
        email=email,
        display_name=display_name,
        password_hash=hash_password(password),
        role="admin",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"token": create_access_token(user), "user": _user_to_dict(user)}


@app.post("/api/auth/login")
def login(payload: LoginIn, db: Session = Depends(get_db)) -> dict:
    email = _normalize_email(payload.email)
    user = db.scalar(select(User).where(User.email == email))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if user.role != "admin" and not ALLOW_READER_EMAIL_LOGIN:
        raise HTTPException(status_code=403, detail="Reader email login is disabled")

    return {"token": create_access_token(user), "user": _user_to_dict(user)}


@app.get("/api/auth/me")
def get_me(current_user: User = Depends(get_current_user)) -> dict:
    return {"user": _user_to_dict(current_user)}


@app.get("/api/me/activity")
def get_my_activity(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    comments = db.scalars(
        select(Comment)
        .where(Comment.user_id == current_user.id)
        .options(selectinload(Comment.article), selectinload(Comment.parent))
        .order_by(Comment.created_at.desc())
    ).all()
    reactions = db.scalars(
        select(UserReaction)
        .where(UserReaction.user_id == current_user.id)
        .options(selectinload(UserReaction.article))
        .order_by(UserReaction.created_at.desc())
    ).all()
    favorite_reactions = [item for item in reactions if item.reaction_type == "favorite"]
    return {
        "user": _user_to_dict(current_user),
        "summary": {
            "comments": len(comments),
            "reactions": len(reactions),
            "favorites": len(favorite_reactions),
        },
        "comments": [_my_comment_to_dict(comment) for comment in comments[:20]],
        "reactions": [_my_reaction_to_dict(reaction) for reaction in reactions[:30]],
        "favoriteArticles": [_favorite_article_to_dict(reaction) for reaction in favorite_reactions[:20]],
    }


@app.get("/api/auth/github/start")
def start_github_login() -> RedirectResponse:
    try:
        return RedirectResponse(get_github_authorize_url(create_oauth_state("/admin")))
    except HTTPException as exc:
        return _frontend_auth_redirect(error=str(exc.detail))


@app.get("/api/auth/github/callback")
def github_callback(
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    db: Session = Depends(get_db),
) -> RedirectResponse:
    if error:
        return _frontend_auth_redirect(error=error)
    if not code or not state:
        return _frontend_auth_redirect(error="GitHub callback is missing code or state")

    try:
        verify_oauth_state(state)
        profile, email = fetch_github_identity(code)
        user = _upsert_github_user(db, profile, email)
        return _frontend_auth_redirect(token=create_access_token(user))
    except HTTPException as exc:
        return _frontend_auth_redirect(error=str(exc.detail))


@app.post("/api/admin/articles")
def create_admin_article(
    payload: ArticleIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> dict:
    title = payload.title.strip()
    if not title:
        raise HTTPException(status_code=400, detail="Article title is required")

    article = Article(
        id=_generate_article_id(db, title),
        title=title,
        summary=_required_text(payload.summary, "Article summary is required"),
        content=_required_text(payload.content, "Article content is required"),
        cover_url=_optional_text(payload.coverUrl),
        date=(payload.date or datetime.utcnow().date().isoformat()).strip(),
        read_time=(payload.readTime or "3 min").strip(),
        status=payload.status,
        category=(_optional_text(payload.category) or "学习笔记")[:80],
        pinned=payload.pinned,
    )
    article.tags = [_get_or_create_tag(db, tag_name) for tag_name in _clean_tags(payload.tags)]
    article.reactions = [
        ReactionCounter(reaction_type=reaction_type, count=0)
        for reaction_type in REACTION_TYPES
    ]
    db.add(article)
    db.commit()
    _record_admin_event(db, current_user, "创建文章", "article", article.title, f"状态：{article.status}")
    return _article_to_dict(_get_article_or_404(db, article.id), current_user)


@app.put("/api/admin/articles/{article_id}")
def update_admin_article(
    article_id: str,
    payload: ArticleIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> dict:
    article = _get_article_or_404(db, article_id)
    article.title = _required_text(payload.title, "Article title is required")
    article.summary = _required_text(payload.summary, "Article summary is required")
    article.content = _required_text(payload.content, "Article content is required")
    article.cover_url = _optional_text(payload.coverUrl)
    article.date = (payload.date or article.date).strip()
    article.read_time = (payload.readTime or article.read_time).strip()
    article.status = payload.status
    article.category = (_optional_text(payload.category) or "学习笔记")[:80]
    article.pinned = payload.pinned
    article.tags = [_get_or_create_tag(db, tag_name) for tag_name in _clean_tags(payload.tags)]
    db.commit()
    _record_admin_event(db, current_user, "更新文章", "article", article.title, f"状态：{article.status}")
    return _article_to_dict(_get_article_or_404(db, article.id), current_user)


@app.delete("/api/admin/articles/{article_id}")
def delete_admin_article(
    article_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> dict[str, str]:
    article = _get_article_or_404(db, article_id)
    title = article.title
    db.delete(article)
    db.commit()
    _record_admin_event(db, current_user, "删除文章", "article", title, article_id)
    return {"status": "deleted", "articleId": article_id}


@app.post("/api/admin/uploads/images")
async def upload_admin_image(
    file: UploadFile = File(...),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict[str, str | int]:
    content_type = (file.content_type or "").lower()
    suffix = ALLOWED_IMAGE_TYPES.get(content_type)
    if not suffix:
        raise HTTPException(status_code=400, detail="Only JPG, PNG, WebP, GIF, or SVG images are supported")

    content = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="Image must be 5 MB or smaller")
    if not content:
        raise HTTPException(status_code=400, detail="Image file is empty")

    original_suffix = Path(file.filename or "").suffix.lower()
    if original_suffix in {".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"}:
        suffix = ".jpg" if original_suffix == ".jpeg" else original_suffix

    filename = f"{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{uuid4().hex}{suffix}"
    destination = UPLOAD_DIR / filename
    destination.write_bytes(content)
    _record_admin_event(db, current_user, "上传图片", "upload", filename, f"{len(content)} bytes")
    return {"url": f"/uploads/{filename}", "filename": filename, "size": len(content)}


@app.get("/api/admin/uploads/images")
def list_admin_images(current_user: User = Depends(require_admin)) -> list[dict[str, str | int]]:
    images = []
    for path in UPLOAD_DIR.iterdir():
        if not path.is_file() or path.suffix.lower() not in IMAGE_SUFFIXES:
            continue
        stat = path.stat()
        images.append({
            "filename": path.name,
            "url": f"/uploads/{path.name}",
            "size": stat.st_size,
            "createdAt": datetime.fromtimestamp(stat.st_mtime).isoformat(),
        })
    return sorted(images, key=lambda item: str(item["createdAt"]), reverse=True)


@app.delete("/api/admin/uploads/images/{filename}")
def delete_admin_image(
    filename: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    if Path(filename).name != filename or Path(filename).suffix.lower() not in IMAGE_SUFFIXES:
        raise HTTPException(status_code=400, detail="Invalid image filename")

    target = UPLOAD_DIR / filename
    if not target.exists() or not target.is_file():
        raise HTTPException(status_code=404, detail="Image not found")

    target.unlink()
    _record_admin_event(db, current_user, "删除图片", "upload", filename, "")
    return {"status": "deleted", "filename": filename}


@app.get("/api/admin/comments")
def list_admin_comments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> list[dict]:
    comments = db.scalars(
        select(Comment)
        .options(selectinload(Comment.article), selectinload(Comment.parent), selectinload(Comment.user))
        .order_by(Comment.created_at.desc())
    ).all()
    return [_admin_comment_to_dict(comment) for comment in comments]


@app.delete("/api/admin/comments/{comment_id}")
def delete_admin_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> dict[str, int | str]:
    comment = db.get(Comment, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    detail = comment.content[:160]
    db.delete(comment)
    db.commit()
    _record_admin_event(db, current_user, "删除评论", "comment", str(comment_id), detail)
    return {"status": "deleted", "commentId": comment_id}


@app.post("/api/admin/comments/{comment_id}/approve")
def approve_admin_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> dict:
    comment = db.get(Comment, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    detail = comment.content[:160]
    comment.status = "approved"
    db.commit()
    _record_admin_event(db, current_user, "通过评论", "comment", str(comment_id), detail)
    db.refresh(comment)
    return _admin_comment_to_dict(comment)


@app.get("/api/admin/audit-logs")
def list_admin_audit_logs(
    limit: int = Query(default=30, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> list[dict]:
    logs = db.scalars(
        select(AdminAuditLog)
        .options(selectinload(AdminAuditLog.user))
        .order_by(AdminAuditLog.created_at.desc())
        .limit(limit)
    ).all()
    return [
        {
            "id": item.id,
            "action": item.action,
            "targetType": item.target_type,
            "targetLabel": item.target_label,
            "detail": item.detail,
            "createdAt": item.created_at.isoformat(),
            "operator": item.user.display_name if item.user else "未知管理员",
        }
        for item in logs
    ]


@app.get("/api/admin/system/health")
def get_admin_system_health(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> dict[str, Any]:
    database_ok = True
    database_message = "连接正常"
    try:
        db.execute(text("SELECT 1"))
    except Exception as exc:
        database_ok = False
        database_message = str(exc)[:180]

    upload_ok = UPLOAD_DIR.exists() and UPLOAD_DIR.is_dir()
    upload_count = len([path for path in UPLOAD_DIR.iterdir() if path.is_file()]) if upload_ok else 0
    ai_config = _current_ai_config()
    return {
        "checkedAt": datetime.utcnow().isoformat(),
        "services": [
            {"name": "Backend API", "status": "online", "detail": app.version},
            {"name": "Database", "status": "online" if database_ok else "attention", "detail": database_message},
            {"name": "Uploads", "status": "online" if upload_ok else "attention", "detail": f"{upload_count} 个文件"},
            {"name": "AI Provider", "status": "online" if ai_config["configured"] else "attention", "detail": ai_config["model"] or "未配置真实模型"},
        ],
        "containers": _read_container_statuses(),
        "limits": {
            "maxUploadMb": MAX_UPLOAD_BYTES // (1024 * 1024),
            "commentMaxLength": COMMENT_MAX_LENGTH,
            "commentCooldownSeconds": COMMENT_COOLDOWN_SECONDS,
        },
    }


@app.get("/api/admin/stats")
def get_admin_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> dict:
    articles = _load_articles(db)
    comments = db.scalars(select(Comment).options(selectinload(Comment.article))).all()
    users = db.scalars(select(User)).all()
    total_views = sum(article.view_count or 0 for article in articles)
    top_articles = sorted(articles, key=lambda item: item.view_count or 0, reverse=True)[:5]
    categories: dict[str, int] = {}
    tags: dict[str, int] = {}
    for article in articles:
        categories[article.category or "未分类"] = categories.get(article.category or "未分类", 0) + 1
        for tag in article.tags:
            tags[tag.name] = tags.get(tag.name, 0) + 1
    return {
        "summary": {
            "articles": len(articles),
            "published": len([article for article in articles if article.status == "published"]),
            "drafts": len([article for article in articles if article.status == "draft"]),
            "comments": len(comments),
            "pendingComments": len([comment for comment in comments if comment.status == "pending"]),
            "users": len(users),
            "views": total_views,
        },
        "topArticles": [
            {"id": article.id, "title": article.title, "views": article.view_count or 0}
            for article in top_articles
        ],
        "categories": [{"name": name, "count": count} for name, count in sorted(categories.items())],
        "tags": [
            {"name": name, "count": count}
            for name, count in sorted(tags.items(), key=lambda item: item[1], reverse=True)[:10]
        ],
    }


@app.get("/api/ai/news")
def get_ai_news() -> list[dict]:
    return AI_NEWS


def _load_saved_ai_settings() -> dict[str, Any]:
    try:
        if not AI_SETTINGS_FILE.exists():
            return {}
        data = json.loads(AI_SETTINGS_FILE.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except (OSError, json.JSONDecodeError):
        return {}


def _write_saved_ai_settings(settings: dict[str, Any]) -> None:
    AI_SETTINGS_FILE.parent.mkdir(parents=True, exist_ok=True)
    AI_SETTINGS_FILE.write_text(json.dumps(settings, ensure_ascii=False, indent=2), encoding="utf-8")


def _delete_saved_ai_settings() -> None:
    try:
        AI_SETTINGS_FILE.unlink()
    except FileNotFoundError:
        return


def _read_container_statuses() -> list[dict[str, str]]:
    try:
        result = subprocess.run(
            ["docker", "compose", "ps", "--format", "json"],
            capture_output=True,
            text=True,
            timeout=3,
        )
    except (OSError, subprocess.TimeoutExpired):
        return [
            {
                "name": "Docker 容器",
                "status": "attention",
                "detail": "后端容器当前无法访问 Docker 状态，可在服务器开放 docker compose ps 后显示真实容器。",
            }
        ]

    if result.returncode != 0:
        return [
            {
                "name": "Docker 容器",
                "status": "attention",
                "detail": (result.stderr or result.stdout or "docker compose ps 执行失败")[:180],
            }
        ]

    containers: list[dict[str, str]] = []
    for line in result.stdout.splitlines():
        try:
            parsed = json.loads(line)
        except json.JSONDecodeError:
            continue
        parsed_items = parsed if isinstance(parsed, list) else [parsed]
        for item in parsed_items:
            if not isinstance(item, dict):
                continue
            state = str(item.get("State") or item.get("Status") or "").lower()
            containers.append({
                "name": str(item.get("Name") or item.get("Service") or "Docker 服务"),
                "status": "online" if "running" in state or state == "healthy" else "attention",
                "detail": str(item.get("Status") or item.get("State") or "状态未知")[:180],
            })
    return containers or [
        {
            "name": "Docker 容器",
            "status": "attention",
            "detail": "没有读取到容器列表。",
        }
    ]


def _current_ai_config() -> dict[str, Any]:
    saved = _load_saved_ai_settings()
    has_saved_settings = bool(saved)
    api_key = _optional_text(saved.get("apiKey")) if has_saved_settings else ""
    env_key = AI_API_KEY
    config = {
        "provider": AI_PROVIDER_NAME,
        "apiStyle": _normalize_ai_style(AI_API_STYLE),
        "baseUrl": AI_BASE_URL,
        "model": AI_MODEL,
        "apiKey": env_key,
        "timeout": AI_REQUEST_TIMEOUT,
        "enabled": True,
        "source": "环境变量" if (AI_BASE_URL or AI_MODEL or AI_API_KEY) else "未配置",
        "saved": False,
    }
    if has_saved_settings:
        try:
            timeout = float(saved.get("timeout", AI_REQUEST_TIMEOUT) or AI_REQUEST_TIMEOUT)
        except (TypeError, ValueError):
            timeout = AI_REQUEST_TIMEOUT
        config.update({
            "provider": _optional_text(saved.get("providerName")) or _optional_text(saved.get("provider")) or "OpenAI Compatible",
            "apiStyle": _normalize_ai_style(_optional_text(saved.get("apiStyle")) or "openai"),
            "baseUrl": _optional_text(saved.get("baseUrl")),
            "model": _optional_text(saved.get("model")),
            "apiKey": api_key,
            "timeout": max(5.0, min(timeout, 120.0)),
            "enabled": bool(saved.get("enabled", True)),
            "source": "后台保存",
            "saved": True,
        })
    config["configured"] = bool(config["enabled"] and config["baseUrl"] and config["model"] and config["apiKey"])
    config["apiKeyTail"] = f"***{config['apiKey'][-4:]}" if config["apiKey"] else ""
    return config


def _public_ai_settings() -> dict[str, str | bool | float]:
    config = _current_ai_config()
    configured = bool(config["configured"])
    return {
        "provider": config["provider"],
        "apiStyle": config["apiStyle"],
        "model": config["model"] or "",
        "baseUrl": config["baseUrl"] or "",
        "baseUrlConfigured": bool(config["baseUrl"]),
        "apiKeyConfigured": bool(config["apiKey"]),
        "apiKeyTail": config["apiKeyTail"],
        "configured": configured,
        "enabled": bool(config["enabled"]),
        "saved": bool(config["saved"]),
        "source": config["source"],
        "timeout": float(config["timeout"]),
        "note": "后台保存的密钥只显示末尾几位；停用或删除后写作助手会回到本地模板。",
    }


@app.get("/api/ai/status")
def get_ai_status() -> dict[str, str | bool]:
    config = _current_ai_config()
    configured = bool(config["configured"])
    return {
        "provider": config["provider"],
        "apiStyle": config["apiStyle"],
        "model": config["model"] or "未配置",
        "baseUrlConfigured": bool(config["baseUrl"]),
        "apiKeyConfigured": bool(config["apiKey"]),
        "configured": configured,
        "mode": "real-model-ready" if configured else "local-placeholder",
        "message": "真实模型配置已就绪，将优先调用保存的 AI 配置。" if configured else "当前使用本地占位生成；可在后台 AI 页保存真实模型配置。",
    }


@app.get("/api/admin/ai/settings")
def get_admin_ai_settings(current_user: User = Depends(require_admin)) -> dict[str, str | bool | float]:
    return _public_ai_settings()


@app.put("/api/admin/ai/settings")
def save_admin_ai_settings(
    payload: AiSettingsIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> dict[str, str | bool | float]:
    existing = _load_saved_ai_settings()
    api_key = _optional_text(payload.apiKey) or _optional_text(existing.get("apiKey"))
    base_url = _optional_text(payload.baseUrl)
    model = _optional_text(payload.model)
    if payload.enabled and (not base_url or not model or not api_key):
        raise HTTPException(status_code=400, detail="启用 AI 前需要填写 Base URL、模型名和 API Key")
    settings = {
        "providerName": _optional_text(payload.providerName) or "OpenAI Compatible",
        "apiStyle": _normalize_ai_style(payload.apiStyle),
        "baseUrl": base_url,
        "model": model,
        "apiKey": api_key,
        "timeout": max(5.0, min(float(payload.timeout or 25.0), 120.0)),
        "enabled": bool(payload.enabled),
        "updatedAt": datetime.utcnow().isoformat(),
        "updatedBy": current_user.email,
    }
    _write_saved_ai_settings(settings)
    _record_admin_event(db, current_user, "保存 AI 配置", "ai", settings["providerName"], f"模型：{settings['model']}")
    return _public_ai_settings()


@app.post("/api/admin/ai/settings/disable")
def disable_admin_ai_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> dict[str, str | bool | float]:
    settings = _load_saved_ai_settings()
    if not settings:
        settings = {
            "providerName": AI_PROVIDER_NAME,
            "apiStyle": _normalize_ai_style(AI_API_STYLE),
            "baseUrl": AI_BASE_URL,
            "model": AI_MODEL,
            "apiKey": AI_API_KEY,
            "timeout": AI_REQUEST_TIMEOUT,
        }
    settings["enabled"] = False
    settings["updatedAt"] = datetime.utcnow().isoformat()
    settings["updatedBy"] = current_user.email
    _write_saved_ai_settings(settings)
    _record_admin_event(db, current_user, "停用 AI 配置", "ai", _optional_text(settings.get("providerName")))
    return _public_ai_settings()


@app.delete("/api/admin/ai/settings")
def delete_admin_ai_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> dict[str, str | bool | float]:
    _delete_saved_ai_settings()
    _record_admin_event(db, current_user, "删除 AI 配置", "ai", "后台保存配置")
    return _public_ai_settings()


@app.post("/api/admin/ai/test")
def test_admin_ai_settings(
    payload: AiTestIn,
    current_user: User = Depends(require_admin),
) -> dict[str, str | bool]:
    config = _current_ai_config()
    base_url = _optional_text(payload.baseUrl) or config["baseUrl"]
    model = _optional_text(payload.model) or config["model"]
    api_key = _optional_text(payload.apiKey) or config["apiKey"]
    provider = _optional_text(payload.providerName) or config["provider"]
    api_style = _normalize_ai_style(_optional_text(payload.apiStyle) or config["apiStyle"])
    if not base_url or not model or not api_key:
        return {
            "ok": False,
            "provider": provider,
            "apiStyle": api_style,
            "model": model or "未配置",
            "message": "缺少 Base URL、模型名或 API Key，无法测试真实模型。",
        }

    try:
        generated = _run_ai_chat_once(
            base_url=base_url,
            api_style=api_style,
            model=model,
            api_key=api_key,
            messages=[
                {"role": "system", "content": "你是一个用于连通性测试的中文助手。"},
                {"role": "user", "content": "请只回复：AI 配置测试成功"},
            ],
            timeout=min(float(config["timeout"]), 20),
        )
        return {
            "ok": True,
            "provider": provider,
            "apiStyle": api_style,
            "model": model,
            "message": generated[:120] or "AI 配置测试成功",
        }
    except RuntimeError as exc:
        return {
            "ok": False,
            "provider": provider,
            "apiStyle": api_style,
            "model": model,
            "message": f"真实模型测试失败：{exc}",
        }


@app.get("/api/admin/ai/history")
def list_admin_ai_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> list[dict]:
    history = db.scalars(
        select(AiGeneration)
        .options(selectinload(AiGeneration.user))
        .order_by(AiGeneration.created_at.desc())
    ).all()
    return [_ai_generation_to_dict(item) for item in history[:80]]


@app.post("/api/ai/workbench")
def run_ai_workbench(payload: AiWorkbenchIn) -> dict:
    topic = _optional_text(payload.topic) or "个人博客"
    content = _optional_text(payload.content)
    tags = [_optional_text(tag) for tag in payload.tags if _optional_text(tag)]
    tone = _optional_text(payload.tone) or "技术学习"

    ai_config = _current_ai_config()
    if ai_config["configured"]:
        try:
            return _run_real_ai_workbench(payload, topic, content, tags, tone, ai_config)
        except RuntimeError as exc:
            items = _build_local_ai_items(payload.mode, topic, content, tags, tone)
            return {
                "mode": payload.mode,
                "provider": ai_config["provider"],
                "model": ai_config["model"],
                "status": "fallback",
                "message": f"真实模型调用失败，已返回本地候选：{exc}",
                "items": items,
            }

    items = _build_local_ai_items(payload.mode, topic, content, tags, tone)
    return {
        "mode": payload.mode,
        "provider": "local-placeholder",
        "model": "local-template",
        "status": "mock",
        "message": "当前使用本地占位生成逻辑；配置真实模型后会优先返回 AI Provider 输出。",
        "items": items,
    }


@app.post("/api/ai/editor")
def run_ai_editor(
    payload: AiEditorIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> dict:
    title = _optional_text(payload.title) or "未命名文章"
    summary = _optional_text(payload.summary) or ""
    content = _optional_text(payload.content) or ""
    selected_text = _optional_text(payload.selectedText) or ""
    tone = _optional_text(payload.tone) or "技术学习"
    source_text = selected_text or content

    ai_config = _current_ai_config()
    if ai_config["configured"]:
        try:
            generated = _run_real_ai_editor(payload.task, title, summary, source_text, tone, ai_config)
            result = {
                "task": payload.task,
                "provider": ai_config["provider"],
                "model": ai_config["model"],
                "status": "real",
                "message": "已由真实模型生成写作辅助内容",
                "content": generated,
            }
            result["historyId"] = _record_ai_generation(db, current_user, payload.task, "real", title, source_text, generated)
            return result
        except RuntimeError as exc:
            generated = _build_local_ai_editor_content(payload.task, title, summary, source_text, tone)
            result = {
                "task": payload.task,
                "provider": ai_config["provider"],
                "model": ai_config["model"],
                "status": "fallback",
                "message": f"真实模型调用失败，已返回本地写作辅助：{exc}",
                "content": generated,
            }
            result["historyId"] = _record_ai_generation(db, current_user, payload.task, "fallback", title, source_text, generated)
            return result

    generated = _build_local_ai_editor_content(payload.task, title, summary, source_text, tone)
    result = {
        "task": payload.task,
        "provider": "local-placeholder",
        "model": "local-template",
        "status": "mock",
        "message": "当前使用本地占位写作辅助；配置真实模型后会优先返回 AI Provider 输出。",
        "content": generated,
    }
    result["historyId"] = _record_ai_generation(db, current_user, payload.task, "mock", title, source_text, generated)
    return result


def _build_local_ai_items(
    mode: Literal["ideas", "summary", "titles"],
    topic: str,
    content: str | None,
    tags: list[str],
    tone: str,
) -> list[dict]:
    if mode == "ideas":
        items = [
            {
                "title": f"{topic}：从问题到实践的学习记录",
                "summary": f"用一篇偏{tone}风格的文章，记录你为什么关注这个主题、踩过哪些坑、最后沉淀出什么方法。",
                "tags": tags or ["学习笔记", "实践复盘"],
                "action": "适合写成项目复盘或学习笔记。",
            },
            {
                "title": f"{topic} 入门路线和资料整理",
                "summary": "把零散资料整理成可执行的学习路线，适合作为个人博客里的长期索引文章。",
                "tags": tags or ["资料整理", "路线图"],
                "action": "适合配合外链、图片和阶段性任务清单。",
            },
            {
                "title": f"我如何用 {topic} 改进自己的工作流",
                "summary": "围绕一个真实场景展开，写清楚旧流程的问题、新流程的设计和可量化结果。",
                "tags": tags or ["效率", "自动化"],
                "action": "适合后续接入 AI 自动化模块。",
            },
        ]
    elif mode == "summary":
        source = content or topic
        compact = re.sub(r"\s+", " ", source).strip()
        if len(compact) > 120:
            compact = compact[:120].rstrip() + "..."
        items = [
            {
                "title": "短摘要",
                "summary": compact or "这里会根据正文生成一段适合文章列表展示的短摘要。",
                "tags": tags or ["摘要"],
                "action": "下一版可一键填入文章摘要字段。",
            },
            {
                "title": "结构化摘要",
                "summary": f"主题：{topic}。核心内容围绕背景、关键做法和后续计划展开，适合用在文章开头或结尾。",
                "tags": tags or ["结构化总结"],
                "action": "适合发布前快速检查文章主线。",
            },
        ]
    elif mode == "titles":
        items = [
            {
                "title": f"{topic} 的一次完整复盘",
                "summary": "稳妥、清晰，适合技术学习文章。",
                "tags": tags or ["标题候选"],
                "action": "偏记录型标题。",
            },
            {
                "title": f"从零搭建 {topic}：我踩过的坑和解决办法",
                "summary": "更有故事性，适合项目搭建记录。",
                "tags": tags or ["标题候选"],
                "action": "偏经验分享标题。",
            },
            {
                "title": f"为什么我决定把 {topic} 做成长期模块",
                "summary": "更偏个人博客表达，适合说明动机和路线。",
                "tags": tags or ["标题候选"],
                "action": "偏思考型标题。",
            },
        ]
    else:
        items = []
    return items


def _is_ai_configured() -> bool:
    return bool(_current_ai_config()["configured"])


def _normalize_ai_style(value: str | None) -> str:
    style = (value or "openai").strip().lower()
    if style in {"codex", "codex-relay", "aicodemirror", "aicode-mirror"}:
        return "codex"
    return "openai"


def _run_real_ai_workbench(
    payload: AiWorkbenchIn,
    topic: str,
    content: str | None,
    tags: list[str],
    tone: str,
    ai_config: dict[str, Any],
) -> dict:
    prompt = _build_ai_prompt(payload.mode, topic, content, tags, tone)
    content_text = _run_configured_ai_chat(
        ai_config,
        messages=[
            {
                "role": "system",
                "content": "你是一个帮助个人博客作者整理学习笔记、项目复盘和文章选题的中文写作助手。请严格输出 JSON。",
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.7,
    )

    items = _parse_ai_items(content_text)
    return {
        "mode": payload.mode,
        "provider": ai_config["provider"],
        "model": ai_config["model"],
        "status": "real",
        "message": "已由真实模型生成候选内容",
        "items": items,
    }


def _build_ai_prompt(
    mode: Literal["ideas", "summary", "titles"],
    topic: str,
    content: str | None,
    tags: list[str],
    tone: str,
) -> str:
    mode_guides = {
        "ideas": "生成 3 个文章选题，每个包含标题、摘要、标签和下一步写作动作。",
        "summary": "根据正文或主题生成 2 个摘要方案，一个短摘要，一个结构化摘要。",
        "titles": "生成 3 个标题候选，并说明适合的文章气质或使用场景。",
    }
    tag_text = "、".join(tags) if tags else "由你建议"
    content_text = content or "暂无正文，请根据主题生成。"
    return (
        f"任务：{mode_guides[mode]}\n"
        f"主题：{topic}\n"
        f"语气：{tone}\n"
        f"参考标签：{tag_text}\n"
        f"正文或背景：{content_text[:3000]}\n\n"
        "只输出 JSON，不要输出 Markdown 代码块。格式如下："
        '{"items":[{"title":"标题","summary":"摘要","tags":["标签1","标签2"],"action":"下一步动作"}]}'
    )


def _ai_chat_url_for(base_url: str, api_style: str = "openai") -> str:
    cleaned = base_url.rstrip("/")
    if _normalize_ai_style(api_style) == "codex":
        return cleaned
    if cleaned.endswith("/chat/completions"):
        return cleaned
    return f"{cleaned}/chat/completions"


def _run_configured_ai_chat(ai_config: dict[str, Any], messages: list[dict[str, str]], temperature: float) -> str:
    return _run_ai_chat_once(
        base_url=ai_config["baseUrl"],
        api_style=ai_config["apiStyle"],
        model=ai_config["model"],
        api_key=ai_config["apiKey"],
        messages=messages,
        timeout=float(ai_config["timeout"]),
        temperature=temperature,
    )


def _run_ai_chat_once(
    base_url: str,
    api_style: str,
    model: str,
    api_key: str,
    messages: list[dict[str, str]],
    timeout: float,
    temperature: float = 0.2,
) -> str:
    style = _normalize_ai_style(api_style)
    endpoint = _ai_chat_url_for(base_url, style)
    prompt = _messages_to_prompt(messages)
    candidate_payloads = [
        {"model": model, "messages": messages, "temperature": temperature, "stream": False},
    ]
    if style == "codex":
        candidate_payloads.extend([
            {"model": model, "input": prompt, "temperature": temperature, "stream": False},
            {"model": model, "prompt": prompt, "temperature": temperature, "stream": False},
        ])

    last_error: RuntimeError | None = None
    for payload in candidate_payloads:
        try:
            raw_body = _post_ai_json(endpoint, api_key, payload, timeout)
            return _extract_ai_text(raw_body)
        except RuntimeError as exc:
            last_error = exc
            if "HTTP 401" in str(exc) or "HTTP 403" in str(exc):
                break

    raise last_error or RuntimeError("模型响应格式无法识别")


def _post_ai_json(endpoint: str, api_key: str, payload: dict, timeout: float) -> str:
    request = Request(
        endpoint,
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urlopen(request, timeout=timeout) as response:
            return response.read().decode("utf-8")
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")[:180]
        raise RuntimeError(f"HTTP {exc.code} {detail}".strip()) from exc
    except URLError as exc:
        raise RuntimeError(str(exc.reason)) from exc
    except TimeoutError as exc:
        raise RuntimeError("请求超时") from exc


def _messages_to_prompt(messages: list[dict[str, str]]) -> str:
    parts = []
    for message in messages:
        role = str(message.get("role") or "user").strip()
        content = str(message.get("content") or "").strip()
        if content:
            parts.append(f"{role}: {content}")
    return "\n\n".join(parts)


def _extract_ai_text(raw_body: str) -> str:
    stripped = raw_body.strip()
    if not stripped:
        raise RuntimeError("模型返回内容为空")
    lower = stripped[:120].lower()
    if lower.startswith("<!doctype") or lower.startswith("<html"):
        raise RuntimeError("接口返回了网页 HTML，请检查 Base URL 是否为中转站提供的完整 API 地址")

    if stripped.startswith("data:"):
        text = _extract_sse_text(stripped)
        if text:
            return text

    try:
        body = json.loads(stripped)
    except json.JSONDecodeError as exc:
        if stripped and not stripped.startswith("{") and not stripped.startswith("["):
            return stripped[:5000].strip()
        raise RuntimeError("模型响应格式无法识别") from exc

    if isinstance(body, dict):
        error = body.get("error")
        if isinstance(error, dict):
            message = str(error.get("message") or error.get("code") or "").strip()
            if message:
                raise RuntimeError(message[:180])
        elif isinstance(error, str) and error.strip():
            raise RuntimeError(error.strip()[:180])

    text = _find_ai_text(body)
    if not text:
        raise RuntimeError("模型响应格式无法识别")
    return text.strip()


def _extract_sse_text(raw_body: str) -> str:
    parts = []
    for line in raw_body.splitlines():
        line = line.strip()
        if not line.startswith("data:"):
            continue
        data = line[5:].strip()
        if not data or data == "[DONE]":
            continue
        try:
            body = json.loads(data)
        except json.JSONDecodeError:
            parts.append(data)
            continue
        text = _find_ai_text(body)
        if text:
            parts.append(text)
    return "".join(parts).strip()


def _find_ai_text(value) -> str:
    if isinstance(value, str):
        return value.strip()

    if isinstance(value, list):
        parts = [_find_ai_text(item) for item in value]
        return "".join(part for part in parts if part).strip()

    if not isinstance(value, dict):
        return ""

    choices = value.get("choices")
    if isinstance(choices, list) and choices:
        choice = choices[0]
        if isinstance(choice, dict):
            message = choice.get("message")
            if isinstance(message, dict):
                content = _find_ai_text(message.get("content"))
                if content:
                    return content
            delta = choice.get("delta")
            if isinstance(delta, dict):
                content = _find_ai_text(delta.get("content"))
                if content:
                    return content
            text = _find_ai_text(choice.get("text"))
            if text:
                return text

    output_text = _find_ai_text(value.get("output_text"))
    if output_text:
        return output_text

    output = value.get("output")
    if isinstance(output, list):
        parts = []
        for item in output:
            if isinstance(item, dict):
                parts.append(_find_ai_text(item.get("content")))
        text = "".join(part for part in parts if part).strip()
        if text:
            return text

    for key in ("content", "text", "result", "response", "message", "answer"):
        text = _find_ai_text(value.get(key))
        if text:
            return text

    return ""


def _parse_ai_items(content_text: str) -> list[dict]:
    cleaned = content_text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?", "", cleaned, flags=re.IGNORECASE).strip()
        cleaned = re.sub(r"```$", "", cleaned).strip()

    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise RuntimeError("模型没有返回 JSON")

    try:
        parsed = json.loads(cleaned[start : end + 1])
    except json.JSONDecodeError as exc:
        raise RuntimeError("模型返回的 JSON 解析失败") from exc

    raw_items = parsed.get("items")
    if not isinstance(raw_items, list) or not raw_items:
        raise RuntimeError("模型返回内容缺少 items")

    items = []
    for raw_item in raw_items[:5]:
        if not isinstance(raw_item, dict):
            continue
        title = str(raw_item.get("title") or "").strip()
        summary = str(raw_item.get("summary") or "").strip()
        action = str(raw_item.get("action") or "").strip()
        raw_tags = raw_item.get("tags") or []
        if isinstance(raw_tags, str):
            tags = [tag.strip() for tag in re.split(r"[,，、]", raw_tags) if tag.strip()]
        elif isinstance(raw_tags, list):
            tags = [str(tag).strip() for tag in raw_tags if str(tag).strip()]
        else:
            tags = []
        if title and summary:
            items.append({
                "title": title[:120],
                "summary": summary[:500],
                "tags": tags[:5],
                "action": action[:180] or "可作为下一篇文章候选内容。",
            })

    if not items:
        raise RuntimeError("模型返回内容为空")
    return items


def _run_real_ai_editor(
    task: Literal["polish", "continue", "outline"],
    title: str,
    summary: str,
    source_text: str,
    tone: str,
    ai_config: dict[str, Any],
) -> str:
    prompt = _build_ai_editor_prompt(task, title, summary, source_text, tone)
    generated = _run_configured_ai_chat(
        ai_config,
        messages=[
            {
                "role": "system",
                "content": "你是个人博客写作助手。请输出可直接粘贴到 Markdown 文章正文中的中文内容，不要解释你的工作过程。",
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.65,
    )

    generated = re.sub(r"^```(?:markdown|md)?", "", generated, flags=re.IGNORECASE).strip()
    generated = re.sub(r"```$", "", generated).strip()
    if not generated:
        raise RuntimeError("模型返回内容为空")
    return generated[:5000]


def _build_ai_editor_prompt(
    task: Literal["polish", "continue", "outline"],
    title: str,
    summary: str,
    source_text: str,
    tone: str,
) -> str:
    task_guides = {
        "polish": "请润色给定内容，保留原意，改善表达、结构和衔接。输出润色后的正文片段。",
        "continue": "请基于已有内容续写 2 到 4 个自然段，延续原文语气，并给出可继续展开的方向。",
        "outline": "请为这篇文章生成清晰 Markdown 大纲，包含二级标题和每节要点。",
    }
    return (
        f"任务：{task_guides[task]}\n"
        f"文章标题：{title}\n"
        f"文章摘要：{summary or '暂无'}\n"
        f"语气：{tone}\n"
        f"参考内容：{(source_text or '暂无正文，请根据标题和摘要生成。')[:4000]}\n\n"
        "要求：输出 Markdown；不要用代码块包裹；不要写“以下是”。"
    )


def _build_local_ai_editor_content(
    task: Literal["polish", "continue", "outline"],
    title: str,
    summary: str,
    source_text: str,
    tone: str,
) -> str:
    compact = re.sub(r"\s+", " ", source_text).strip()
    if len(compact) > 220:
        compact = compact[:220].rstrip() + "..."

    if task == "polish":
        return (
            "## AI 润色建议\n\n"
            f"- 主题聚焦：围绕“{title}”保持一条清晰主线。\n"
            f"- 表达风格：建议采用偏{tone}的语气，减少跳跃，补足因果关系。\n"
            f"- 可替换段落：{compact or summary or '请先补充一段正文，再使用真实模型生成完整润色结果。'}\n"
        )
    if task == "continue":
        return (
            "## AI 续写草稿\n\n"
            f"沿着“{title}”继续写，可以先补充当前问题的背景，再记录你实际尝试过的方案。\n\n"
            "接下来可以写三个部分：第一，为什么这个问题值得记录；第二，实践中遇到的阻碍；第三，最终沉淀的方法或清单。\n"
        )
    return (
        "## AI 文章大纲\n\n"
        f"### 1. 背景：为什么写《{title}》\n\n"
        "- 记录问题来源\n- 说明读者能获得什么\n\n"
        "### 2. 实践过程\n\n"
        "- 关键步骤\n- 遇到的问题\n- 解决办法\n\n"
        "### 3. 总结和下一步\n\n"
        "- 当前结论\n- 后续计划\n"
    )


@app.get("/api/game/card-war")
def get_card_war_info() -> dict[str, str]:
    return {
        "title": "决斗小游戏",
        "repository": "https://github.com/firefelixfu026/card-war-made-by-class-3",
        "playUrl": "https://firefelixfu026.github.io/card-war-made-by-class-3/",
        "status": "embedded",
    }


def _record_admin_event(
    db: Session,
    current_user: User,
    action: str,
    target_type: str = "",
    target_label: str = "",
    detail: str = "",
) -> None:
    db.add(
        AdminAuditLog(
            user_id=current_user.id,
            action=action[:80],
            target_type=target_type[:80],
            target_label=target_label[:255],
            detail=detail[:1000],
        )
    )
    db.commit()


def _load_articles(db: Session) -> list[Article]:
    statement = (
        select(Article)
        .options(
            selectinload(Article.tags),
            selectinload(Article.comments),
            selectinload(Article.reactions),
            selectinload(Article.user_reactions),
        )
        .order_by(Article.pinned.desc(), Article.created_at.desc())
    )
    return list(db.scalars(statement).all())


def _get_article_or_404(db: Session, article_id: str) -> Article:
    article = db.scalar(
        select(Article)
        .where(Article.id == article_id)
        .options(
            selectinload(Article.tags),
            selectinload(Article.comments),
            selectinload(Article.reactions),
            selectinload(Article.user_reactions),
        )
    )
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article


def _article_to_dict(article: Article, current_user: User | None = None) -> dict:
    return {
        "id": article.id,
        "title": article.title,
        "summary": article.summary,
        "content": article.content,
        "coverUrl": article.cover_url or "",
        "tags": [tag.name for tag in sorted(article.tags, key=lambda item: item.name)],
        "date": article.date,
        "readTime": article.read_time,
        "status": article.status,
        "category": article.category or "学习笔记",
        "pinned": bool(article.pinned),
        "viewCount": article.view_count or 0,
        "comments": [_comment_to_dict(comment) for comment in _visible_comments(article, current_user)],
        "reactions": _reaction_counts(article),
        "viewerReactions": _viewer_reactions(article, current_user),
    }


def _ensure_article_visible(article: Article, current_user: User | None) -> None:
    if article.status == "published":
        return
    if current_user and current_user.role == "admin":
        return
    raise HTTPException(status_code=404, detail="Article not found")


def _visible_comments(article: Article, current_user: User | None) -> list[Comment]:
    if current_user and current_user.role == "admin":
        return sorted(article.comments, key=lambda item: item.created_at)
    return _public_comments(article)


def _public_comments(article: Article) -> list[Comment]:
    return sorted(
        [comment for comment in article.comments if comment.status == "approved"],
        key=lambda item: item.created_at,
    )


def _comment_to_dict(comment: Comment) -> dict:
    return {
        "id": comment.id,
        "authorName": comment.author_name,
        "userId": comment.user_id,
        "parentId": comment.parent_id,
        "replyToAuthor": comment.parent.author_name if comment.parent else "",
        "content": comment.content,
        "status": comment.status,
        "createdAt": comment.created_at.isoformat(),
    }


def _admin_comment_to_dict(comment: Comment) -> dict:
    return {
        **_comment_to_dict(comment),
        "articleId": comment.article_id,
        "articleTitle": comment.article.title if comment.article else "",
    }


def _my_comment_to_dict(comment: Comment) -> dict:
    return {
        **_comment_to_dict(comment),
        "articleId": comment.article_id,
        "articleTitle": comment.article.title if comment.article else "",
    }


def _my_reaction_to_dict(reaction: UserReaction) -> dict:
    return {
        "id": reaction.id,
        "type": reaction.reaction_type,
        "articleId": reaction.article_id,
        "articleTitle": reaction.article.title if reaction.article else reaction.article_id,
        "createdAt": reaction.created_at.isoformat(),
    }


def _favorite_article_to_dict(reaction: UserReaction) -> dict:
    article = reaction.article
    return {
        "id": reaction.article_id,
        "title": article.title if article else reaction.article_id,
        "summary": article.summary if article else "",
        "date": article.date if article else "",
        "readTime": article.read_time if article else "",
        "createdAt": reaction.created_at.isoformat(),
    }


def _ai_generation_to_dict(item: AiGeneration) -> dict:
    return {
        "id": item.id,
        "task": item.task,
        "source": item.source,
        "title": item.title,
        "prompt": item.prompt,
        "result": item.result,
        "authorName": item.user.display_name if item.user else "",
        "createdAt": item.created_at.isoformat(),
    }


def _record_ai_generation(
    db: Session,
    user: User,
    task: str,
    source: str,
    title: str,
    prompt: str,
    result: str,
) -> int:
    item = AiGeneration(
        user_id=user.id,
        task=task,
        source=source,
        title=title[:255],
        prompt=(prompt or "")[:3000],
        result=(result or "")[:5000],
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item.id


def _reaction_counts(article: Article) -> dict[str, int]:
    counts = {reaction_type: 0 for reaction_type in REACTION_TYPES}
    for reaction in article.reactions:
        counts[reaction.reaction_type] = reaction.count
    return counts


def _viewer_reactions(article: Article, current_user: User | None) -> dict[str, bool]:
    selected = {reaction_type: False for reaction_type in REACTION_TYPES}
    if not current_user:
        return selected

    for reaction in article.user_reactions:
        if reaction.user_id == current_user.id and reaction.reaction_type in selected:
            selected[reaction.reaction_type] = True
    return selected


def _sync_reaction_counters(db: Session, article_id: str) -> None:
    for reaction_type in REACTION_TYPES:
        counter = _get_or_create_reaction_counter(db, article_id, reaction_type)
        counter.count = len(
            db.scalars(
                select(UserReaction.id).where(
                    UserReaction.article_id == article_id,
                    UserReaction.reaction_type == reaction_type,
                )
            ).all()
        )
    db.commit()


def _get_or_create_reaction_counter(db: Session, article_id: str, reaction_type: str) -> ReactionCounter:
    counter = db.scalar(
        select(ReactionCounter).where(
            ReactionCounter.article_id == article_id,
            ReactionCounter.reaction_type == reaction_type,
        )
    )
    if counter:
        return counter

    counter = ReactionCounter(article_id=article_id, reaction_type=reaction_type, count=0)
    db.add(counter)
    db.flush()
    return counter


def _get_or_create_tag(db: Session, name: str) -> Tag:
    tag = db.scalar(select(Tag).where(Tag.name == name))
    if tag:
        return tag

    tag = Tag(name=name)
    db.add(tag)
    db.flush()
    return tag


def _required_text(value: str, message: str) -> str:
    cleaned = value.strip()
    if not cleaned:
        raise HTTPException(status_code=400, detail=message)
    return cleaned


def _optional_text(value: str | None) -> str | None:
    if not value:
        return None
    cleaned = value.strip()
    return cleaned or None


def _verify_admin_setup_token(value: str) -> None:
    if not ADMIN_SETUP_TOKEN:
        raise HTTPException(status_code=403, detail="Admin setup is disabled")
    if not hmac.compare_digest(value.strip(), ADMIN_SETUP_TOKEN):
        raise HTTPException(status_code=403, detail="Invalid admin setup token")


def _normalize_email(value: str) -> str:
    email = value.strip().lower()
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
        raise HTTPException(status_code=400, detail="A valid email is required")
    return email


def _validate_password(value: str) -> str:
    if len(value) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    return value


def _upsert_github_user(db: Session, profile: dict, email: str | None) -> User:
    github_id = str(profile.get("id") or "").strip()
    login = str(profile.get("login") or "").strip()
    if not github_id or not login:
        raise HTTPException(status_code=400, detail="GitHub profile is missing required fields")

    normalized_email = _github_email(login, email)
    display_name = (profile.get("name") or login).strip()
    avatar_url = profile.get("avatar_url")
    should_be_admin = _is_configured_github_admin(login, normalized_email)

    user = db.scalar(select(User).where(User.github_id == github_id))
    if not user:
        user = db.scalar(select(User).where(User.email == normalized_email))
        if user and user.github_id and user.github_id != github_id:
            raise HTTPException(status_code=409, detail="This email is linked to another GitHub account")

    if user:
        user.github_id = github_id
        user.email = user.email or normalized_email
        user.display_name = display_name
        user.avatar_url = avatar_url
        if should_be_admin:
            user.role = "admin"
    else:
        user = User(
            email=normalized_email,
            github_id=github_id,
            display_name=display_name,
            avatar_url=avatar_url,
            role="admin" if should_be_admin else "reader",
        )
        db.add(user)

    db.commit()
    db.refresh(user)
    return user


def _github_email(login: str, email: str | None) -> str:
    if email and email.strip():
        return email.strip().lower()
    return f"{login.lower()}@users.noreply.github.com"


def _is_configured_github_admin(login: str, email: str) -> bool:
    admin_logins = _split_env_values("GITHUB_ADMIN_LOGINS")
    admin_emails = _split_env_values("GITHUB_ADMIN_EMAILS")
    return login.lower() in admin_logins or email.lower() in admin_emails


def _split_env_values(name: str) -> set[str]:
    return {
        item.strip().lower()
        for item in os.getenv(name, "").split(",")
        if item.strip()
    }


def _frontend_auth_redirect(token: str | None = None, error: str | None = None) -> RedirectResponse:
    params = {"auth": "github"}
    if token:
        params["token"] = token
    if error:
        params["error"] = error
    return RedirectResponse(f"{FRONTEND_ORIGIN}/#{urlencode(params)}")


def _user_to_dict(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "displayName": user.display_name,
        "role": user.role,
        "avatarUrl": user.avatar_url,
        "githubLinked": bool(user.github_id),
    }


def _clean_tags(tags: list[str]) -> list[str]:
    seen: set[str] = set()
    cleaned_tags: list[str] = []
    for tag in tags:
        cleaned = tag.strip()
        if cleaned and cleaned not in seen:
            seen.add(cleaned)
            cleaned_tags.append(cleaned)
    return cleaned_tags


def _generate_article_id(db: Session, title: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    if not slug:
        slug = f"article-{datetime.utcnow().strftime('%Y%m%d')}"

    candidate = slug
    while db.get(Article, candidate):
        candidate = f"{slug}-{uuid4().hex[:6]}"
    return candidate
