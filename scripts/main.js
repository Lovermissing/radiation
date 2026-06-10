/* ==================== DOM ELEMENTS ==================== */
const qianCharacter = document.getElementById('qianCharacter');
const aiBubble = document.getElementById('aiBubble');
const aiMessage = document.getElementById('aiMessage');

const moduleBtns = document.querySelectorAll('.module-btn');
const modal = document.getElementById('moduleModal');
const modalTitle = document.getElementById('modalTitle');
const modalContent = document.getElementById('modalContent');
const closeModalBtn = document.getElementById('closeModal');

const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');

const nextLabBtn = document.getElementById('nextLabBtn');

/* ==================== STATE ==================== */
let currentModule = '';

/* ==================== WELCOME MESSAGE ==================== */
window.addEventListener('load', async () => {
    try {
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'welcome' })
        });
        const data = await res.json();
        if (data.success) {
            aiMessage.textContent = data.content;
        }
    } catch (err) {
        aiMessage.textContent =
            "Welcome to the Synchrotron Radiation Laboratory! I'm Dr. Qian Xuesen. Think of this place as a super microscope that can see atoms!";
    }

    setTimeout(() => {
        aiBubble.style.opacity = '1';
        aiBubble.style.transform = 'translateY(0) scale(1)';
    }, 1000);
});

/* ==================== MODULE OPEN ==================== */
moduleBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
        currentModule = btn.dataset.module;
        const title = btn.querySelector('h3').textContent;

        modalTitle.textContent = title;
        modalContent.innerHTML = '<p style="opacity:0.8;">Loading introduction...</p>';
        modal.style.display = 'flex';

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'introduction',
                    module: currentModule
                })
            });

            const data = await res.json();
            modalContent.innerHTML = `<p>${data.content.replace(/\n/g, '</p><p>')}</p>`;
        } catch (err) {
            modalContent.innerHTML = `
                <p>As Dr. Qian Xuesen, I'd say this lab is like a <strong>super microscope</strong>.</p>
                <p>It helps us see atoms, develop new medicines, and protect cultural relics.</p>
            `;
        }

        chatMessages.innerHTML = `
            <div class="message ai">
                <p>Welcome! I'm Dr. Qian Xuesen. Ask me anything about ${title}!</p>
                <div class="message-time">Just now</div>
            </div>
        `;
    });
});

/* ==================== MODULE CLOSE ==================== */
closeModalBtn.addEventListener('click', () => {
    modal.style.display = 'none';
});

/* ==================== SEND QUESTION ==================== */
function sendMessage() {
    const msg = userInput.value.trim();
    if (!msg) return;

    appendMessage('user', msg);
    userInput.value = '';
    userInput.disabled = true;
    sendBtn.disabled = true;

    appendMessage('ai', 'Dr. Qian is thinking...');

    fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type: 'question',
            module: currentModule,
            message: msg
        })
    })
    .then(res => res.json())
    .then(data => {
        removeLastAiMessage();
        appendMessage('ai', data.content || "Let's keep exploring synchrotron science together!");
    })
    .catch(err => {
        removeLastAiMessage();
        appendMessage('ai',
            "Even the brightest light meets a shadow sometimes. Let's try asking that differently!"
        );
    })
    .finally(() => {
        userInput.disabled = false;
        sendBtn.disabled = false;
        userInput.focus();
    });
}

sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') sendMessage();
});

/* ==================== CHAT HELPERS ==================== */
function appendMessage(sender, text) {
    const div = document.createElement('div');
    div.className = `message ${sender}`;
    div.innerHTML = `<p>${text.replace(/\n/g, '<br>')}</p><div class="message-time">Just now</div>`;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeLastAiMessage() {
    const messages = chatMessages.querySelectorAll('.message.ai');
    if (messages.length) {
        messages[messages.length - 1].remove();
    }
}

/* ==================== NEXT LAB LOGIC ==================== */
nextLabBtn.addEventListener('click', () => {
    aiMessage.textContent =
        "孩子，走到这里，你已经领略了东区的浪漫，西区的理性，接下来，去中区看看吧，那里会指向你这趟旅行的最终答案，我们有缘再见——钱学森。";

    aiBubble.style.opacity = '1';
    aiBubble.style.transform = 'translateY(0) scale(1)';

    setTimeout(() => {
        window.location.href = 'https://interactive-digital-0k6b.bolt.host/';
    }, 3000);
});