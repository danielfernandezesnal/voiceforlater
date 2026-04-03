'use client'
import { useRef } from 'react'

interface Photo {
  file: File
  caption: string
  previewUrl: string
}

interface PhotoUploaderProps {
  photos: Photo[]
  onChange: (photos: Photo[]) => void
  locale?: string
}

const MAX_PHOTOS = 2
const MAX_MB = 5
const MAX_BYTES = MAX_MB * 1024 * 1024
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ACCEPTED_EXT = '.jpg,.jpeg,.png,.webp'

async function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const MAX_DIM = 1200
      let { width, height } = img
      if (width > MAX_DIM || height > MAX_DIM) {
        if (width > height) { height = Math.round((height * MAX_DIM) / width); width = MAX_DIM }
        else { width = Math.round((width * MAX_DIM) / height); height = MAX_DIM }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      URL.revokeObjectURL(url)
      canvas.toBlob((blob) => {
        resolve(new File([blob!], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }))
      }, 'image/jpeg', 0.82)
    }
    img.src = url
  })
}

export function PhotoUploader({ photos, onChange, locale }: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const es = locale === 'es'

  const handleFiles = async (files: FileList | null) => {
    if (!files) return
    const remaining = MAX_PHOTOS - photos.length
    const toProcess = Array.from(files).slice(0, remaining)
    const newPhotos: Photo[] = []
    for (const file of toProcess) {
      if (!ACCEPTED_TYPES.includes(file.type)) continue
      if (file.size > MAX_BYTES) continue
      const compressed = await compressImage(file)
      const previewUrl = URL.createObjectURL(compressed)
      newPhotos.push({ file: compressed, caption: '', previewUrl })
    }
    onChange([...photos, ...newPhotos])
  }

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(photos[index].previewUrl)
    onChange(photos.filter((_, i) => i !== index))
  }

  const updateCaption = (index: number, caption: string) => {
    onChange(photos.map((p, i) => i === index ? { ...p, caption } : p))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">
          {es ? 'Fotos adjuntas' : 'Attached photos'}
          <span className="text-xs text-muted-foreground ml-2">({photos.length}/{MAX_PHOTOS})</span>
        </label>
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {photos.map((photo, i) => (
            <div key={i} className="space-y-2">
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted">
                <img src={photo.previewUrl} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <input
                type="text"
                value={photo.caption}
                onChange={(e) => updateCaption(i, e.target.value)}
                placeholder={es ? 'Descripción (opcional)' : 'Caption (optional)'}
                maxLength={100}
                className="w-full px-3 py-1.5 text-xs bg-input border border-border rounded-lg placeholder:text-muted-foreground focus:ring-1 focus:ring-ring focus:border-transparent"
              />
            </div>
          ))}
        </div>
      )}

      {photos.length < MAX_PHOTOS && (
        <label
          htmlFor="photo-upload"
          className="flex items-center gap-3 p-3 border border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-accent/5 transition-all"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground flex-shrink-0">
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
          </svg>
          <div>
            <p className="text-sm font-medium text-foreground">
              {es ? 'Agregar foto' : 'Add photo'}
            </p>
            <p className="text-xs text-muted-foreground">
              {es ? `JPG, PNG, WEBP · Máx. ${MAX_MB}MB · hasta ${MAX_PHOTOS} fotos` : `JPG, PNG, WEBP · Max. ${MAX_MB}MB · up to ${MAX_PHOTOS} photos`}
            </p>
          </div>
          <input
            ref={inputRef}
            id="photo-upload"
            type="file"
            accept={ACCEPTED_EXT}
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </label>
      )}
    </div>
  )
}
