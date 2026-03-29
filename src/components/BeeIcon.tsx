interface Props {
  size?: number
}

export default function BeeIcon({ size = 24 }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      aria-hidden="true"
    >
      <ellipse cx="28" cy="44" rx="22" ry="12" fill="#DBEAFE" stroke="#93C5FD" strokeWidth="1.5" transform="rotate(-20 28 44)" opacity="0.92"/>
      <ellipse cx="72" cy="44" rx="22" ry="12" fill="#DBEAFE" stroke="#93C5FD" strokeWidth="1.5" transform="rotate(20 72 44)" opacity="0.92"/>
      <ellipse cx="50" cy="62" rx="16" ry="21" fill="#FCD34D"/>
      <rect x="34" y="55" width="32" height="6" rx="2" fill="#1C1917"/>
      <rect x="34" y="66" width="32" height="6" rx="2" fill="#1C1917"/>
      <ellipse cx="50" cy="83" rx="4" ry="5" fill="#B45309"/>
      <circle cx="50" cy="38" r="13" fill="#FCD34D"/>
      <path d="M44 27 Q40 17 35 13" stroke="#1C1917" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <circle cx="34" cy="12" r="3.5" fill="#1C1917"/>
      <path d="M56 27 Q60 17 65 13" stroke="#1C1917" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <circle cx="66" cy="12" r="3.5" fill="#1C1917"/>
    </svg>
  )
}
