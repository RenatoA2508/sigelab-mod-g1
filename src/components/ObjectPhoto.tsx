import { useState } from 'react'
import { ImageOff } from 'lucide-react'

export function ObjectPhoto({
  src,
  alt,
  className = '',
}: {
  src: string | null
  alt: string
  className?: string
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  if (!src || src === failedSrc)
    return (
      <div
        className={`photo-fallback ${className}`}
        role="img"
        aria-label="Fotografía temporalmente no disponible"
      >
        <ImageOff aria-hidden="true" size={25} />
        <span>Imagen no disponible</span>
      </div>
    )
  return (
    <img
      className={className}
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailedSrc(src)}
    />
  )
}
