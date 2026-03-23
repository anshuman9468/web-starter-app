import { useState, useRef, useCallback, useEffect } from 'react';
import { VoicePipeline, ModelCategory, ModelManager, AudioCapture, AudioPlayback, SpeechActivity } from '@runanywhere/web';
import { VAD } from '@runanywhere/web-onnx';
import { useModelLoader } from '../hooks/useModelLoader';
import { ModelBanner } from './ModelBanner';
import {
  getTasks,
  addTask,
  completeTask,
  clearCompletedTasks,
  getCurrentTime,
  getCurrentDate,
  extractTaskFromText,
  detectTimeQuery,
  detectTaskQuery,
  buildAssistantContext,
  generateAssistantSystemPrompt,
  type Task,
} from '../utils/assistantTools';
import {
  getCurrentMode,
  setCurrentMode,
  detectModeSwitch,
  getSystemPromptForMode,
  getModeState,
  MODE_INFO,
  initStory,
  continueStory,
  initLanguageLearning,
  evaluatePronunciation,
  startCooking,
  nextCookingStep,
  detectCookingCommand,
  executeProductivityCommand,
  startWellnessSession,
  respondToMood,
  offerBreathingExercise,
  type VoiceMode,
} from '../utils/multiModeAgent';

type VoiceState = 'idle' | 'loading-models' | 'listening' | 'processing' | 'speaking';

export function VoiceTab() {
  const llmLoader = useModelLoader(ModelCategory.Language, true);
  const sttLoader = useModelLoader(ModelCategory.SpeechRecognition, true);
  const ttsLoader = useModelLoader(ModelCategory.SpeechSynthesis, true);
  const vadLoader = useModelLoader(ModelCategory.Audio, true);

  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showTasks, setShowTasks] = useState(true);
  const [currentMode, setMode] = useState<VoiceMode>(getCurrentMode());

  const micRef = useRef<AudioCapture | null>(null);
  const pipelineRef = useRef<VoicePipeline | null>(null);
  const vadUnsub = useRef<(() => void) | null>(null);

  // Load tasks on mount
  useEffect(() => {
    setTasks(getTasks());
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      micRef.current?.stop();
      vadUnsub.current?.();
    };
  }, []);

  // Ensure all 4 models are loaded
  const ensureModels = useCallback(async (): Promise<boolean> => {
    setVoiceState('loading-models');
    setError(null);

    const results = await Promise.all([
      vadLoader.ensure(),
      sttLoader.ensure(),
      llmLoader.ensure(),
      ttsLoader.ensure(),
    ]);

    if (results.every(Boolean)) {
      setVoiceState('idle');
      return true;
    }

    setError('Failed to load one or more voice models');
    setVoiceState('idle');
    return false;
  }, [vadLoader, sttLoader, llmLoader, ttsLoader]);

  // Start listening
  const startListening = useCallback(async () => {
    setTranscript('');
    setResponse('');
    setError(null);

    // Load models if needed
    const anyMissing = !ModelManager.getLoadedModel(ModelCategory.Audio)
      || !ModelManager.getLoadedModel(ModelCategory.SpeechRecognition)
      || !ModelManager.getLoadedModel(ModelCategory.Language)
      || !ModelManager.getLoadedModel(ModelCategory.SpeechSynthesis);

    if (anyMissing) {
      const ok = await ensureModels();
      if (!ok) return;
    }

    setVoiceState('listening');

    const mic = new AudioCapture({ sampleRate: 16000 });
    micRef.current = mic;

    if (!pipelineRef.current) {
      pipelineRef.current = new VoicePipeline();
    }

    // Start VAD + mic
    VAD.reset();

    vadUnsub.current = VAD.onSpeechActivity((activity) => {
      if (activity === SpeechActivity.Ended) {
        const segment = VAD.popSpeechSegment();
        // Reduced minimum length for faster triggering (was 1600)
        if (segment && segment.samples.length > 800) {
          processSpeech(segment.samples);
        }
      }
    });

    await mic.start(
      (chunk) => { VAD.processSamples(chunk); },
      (level) => { setAudioLevel(level); },
    );
  }, [ensureModels]);

  // Process user speech and handle assistant logic for ALL MODES
  const handleUserIntent = useCallback((userText: string): string | null => {
    const lowerText = userText.toLowerCase();

    // Check for mode switch first
    const newMode = detectModeSwitch(userText);
    if (newMode && newMode !== currentMode) {
      setMode(newMode);
      setCurrentMode(newMode);
      
      // Initialize new mode
      if (newMode === 'storyteller') return initStory();
      if (newMode === 'language') return initLanguageLearning();
      if (newMode === 'cooking') return "What would you like to cook? Say: pasta, eggs, salad, or rice.";
      if (newMode === 'productivity') return "Browser automation ready. Say: open website, search, new tab, or scroll.";
      if (newMode === 'wellness') return startWellnessSession();
      if (newMode === 'assistant') return "Assistant mode. I can manage tasks and answer questions.";
    }

    // Handle based on current mode
    switch (currentMode) {
      case 'storyteller':
        return continueStory(userText);
      
      case 'language':
        return evaluatePronunciation(userText);
      
      case 'cooking':
        const cookCmd = detectCookingCommand(userText);
        if (cookCmd === 'next') return nextCookingStep();
        if (cookCmd === 'repeat') {
          const state = getModeState<any>();
          return state ? `Repeat step ${state.step + 1}` : "Say: cook pasta, eggs, salad, or rice";
        }
        if (cookCmd === 'start') {
          const recipe = lowerText.includes('pasta') ? 'pasta' :
                        lowerText.includes('eggs') ? 'eggs' :
                        lowerText.includes('salad') ? 'salad' :
                        lowerText.includes('rice') ? 'rice' : 'pasta';
          return startCooking(recipe);
        }
        return "Say: cook something, next step, or repeat step";
      
      case 'productivity':
        return executeProductivityCommand(userText);
      
      case 'wellness':
        if (/breathe|breathing|exercise/.test(lowerText)) {
          return offerBreathingExercise();
        }
        return respondToMood(userText);
      
      case 'assistant':
      default:
        // Original assistant logic (instant responses)
        const taskInfo = extractTaskFromText(userText);
        if (taskInfo) {
          const task = addTask(taskInfo.task);
          setTasks(getTasks());
          return `Added: ${task.text}`;
        }

        const timeQuery = detectTimeQuery(userText);
        if (timeQuery === 'time') return `It's ${getCurrentTime()}`;
        if (timeQuery === 'date') return `${getCurrentDate()}`;
        if (timeQuery === 'day') {
          const date = new Date();
          return `It's ${date.toLocaleDateString('en-US', { weekday: 'long' })}`;
        }

        const taskQuery = detectTaskQuery(userText);
        if (taskQuery === 'list') {
          const tasks = getTasks().filter((t) => !t.completed);
          if (tasks.length === 0) return 'No tasks yet';
          const taskList = tasks.slice(0, 3).map((t) => t.text).join(', ');
          if (tasks.length > 3) return `${tasks.length} tasks: ${taskList}, and ${tasks.length - 3} more`;
          return `Tasks: ${taskList}`;
        }
        if (taskQuery === 'count') {
          const count = getTasks().filter((t) => !t.completed).length;
          return `${count} task${count !== 1 ? 's' : ''}`;
        }
        if (taskQuery === 'clear') {
          const cleared = clearCompletedTasks();
          setTasks(getTasks());
          return cleared > 0 ? `Cleared ${cleared} task${cleared > 1 ? 's' : ''}` : 'Nothing to clear';
        }

        if (/^(hi|hello|hey|good morning|good afternoon|good evening)/.test(lowerText)) {
          return 'Hello! How can I help?';
        }

        if (/help|what can you do|capabilities/.test(lowerText)) {
          return 'I have 6 modes: tasks, stories, language, cooking, productivity, wellness. Switch anytime!';
        }

        return null; // Let LLM handle other queries
    }
  }, [currentMode]);

  // Process a speech segment through the full pipeline
  const processSpeech = useCallback(async (audioData: Float32Array) => {
    const pipeline = pipelineRef.current;
    if (!pipeline) return;

    // Stop mic during processing
    micRef.current?.stop();
    vadUnsub.current?.();
    setVoiceState('processing');

    try {
      let userTranscript = '';
      let directResponse: string | null = null;

      const result = await pipeline.processTurn(audioData, {
        maxTokens: 30,
        temperature: 0.95,
        systemPrompt: `${getSystemPromptForMode(currentMode)} ${currentMode === 'assistant' ? buildAssistantContext() : ''}`,
      }, {
        onTranscription: (text) => {
          userTranscript = text;
          setTranscript(text);
          
          // Check if we can handle this directly without LLM
          directResponse = handleUserIntent(text);
        },
        onResponseToken: (_token, accumulated) => {
          if (!directResponse) {
            setResponse(accumulated);
          }
        },
        onResponseComplete: (text) => {
          const finalResponse = directResponse || text;
          setResponse(finalResponse);
        },
        onSynthesisComplete: async (audio, sampleRate) => {
          setVoiceState('speaking');
          const player = new AudioPlayback({ sampleRate });
          await player.play(audio, sampleRate);
          player.dispose();
        },
        onStateChange: (s) => {
          if (s === 'processingSTT') setVoiceState('processing');
          if (s === 'generatingResponse') setVoiceState('processing');
          if (s === 'playingTTS') setVoiceState('speaking');
        },
      });

      if (result) {
        setTranscript(result.transcription);
        const finalResponse = directResponse || result.response;
        setResponse(finalResponse);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }

    setVoiceState('idle');
    setAudioLevel(0);
  }, [handleUserIntent]);

  const stopListening = useCallback(() => {
    micRef.current?.stop();
    vadUnsub.current?.();
    setVoiceState('idle');
    setAudioLevel(0);
  }, []);

  // Which loaders are still loading?
  const pendingLoaders = [
    { label: 'VAD', loader: vadLoader },
    { label: 'STT', loader: sttLoader },
    { label: 'LLM', loader: llmLoader },
    { label: 'TTS', loader: ttsLoader },
  ].filter((l) => l.loader.state !== 'ready');

  const pendingTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  const handleCompleteTask = (taskId: string) => {
    completeTask(taskId);
    setTasks(getTasks());
  };

  const handleClearCompleted = () => {
    clearCompletedTasks();
    setTasks(getTasks());
  };

  const handleModeChange = (mode: VoiceMode) => {
    setMode(mode);
    setCurrentMode(mode);
    setTranscript('');
    setResponse('');
  };

  const modeInfo = MODE_INFO[currentMode];

  return (
    <div className="tab-panel voice-panel">
      {pendingLoaders.length > 0 && voiceState === 'idle' && (
        <ModelBanner
          state={pendingLoaders[0].loader.state}
          progress={pendingLoaders[0].loader.progress}
          error={pendingLoaders[0].loader.error}
          onLoad={ensureModels}
          label={`Voice Agent (${pendingLoaders.map((l) => l.label).join(', ')})`}
        />
      )}

      {error && <div className="model-banner"><span className="error-text">{error}</span></div>}

      {/* Mode Selector */}
      <div className="mode-selector">
        {(Object.keys(MODE_INFO) as VoiceMode[]).map((mode) => (
          <button
            key={mode}
            className={`mode-btn ${currentMode === mode ? 'active' : ''}`}
            onClick={() => handleModeChange(mode)}
            disabled={voiceState !== 'idle'}
          >
            <span className="mode-icon">{MODE_INFO[mode].icon}</span>
            <span className="mode-name">{MODE_INFO[mode].name}</span>
          </button>
        ))}
      </div>

      <div className="assistant-header">
        <h3>{modeInfo.icon} {modeInfo.name}</h3>
        <p className="assistant-subtitle">{modeInfo.description}</p>
      </div>

      <div className="voice-center">
        <div className="voice-orb" data-state={voiceState} style={{ '--level': audioLevel } as React.CSSProperties}>
          <div className="voice-orb-inner" />
        </div>

        <p className="voice-status">
          {voiceState === 'idle' && 'Tap to start listening'}
          {voiceState === 'loading-models' && 'Loading models...'}
          {voiceState === 'listening' && 'Listening... speak now'}
          {voiceState === 'processing' && 'Processing...'}
          {voiceState === 'speaking' && 'Speaking...'}
        </p>

        {voiceState === 'idle' || voiceState === 'loading-models' ? (
          <button
            className="btn btn-primary btn-lg"
            onClick={startListening}
            disabled={voiceState === 'loading-models'}
          >
            Start Listening
          </button>
        ) : voiceState === 'listening' ? (
          <button className="btn btn-lg" onClick={stopListening}>
            Stop
          </button>
        ) : null}
      </div>

      <div className="assistant-examples">
        <p className="text-muted">Try saying:</p>
        <div className="example-chips">
          {currentMode === 'assistant' && (
            <>
              <span className="chip">"What time is it?"</span>
              <span className="chip">"Add task to buy groceries"</span>
              <span className="chip">"List my tasks"</span>
            </>
          )}
          {currentMode === 'storyteller' && (
            <>
              <span className="chip">"Tell me a story"</span>
              <span className="chip">"Go left"</span>
              <span className="chip">"Enter the cave"</span>
            </>
          )}
          {currentMode === 'language' && (
            <>
              <span className="chip">"Teach me English"</span>
              <span className="chip">"Practice pronunciation"</span>
              <span className="chip">Repeat phrases clearly</span>
            </>
          )}
          {currentMode === 'cooking' && (
            <>
              <span className="chip">"Cook pasta"</span>
              <span className="chip">"Next step"</span>
              <span className="chip">"Repeat that"</span>
            </>
          )}
          {currentMode === 'productivity' && (
            <>
              <span className="chip">"Open Google"</span>
              <span className="chip">"Search for AI news"</span>
              <span className="chip">"New tab"</span>
            </>
          )}
          {currentMode === 'wellness' && (
            <>
              <span className="chip">"I'm feeling stressed"</span>
              <span className="chip">"Help me breathe"</span>
              <span className="chip">"I need to talk"</span>
            </>
          )}
        </div>
      </div>

      {transcript && (
        <div className="voice-transcript">
          <h4>You said:</h4>
          <p>{transcript}</p>
        </div>
      )}

      {response && (
        <div className="voice-response">
          <h4>Assistant:</h4>
          <p>{response}</p>
        </div>
      )}

      {/* Task Management Section - Only in Assistant Mode */}
      {currentMode === 'assistant' && (
        <div className="assistant-tasks">
          <div className="tasks-header">
            <h4>Your Tasks ({pendingTasks.length})</h4>
            <button className="btn btn-sm" onClick={() => setShowTasks(!showTasks)}>
              {showTasks ? 'Hide' : 'Show'}
            </button>
          </div>

          {showTasks && (
            <div className="tasks-list">
              {pendingTasks.length === 0 && (
                <p className="text-muted" style={{ textAlign: 'center', padding: '16px' }}>
                  No pending tasks. Say "add task" to create one!
                </p>
              )}
              {pendingTasks.map((task) => (
                <div key={task.id} className="task-item">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => handleCompleteTask(task.id)}
                  />
                  <span className="task-text">{task.text}</span>
                </div>
              ))}
              {completedTasks.length > 0 && (
                <div className="tasks-footer">
                  <button className="btn btn-sm" onClick={handleClearCompleted}>
                    Clear {completedTasks.length} Completed
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
