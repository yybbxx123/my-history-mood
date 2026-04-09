import { useEffect, useMemo, useState } from "react";
import { analyze, chat, getFigures, getQuestions } from "./api.js";

const LS_KEY = "unified_assessment_result_v1";

export default function App() {
  const [page, setPage] = useState("assessment"); // assessment | story | profile
  const [phase, setPhase] = useState("home"); // home | quiz | result | chat (within assessment)

  const [questions, setQuestions] = useState([]);
  const [figures, setFigures] = useState([]);

  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  const [storyIndex, setStoryIndex] = useState(0);

  const [chatText, setChatText] = useState("");
  const [chatHistory, setChatHistory] = useState([]);

  useEffect(() => {
    Promise.all([getQuestions(), getFigures()])
      .then(([qs, fs]) => {
        setQuestions(Array.isArray(qs) ? qs : []);
        setFigures(Array.isArray(fs) ? fs : []);
      })
      .catch(() => {
        setQuestions([]);
        setFigures([]);
      });
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      setResult(parsed);
    } catch {
      // ignore
    }
  }, []);

  const currentStory = useMemo(() => {
    if (!figures.length) return null;
    return figures[Math.max(0, Math.min(storyIndex, figures.length - 1))] || null;
  }, [figures, storyIndex]);

  const resetAssessment = () => {
    setAnswers({});
    setResult(null);
    setChatHistory([]);
    setChatText("");
    setPhase("home");
    setErrorText("");
  };

  const submitAssessment = async () => {
    setLoading(true);
    setErrorText("");
    try {
      const data = await analyze(answers);
      setResult(data);
      setPhase("result");
    } catch (e) {
      setErrorText("提交失败：请检查后端是否启动、API 地址是否正确。");
    } finally {
      setLoading(false);
    }
  };

  const saveResult = () => {
    if (!result) return;
    localStorage.setItem(LS_KEY, JSON.stringify(result));
    setPage("profile");
  };

  const sendChat = async () => {
    const character = result?.matched_figure?.name;
    const msg = chatText.trim();
    if (!character || !msg) return;

    const nextHistory = [...chatHistory, { role: "user", content: msg }];
    setChatHistory(nextHistory);
    setChatText("");
    try {
      const data = await chat({ character, userMessage: msg, chatHistory: nextHistory });
      setChatHistory((prev) => [...prev, { role: "assistant", content: data.reply || "（无回复）" }]);
    } catch {
      setChatHistory((prev) => [...prev, { role: "assistant", content: "对话请求失败，请稍后重试。" }]);
    }
  };

  return (
    <div className="app">
      <main className="main-content">
        <div id="assessment" className={`page ${page === "assessment" ? "active" : ""}`}>
          {phase === "home" && (
            <div className="assessment-section">
              <div className="page-header">
                <h1>性格测评</h1>
                <p>发现你的古代人格原型（走后端 API 分析）</p>
              </div>
              <div className="content-grid">
                <div className="card">
                  <div className="card-icon">🎭</div>
                  <h3>人格测评</h3>
                  <p>通过题目分析性格，并匹配最像你的古代人物</p>
                  <button className="btn-primary" onClick={() => setPhase("quiz")}>
                    开始测评
                  </button>
                </div>
              </div>
            </div>
          )}

          {phase === "quiz" && (
            <div className="assessment-section">
              <div className="page-header">
                <h1>测评问卷</h1>
                <p>完成后将调用后端 `/api/analyze` 生成结果</p>
              </div>

              <div className="card" style={{ textAlign: "left" }}>
                {errorText && <div className="error">{errorText}</div>}
                {questions.length === 0 ? (
                  <p className="muted">题库加载失败或为空（可检查 Supabase 或后端是否正常）。</p>
                ) : (
                  questions.map((q) => (
                    <div className="question" key={q.id}>
                      <p className="q-title">{q.question}</p>
                      {q.type === "single" ? (
                        <div className="options">
                          {(q.options || []).map((opt) => (
                            <label key={opt}>
                              <input
                                type="radio"
                                name={q.id}
                                checked={answers[q.id] === opt}
                                onChange={() => setAnswers((p) => ({ ...p, [q.id]: opt }))}
                              />
                              {opt}
                            </label>
                          ))}
                        </div>
                      ) : (
                        <textarea
                          rows={4}
                          value={answers[q.id] || ""}
                          onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))}
                          placeholder="请输入你的经历..."
                        />
                      )}
                    </div>
                  ))
                )}

                <div className="row">
                  <button className="btn-secondary" onClick={() => setPhase("home")}>
                    返回
                  </button>
                  <button className="btn-primary" onClick={submitAssessment} disabled={loading}>
                    {loading ? "分析中..." : "提交并分析"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {phase === "result" && result && (
            <div className="assessment-section">
              <div className="page-header">
                <h1>测评结果</h1>
                <p>来自后端 AI 分析</p>
              </div>

              <div className="result-container">
                <div className="result-character">
                  <p>
                    <b>性格总结：</b>
                    {result.personality_summary}
                  </p>
                  <p>
                    <b>核心特质：</b>
                    {(result.core_traits || []).join("、")}
                  </p>
                  <p>
                    <b>匹配人物：</b>
                    {result.matched_figure?.name}（{result.matched_figure?.era}）
                  </p>
                  <p>
                    <b>匹配原因：</b>
                    {result.matched_figure?.reason}
                  </p>
                  <p>
                    <b>故事化解读：</b>
                    {result.story_report}
                  </p>

                  <div className="result-actions">
                    <button className="btn-primary" onClick={saveResult}>
                      保存到我的
                    </button>
                    <button className="btn-secondary" onClick={() => setPhase("chat")}>
                      与人物对话
                    </button>
                    <button className="btn-secondary" onClick={resetAssessment}>
                      重新开始
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {phase === "chat" && (
            <div className="assessment-section">
              <div className="page-header">
                <h1>与人物对话</h1>
                <p>调用后端 `/api/chat`</p>
              </div>

              <div className="card">
                <div className="chat-box">
                  {chatHistory.map((m, i) => (
                    <div key={i} className="chat-item">
                      <b>{m.role === "user" ? "你" : result?.matched_figure?.name || "人物"}：</b>
                      {m.content}
                    </div>
                  ))}
                </div>

                <div className="row">
                  <input
                    className="chat-input"
                    value={chatText}
                    onChange={(e) => setChatText(e.target.value)}
                    placeholder="输入你想问的问题..."
                  />
                  <button className="btn-primary" onClick={sendChat}>
                    发送
                  </button>
                </div>

                <div className="row">
                  <button className="btn-secondary" onClick={() => setPhase("result")}>
                    返回结果
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div id="story" className={`page ${page === "story" ? "active" : ""}`}>
          <div className="page-header">
            <h1>历史人物故事</h1>
            <p>数据来自后端 `/api/figures`（云数据库优先）</p>
          </div>

          <div className="story-container">
            <div className="story-card-wrapper">
              <div className="story-card-main" id="storyCard">
                {!currentStory ? (
                  <div className="muted">人物库为空或加载失败。</div>
                ) : (
                  <>
                    <div className="character-avatar">👤</div>
                    <div className="character-name">{currentStory.name}</div>
                    <div className="character-type">{currentStory.era}</div>
                    <div className="character-personality">
                      {(currentStory.traits || []).join(" / ")}
                    </div>
                    <div className="character-story">{currentStory.summary}</div>
                  </>
                )}
              </div>

              <div className="story-navigation">
                <button
                  className="nav-btn"
                  disabled={storyIndex <= 0}
                  onClick={() => setStoryIndex((i) => Math.max(0, i - 1))}
                >
                  ← 上一个
                </button>
                <span className="story-counter">
                  {figures.length ? `${storyIndex + 1} / ${figures.length}` : "0 / 0"}
                </span>
                <button
                  className="nav-btn"
                  disabled={storyIndex >= figures.length - 1}
                  onClick={() => setStoryIndex((i) => Math.min(figures.length - 1, i + 1))}
                >
                  下一个 →
                </button>
              </div>
            </div>
          </div>
        </div>

        <div id="profile" className={`page ${page === "profile" ? "active" : ""}`}>
          <div className="profile-header">
            <div className="wogua-message">🥒 倭瓜告诉您：</div>
            <h1>个人中心</h1>
            <p>查看你保存的测评结果</p>
          </div>

          <div className="profile-section">
            <div className="my-result">
              {result ? (
                <div className="saved-result">
                  <div className="character-name">{result.matched_figure?.name || "未知"}</div>
                  <div className="character-type">{result.matched_figure?.era || ""}</div>
                  <div className="character-personality" style={{ marginBottom: 15 }}>
                    {(result.core_traits || []).join("、")}
                  </div>
                  <div className="character-story">{result.story_report}</div>
                  <div className="row" style={{ marginTop: 12 }}>
                    <button className="btn-primary" onClick={() => setPage("assessment")}>
                      去测评
                    </button>
                    <button className="btn-secondary" onClick={() => localStorage.removeItem(LS_KEY)}>
                      清除保存
                    </button>
                  </div>
                </div>
              ) : (
                <div className="no-result">
                  <div className="empty-icon">📝</div>
                  <h3>还没有测评结果</h3>
                  <p>完成测评后，点击“保存到我的”即可在这里查看</p>
                  <button className="btn-primary" onClick={() => setPage("assessment")}>
                    去测评
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <nav className="bottom-nav">
        <div className={`nav-item ${page === "assessment" ? "active" : ""}`} onClick={() => setPage("assessment")}>
          <div className="nav-icon">📊</div>
          <span className="nav-text">测评</span>
        </div>
        <div className={`nav-item ${page === "story" ? "active" : ""}`} onClick={() => setPage("story")}>
          <div className="nav-icon">📖</div>
          <span className="nav-text">故事</span>
        </div>
        <div className={`nav-item ${page === "profile" ? "active" : ""}`} onClick={() => setPage("profile")}>
          <div className="nav-icon">👤</div>
          <span className="nav-text">我的</span>
        </div>
      </nav>
    </div>
  );
}

