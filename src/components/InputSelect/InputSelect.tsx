import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Button } from '../Button';
import { Label } from '../Label';
import './InputSelect.css';

export type InputSelectOption<T extends string = string> = {
  value: T;
  label: ReactNode;
  /** Ex. număr între paranteze, afișat în listă și implicit în buton. */
  suffix?: ReactNode;
  disabled?: boolean;
};

export type InputSelectProps<T extends string = string> = {
  /** `htmlFor` pe etichetă și `id` pe butonul trigger */
  id: string;
  label: ReactNode;
  options: InputSelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  /** Când valoarea nu se regăsește în `options`. */
  placeholder?: string;
  /** Dacă e true (implicit), în buton se afișează și `suffix` pentru opțiunea selectată. */
  showSuffixInTrigger?: boolean;
  className?: string;
  toggleAriaLabel?: string;
  /** Înălțime maximă meniu (ex. `180px`). */
  menuMaxHeight?: string;
  /** Conținut sub dropdown (ex. câmpuri dată). */
  children?: ReactNode;
  /** Etichetă: `filter` (panou filtre) sau `form` (modal / formulare admin). */
  labelVariant?: 'filter' | 'form';
};

function InputSelect<T extends string>({
  id,
  label,
  options,
  value,
  onChange,
  disabled = false,
  placeholder = 'Selectează…',
  showSuffixInTrigger = true,
  className = '',
  toggleAriaLabel,
  menuMaxHeight,
  children,
  labelVariant = 'filter',
}: InputSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleMouseDown = (event: MouseEvent) => {
      const node = rootRef.current;
      const target = event.target as Node | null;
      if (node && target && !node.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [open]);

  const selected = options.find((o) => o.value === value);

  const triggerContent = (() => {
    if (!selected) return placeholder;
    if (!showSuffixInTrigger || selected.suffix == null || selected.suffix === '') {
      return selected.label;
    }
    return (
      <>
        {selected.label} {selected.suffix}
      </>
    );
  })();

  const menuStyle: CSSProperties | undefined = menuMaxHeight
    ? { '--input-select-menu-max-height': menuMaxHeight }
    : undefined;

  return (
    <div className={['input-select', className].filter(Boolean).join(' ')}>
      <Label className="mb-0" htmlFor={id} variant={labelVariant}>
        {label}
      </Label>
      <div className="input-select__dropdown" ref={rootRef}>
        <div className="input-select__control">
          <Button
            id={id}
            type="button"
            variant="light"
            className="input-select__button w-100 d-flex align-items-center"
            onClick={() => !disabled && setOpen((v) => !v)}
            aria-expanded={open}
            aria-haspopup="listbox"
            disabled={disabled}
            aria-label={toggleAriaLabel}
          >
            <span className="input-select__trigger-text">{triggerContent}</span>
            <i className={`fa-solid ${open ? 'fa-chevron-up' : 'fa-chevron-down'}`} aria-hidden />
          </Button>
        </div>
        {open && !disabled ? (
          <div className="input-select__menu" role="listbox" style={menuStyle}>
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={value === opt.value}
                disabled={opt.disabled}
                className={`input-select__option ${value === opt.value ? 'is-active' : ''}`}
                onClick={() => {
                  if (opt.disabled) return;
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                <span>{opt.label}</span>
                {opt.suffix != null && opt.suffix !== '' ? <span>{opt.suffix}</span> : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {children ? <div className="input-select__after">{children}</div> : null}
    </div>
  );
}

export default InputSelect;
