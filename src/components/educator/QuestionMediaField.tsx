import { useRef } from 'react';
import { Upload, X } from 'lucide-react';

type MediaKind = 'image' | 'audio';

interface QuestionMediaFieldProps {
  kind: MediaKind;
  label: string;
  required?: boolean;
  previewUrl?: string;
  fileName?: string;
  onFileSelect: (file: File | null) => void;
  disabled?: boolean;
}

export default function QuestionMediaField({
  kind,
  label,
  required,
  previewUrl,
  fileName,
  onFileSelect,
  disabled,
}: QuestionMediaFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const accept = kind === 'image' ? 'image/*' : 'audio/*';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    if (kind === 'image' && !file.type.startsWith('image/')) return;
    if (kind === 'audio' && !file.type.startsWith('audio/')) return;
    onFileSelect(file);
  };

  const clear = () => {
    onFileSelect(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          <Upload className="w-4 h-4" />
          Choisir un fichier
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleChange}
          disabled={disabled}
        />
        {fileName ? (
          <span className="text-sm text-gray-600 truncate max-w-xs">{fileName}</span>
        ) : null}
        {(fileName || previewUrl) && !disabled ? (
          <button
            type="button"
            onClick={clear}
            className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
          >
            <X className="w-4 h-4" />
            Retirer
          </button>
        ) : null}
      </div>

      {previewUrl && kind === 'image' ? (
        <img
          src={previewUrl}
          alt="Aperçu"
          className="mt-3 max-h-48 rounded-xl border border-gray-200 object-contain"
        />
      ) : null}

      {previewUrl && kind === 'audio' ? (
        <audio controls src={previewUrl} className="mt-3 w-full max-w-md" />
      ) : null}

      <p className="text-xs text-gray-500 mt-2">
        {kind === 'image'
          ? 'Formats image acceptés (max 5 Mo). Le fichier est enregistré sur le serveur.'
          : 'Formats audio acceptés (max 5 Mo). Sans fichier, la synthèse vocale pourra être utilisée en jeu.'}
      </p>
    </div>
  );
}
