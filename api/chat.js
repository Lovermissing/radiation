// api/chat.js - Synchrotron Radiation Laboratory AI
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com/v1',
  apiKey: process.env.DEEPSEEK_API_KEY || ''
});

// System prompt for Synchrotron Radiation Educator
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
- Clear and concise (2-3 paragraphs maximum)
- Focus on practical impacts: medicine, environment, culture, energy

Role: You are guiding visitors through the Synchrotron Radiation Laboratory. Your goal is to demystify "the most powerful light source" and show how it helps humanity.`;

// Welcome message
const WELCOME_MESSAGE = `Welcome to the Synchrotron Radiation Laboratory! I'm Dr. Qian Xuesen.

Think of this facility as a "Super Microscope" and the "World's Fastest Camera." It allows us to see atoms, molecules, and even watch chemical reactions happen in real-time!

Whether you're interested in how new medicines are developed, how we restore ancient paintings, or how to make better batteries for electric cars, this lab provides the answers. Click any module to explore, and feel free to ask me anything!

What would you like to discover today?`;

// Module-specific prompts
const MODULE_PROMPTS = {
  'overview': `You are introducing the Synchrotron Laboratory to a complete beginner.

Explain using these analogies:
- Super Magnifying Glass (seeing tiny things)
- Super Microscope (seeing inside materials)
- World's Fastest Camera (capturing ultra-fast processes)

Focus on: What does it do? Why was it built? How does it help ordinary people? Keep it simple and inspiring.`,

  'mission': `Explain the lab's mission and public value.

Focus on these民生 (people's livelihood) areas:
1. Medical: Developing new drugs and studying cancer cells.
2. New Materials: Better batteries and stronger aerospace parts.
3. Environment: Detecting tiny pollutants in water and soil.
4. Culture: Scanning ancient books and artworks without touching them.

Answer the question: "How does this lab make my life better?"`,

  'light': `Explain the difference between Natural Light, Laser Light, and Synchrotron Light.

- Natural Light: Like a candle, scattered and weak.
- Laser: Focused and strong, but single-colored.
- Synchrotron Light: Millions of times brighter, can be tuned to different colors (energies), and incredibly precise.

Use the analogy of a "Searchlight vs. Candle." Explain why being brighter and more precise matters for seeing atoms.`,

  'equipment': `Explain the two main pieces of equipment using simple analogies.

1. Storage Ring: "The Super Runway." Electrons run in circles here at near light-speed, producing the powerful light.
2. Beamline: "The Exclusive Sight" or "Light Highway." These are pipes that guide the light to the experiment stations, filtering and shaping it perfectly.

Mention the images (2.1.jpg and 2.2.jpg) if asked. Focus on function, not engineering details.`,

  'research': `Describe the research fields in a way a 10-year-old can understand.

1. Biomedical: Looking at viruses and cells to make new vaccines.
2. Cultural Heritage: Seeing what's under the paint of an old masterpiece without damaging it.
3. New Energy: Looking at battery materials to make phones last longer.
4. Environmental: Finding invisible poisons in drinking water.
5. Aerospace: Checking if rocket parts are strong enough.

Give one simple example for each.`,

  'visit-hall': `You are describing the Experiment Hall (image: tf3.jpg).

This is the heart of the lab. The round roof covers the Storage Ring. Point out the yellow crane (for lifting heavy equipment) and the control cabinets where scientists sit. It's like the cockpit of a spaceship!`,

  'visit-beamline': `You are describing the Beamline area (image: tf.jpg).

Show the silver pipes (vacuum tubes) where light travels. Mention the red robotic arm used for maintenance and the clean environment needed for the experiments. It's like the engine room of a high-speed train.`,

  'visit-station': `You are describing the Experiment Station (image: tf2.jpg).

Point out the foil-covered chamber (kept extremely cold and empty of air) and the computer cabinets that read the signals. This is where the "magic" happens—where light touches the sample and reveals its secrets.`
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
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
    
    const { type, module, message, history = [] } = req.body;
    
    if (!process.env.DEEPSEEK_API_KEY) {
      console.error('DeepSeek API Key not configured');
      throw new Error('API Key not configured');
    }
    
    const messages = [
      { role: 'system', content: BASE_SYSTEM_PROMPT }
    ];
    
    if (type === 'welcome') {
      res.status(200).json({
        success: true,
        content: WELCOME_MESSAGE,
        tokens: 0
      });
      return;
      
    } else if (type === 'introduction' && MODULE_PROMPTS[module]) {
      messages.push({
        role: 'user',
        content: `As Young Qian Xuesen, introduce the topic of "${module}" to a visitor who knows nothing about synchrotron science.\n\n${MODULE_PROMPTS[module]}\n\nKeep it to 3-4 paragraphs maximum. Use only English. Make it friendly and easy to understand.`
      });
      
    } else if (type === 'question' && message) {
      if (history && history.length > 0) {
        messages.push(...history.slice(-5));
      }
      messages.push({ 
        role: 'user', 
        content: `Question about ${module || 'synchrotron radiation'}: ${message}\n\nPlease answer in simple English. No technical jargon. Focus on practical understanding.`
      });
      
    } else {
      messages.push({ 
        role: 'user', 
        content: message || 'Hello, can you tell me about the Synchrotron Laboratory? Please speak in simple English.' 
      });
    }
    
    const completion = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: messages,
      max_tokens: 600,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    });
    
    const aiResponse = completion.choices[0].message.content;
    const tokensUsed = completion.usage?.total_tokens || 0;
    
    console.log(`DeepSeek response received. Tokens used: ${tokensUsed}`);
    
    res.status(200).json({
      success: true,
      content: aiResponse,
      tokens: tokensUsed
    });
    
  } catch (error) {
    console.error('API Error:', error);
    
    const FALLBACK_RESPONSES = {
      'overview': "Think of the Synchrotron as a Super Microscope. It lets us see things thousands of times smaller than a human hair! It's like having a camera fast enough to watch atoms dance. What part of that sounds most interesting to you?",
      'mission': "We build this lab to help people! We use it to create better medicine, restore old paintings, and make sure our water is clean. It's a tool for making everyone's life better. Which of those would you like to hear more about?",
      'light': "Imagine a candle versus a giant searchlight. Synchrotron light is millions of times brighter than a candle. This brightness lets us see details that normal light just can't show. It's the ultimate tool for seeing the invisible!",
      'equipment': "We have a 'Super Runway' (Storage Ring) where light is made, and a 'Light Highway' (Beamline) that delivers that light perfectly to the experiment. It's a very precise delivery system!",
      'research': "We look at everything from cancer cells to ancient ink on paper. My favorite is looking at batteries—we can see why they fail and how to make them last longer for electric cars. Isn't that amazing?",
      'visit-hall': "This is the main hall. See the round roof? Underneath it is a giant ring where electrons run at near light-speed. It's the powerhouse of the whole operation!",
      'visit-beamline': "Here we have the silver pipes. This is the 'highway' for light. It travels through these pipes, perfectly clean and focused, until it reaches the experiment.",
      'visit-station': "This is the experiment station. The foil keeps everything super cold and stable. This is where we put the sample and collect the data. It's the heart of the discovery!"
    };
    
    res.status(200).json({
      success: false,
      content: FALLBACK_RESPONSES[req.body?.module] || "Welcome to the Synchrotron Radiation Laboratory! I'm Dr. Qian Xuesen. I'm here to help you understand this amazing facility in simple terms. What would you like to know?",
      error: error.message,
      fallback: true
    });
  }
}