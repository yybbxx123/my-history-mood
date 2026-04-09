class LearningApp {
    constructor() {
        this.currentPage = 'assessment';
        this.currentStoryIndex = 0;
        this.currentQuestionIndex = 0;
        this.answers = [];
        this.assessmentResult = null;
        this.characterList = [];
        
        // 等待数据加载后初始化
        this.waitForData();
    }
    
    waitForData() {
        if (typeof corpus === 'undefined') {
            console.log('等待语料库加载...');
            setTimeout(() => this.waitForData(), 100);
            return;
        }
        
        console.log('语料库加载成功！');
        this.init();
    }
    
    init() {
        this.characterList = Object.keys(corpus.characters);
        console.log('人物列表长度:', this.characterList.length);
        
        this.bindEvents();
        this.showPage(this.currentPage);
        this.initStoryModule();
        this.loadSavedResult();
        
        console.log('应用初始化完成');
    }
    
    bindEvents() {
        // 底部导航点击事件
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                this.switchPage(page);
            });
        });
        
        // 测评模块按钮事件
        this.bindAssessmentEvents();
        
        // 故事模块按钮事件
        this.bindStoryEvents();
        
        // 个人中心菜单事件
        this.bindProfileEvents();
    }
    
    switchPage(page) {
        if (page === this.currentPage) return;
        
        // 隐藏当前页面
        const currentPageEl = document.getElementById(this.currentPage);
        if (currentPageEl) {
            currentPageEl.classList.remove('active');
        }
        
        // 显示新页面
        this.showPage(page);
        
        // 更新导航状态
        this.updateNavigation(page);
        
        this.currentPage = page;
    }
    
    showPage(page) {
        const pageEl = document.getElementById(page);
        if (pageEl) {
            pageEl.classList.add('active');
        }
    }
    
    updateNavigation(page) {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === page) {
                item.classList.add('active');
            }
        });
    }
    
    bindAssessmentEvents() {
        // 开始测评按钮
        const startBtn = document.getElementById('startAssessment');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                console.log('开始测评按钮被点击');
                this.startAssessment();
            });
        }
        
        // 其他测评相关按钮
        const prevBtn = document.getElementById('prevQuestion');
        const nextBtn = document.getElementById('nextQuestion');
        const finishBtn = document.getElementById('finishQuiz');
        const saveBtn = document.getElementById('saveResult');
        const retakeBtn = document.getElementById('retakeQuiz');
        
        if (prevBtn) prevBtn.addEventListener('click', () => this.prevQuestion());
        if (nextBtn) nextBtn.addEventListener('click', () => this.nextQuestion());
        if (finishBtn) finishBtn.addEventListener('click', () => this.finishAssessment());
        if (saveBtn) saveBtn.addEventListener('click', () => this.saveResult());
        if (retakeBtn) retakeBtn.addEventListener('click', () => this.retakeAssessment());
    }
    
    bindStoryEvents() {
        const prevBtn = document.getElementById('prevStory');
        const nextBtn = document.getElementById('nextStory');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.prevStory());
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextStory());
        }
    }
    
    bindProfileEvents() {
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach((item, index) => {
            item.addEventListener('click', () => {
                const menus = ['我的人格类型', '历史人物档案', '设置', '帮助中心'];
                this.showMessage(`正在打开${menus[index]}...`);
            });
        });
    }
    
    // 故事模块功能
    initStoryModule() {
        this.renderStoryCard();
    }
    
    renderStoryCard() {
        const storyCard = document.getElementById('storyCard');
        const storyCounter = document.getElementById('storyCounter');
        
        if (!storyCard || !storyCounter) {
            console.log('故事元素未找到');
            return;
        }
        
        if (this.characterList.length === 0) {
            console.log('人物列表为空');
            return;
        }
        
        const characterName = this.characterList[this.currentStoryIndex];
        const character = corpus.characters[characterName];
        
        if (!character) {
            console.log('人物未找到:', characterName);
            return;
        }
        
        // 人物对应的emoji
        const avatarMap = {
            '秦始皇': '👑', '汉高祖刘邦': '🏛️', '武则天': '👸', '成吉思汗': '🏹',
            '孙武': '📋', '项羽': '💪', '诸葛亮': '🧠', '岳飞': '🛡️',
            '孔子': '📚', '老子': '🌊', '庄子': '🦋', '李白': '🍷',
            '杜甫': '📝', '苏轼': '🌙', '屈原': '🌊', '司马迁': '✍️',
            '花木兰': '🛡️'
        };
        
        storyCard.innerHTML = `
            <div class="character-avatar">${avatarMap[characterName] || '👤'}</div>
            <div class="character-name">${characterName}</div>
            <div class="character-type">${character.type}</div>
            <div class="character-personality">${character.personality}</div>
            <div class="character-story">${character.story}</div>
        `;
        
        storyCounter.textContent = `${this.currentStoryIndex + 1} / ${this.characterList.length}`;
        
        // 更新导航按钮状态
        const prevBtn = document.getElementById('prevStory');
        const nextBtn = document.getElementById('nextStory');
        
        if (prevBtn) prevBtn.disabled = this.currentStoryIndex === 0;
        if (nextBtn) nextBtn.disabled = this.currentStoryIndex === this.characterList.length - 1;
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
    
    // 测评模块功能
    startAssessment() {
        console.log('启动测评功能');
        this.currentQuestionIndex = 0;
        this.answers = [];
        this.showAssessmentSection('assessmentQuiz');
        this.renderQuestion();
    }
    
    showAssessmentSection(sectionId) {
        const sections = ['assessmentHome', 'assessmentQuiz', 'assessmentResult'];
        sections.forEach(id => {
            const section = document.getElementById(id);
            if (section) {
                section.style.display = id === sectionId ? 'block' : 'none';
            }
        });
    }
    
    renderQuestion() {
        const question = corpus.questions[this.currentQuestionIndex];
        if (!question) {
            console.log('题目未找到:', this.currentQuestionIndex);
            return;
        }
        
        console.log('渲染题目:', question.question);
        
        const questionText = document.getElementById('questionText');
        const optionsContainer = document.getElementById('optionsContainer');
        const questionCounter = document.getElementById('questionCounter');
        const progressFill = document.getElementById('progressFill');
        
        if (questionText) questionText.textContent = question.question;
        if (questionCounter) questionCounter.textContent = `${this.currentQuestionIndex + 1} / ${corpus.questions.length}`;
        if (progressFill) {
            const progress = ((this.currentQuestionIndex + 1) / corpus.questions.length) * 100;
            progressFill.style.width = `${progress}%`;
        }
        
        if (optionsContainer) {
            optionsContainer.innerHTML = '';
            question.options.forEach((option, index) => {
                const optionEl = document.createElement('div');
                optionEl.className = 'option-item';
                optionEl.textContent = option.text;
                optionEl.addEventListener('click', () => {
                    this.selectOption(index, option.type);
                });
                optionsContainer.appendChild(optionEl);
            });
        }
        
        this.updateQuizNavigation();
    }
    
    selectOption(optionIndex, optionType) {
        console.log('选择选项:', optionIndex, optionType);
        
        // 更新答案
        this.answers[this.currentQuestionIndex] = {
            questionId: this.currentQuestionIndex,
            optionIndex: optionIndex,
            type: optionType
        };
        
        // 更新UI
        const options = document.querySelectorAll('.option-item');
        options.forEach((option, index) => {
            option.classList.toggle('selected', index === optionIndex);
        });
        
        this.updateQuizNavigation();
    }
    
    updateQuizNavigation() {
        const prevBtn = document.getElementById('prevQuestion');
        const nextBtn = document.getElementById('nextQuestion');
        const finishBtn = document.getElementById('finishQuiz');
        
        const hasAnswer = this.answers[this.currentQuestionIndex];
        const isLastQuestion = this.currentQuestionIndex === corpus.questions.length - 1;
        
        if (prevBtn) {
            prevBtn.style.display = this.currentQuestionIndex > 0 ? 'block' : 'none';
        }
        
        if (nextBtn) {
            nextBtn.style.display = hasAnswer && !isLastQuestion ? 'block' : 'none';
        }
        
        if (finishBtn) {
            finishBtn.style.display = hasAnswer && isLastQuestion ? 'block' : 'none';
        }
    }
    
    prevQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.renderQuestion();
            
            // 恢复之前的选择
            const prevAnswer = this.answers[this.currentQuestionIndex];
            if (prevAnswer) {
                const options = document.querySelectorAll('.option-item');
                if (options[prevAnswer.optionIndex]) {
                    options[prevAnswer.optionIndex].classList.add('selected');
                }
            }
        }
    }
    
    nextQuestion() {
        if (this.currentQuestionIndex < corpus.questions.length - 1) {
            this.currentQuestionIndex++;
            this.renderQuestion();
        }
    }
    
    finishAssessment() {
        console.log('完成测评，计算结果...');
        
        // 计算结果
        const typeCount = {};
        this.answers.forEach(answer => {
            const type = answer.type;
            typeCount[type] = (typeCount[type] || 0) + 1;
        });
        
        console.log('类型统计:', typeCount);
        
        // 找出最多的类型
        let maxCount = 0;
        let resultType = '';
        for (const [type, count] of Object.entries(typeCount)) {
            if (count > maxCount) {
                maxCount = count;
                resultType = type;
            }
        }
        
        console.log('结果类型:', resultType);
        
        // 获取对应的人物
        const characters = corpus.typeMapping[resultType] || [];
        this.assessmentResult = {
            type: resultType,
            characters: characters,
            typeCount: typeCount
        };
        
        this.showResult();
    }
    
    showResult() {
        this.showAssessmentSection('assessmentResult');
        
        const resultContainer = document.getElementById('resultContainer');
        if (!resultContainer || !this.assessmentResult) return;
        
        const { type, characters } = this.assessmentResult;
        
        resultContainer.innerHTML = `
            <div class="result-character">
                <h2>你的人格类型</h2>
                <h3 style="color: #667eea; margin: 15px 0;">${type}</h3>
                <p style="margin-bottom: 20px;">与你相似的历史人物：</p>
                ${characters.map(name => {
                    const character = corpus.characters[name];
                    if (!character) return '';
                    return `
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 12px; margin-bottom: 15px; text-align: left;">
                            <h4 style="color: #2c3e50; margin-bottom: 8px;">${name}</h4>
                            <p style="color: #7f8c8d; font-size: 14px; margin-bottom: 8px;">${character.personality}</p>
                            <p style="color: #495057; font-size: 14px; line-height: 1.4;">${character.story}</p>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }
    
    saveResult() {
        if (this.assessmentResult) {
            localStorage.setItem('assessmentResult', JSON.stringify(this.assessmentResult));
            this.showMessage('结果已保存到"我的"页面！');
            this.updateProfileResult();
        }
    }
    
    retakeAssessment() {
        this.startAssessment();
    }
    
    // 个人中心功能
    loadSavedResult() {
        const saved = localStorage.getItem('assessmentResult');
        if (saved) {
            try {
                this.assessmentResult = JSON.parse(saved);
                this.updateProfileResult();
            } catch (e) {
                console.log('加载保存的结果失败:', e);
            }
        }
    }
    
    updateProfileResult() {
        const myResult = document.getElementById('myResult');
        if (!myResult) return;
        
        if (this.assessmentResult) {
            const { type, characters } = this.assessmentResult;
            const mainCharacter = characters[0];
            const character = corpus.characters[mainCharacter];
            
            if (character) {
                myResult.innerHTML = `
                    <div class="saved-result">
                        <div class="character-name">${mainCharacter}</div>
                        <div class="character-type">${type}</div>
                        <div class="character-personality" style="margin-bottom: 15px;">${character.personality}</div>
                        <div class="character-story">${character.story}</div>
                    </div>
                `;
            }
        } else {
            myResult.innerHTML = `
                <div class="no-result">
                    <div class="empty-icon">📝</div>
                    <h3>还没有测评结果</h3>
                    <p>完成性格测评后，结果会保存在这里</p>
                    <button class="btn-primary" id="goToAssessment">去测评</button>
                </div>
            `;
            
            // 重新绑定按钮事件
            setTimeout(() => {
                const goBtn = document.getElementById('goToAssessment');
                if (goBtn) {
                    goBtn.addEventListener('click', () => {
                        this.navigateTo('assessment');
                    });
                }
            }, 100);
        }
    }
    
    showMessage(message) {
        console.log('显示消息:', message);
        
        // 创建消息提示
        const messageEl = document.createElement('div');
        messageEl.className = 'message-toast';
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 12px 24px;
            border-radius: 25px;
            font-size: 14px;
            z-index: 1000;
            animation: fadeInOut 2s ease-in-out;
        `;
        
        // 添加动画样式
        if (!document.getElementById('messageStyle')) {
            const style = document.createElement('style');
            style.id = 'messageStyle';
            style.textContent = `
                @keyframes fadeInOut {
                    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                    20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(messageEl);
        
        // 2秒后移除消息
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 2000);
    }
    
    // 程序化切换页面（供外部调用）
    navigateTo(page) {
        if (['assessment', 'story', 'profile'].includes(page)) {
            this.switchPage(page);
        }
    }
}

// 等待DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM加载完成，开始初始化应用...');
    window.app = new LearningApp();
    window.learningApp = window.app;
});

// 如果DOM已经加载完成，直接初始化
if (document.readyState !== 'loading') {
    console.log('DOM已加载，直接初始化应用...');
    window.app = new LearningApp();
    window.learningApp = window.app;
}