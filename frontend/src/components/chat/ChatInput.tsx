import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Mic, MicOff, X, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onSendAttachment: (message: string, file: File) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onSendAttachment,
  isLoading,
  disabled = false,
}) => {
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
    }
  }, [text]);

  // Voice speech-to-text setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN'; // Indian English / Hindi mix support

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsRecording(false);
      };

      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);

      recognitionRef.current = recognition;
    }
  }, []);

  const handleToggleVoice = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (isLoading || disabled) return;

    if (selectedFile) {
      onSendAttachment(text, selectedFile);
      setSelectedFile(null);
      setText('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } else if (text.trim()) {
      onSendMessage(text.trim());
      setText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="p-2 sm:p-2.5 bg-white border-t border-slate-200/90 shadow-sm">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-1">
        {/* Selected Attachment Pill */}
        {selectedFile && (
          <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-bis-50 border border-bis-200 text-xs text-bis-900 animate-fade-in w-fit">
            {selectedFile.type.startsWith('image/') ? (
              <ImageIcon className="w-3.5 h-3.5 text-bis-600" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-bis-600" />
            )}
            <span className="font-medium max-w-[180px] truncate">{selectedFile.name}</span>
            <span className="text-[10px] text-slate-400">
              ({(selectedFile.size / 1024).toFixed(1)} KB)
            </span>
            <button
              type="button"
              onClick={handleClearFile}
              className="p-0.5 hover:bg-bis-200/60 rounded text-bis-700 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Text Input Row */}
        <div className="relative flex items-center gap-1.5 bg-slate-50 border border-slate-300 focus-within:border-bis-600 focus-within:ring-2 focus-within:ring-bis-100 rounded-xl p-1.5 px-2 transition-all shadow-inner">
          {/* File Attachment Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 text-slate-500 hover:text-bis-800 hover:bg-slate-200/60 rounded-lg transition-colors shrink-0"
            title="Attach image or standard document for compliance inspection"
          >
            <Paperclip className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Voice Mic Button */}
          <button
            type="button"
            onClick={handleToggleVoice}
            className={`p-1.5 rounded-lg transition-colors shrink-0 ${
              isRecording
                ? 'bg-rose-500 text-white animate-pulse'
                : 'text-slate-500 hover:text-bis-800 hover:bg-slate-200/60'
            }`}
            title={isRecording ? 'Listening... click to stop' : 'Speak your query'}
          >
            {isRecording ? (
              <MicOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            ) : (
              <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            )}
          </button>

          {/* Text Area */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || isLoading}
            placeholder={
              isRecording
                ? 'Listening to speech...'
                : 'Ask anything about BIS...'
            }
            rows={1}
            className="flex-1 bg-transparent border-0 focus:ring-0 focus:outline-none resize-none py-1 px-1 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 min-h-[30px] max-h-[100px] custom-scrollbar leading-relaxed"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={(!text.trim() && !selectedFile) || isLoading || disabled}
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 font-semibold text-xs transition-all shrink-0 ${
              (text.trim() || selectedFile) && !isLoading
                ? 'bg-bis-700 hover:bg-bis-600 active:bg-bis-800 text-white shadow-sm'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <span className="hidden sm:inline">Consult</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>

        {/* Footer info note */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 pt-0.5">
          <span>Press <strong>Enter</strong> to send, <strong>Shift+Enter</strong> for newline</span>
          <span className="hidden sm:inline">Official BIS Portal</span>
        </div>
      </form>
    </div>
  );
};
