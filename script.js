class LearningApp {
  constructor() {
    this.currentPage = 'assessment';
    this.currentStoryIndex = 0;
    this.currentQuestionIndex = 0;
    this.answers = [];
    this.assessmentResult = null;
    this.characterList = [];
    this.chatState = { selectedCharacter: null, conversations: {} };
    this.waitForData();
  }

  waitForData() {
    if (typeof corpus === 'undefined') {
      setTimeout(() => this.waitForData(), 100);
      return;
    }
    this.init();
  }

  init() {
    this.characterList = Object.keys(corpus.characters);
    this.bindEvents();
    this.showPage(this.currentPage);
    this.renderStoryCard();
    this.loadSavedResult();
    this.loadChatState();
    this.updateChatUI();
  }

  bindEvents() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => this.switchPage(item.dataset.page));
    });

    document.getElementById('startAssessment')?.addEventListener('click', () => this.startAssessment());
    document.getElementById('prevQuestion')?.addEventListener('click', () => this.prevQuestion());
    document.getElementById('nextQuestion')?.addEventListener('click', () => this.nextQuestion());
    document.getElementById('finishQuiz')?.addEventListener('click', () => this.finishAssessment());
    document.getElementById('saveResult')?.addEventListener('click', () => this.saveResult());
    document.getElementById('retakeQuiz')?.addEventListener('click', () => this.retakeAssessment());
    document.getElementById('prevStory')?.addEventListener('click', () => this.prevStory());
    document.getElementById('nextStory')?.addEventListener('click', () => this.nextStory());
    document.getElementById('goToAssessmentFromChat')?.addEventListener('click', () => this.navigateTo('assessment'));
    document.getElementById('sendChatBtn')?.addEventListener('click', () => this.sendChatMessage());
    document.getElementById('chatInput')?.addEventListener('keydown', event => {
      if (event.key === 'Enter') this.sendChatMessage();
    });

    document.querySelectorAll('.menu-item').forEach((item, index) => {
      item.addEventListener('click', () => {
        const menus = ['我的人格类型', '历史人物档案', '设置', '帮助中心'];
        this.showMessage(`正在打开${menus[index]}...`);
      });
    });

    this.bindGoAssessment();
  }

  bindGoAssessment() {
    document.getElementById('goToAssessment')?.addEventListener('click', () => this.navigateTo('assessment'));
  }

  switchPage(page) {
    if (page === this.currentPage) return;
    document.getElementById(this.currentPage)?.classList.remove('active');
    this.showPage(page);
    this.updateNavigation(page);
    this.currentPage = page;
    if (page === 'chat') this.updateChatUI();
  }

  showPage(page) {
    document.getElementById(page)?.classList.add('active');
  }

  updateNavigation(page) {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });
  }

  renderStoryCard() {
    const card = document.getElementById('storyCard');
    const counter = document.getElementById('storyCounter');
    if (!card || !counter || !this.characterList.length) return;

    const name = this.characterList[this.currentStoryIndex];
    const character = corpus.characters[name];
    if (!character) return;

    card.innerHTML = `
      <div class="character-avatar">${this.getCharacterAvatar(name)}</div>
      <div class="character-name">${name}</div>
      <div class="character-type">${character.type}</div>
      <div class="character-personality">${character.personality}</div>
      <div class="character-story">${character.story}</div>
    `;

    counter.textContent = `${this.currentStoryIndex + 1} / ${this.characterList.length}`;
    document.getElementById('prevStory').disabled = this.currentStoryIndex === 0;
    document.getElementById('nextStory').disabled = this.currentStoryIndex === this.characterList.length - 1;
  }

  prevStory() {
    if (this.currentStoryIndex > 0) {
      this.currentStoryIndex--;
      this.renderStoryCard();
    }
  }

  nextStory() {
    if (this.currentStoryIndex < this.characterList.length - 1) {
      this.currentStoryIndex++;
      this.renderStoryCard();
    }
  }

  startAssessment() {
    this.currentQuestionIndex = 0;
    this.answers = [];
    this.showAssessmentSection('assessmentQuiz');
    this.renderQuestion();
  }

  showAssessmentSection(id) {
    ['assessmentHome', 'assessmentQuiz', 'assessmentResult'].forEach(sectionId => {
      const el = document.getElementById(sectionId);
      if (el) el.style.display = sectionId === id ? 'block' : 'none';
    });
  }

  renderQuestion() {
    const question = corpus.questions[this.currentQuestionIndex];
    if (!question) return;

    document.getElementById('questionText').textContent = question.question;
    document.getElementById('questionCounter').textContent = `${this.currentQuestionIndex + 1} / ${corpus.questions.length}`;
    document.getElementById('progressFill').style.width = `${((this.currentQuestionIndex + 1) / corpus.questions.length) * 100}%`;

    const box = document.getElementById('optionsContainer');
    box.innerHTML = '';
    question.options.forEach((option, index) => {
      const el = document.createElement('div');
      el.className = 'option-item';
      el.textContent = option.text;
      el.addEventListener('click', () => this.selectOption(index, option.type));
      box.appendChild(el);
    });

    const answer = this.answers[this.currentQuestionIndex];
    if (answer) box.children[answer.optionIndex]?.classList.add('selected');
    this.updateQuizNavigation();
  }

  selectOption(optionIndex, type) {
    this.answers[this.currentQuestionIndex] = { questionId: this.currentQuestionIndex, optionIndex, type };
    document.querySelectorAll('.option-item').forEach((item, index) => {
      item.classList.toggle('selected', index === optionIndex);
    });
    this.updateQuizNavigation();
  }

  updateQuizNavigation() {
    const hasAnswer = this.answers[this.currentQuestionIndex];
    const isLast = this.currentQuestionIndex === corpus.questions.length - 1;
    document.getElementById('prevQuestion').style.display = this.currentQuestionIndex > 0 ? 'block' : 'none';
    document.getElementById('nextQuestion').style.display = hasAnswer && !isLast ? 'block' : 'none';
    document.getElementById('finishQuiz').style.display = hasAnswer && isLast ? 'block' : 'none';
  }

  prevQuestion() {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
      this.renderQuestion();
    }
  }

  nextQuestion() {
    if (this.currentQuestionIndex < corpus.questions.length - 1) {
      this.currentQuestionIndex++;
      this.renderQuestion();
    }
  }

  finishAssessment() {
    const typeCount = {};
    this.answers.forEach(answer => {
      typeCount[answer.type] = (typeCount[answer.type] || 0) + 1;
    });

    let resultType = '';
    let max = 0;
    Object.entries(typeCount).forEach(([type, count]) => {
      if (count > max) {
        max = count;
        resultType = type;
      }
    });

    this.assessmentResult = { type: resultType, characters: corpus.typeMapping[resultType] || [], typeCount };
    this.initializeChatSelection();
    this.showResult();
    this.updateChatUI();
  }

  showResult() {
    const box = document.getElementById('resultContainer');
    this.showAssessmentSection('assessmentResult');
    if (!box || !this.assessmentResult) return;

    box.innerHTML = `
      <div class="result-character">
        <h2>你的人格类型</h2>
        <h3 style="color:#667eea;margin:15px 0;">${this.assessmentResult.type}</h3>
        <p style="margin-bottom:20px;">请选择一位与你相似的历史人物进行聊天：</p>
        ${this.assessmentResult.characters.map(name => {
          const c = corpus.characters[name];
          if (!c) return '';
          return `
            <div class="result-person-card">
              <div class="result-person-header">
                <span class="result-person-avatar">${this.getCharacterAvatar(name)}</span>
                <div>
                  <h4>${name}</h4>
                  <p>${c.personality}</p>
                </div>
              </div>
              <div class="character-story">${c.story}</div>
              <button class="btn-primary result-chat-btn" data-character="${name}">与${name}对话</button>
            </div>
          `;
        }).join('')}
      </div>
    `;

    box.querySelectorAll('.result-chat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectChatCharacter(btn.dataset.character);
        this.navigateTo('chat');
      });
    });
  }

  saveResult() {
    if (!this.assessmentResult) return;
    localStorage.setItem('assessmentResult', JSON.stringify(this.assessmentResult));
    this.saveChatState();
    this.showMessage('结果已保存到“我的”页面！');
    this.updateProfileResult();
  }

  retakeAssessment() {
    this.startAssessment();
  }

  loadSavedResult() {
    const saved = localStorage.getItem('assessmentResult');
    if (saved) {
      try {
        this.assessmentResult = JSON.parse(saved);
      } catch (e) {}
    }
    this.updateProfileResult();
  }

  updateProfileResult() {
    const box = document.getElementById('myResult');
    if (!box) return;

    const main = this.assessmentResult?.characters?.[0];
    const c = main ? corpus.characters[main] : null;
    if (c) {
      box.innerHTML = `
        <div class="saved-result">
          <div class="character-name">${main}</div>
          <div class="character-type">${this.assessmentResult.type}</div>
          <div class="character-personality" style="margin-bottom:15px;">${c.personality}</div>
          <div class="character-story">${c.story}</div>
        </div>
      `;
      return;
    }

    box.innerHTML = `
      <div class="no-result">
        <div class="empty-icon">📝</div>
        <h3>还没有测评结果</h3>
        <p>完成性格测评后，结果会保存在这里</p>
        <button class="btn-primary" id="goToAssessment">去测评</button>
      </div>
    `;
    this.bindGoAssessment();
  }

  loadChatState() {
    const saved = localStorage.getItem('chatState');
    if (saved) {
      try {
        this.chatState = JSON.parse(saved);
      } catch (e) {}
    }
  }

  saveChatState() {
    localStorage.setItem('chatState', JSON.stringify(this.chatState));
  }

  initializeChatSelection() {
    const list = this.assessmentResult?.characters || [];
    if (!list.includes(this.chatState.selectedCharacter)) {
      this.chatState.selectedCharacter = list[0] || null;
    }
    list.forEach(name => {
      if (!this.chatState.conversations[name]) {
        this.chatState.conversations[name] = [{ role: 'character', text: this.getCharacterOpening(name) }];
      }
    });
    this.saveChatState();
  }

  selectChatCharacter(name) {
    if (!this.assessmentResult?.characters?.includes(name)) return;
    this.chatState.selectedCharacter = name;
    if (!this.chatState.conversations[name]) {
      this.chatState.conversations[name] = [{ role: 'character', text: this.getCharacterOpening(name) }];
    }
    this.saveChatState();
    this.updateChatUI();
  }

  getSelectedCharacter() {
    const name = this.chatState.selectedCharacter;
    const c = name ? corpus.characters[name] : null;
    return c ? { name, ...c } : null;
  }

  updateChatUI() {
    const guide = document.getElementById('chatGuide');
    const content = document.getElementById('chatContent');
    const selector = document.getElementById('chatSelector');
    const card = document.getElementById('chatCharacterCard');
    const input = document.getElementById('chatInput');
    if (!guide || !content || !selector || !card || !input) return;

    if (!this.assessmentResult?.characters?.length) {
      guide.style.display = 'block';
      content.style.display = 'none';
      return;
    }

    this.initializeChatSelection();
    const selected = this.getSelectedCharacter();
    if (!selected) return;

    guide.style.display = 'none';
    content.style.display = 'block';
    selector.innerHTML = `<div class="chat-selector-title">选择聊天人物</div><div class="chat-selector-list">${this.assessmentResult.characters.map(name => `<button class="chat-selector-btn ${name === selected.name ? 'active' : ''}" data-character="${name}"><span>${this.getCharacterAvatar(name)}</span>${name}</button>`).join('')}</div>`;
    selector.querySelectorAll('.chat-selector-btn').forEach(btn => {
      btn.addEventListener('click', () => this.selectChatCharacter(btn.dataset.character));
    });
    card.innerHTML = `<div class="chat-character-avatar">${this.getCharacterAvatar(selected.name)}</div><div class="chat-character-info"><h3>${selected.name}</h3><p>${selected.type}</p><span>${selected.personality}</span></div>`;
    input.placeholder = `和${selected.name}聊聊你的想法...`;
    this.renderChatMessages();
  }

  renderChatMessages() {
    const box = document.getElementById('chatMessages');
    const selected = this.getSelectedCharacter();
    if (!box || !selected) return;

    const msgs = this.chatState.conversations[selected.name] || [];
    box.innerHTML = msgs.map(m => `<div class="chat-message ${m.role === 'user' ? 'user' : 'character'}"><div class="chat-bubble"><div class="chat-speaker">${m.role === 'user' ? '我' : selected.name}</div><p>${m.text}</p></div></div>`).join('');
    box.scrollTop = box.scrollHeight;
  }

  sendChatMessage() {
    const input = document.getElementById('chatInput');
    const selected = this.getSelectedCharacter();
    if (!input || !selected) return this.showMessage('请先完成测评并选择人物');

    const text = input.value.trim();
    if (!text) return;

    const msgs = this.chatState.conversations[selected.name] || [];
    msgs.push({ role: 'user', text });
    msgs.push({ role: 'character', text: this.generateCharacterReply(selected.name, text, msgs) });
    this.chatState.conversations[selected.name] = msgs;
    this.saveChatState();
    input.value = '';
    this.renderChatMessages();
  }

  getCharacterOpening(name) {
    const map = {
      '诸葛亮': '我是诸葛亮。局势再乱，也总能理出线头。你可以慢慢说，我陪你一起分析。',
      '李白': '我是李白。若心中有闷意，不妨说与我听，天地很大，你不必急着把自己困住。',
      '苏轼': '我是苏轼。人生风雨常有，但也总有月色与你相伴。你想说什么，我都听着。',
      '岳飞': '我是岳飞。人心若定，再难的路也能走下去。你可以把眼前的烦恼告诉我。',
      '武则天': '我是武则天。迷惘时先别急着否定自己，把问题说清楚，我们一起找回主动。'
    };
    return map[name] || `我是${name}。你可以把最近的想法、压力或困惑告诉我，我会认真听你说。`;
  }

  generateCharacterReply(name, userText, msgs) {
    const recent = msgs.filter(x => x.role === 'user').slice(-3).map(x => x.text).join('；');
    const text = userText.toLowerCase();
    if (name === '诸葛亮') {
      if (text.includes('压力') || text.includes('焦虑') || text.includes('迷茫')) return '你先别急着和所有问题同时交手。先分清轻重缓急，稳住最核心的一件事，心自然会慢慢定下来。';
      if (text.includes('学习') || text.includes('考试') || text.includes('成长')) return '求进不必躁进。你先看清自己的薄弱处，再一步一步补齐，比盲目用力更有效。';
      return `你提到“${userText}”，再看你前面说的“${recent}”，我更在意的是你真正想守住什么。想明白这一点，路会清楚很多。`;
    }
    if (name === '李白') {
      if (text.includes('难过') || text.includes('孤独') || text.includes('失眠')) return '人有低潮时，不必强迫自己立刻明朗。先允许情绪流动，再慢慢找回那口属于你的心气。';
      if (text.includes('梦想') || text.includes('未来') || text.includes('目标')) return '别急着让未来立刻给你答案。你只要先护住热爱，很多路会在你往前走的时候自己显出来。';
      return `你说的“${userText}”，我听见了。你不必把自己活成标准答案，能真诚面对内心，本身就是一种勇敢。`;
    }
    if (name === '苏轼') {
      if (text.includes('失败') || text.includes('挫折') || text.includes('失去')) return '一时失意，并不等于此后都无光亮。先让自己稳一稳，日子总能从裂缝里长出新的转机。';
      if (text.includes('关系') || text.includes('朋友') || text.includes('家人')) return '人与人之间，最难得的是理解。你不妨先照顾好自己的感受，再试着温和表达，很多结会松开。';
      return `关于“${userText}”，我想对你说，不必急着和生活分胜负。你先把今天过稳，明天自然会多一点从容。`;
    }
    if (name === '岳飞') {
      if (text.includes('坚持') || text.includes('放弃')) return '若这件事仍值得你珍惜，就别轻言退后。真正的力量，不是永不疲惫，而是疲惫时仍记得初心。';
      if (text.includes('责任') || text.includes('家庭') || text.includes('担当')) return '你会被这些问题压住，恰恰说明你很在意。先别只责怪自己，稳稳站住，再把责任一件件扛起来。';
      return `你说到“${userText}”，我能感到你心里并不轻松。别怕慢，只要方向不丢，脚下这一步就有意义。`;
    }
    if (name === '武则天') {
      if (text.includes('选择') || text.includes('决定')) return '你现在最需要的，不是完美答案，而是先做出一个清醒选择。犹豫太久，只会把主动权交出去。';
      if (text.includes('自卑') || text.includes('不自信')) return '别急着把自己放在低处。你先看见自己的能力，再谈外界如何评价你，位置很多时候是自己站出来的。';
      return `你提到“${userText}”，我想提醒你：先把情绪放稳，再把局面看清。你不是没有力量，只是还没把力量重新收回来。`;
    }
    if (text.includes('压力') || text.includes('迷茫')) return `${name}想对你说：先别逼自己马上解决一切，给自己一点呼吸，再慢慢整理。`;
    return `${name}听见你的话了。你可以继续往下说，我会陪你把这件事想清楚。`;
  }

  getCharacterAvatar(name) {
    const map = { '秦始皇':'👑','汉高祖刘邦':'🏛️','武则天':'👸','成吉思汗':'🏹','孙武':'📋','项羽':'💪','诸葛亮':'🧠','岳飞':'🛡️','孔子':'📚','老子':'🌊','庄子':'🦋','李白':'🍷','杜甫':'📝','苏轼':'🌙','屈原':'🌊','司马迁':'✍️','花木兰':'🗡️' };
    return map[name] || '👤';
  }

  showMessage(message) {
    const el = document.createElement('div');
    el.className = 'message-toast';
    el.textContent = message;
    el.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,.8);color:#fff;padding:12px 24px;border-radius:25px;font-size:14px;z-index:1000;animation:fadeInOut 2s ease-in-out;';
    if (!document.getElementById('messageStyle')) {
      const style = document.createElement('style');
      style.id = 'messageStyle';
      style.textContent = '@keyframes fadeInOut{0%{opacity:0;transform:translate(-50%,-50%) scale(.8)}20%,80%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-50%) scale(.8)}}';
      document.head.appendChild(style);
    }
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2000);
  }

  navigateTo(page) {
    if (['assessment','story','chat','profile'].includes(page)) this.switchPage(page);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new LearningApp();
  window.learningApp = window.app;
});
