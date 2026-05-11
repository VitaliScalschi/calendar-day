import React, { useEffect, useState } from 'react'
import './SearchBar.css'
import type { SearchBarProps } from '../../interface/index'

function SearchBar({
  inputId,
  placeholder = 'Caută eveniment...',
  value,
  onSearch,
  onFilter,
  className = '',
  containerClassName = '',
  style,
}: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState(value ?? '')

  useEffect(() => {
    if (typeof value === 'string') {
      setSearchQuery(value)
    }
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    onSearch(value)
  }

  const clearSearch = () => {
    setSearchQuery('')
    onSearch('')
  }

  return (
    <div className={`search-bar-container ${containerClassName}`.trim()} style={style}>
      <div className={`search-bar ${className}`.trim()}>
        <input
          id={inputId}
          type="text"
          className="search-bar__input"
          placeholder={placeholder}
          value={searchQuery}
          onChange={handleChange}
        />
        <div className="search-bar__actions">
          {searchQuery ? (
            <button
              type="button"
              className="search-bar__clear-btn clear-btn"
              onClick={clearSearch}
              aria-label="Șterge căutarea"
              title="Șterge"
            >
              <i className="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>
          ) : null}
          <span className="search-bar__divider" aria-hidden="true"></span>
          <span className="search-bar__icon" aria-hidden="true">
            <i className="fa-solid fa-magnifying-glass"></i>
          </span>
        </div>
      </div>
      {onFilter && (
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={onFilter}
        >
          Filtrează
        </button>
      )}
    </div>
  )
}

export default SearchBar
