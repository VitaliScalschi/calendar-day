import './UseInfo.css'
import { TITLE_CARD, INFO_ITEMS } from './constant'

function UseInfo() {
  return (
    <aside className="useful-info-card p-3 mt-3 border rounded">
        <div className='d-flex justify-content-start align-items-center gap-2 pb-2'>
          <i className="fa-brands fa-readme icon"></i>
          <h3 className="useful-info-card__title">{TITLE_CARD}</h3>
        </div>
        <div className="card-body bg-white">
          <div className="border rounded p-2 bg-white">
            <ul className="info-list list-unstyled mb-0">
              {INFO_ITEMS.map((item, index) => (
                <li key={index} className="info-item d-flex align-items-center gap-2 p-2 border-bottom">
                  <span className="info-item-dot" aria-hidden="true">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
    </aside>
  )
}

export default UseInfo

