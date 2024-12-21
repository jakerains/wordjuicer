import React from 'react';
import { Globe, Volume2, Languages, Server } from 'lucide-react';
import { Select } from './ui/Select';
import { useModelStore } from '../store/modelStore';
import { useApiKeyStore } from '../store/apiKeyStore';

export function TranscriptionSettings() {
  const { selectedModel, setSelectedModel, availableModels, getModelsForProvider } = useModelStore();
  const { provider, isValidated } = useApiKeyStore();

  React.useEffect(() => {
    if (isValidated) {
      getModelsForProvider(provider).then(models => {
        // Set first available model as selected if current selection is invalid
        if (models.length > 0 && !models.find(m => m.id === selectedModel)) {
          setSelectedModel(models[0].id);
        }
      }).catch(error => {
        console.error('Failed to fetch models:', error);
      });
    }
  }, [provider, isValidated, getModelsForProvider, setSelectedModel]);

  // Filter models based on provider
  const filteredModels = availableModels.filter(model => model.provider === provider);

  return (
    <div className="space-y-6 bg-black/40 backdrop-blur-md rounded-[20px] p-6 border border-white/20">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-[#A2AD1E]/20 rounded-full">
            <Server className="w-5 h-5 text-[#A2AD1E]" />
          </div>
          <h3 className="text-lg font-semibold text-white">Model Selection</h3>
        </div>
        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Transcription Model
            </label>
            <Select
              icon={<Server className="w-5 h-5" />}
              options={filteredModels.map(model => ({
                value: model.id,
                label: model.name
              }))}
              value={selectedModel}
              onChange={setSelectedModel}
              disabled={!isValidated || filteredModels.length === 0}
            />
            <p className="mt-2 text-sm text-white/70">
              {provider === 'groq' 
                ? 'Using Groq\'s optimized Whisper implementation'
                : 'Using Hugging Face\'s Whisper implementation'}
            </p>
            {!isValidated && (
              <p className="mt-2 text-sm text-[#F96C57]">
                Please validate your API key to select a model
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-[#F96C57]/20 rounded-full">
            <Languages className="w-5 h-5 text-[#F96C57]" />
          </div>
          <h3 className="text-lg font-semibold text-white">Language Settings</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Primary Language
            </label>
            <Select
              icon={<Globe className="w-5 h-5" />}
              options={[
                { value: 'en', label: 'English' },
                { value: 'es', label: 'Spanish' },
                { value: 'fr', label: 'French' },
                { value: 'de', label: 'German' },
                { value: 'auto', label: 'Auto Detect' }
              ]}
              value="auto"
              onChange={() => {}}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Processing Quality
            </label>
            <Select
              icon={<Volume2 className="w-5 h-5" />}
              options={[
                { value: 'high', label: 'High Quality (Slower)' },
                { value: 'balanced', label: 'Balanced' },
                { value: 'fast', label: 'Fast (Lower Quality)' }
              ]}
              value="balanced"
              onChange={() => {}}
            />
          </div>
        </div>
      </div> {/* Add this closing div */}
    </div>
  );
}