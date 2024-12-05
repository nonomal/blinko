import { Icon } from '@iconify/react';
import { Button, Tooltip } from '@nextui-org/react';
import { Copy } from "../Common/Copy";
import { LeftCickMenu } from "../BlinkoRightClickMenu";
import { BlinkoStore } from '@/store/blinkoStore';
import { Note } from '@/server/types';
import { ToastPlugin } from "@/store/module/Toast/Toast";
import { RootStore } from '@/store';
import copy from "copy-to-clipboard";
import dayjs from '@/lib/dayjs';
import { useTranslation } from 'react-i18next';
import { _ } from '@/lib/lodash';
import { useIsIOS } from '@/lib/hooks';

interface CardHeaderProps {
  blinkoItem: Note;
  blinko: BlinkoStore;
  isShareMode: boolean;
  isExpanded?: boolean;
}

export const CardHeader = ({ blinkoItem, blinko, isShareMode, isExpanded }: CardHeaderProps) => {
  const { t } = useTranslation();
  const iconSize = isExpanded ? '20' : '16';
  const isIOSDevice = useIsIOS();
  
  return (
    <div className={`flex items-center select-none ${isExpanded ? 'mb-4' : 'mb-2'}`}>
      <div className={`flex items-center w-full gap-1 ${isExpanded ? 'text-base' : 'text-xs'}`}>
        {isExpanded && (
          <Button
            isIconOnly
            variant='flat'
            size='sm'
            className='mr-2'
            onClick={() => {
              window.history.back();
            }}
          >
            <Icon icon="tabler:arrow-left" width={iconSize} height={iconSize} />
          </Button>
        )}

        {blinkoItem.isShare && !isShareMode && (
          <Tooltip content={t('go-to-share-page')}>
            <Icon
              className="cursor-pointer text-[#8600EF]"
              icon="prime:eye"
              width={iconSize}
              height={iconSize}
              onClick={(e) => {
                e.stopPropagation();
                window.open(`/share`);
              }}
            />
          </Tooltip>
        )}

        <div className={`${isExpanded ? 'text-sm' : 'text-xs'} text-desc`}>
          {blinko.config.value?.timeFormat == 'relative'
            ? dayjs(blinko.config.value?.isOrderByCreateTime ? blinkoItem.createdAt : blinkoItem.updatedAt).fromNow()
            : dayjs(blinko.config.value?.isOrderByCreateTime ? blinkoItem.createdAt : blinkoItem.updatedAt).format(blinko.config.value?.timeFormat ?? 'YYYY-MM-DD HH:mm:ss')
          }
        </div>

        <Copy
          size={16}
          className={`ml-auto ${
            isIOSDevice 
              ? 'opacity-100' 
              : 'opacity-0 group-hover/card:opacity-100 group-hover/card:translate-x-0 translate-x-1'
          }`}
          content={blinkoItem.content + `\n${blinkoItem.attachments?.map(i => window.location.origin + i.path).join('\n')}`}
        />

        <ShareButton blinkoItem={blinkoItem} blinko={blinko} isIOSDevice={isIOSDevice} />

        {blinkoItem.isTop && (
          <Icon
            className={isIOSDevice ? 'ml-[10px] text-[#EFC646]' : "ml-auto group-hover/card:ml-2 text-[#EFC646]"}
            icon="solar:bookmark-bold"
            width={iconSize}
            height={iconSize}
          />
        )}

        {!isShareMode && (
          <LeftCickMenu
            className={isIOSDevice ? 'ml-[10px]' : (blinkoItem.isTop ? "ml-[10px]" : 'ml-auto group-hover/card:ml-2')}
            onTrigger={() => { blinko.curSelectedNote = _.cloneDeep(blinkoItem) }}
          />
        )}
      </div>
    </div>
  );
};

const ShareButton = ({ blinkoItem, blinko, isIOSDevice }: { blinkoItem: Note, blinko: BlinkoStore, isIOSDevice: boolean }) => {
  return (
    <Tooltip content={blinkoItem.isShare ? 'Copy share link' : 'Share and copy link'}>
      <Icon
        icon="tabler:share-2"
        width="16"
        height="16"
        className={`cursor-pointer text-desc ml-2 ${
          isIOSDevice 
            ? 'opacity-100' 
            : 'opacity-0 group-hover/card:opacity-100 group-hover/card:translate-x-0 translate-x-1'
        }`}
        onClick={async (e) => {
          e.stopPropagation();
          if (!blinkoItem.isShare) {
            await blinko.upsertNote.call({ id: blinkoItem.id, isShare: true, showToast: false });
          }
          copy(`${window.location.origin}/share/${blinkoItem.id}`);
          RootStore.Get(ToastPlugin).success('Copied successfully~ Go to share!');
        }}
      />
    </Tooltip>
  );
};