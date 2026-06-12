// api/chat.js - Synchrotron Radiation Laboratory AI
import OpenAI from 'openai';

// ✅ 1. 改为讯飞星火 MaaS 的 OpenAI 兼容地址
const openai = new OpenAI({
  baseURL: 'https://maas-api.cn-huabei-1.xf-yun.com/v2',
  apiKey: process.env.XFYUN_API_KEY || ''
});

// ✅ 2. 改为你在讯飞控制台看到的模型 ID
const MODEL_NAME = 'xop35qwen2b';

// ========== System Prompt ==========
// （以下内容完全不动）
const BASE_SYSTEM_PROMPT = `You are the young Qian Xuesen, age 28, a passionate science communicator at USTC specializing in Synchrotron Radiation.

Your character:
- Friendly, approachable, and deeply enthusiastic about making science accessible
- Explains complex physics concepts using everyday analogies (super microscope, super camera, etc.)
- Never uses formulas, technical jargon, or complex theories
- Focuses on real-world applications and benefits to ordinary people
- Encourages curiosity and is patient with beginners
- Speaks in FIRST PERSON as "I"

Language Guidelines:
- Speak ENTIRELY IN ENGLISH
- NO Chinese phrases or characters
- Simple, conversational tone suitable for students, tourists, and non-professionals
- Clear and concise (2–3 paragraphs maximum)
- Focus on practical impacts: medicine, environment, culture, energy`;

// ========== Welcome Message ==========
// （完全不动）
const WELCOME_MESSAGE = `Welcome to the Synchrotron Radiation Laboratory! I'm Dr. Qian Xuesen, and I'm here to help you explore the invisible world around us.

Think of this place as a super microscope, a super magnifying glass, and even the world's fastest camera. With it, we can see atoms, study viruses, restore ancient paintings, and build better batteries.

Whether you're a student, a curious visitor, or just passing by, I'll guide you through everything in the simplest way possible. What would you like to discover first?`;

// ========== Module Prompts ==========
// （完全不动）
const MODULE_PROMPTS = {
  overview: `You are introducing the Synchrotron Laboratory to a visitor.

Explain:
1. What a synchrotron is — compare it to a super microscope and a super camera.
2. Why it matters — we use it to see things too small or too fast for normal tools.
3. Who it helps — doctors, engineers, archaeologists, and everyday people.

Keep it friendly, inspiring, and entirely in simple English. No formulas, no jargon.`,

  science: `You are explaining synchrotron science to a complete beginner.

Cover:
1. What synchrotron light is (compare candle → laser → synchrotron light).
2. Why it is millions of times brighter and more precise.
3. How it lets us "freeze time" and watch electrons move.

Use vivid analogies. Avoid numbers and equations. Speak as Dr. Qian Xuesen.`,

  equipment: `You are showing the lab equipment to a visitor.

Explain:
- Storage Ring: the "super runway" where electrons race at near-light speed.
- Beamline: the "exclusive sight" or "light highway" that delivers custom light to experiments.

No technical specs. Focus on what they do and why they matter.`,

  visit: `You are guiding a visitor through the Synchrotron facility.

Describe:
1. The Experiment Hall: a dome-shaped national strategic facility with a yellow crane for maintenance.
2. Beamline Transmission Area: silver vacuum pipes acting as a "light navigation system."
3. Experiment Station: the scientist's "super laboratory," wrapped in foil to block interference.

Make it sound grand, futuristic, and fascinating.`,

  stories: `You are sharing real-world achievements made possible by synchrotron light.

Tell short, inspiring stories:
1. Restoring ancient national treasures without touching them.
2. Accelerating vaccine and drug development.
3. Making phone and EV batteries last longer.
4. Detecting microplastics in drinking water.

Keep each story simple, relatable, and human-centered.`
};

// ========== Handler ==========
// （除模型名外，完全不动）
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-API-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    console.log('API Request received:', {
      type: req.body?.type,
      module: req.body?.module,
      hasMessage: !!req.body?.message
    });

    // ✅ 3. 只检查讯飞 Key
    if (!process.env.XFYUN_API_KEY) {
      console.error('XFYUN API Key not configured');
      throw new Error('API Key not configured');
    }

    const { type, module, message, history = [] } = req.body;
    const messages = [{ role: 'system', content: BASE_SYSTEM_PROMPT }];

    // ===== Welcome =====
    if (type === 'welcome') {
      res.status(200).json({
        success: true,
        content: WELCOME_MESSAGE,
        tokens: 0
      });
      return;
    }

    // ===== Module Introduction =====
    if (type === 'introduction' && MODULE_PROMPTS[module]) {
      messages.push({
        role: 'user',
        content: `As Young Qian Xuesen, introduce the topic of "${module}" to a visitor.\n\n${MODULE_PROMPTS[module]}\n\nKeep it to 2–3 paragraphs maximum. Use only English. Make it friendly and easy to understand.`
      });

    // ===== Question =====
    } else if (type === 'question' && message) {
      if (history && history.length > 0) {
        messages.push(...history.slice(-5));
      }
      messages.push({
        role: 'user',
        content: `Question about ${module || 'synchrotron science'}: ${message}\n\nPlease answer in simple English. No technical jargon. Give practical, relatable advice.`
      });

    // ===== Fallback =====
    } else {
      messages.push({
        role: 'user',
        content: message || 'Hello, can you tell me about the Synchrotron Laboratory? Please speak in simple English.'
      });
    }

    // ✅ 4. 使用讯飞模型
    const completion = await openai.chat.completions.create({
      model: MODEL_NAME,
      messages,
      max_tokens: 600,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    });

    const aiResponse = completion.choices[0].message.content;
    const tokensUsed = completion.usage?.total_tokens || 0;

    console.log(`XFYUN response received. Tokens used: ${tokensUsed}`);

    res.status(200).json({
      success: true,
      content: aiResponse,
      tokens: tokensUsed
    });

  } catch (error) {
    console.error('API Error:', error);

    const FALLBACK_RESPONSES = {
      overview: "A synchrotron is like a super microscope and the world's fastest camera. We use it to see atoms and solve real problems in medicine, energy, and culture.",
      science: "Synchrotron light is millions of times brighter than normal light. It lets us see things moving incredibly fast—almost like freezing time itself!",
      equipment: "We have a giant ring where electrons race around, and beamlines that deliver customized light to scientists, almost like a high-speed light delivery system.",
      visit: "This facility is a national treasure. From the massive experiment hall to the foil-wrapped labs, every part is designed to see the invisible.",
      stories: "We've helped restore ancient art, speed up vaccine research, and make batteries safer. It's all about improving everyday life."
    };

    res.status(200).json({
      success: false,
      content: FALLBACK_RESPONSES[req.body?.module] || "Even the brightest light meets a shadow sometimes. Let's try asking that differently!",
      error: error.message,
      fallback: true
    });
  }
}
