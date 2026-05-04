import { useState } from 'react';

export type PasswordInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>;

export function PasswordInput({ className = '', ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const inputClass = [className, 'pe-5'].filter(Boolean).join(' ').trim();

  return (
    <div className="position-relative">
      <input {...props} type={visible ? 'text' : 'password'} className={inputClass || undefined} />
      <button
        type="button"
        className="btn btn-link position-absolute top-50 end-0 translate-middle-y px-2 py-1 lh-1 text-body-secondary text-decoration-none border-0 shadow-none"
        aria-label={visible ? 'Ascunde parola' : 'Arată parola'}
        aria-pressed={visible}
        onClick={() => setVisible((v) => !v)}
      >
        <i className={`fa-solid ${visible ? 'fa-eye-slash' : 'fa-eye'}`} aria-hidden="true" />
      </button>
    </div>
  );
}
