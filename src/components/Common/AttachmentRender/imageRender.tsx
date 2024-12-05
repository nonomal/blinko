import React, { useEffect, useMemo, useState } from 'react';
import { FileType } from '../Editor/type';
import { Image, Skeleton } from '@nextui-org/react';
import { PhotoProvider, PhotoView } from 'react-photo-view';
import { Icon } from '@iconify/react';
import { DeleteIcon, DownloadIcon } from './icons';
import { observer } from 'mobx-react-lite';
import { RootStore } from '@/store';
import { useMediaQuery } from 'usehooks-ts';

type IProps = {
  files: FileType[]
  preview?: boolean
  columns?: number
}
const ImageThumbnailRender = ({ file, className }: { file: FileType, className?: string }) => {
  const [isOriginalError, setIsOriginalError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(
    file.preview.replace('/api/file/', '/api/file/thumbnail_')
  );
  useEffect(() => {
    if (isOriginalError) {
      setCurrentSrc('/image-fallback.svg')
    }
  }, [isOriginalError])
  return <Image
    src={currentSrc}
    onError={() => {
      if (file.preview == currentSrc) {
        return setIsOriginalError(true)
      }
      setCurrentSrc(file.preview)
    }}
    // style={{ borderRadius: '13px' }}
    className={className}
  />
}

const ImageRender = observer((props: IProps) => {
  const { files, preview = false, columns = 3 } = props
  const isPc = useMediaQuery('(min-width: 768px)')
  const images = files?.filter(i => i.previewType == 'image')

  const imageRenderClassName = useMemo(() => {
    const imageLength = files?.filter(i => i.previewType == 'image')?.length
    if (!preview && !isPc) {
      return `flex items-center overflow-x-scroll gap-2`
    }
    if (imageLength == 1) {
      return `grid grid-cols-2 gap-2`
    }
    if (imageLength > 1 && imageLength <= 5) {
      return `grid grid-cols-2 gap-2`
    }
    if (imageLength > 5) {
      return `grid grid-cols-3 gap-2`
    }
    return ''
  }, [images])

  const imageHeight = useMemo(() => {
    const imageLength = files?.filter(i => i.previewType == 'image')?.length
    if (!preview&& !isPc) {
      return `h-[80px] w-[80px] min-w-[80px]`
    }
    if (imageLength == 1) {
      return `h-[200px] max-h-[200px] md:max-w-[200px]`
    }
    if (imageLength > 1 && imageLength <= 5) {
      return `md:h-[180px] h-[160px]`
    }
    if (imageLength > 5) {
      return `lg:h-[160px] md:h-[120px] h-[100px]`
    }
    return ''
  }, [images])

  return <div className={imageRenderClassName}>
    <PhotoProvider>
      {images.map((file, index) => (
        <div className={`relative group w-full ${imageHeight}`}>
          {file.uploadPromise?.loading?.value && <div className='absolute inset-0 flex items-center justify-center w-full h-full'>
            <Icon icon="line-md:uploading-loop" width="40" height="40" />
          </div>}
          <div className='w-full'>
            <PhotoView src={file.preview}>
              <div>
                <ImageThumbnailRender file={file} className={`mb-4 ${imageHeight} object-cover md:w-[1000px]`} />
              </div>
            </PhotoView>
          </div>
          {!file.uploadPromise?.loading?.value && !preview &&
            <DeleteIcon className='absolute z-10 right-[5px] top-[5px]' files={files} file={file} />
          }
          {preview && <DownloadIcon file={file} />
          }
        </div>
      ))}
    </PhotoProvider>
  </div>
})

export { ImageRender }