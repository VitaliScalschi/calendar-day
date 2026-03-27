import React from 'react'
import ElectionDayCard from '../ElectionDayCard/ElectionDayCard'
import Calendar from '../Calendar/Calendar'
import './UseInfo.css'
import { TITLE_CARD, INFO_ITEMS } from './constant'
import { convertFromSQLDate } from '../../utils/dateUtils'
import type { UseInfoProps } from '../../interface/index'

function UseInfo({ activeTab, selectedDateKey, onSelectDateKey }: UseInfoProps) {

  const formatEday = (eday: string | undefined): string => {
    if (!eday) return 'Data nu este disponibilă';
    
    if (/^\d{2}\/\d{2}\/\d{4}/.test(eday)) {
      return eday;
    }
    
    if (/^\d{4}-\d{2}-\d{2}/.test(eday)) {
      return convertFromSQLDate(eday);
    }
    
    return eday;
  };

  const eday = activeTab ? formatEday(activeTab.eday) : undefined;
  const title = activeTab?.title;

  return (
    <section className="useful-info">
      <ElectionDayCard 
        eday={eday} 
        title={title} 
        deadlines={activeTab?.deadlines}
      />
      <Calendar
        eday={activeTab?.eday}
        deadlines={activeTab?.deadlines}
        selectedDateKey={selectedDateKey}
        onSelectDateKey={onSelectDateKey}
      />

      <div className="card border-0 shadow-sm mb-4 useful-info-card overflow-hidden">
        <div className="card-header useful-info-title d-flex align-items-center gap-2 py-2 px-3">
          <span aria-hidden="true">📘</span>
          <h2 className="h5 mb-0 text-white fw-semibold">{TITLE_CARD}</h2>
        </div>
        <div className="card-body p-3 bg-light-subtle">
          <div className="useful-info-content border rounded-3 p-3 bg-white">
            <ul className="info-list list-unstyled mb-0">
              {INFO_ITEMS.map((item, index) => (
                <li key={index} className="info-item d-flex align-items-center gap-2 py-2 border-bottom">
                  <span className="info-item-dot" aria-hidden="true">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

export default UseInfo

