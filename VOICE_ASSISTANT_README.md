# Voice Personal Assistant - RunAnywhere SDK

A voice-first conversational web application built with the RunAnywhere SDK, featuring **complete on-device AI processing** with no external API calls.

## Features

### 🎙️ Voice Pipeline (100% Local)
- **Speech-to-Text**: Whisper Tiny English (ONNX) - 105MB
- **Language Model**: Liquid AI LFM2 350M (GGUF) - 250MB
- **Text-to-Speech**: Piper TTS US English (ONNX) - 65MB
- **Voice Activity Detection**: Silero VAD v5 - 5MB

### 🤖 Personal Assistant Capabilities
- **Task Management**: Create, list, complete, and clear tasks via voice
- **Time & Date Queries**: Ask about current time, date, or day of week
- **Natural Conversation**: Engage in friendly dialogue with context awareness
- **Hands-Free Operation**: Complete voice control with automatic speech detection
- **Local Storage**: All tasks stored in browser localStorage

## Voice Commands

### Task Management
- "Add task to buy groceries"
- "Remind me to call mom"
- "Create a task for tomorrow's meeting"
- "List my tasks"
- "How many tasks do I have?"
- "Clear completed tasks"

### Time & Date
- "What time is it?"
- "What's today's date?"
- "What day is it?"
- "Tell me the time"

### General Conversation
- "Hello, how are you?"
- "What can you do?"
- "Help me plan my day"
- Any natural language question or request

## Technical Architecture

### Voice Processing Flow
1. **Microphone Capture** → 16kHz audio sampling
2. **VAD (Voice Activity Detection)** → Detects speech start/end
3. **Speech-to-Text** → Transcribes audio to text
4. **Intent Recognition** → Parses user intent (task, time, general)
5. **Response Generation** → LLM generates contextual response
6. **Text-to-Speech** → Converts response to natural speech
7. **Audio Playback** → Plays response through speakers

### Key Components

#### `src/utils/assistantTools.ts`
Core utilities for the personal assistant:
- Task CRUD operations (Create, Read, Update, Delete)
- Time/date utilities
- Natural language processing helpers
- Intent detection (task creation, time queries, task queries)
- Context builder for LLM prompts

#### `src/components/VoiceTab.tsx`
Main voice assistant interface:
- Voice pipeline management
- Model loading and state handling
- Speech processing and response generation
- Task list UI with checkbox interactions
- Real-time audio visualization

#### `src/runanywhere.ts`
RunAnywhere SDK initialization:
- Registers LlamaCPP and ONNX backends
- Model catalog configuration
- VLM worker bridge setup
- WebGPU/CPU acceleration detection

## How It Works

### 1. Natural Language Understanding
The assistant uses simple pattern matching for common intents:

```typescript
// Task creation patterns
"add task to buy groceries" → Creates task
"remind me to call mom" → Creates task

// Time queries
"what time is it" → Returns current time
"what's the date" → Returns current date

// Task queries
"list my tasks" → Shows all pending tasks
"how many tasks" → Returns task count
```

### 2. Context-Aware Responses
The LLM receives context about:
- Current time and date
- User's pending tasks (up to 5 most recent)
- Previous conversation (via VoicePipeline state)

### 3. Local-First Architecture
Everything runs in the browser:
- **No API keys required**
- **No cloud services**
- **Complete privacy** - data never leaves your device
- **Offline capable** - works without internet after initial load

## Privacy & Data Storage

### What's Stored Locally
- **Tasks**: Stored in `localStorage` under key `voice_assistant_tasks`
- **Reminders**: Stored in `localStorage` under key `voice_assistant_reminders`
- **Models**: Downloaded to browser cache (IndexedDB via RunAnywhere SDK)

### What's NOT Stored
- Voice recordings (processed and discarded immediately)
- Conversation history (ephemeral, not persisted)
- Personal information (never collected)

## Performance

### Model Loading Times (First Run)
- VAD: ~2-5 seconds
- STT (Whisper): ~10-15 seconds
- LLM (LFM2): ~5-10 seconds
- TTS (Piper): ~5-8 seconds

### Inference Performance
- **Speech-to-Text**: ~1-3 seconds for 5-second audio
- **LLM Response**: ~2-5 seconds (depends on CPU/GPU)
- **Text-to-Speech**: ~500ms-2s (depends on response length)
- **Total Pipeline**: ~5-10 seconds end-to-end

### Hardware Acceleration
- **WebGPU**: Automatic acceleration on supported browsers (Chrome/Edge)
- **CPU Fallback**: Single-threaded WASM on unsupported browsers
- **Multi-threading**: Uses SharedArrayBuffer when available

## Browser Requirements

### Minimum Requirements
- Modern browser (Chrome 90+, Edge 90+, Safari 15+, Firefox 90+)
- 2GB+ available RAM
- Microphone access

### Recommended Setup
- Chrome/Edge 120+ (for WebGPU acceleration)
- 4GB+ available RAM
- Cross-Origin Isolation headers (enabled automatically in dev mode)

### Audio Permissions
First-time users will see a microphone permission prompt. Grant access to use voice features.

## Development

### Run Development Server
```bash
npm run dev
```
Access at http://localhost:5173

### Build for Production
```bash
npm run build
```
Output: `dist/` folder with all assets

### Test Voice Assistant
1. Navigate to Voice tab
2. Click "Start Listening"
3. Wait for models to load (first time only)
4. Speak naturally when you see "Listening..."
5. Voice Activity Detection will automatically detect speech end
6. Listen to the assistant's response

## Extending the Assistant

### Add New Intents
Edit `src/utils/assistantTools.ts`:

```typescript
export function detectCustomIntent(text: string): boolean {
  const lowerText = text.toLowerCase();
  return /your pattern here/.test(lowerText);
}
```

### Customize System Prompt
Edit the `generateAssistantSystemPrompt()` function in `src/utils/assistantTools.ts`

### Add New Models
Edit `src/runanywhere.ts` to register additional models in the catalog

## Troubleshooting

### "Models not loading"
- Check browser console for errors
- Ensure sufficient RAM available (4GB+ recommended)
- Try refreshing the page

### "Microphone not working"
- Check browser permissions (chrome://settings/content/microphone)
- Ensure HTTPS or localhost (mic requires secure context)
- Try different browser

### "Voice detection not triggering"
- Speak louder or closer to microphone
- Check system microphone levels
- Adjust VAD sensitivity (in code)

### "Slow inference"
- Enable WebGPU in browser flags (chrome://flags)
- Close other tabs to free RAM
- Consider using smaller models

## Credits

Built with:
- [RunAnywhere SDK](https://runanywhere.ai) - On-device AI framework
- [Liquid AI LFM2](https://huggingface.co/LiquidAI) - Language models
- [Whisper ONNX](https://github.com/openai/whisper) - Speech recognition
- [Piper TTS](https://github.com/rhasspy/piper) - Text-to-speech
- [Silero VAD](https://github.com/snakers4/silero-vad) - Voice activity detection
- React 19 + TypeScript + Vite

## License

This starter template is open source. Individual model licenses may vary.
