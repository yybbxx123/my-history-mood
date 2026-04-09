import { useEffect, useState } from "react";

const API_BASE = "http://127.0.0.1:8000/api";

export default function App() {
  const [step, setStep] = useState("home");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [chatText, setChatText] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/questions`)
      .then((r) => r.json())
      .then(setQuestions)
      .catch(() => setQuestions([]));
  }, []);

  const submit = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      setResult(await res.json());
      setStep("result");
    } finally {
      setLoading(false);
    }
  };

  const send = async () => {
    if (!chatText.trim() || !result?.matched_figure?.name) return;
    const msg = chatText.trim();
    const nextHistory = [...chatHistory, { role: "user", content: msg }];
    setChatHistory(nextHistory);
    setChatText("");
    const res = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        character: result.matched_figure.name,
        user_message: msg,
        chat_history: nextHistory,
      }),
    });
    const data = await res.json();
    setChatHistory((prev) => [...prev, { role: "assistant", content: data.reply }]);
  };

  return (
    <div className="container">
      <h1>AI心理测评 × 古代人物匹配系统</h1>
      {step === "home" && (
        <section className="card">
          <p>通过 10 道题分析性格，并匹配中国古代人物。</p>
          <button onClick={() => setStep("quiz")}>开始测评</button>
        </section>
      )}
      {step === "quiz" && (
        <section className="card">
          <h2>问卷页</h2>
          {questions.map((q) => (
            <div className="question" key={q.id}>
              <p>{q.question}</p>
              {q.type === "single" ? (
                <div className="options">
                  {q.options.map((opt) => (
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
                />
              )}
            </div>
          ))}
          <div className="row">
            <button className="secondary" onClick={() => setStep("home")}>返回</button>
            <button onClick={submit} disabled={loading}>{loading ? "分析中..." : "提交"}</button>
          </div>
        </section>
      )}
      {step === "result" && result && (
        <section className="card">
          <h2>结果页</h2>
          <p><b>性格总结：</b>{result.personality_summary}</p>
          <p><b>核心特质：</b>{(result.core_traits || []).join("、")}</p>
          <p><b>匹配人物：</b>{result.matched_figure?.name}（{result.matched_figure?.era}）</p>
          <p><b>匹配原因：</b>{result.matched_figure?.reason}</p>
          <p><b>故事化解读：</b>{result.story_report}</p>
          <div className="row">
            <button className="secondary" onClick={() => setStep("quiz")}>重测</button>
            <button onClick={() => setStep("chat")}>去聊天</button>
          </div>
        </section>
      )}
      {step === "chat" && (
        <section className="card">
          <h2>聊天页（{result?.matched_figure?.name}）</h2>
          <div className="chat-box">
            {chatHistory.map((m, i) => (
              <div key={i} className="chat-item"><b>{m.role === "user" ? "你" : "人物"}：</b>{m.content}</div>
            ))}
          </div>
          <div className="row">
            <input value={chatText} onChange={(e) => setChatText(e.target.value)} placeholder="输入问题..." />
            <button onClick={send}>发送</button>
          </div>
          <button className="secondary" onClick={() => setStep("result")}>返回结果</button>
        </section>
      )}
    </div>
  );
}
import { useEffect, useState } from "react";

const API_BASE = "http://127.0.0.1:8000/api";

const defaultAnswers = {};

function App() {
  const [step, setStep] = useState("home");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState(defaultAnswers);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chatText, setChatText] = useState("");
  const [chatHistory, setChatHistory] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/questions`)
      .then((res) => res.json())
      .then((data) => setQuestions(data))
      .catch(() => setQuestions([]));
  }, []);

  const updateAnswer = (id, value) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const submitAssessment = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      setResult(data);
      setStep("result");
    } catch (error) {
      alert("提交失败，请检查后端是否启动。");
    } finally {
      setLoading(false);
    }
  };

  const sendChat = async () => {
    if (!chatText.trim() || !result?.matched_figure?.name) return;
    const userMsg = { role: "user", content: chatText };
    const newHistory = [...chatHistory, userMsg];
    setChatHistory(newHistory);
    setChatText("");

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          character: result.matched_figure.name,
          user_message: chatText,
          chat_history: newHistory,
        }),
      });
      const data = await res.json();
      setChatHistory((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (error) {
      setChatHistory((prev) => [...prev, { role: "assistant", content: "对话请求失败，请稍后重试。" }]);
    }
  };

  return (
    <div className="container">
      <h1>AI心理测评 × 古代人物匹配系统</h1>

      {step === "home" && (
        <section className="card">
          <p>通过 10 道题分析性格，并匹配最像你的中国古代人物。</p>
          <button onClick={() => setStep("quiz")}>开始测评</button>
        </section>
      )}

      {step === "quiz" && (
        <section className="card">
          <h2>问卷页</h2>
          {questions.map((q) => (
            <div key={q.id} className="question">
              <p>{q.question}</p>
              {q.type === "single" ? (
                <div className="options">
                  {q.options.map((opt) => (
                    <label key={opt}>
                      <input
                        type="radio"
                        name={q.id}
                        value={opt}
                        checked={answers[q.id] === opt}
                        onChange={() => updateAnswer(q.id, opt)}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              ) : (
                <textarea
                  rows={4}
                  value={answers[q.id] || ""}
                  onChange={(e) => updateAnswer(q.id, e.target.value)}
                  placeholder="请输入你的经历..."
                />
              )}
            </div>
          ))}
          <div className="row">
            <button onClick={() => setStep("home")}>返回首页</button>
            <button onClick={submitAssessment} disabled={loading}>
              {loading ? "分析中..." : "提交并分析"}
            </button>
          </div>
        </section>
      )}

      {step === "result" && result && (
        <section className="card">
          <h2>结果页</h2>
          <p>
            <strong>性格总结：</strong>
            {result.personality_summary}
          </p>
          <p>
            <strong>核心特质：</strong>
            {(result.core_traits || []).join("、")}
          </p>
          <p>
            <strong>匹配人物：</strong>
            {result.matched_figure?.name}（{result.matched_figure?.era}）
          </p>
          <p>
            <strong>匹配原因：</strong>
            {result.matched_figure?.reason}
          </p>
          <p>
            <strong>故事化解读：</strong>
            {result.story_report}
          </p>
          <div className="row">
            <button onClick={() => setStep("quiz")}>重新测评</button>
            <button onClick={() => setStep("chat")}>与人物对话</button>
          </div>
        </section>
      )}

      {step === "chat" && (
        <section className="card">
          <h2>聊天页（{result?.matched_figure?.name || "历史人物"}）</h2>
          <div className="chat-box">
            {chatHistory.map((m, i) => (
              <div key={i} className={`chat-item ${m.role}`}>
                <b>{m.role === "user" ? "你" : "人物"}：</b>
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
            <button onClick={sendChat}>发送</button>
          </div>
          <button onClick={() => setStep("result")}>返回结果页</button>
        </section>
      )}
    </div>
  );
}

export default App;
