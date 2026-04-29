import { useEffect, useMemo, useState } from 'react';
import './UsefulInfoCard.css';
import { TITLE_CARD } from './constant';
import { API_BASE_URL } from '../../shared/services/apiClient';
import {
  fetchUsefulInfoItems,
  type UsefulInfoItem,
} from '../../features/usefulInfo/services/usefulInfoService';

const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

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
    <aside className="useful-info-card p-3 mt-3 border rounded">
      <div className="d-flex justify-content-start align-items-center gap-2 pb-2">
        <i className="fa-brands fa-readme icon"></i>
        <h3 className="useful-info-card__title">{TITLE_CARD}</h3>
      </div>
      <div className="card-body bg-white">
        <div className="border rounded p-2 bg-white">
          <ul className="info-list list-unstyled mb-0">
            {visibleItems.map((item) => (
              <li key={item.id} className="info-item d-flex align-items-center gap-2 p-2 border-bottom">
                <span className="info-item-dot" aria-hidden="true">•</span>
                <a href={resolveItemUrl(item)} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                  {item.title}
                </a>
              </li>
            ))}
            {visibleItems.length === 0 ? (
              <li className="info-item p-2 text-secondary">Nu există informații active.</li>
            ) : null}
          </ul>
        </div>
      </div>
    </aside>
  );
}

export default UsefulInfoCard;
