import './letter-swap-text.css'
import type { CSSProperties } from 'react'

type LetterSwapTextProps = {
  children: string
  className?: string
}

export default function LetterSwapText({ children, className = '' }: LetterSwapTextProps) {
  return (
    <span className={`letter-swap-text ${className}`} role="text" aria-label={children} tabIndex={0}>
      <span className="letter-swap-text__visual" aria-hidden="true">
        {Array.from(children).map((letter, index) => (
          <span className="letter-swap-text__cell" key={`${letter}-${index}`} style={{ '--letter-index': index } as CSSProperties}>
            <span className="letter-swap-text__turn">
              <span className="letter-swap-text__face">{letter === ' ' ? '\u00a0' : letter}</span>
              <span className="letter-swap-text__face letter-swap-text__face--back">{letter === ' ' ? '\u00a0' : letter}</span>
            </span>
          </span>
        ))}
      </span>
    </span>
  )
}
