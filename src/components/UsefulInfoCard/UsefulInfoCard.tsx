import { useEffect, useMemo, useState } from 'react';
import './UsefulInfoCard.css';
import { API_BASE_URL } from '../../shared/services/apiClient';
import {
  fetchUsefulInfoItems,
  type UsefulInfoItem,
} from '../../features/usefulInfo/services/usefulInfoService';

const TITLE_CARD = 'Informații Utile';
const HINT_TEXT = 'Găsești aici toate documentele și informațiile importante pentru o bună informare.';

const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

/** Alege o iconiță Bootstrap Icons pe baza titlului (sau a câmpului `icon` dacă e setat). */
function resolveItemIcon(item: UsefulInfoItem): string {
  if (item.icon?.trim()) return item.icon.trim();

  const title = item.title.toLowerCase();
  if (title.includes('contact')) return 'bi bi-headset';
  if (
    title.includes('cadru normativ') ||
    title.includes('legisla') ||
    title.includes('cod electoral')
  ) {
    return 'bi bi-bank';
  }
  if (title.includes('instruc') || title.includes('ghid')) return 'bi bi-clipboard-check';
  if (title.includes('regulament')) return 'bi bi-file-earmark-text';
  if (title.includes('hot') && title.includes('rare')) return 'bi bi-file-earmark-ruled';
  if (title.includes('comunicat') || title.includes('știri') || title.includes('stiri')) {
    return 'bi bi-megaphone';
  }
  if (title.includes('raport')) return 'bi bi-file-bar-graph';

  if (item.type === 'external-link') return 'bi bi-link-45deg';
  return 'bi bi-file-earmark-text';
}

function UsefulInfoCard() {
  const [items, setItems] = useState<UsefulInfoItem[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const loaded = await fetchUsefulInfoItems(true);
        setItems(loaded);
      } catch {
        setItems([]);
      }
    };
    load();
  }, []);

  const visibleItems = useMemo(
    () =>
      items
        .filter((item) => item.status)
        .sort((a, b) => a.order - b.order),
    [items],
  );

  const resolveItemUrl = (item: UsefulInfoItem) => {
    if (item.type === 'document') {
      return `${API_ORIGIN}/api/useful-infos/${item.id}/download`;
    }

    if (item.type === 'external-link') {
      if (item.slug.startsWith('http://') || item.slug.startsWith('https://')) return item.slug;
      return `https://${item.slug}`;
    }

    return '#';
  };

  return (
    <aside className="useful-info-card" aria-label={TITLE_CARD}>
      <h3 className="useful-info-card__heading">{TITLE_CARD}</h3>

      <div className="useful-info-card__list-wrap">
        {visibleItems.length > 0 ? (
          <ul className="useful-info-card__list" role="list">
            {visibleItems.map((item) => (
              <li key={item.id} className="useful-info-card__item">
                <a
                  href={resolveItemUrl(item)}
                  target={item.type === 'external-link' ? '_blank' : undefined}
                  rel={item.type === 'external-link' ? 'noopener noreferrer' : undefined}
                  className="useful-info-card__link"
                  aria-label={item.title}
                >
                  <span className="useful-info-card__item-icon" aria-hidden>
                    <i className={resolveItemIcon(item)} />
                  </span>
                  <span className="useful-info-card__item-title">{item.title}</span>
                  <i
                    className="bi bi-chevron-right useful-info-card__item-chevron"
                    aria-hidden
                  />
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="useful-info-card__empty">Nu există informații active.</p>
        )}
      </div>

      <div className="useful-info-card__hint" role="note">
        <i className="bi bi-info-circle useful-info-card__hint-icon" aria-hidden />
        <span className="useful-info-card__hint-text">{HINT_TEXT}</span>
      </div>
    </aside>
  );
}

export default UsefulInfoCard;
