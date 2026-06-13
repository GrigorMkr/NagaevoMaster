import { memo, useMemo, useState, type ImgHTMLAttributes } from 'react';
import { listingFallbackChain } from '@/utils/listingImageUrl';

interface ListingPhotoProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
}

const ListingPhoto = memo(function ListingPhoto({
  src,
  alt = '',
  loading = 'lazy',
  decoding = 'async',
  onError,
  ...props
}: ListingPhotoProps) {
  const sources = useMemo(() => listingFallbackChain(src), [src]);
  const [sourceIndex, setSourceIndex] = useState(0);
  const currentSrc = sources[sourceIndex] ?? sources[sources.length - 1] ?? src;

  return (
    <img
      {...props}
      src={currentSrc}
      alt={alt}
      loading={loading}
      decoding={decoding}
      onError={(event) => {
        if (sourceIndex < sources.length - 1) {
          setSourceIndex((index) => index + 1);
          return;
        }
        onError?.(event);
      }}
    />
  );
});

export {
  ListingPhoto,
}
