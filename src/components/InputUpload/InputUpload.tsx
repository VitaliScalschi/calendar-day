import { forwardRef, useCallback, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent, InputHTMLAttributes, ReactNode } from 'react';
import './InputUpload.css';

export type InputUploadProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value'> & {
  file: File | null;
  onFileChange: (file: File | null) => void;
  helperText?: ReactNode;
  dropTitle?: string;
  dropSubtitle?: string;
  successMessage?: string;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb < 10 ? kb.toFixed(2) : kb.toFixed(1)} KB`;
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
}

function fileMatchesAccept(file: File, accept: string | undefined): boolean {
  if (!accept?.trim()) return true;
  const tokens = accept.split(',').map((s) => s.trim()).filter(Boolean);
  const name = file.name.toLowerCase();
  const mime = file.type.toLowerCase();
  for (const token of tokens) {
    if (token.startsWith('.')) {
      if (name.endsWith(token.toLowerCase())) return true;
    } else if (token.includes('*')) {
      const [base] = token.split('/');
      if (mime.startsWith(`${base.toLowerCase()}/`)) return true;
    } else if (mime === token.toLowerCase()) return true;
  }
  return false;
}

function fileIconClass(name: string): { icon: string; mod: string } {
  const lower = name.toLowerCase();
  if (lower.endsWith('.pdf')) return { icon: 'fa-file-pdf', mod: 'input-upload__file-icon--pdf' };
  if (/\.(doc|docx)$/.test(lower)) return { icon: 'fa-file-word', mod: 'input-upload__file-icon--word' };
  if (/\.(xls|xlsx)$/.test(lower)) return { icon: 'fa-file-excel', mod: 'input-upload__file-icon--excel' };
  if (/\.(jpe?g|png|gif|webp)$/.test(lower)) return { icon: 'fa-file-image', mod: 'input-upload__file-icon--image' };
  return { icon: 'fa-file-lines', mod: 'input-upload__file-icon--generic' };
}

export const InputUpload = forwardRef<HTMLInputElement, InputUploadProps>(function InputUpload(
  {
    id,
    className = '',
    file,
    onFileChange,
    helperText,
    dropTitle = 'Plasează fișierul aici',
    dropSubtitle = 'pentru a încărca',
    successMessage = 'Încărcat cu succes',
    accept,
    disabled = false,
    multiple,
    onChange,
    ...rest
  },
  ref,
) {
  const innerRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const setInputRef = useCallback(
    (node: HTMLInputElement | null) => {
      innerRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref],
  );

  const openPicker = () => {
    if (disabled) return;
    innerRef.current?.click();
  };

  const clearFile = () => {
    onFileChange(null);
    if (innerRef.current) {
      innerRef.current.value = '';
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const next = e.target.files?.[0] ?? null;
    if (next && !fileMatchesAccept(next, accept)) {
      e.target.value = '';
      return;
    }
    if (!multiple) {
      onFileChange(next);
    }
    onChange?.(e);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (disabled || multiple) return;
    const dropped = e.dataTransfer.files?.[0];
    if (!dropped) return;
    if (!fileMatchesAccept(dropped, accept)) return;
    onFileChange(dropped);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setDragActive(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setDragActive(false);
    }
  };

  const rootClass = ['input-upload', dragActive ? 'input-upload--drag-active' : '', className]
    .filter(Boolean)
    .join(' ');

  const { icon, mod } = file ? fileIconClass(file.name) : { icon: '', mod: '' };

  if (multiple) {
    return (
      <div className={rootClass}>
        <input
          ref={setInputRef}
          id={id}
          type="file"
          className="form-control form-input-size--md"
          multiple
          accept={accept}
          disabled={disabled}
          onChange={handleInputChange}
          {...rest}
        />
        {helperText ? <p className="input-upload__helper">{helperText}</p> : null}
      </div>
    );
  }

  return (
    <div
      className={rootClass}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={setInputRef}
        id={id}
        type="file"
        className="input-upload__native"
        accept={accept}
        disabled={disabled}
        onChange={handleInputChange}
        tabIndex={-1}
        aria-hidden="true"
        {...rest}
      />

      {!file ? (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label={`${dropTitle} ${dropSubtitle}`}
          className={`input-upload__dropzone ${disabled ? 'input-upload__dropzone--disabled' : ''}`}
          onClick={() => openPicker()}
          onKeyDown={(e) => {
            if (disabled) return;
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openPicker();
            }
          }}
        >
          <div className="input-upload__drop-icon" aria-hidden="true">
            <i className="fa-solid fa-cloud-arrow-up" />
          </div>
          <p className="input-upload__drop-title">{dropTitle}</p>
          <p className="input-upload__drop-sub">{dropSubtitle}</p>
        </div>
      ) : (
        <div className="input-upload__file-card">
          <div className="input-upload__file-main">
            <span className={`input-upload__file-icon ${mod}`} aria-hidden="true">
              <i className={`fa-solid ${icon}`} />
            </span>
            <div className="input-upload__file-meta">
              <p className="input-upload__file-name">{file.name}</p>
              <p className="input-upload__file-details">
                {formatFileSize(file.size)}
                <span aria-hidden="true"> • </span>
                <span className="input-upload__file-success">{successMessage}</span>
              </p>
            </div>
          </div>
          <div className="input-upload__file-actions">
            <span className="input-upload__status-ok" title={successMessage} aria-hidden="true">
              <i className="fa-solid fa-check" />
            </span>
            <button
              type="button"
              className="input-upload__remove"
              onClick={clearFile}
              disabled={disabled}
              aria-label="Elimină fișierul"
              title="Elimină fișierul"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
        </div>
      )}

      {helperText ? <p className="input-upload__helper">{helperText}</p> : null}
    </div>
  );
});

InputUpload.displayName = 'InputUpload';
