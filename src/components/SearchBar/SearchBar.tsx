import React, { useState } from 'react'
import './SearchBar.css'
import type { SearchBarProps } from '../../interface/index'

function SearchBar({ placeholder = 'Caută eveniment...', onSearch, onFilter }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('')

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
    <div className="search-bar-container">
      <div className="input-group flex-grow-1">
        <span className="input-group-text bg-white" aria-hidden="true">
          <i className="fa-solid fa-magnifying-glass text-secondary"></i>
        </span>
        <input
          type="text"
          className="form-control form-input-size--md"
          placeholder={placeholder}
          value={searchQuery}
          onChange={handleChange}
        />
        {searchQuery && (
          <span className="input-group-text bg-white border-start-0">
            <button
              type="button"
              className="btn-close"
              onClick={clearSearch}
              aria-label="Șterge căutarea"
              title="Șterge"
            ></button>
          </span>
        )}
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
