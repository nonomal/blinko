import { Image } from '@nextui-org/react';
import { PhotoProvider, PhotoView } from 'react-photo-view';

interface ImageWrapperProps {
  src: string;
  width?: number;
  height?: number;
}

export const ImageWrapper = ({ src, width, height }: ImageWrapperProps) => {
  const props = { width, height }
  return (
    <PhotoProvider>
      <PhotoView src={src}>
        <Image src={src} {...props} />
      </PhotoView>
    </PhotoProvider>
  );
}; 