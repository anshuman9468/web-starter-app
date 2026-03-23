# Voice Personal Assistant - Testing Guide

## Quick Start Testing

### 1. Start Development Server
```bash
npm run dev
```
Visit http://localhost:5173 (or the port shown in terminal)

### 2. Navigate to Voice Tab
Click on the "🎙️ Voice" tab in the navigation bar

### 3. Load Models (First Time Only)
- The page will show model loading banners
- Click "Load Models" or "Start Listening" to begin download
- Wait 30-60 seconds for initial model download (~425MB total)
- Models are cached for future use

### 4. Test Voice Commands

#### Basic Interaction Test
1. Click "Start Listening"
2. Wait for "Listening... speak now" status
3. Say: **"Hello, what can you do?"**
4. Wait for response (should list capabilities)

#### Task Creation Tests
1. Click "Start Listening"
2. Say: **"Add task to buy groceries"**
3. Verify: Task appears in "Your Tasks" section below
4. Repeat with: **"Remind me to call mom"**
5. Verify: Second task appears

#### Task Query Tests
1. Say: **"List my tasks"**
2. Should hear: List of your pending tasks
3. Say: **"How many tasks do I have?"**
4. Should hear: Number of pending tasks

#### Time & Date Tests
1. Say: **"What time is it?"**
2. Should hear: Current time
3. Say: **"What's today's date?"**
4. Should hear: Current date
5. Say: **"What day is it?"**
6. Should hear: Day of week (e.g., "Monday")

#### Task Management Tests
1. Click checkbox next to a task to mark complete
2. Say: **"Clear completed tasks"**
3. Verify: Completed tasks are removed

#### Conversation Tests
1. Say: **"How are you today?"**
2. Should get friendly response
3. Say: **"Help me plan my day"**
4. Should get productivity suggestions

## Expected Behavior

### Voice Activity Detection
- Green glow when listening
- Automatically stops recording when you stop speaking
- ~1-2 second silence triggers processing
- No need to manually stop (but you can)

### Response Time
- **Total Pipeline**: 5-10 seconds end-to-end
  - Transcription: 1-3 seconds
  - Intent detection: Instant
  - LLM generation: 2-5 seconds
  - Speech synthesis: 1-2 seconds

### Audio Visualization
- Orb pulses while listening
- Scales with audio input level
- Color changes based on state:
  - Orange glow: Listening
  - Green glow: Processing/Speaking

## Troubleshooting

### No microphone input detected
**Solution**: Check browser permissions
- Chrome: Click padlock icon → Site settings → Microphone
- Firefox: Click info icon → Permissions → Microphone
- Safari: Settings → Websites → Microphone

### Models won't load
**Solution**: Check console errors
```bash
# Open browser DevTools (F12)
# Check Console tab for errors
# Common issues:
# - Insufficient RAM (need 2GB+ free)
# - Slow network (downloads ~425MB)
# - Browser cache full (clear cache)
```

### Voice not triggering response
**Solution**: Speak louder or adjust sensitivity
- Speak clearly and close to microphone
- Ensure quiet environment (VAD is sensitive to background noise)
- Wait for "Listening..." status before speaking

### Slow responses
**Solution**: Enable hardware acceleration
```bash
# Chrome: Visit chrome://flags
# Search for "WebGPU"
# Enable and restart browser
```

### Tasks not persisting
**Solution**: Check localStorage
```javascript
// Open DevTools Console
localStorage.getItem('voice_assistant_tasks')
// Should show JSON array of tasks
```

## Performance Benchmarks

### First Load (with model downloads)
- VAD: ~5-10s download + 2s load
- STT (Whisper): ~20-30s download + 5s load
- LLM (LFM2): ~40-60s download + 3s load
- TTS (Piper): ~10-15s download + 2s load
**Total first load: 90-120 seconds**

### Subsequent Loads (models cached)
- VAD: ~2s load
- STT: ~5s load
- LLM: ~3s load
- TTS: ~2s load
**Total subsequent loads: 10-15 seconds**

### Inference Performance
| Operation | CPU Only | WebGPU |
|-----------|----------|--------|
| STT (5s audio) | 2-3s | 1-2s |
| LLM (50 tokens) | 4-6s | 2-3s |
| TTS (1 sentence) | 1-2s | 0.5-1s |
| **Total Pipeline** | 8-12s | 4-7s |

## Advanced Testing

### Test Intent Detection Patterns

#### Task Creation
- "Add task to [action]"
- "Create a task for [action]"
- "Remind me to [action]"
- "I need to [action]"
- "I have to [action]"

#### Time Queries
- "What time is it?"
- "Tell me the time"
- "Current time"
- "What's the time?"

#### Date Queries
- "What's today's date?"
- "What is the date?"
- "Tell me today's date"
- "What's today?"

#### Day Queries
- "What day is it?"
- "Which day of the week?"
- "Day of the week"

#### Task Queries
- "List my tasks"
- "Show my tasks"
- "What are my tasks?"
- "Tell me my tasks"
- "How many tasks do I have?"
- "Task count"

#### Task Management
- "Clear completed tasks"
- "Delete completed"

### Stress Testing

#### Multiple Tasks
Add 10+ tasks rapidly to test list rendering and storage

#### Long Conversations
Have extended conversation to test context awareness

#### Rapid Commands
Issue multiple commands back-to-back to test pipeline handling

## Demo Script (For Presentations)

```
1. "Hello, I need your help"
   → Introduction to voice assistant

2. "What time is it?"
   → Shows time query capability

3. "Add task to buy groceries"
   → Creates first task

4. "Remind me to finish the presentation"
   → Creates second task

5. "Add task to call the client"
   → Creates third task

6. "List my tasks"
   → Shows all three tasks

7. [Mark first task complete via checkbox]

8. "How many tasks do I have?"
   → Should say 2 pending tasks

9. "Clear completed tasks"
   → Removes completed task

10. "What's today's date?"
    → Shows date query capability

Total demo time: ~3-4 minutes
Shows: Task creation, queries, management, time/date, UI interaction
```

## Success Criteria

✅ **Core Functionality**
- Voice input detected and transcribed correctly
- Task creation via voice works
- Time/date queries return accurate information
- Task list updates in real-time
- Checkbox interactions work
- Audio responses play correctly

✅ **User Experience**
- Voice Activity Detection feels natural
- Response time under 10 seconds
- UI is responsive and clear
- Error states display helpful messages

✅ **Privacy & Performance**
- No network requests after model download
- All processing happens locally
- Data persists in localStorage
- Models load successfully on first run

✅ **Browser Compatibility**
- Works in Chrome/Edge (WebGPU recommended)
- Works in Firefox (CPU fallback)
- Works in Safari (CPU fallback)
- Microphone permissions handled correctly

## Next Steps After Testing

1. **Customize System Prompt**: Edit `src/utils/assistantTools.ts`
2. **Add More Intents**: Extend pattern matching functions
3. **Improve NLP**: Use more sophisticated parsing
4. **Add Features**: Weather, calendar integration, notes
5. **Optimize Models**: Try different model sizes for speed/quality balance
6. **Deploy**: Use Vercel, Netlify, or Cloudflare Pages

## Feedback & Issues

If you encounter issues or have suggestions:
1. Check browser console for errors
2. Verify microphone permissions
3. Ensure sufficient RAM (4GB+ recommended)
4. Try different browser (Chrome/Edge for WebGPU)
5. Clear cache and retry

For RunAnywhere SDK issues, visit: https://github.com/runanywhere
