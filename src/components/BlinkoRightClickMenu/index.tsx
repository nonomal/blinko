import { observer } from "mobx-react-lite";
import { BlinkoStore } from '@/store/blinkoStore';
import { Divider, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from '@nextui-org/react';
import { _ } from '@/lib/lodash';
import { useTranslation } from 'react-i18next';
import { ContextMenu, ContextMenuItem } from '@/components/Common/ContextMenu';
import { Icon } from '@iconify/react';
import { PromiseCall } from '@/store/standard/PromiseState';
import { api } from '@/lib/trpc';
import { RootStore } from "@/store";
import { DialogStore } from "@/store/module/Dialog";
import { BlinkoEditor } from "../BlinkoEditor";
import { useEffect, useState } from "react";
import { NoteType } from "@/server/types";
import { useRouter } from "next/router";
import { AiStore } from "@/store/aiStore";

export const ShowEditBlinkoModel = (size: string = '2xl', mode: 'create' | 'edit' = 'edit') => {
  const blinko = RootStore.Get(BlinkoStore)
  RootStore.Get(DialogStore).setData({
    size: size as any,
    isOpen: true,
    onlyContent: true,
    isDismissable: false,
    content: <BlinkoEditor showCloseButton mode={mode} key='edit-key' onSended={() => {
      RootStore.Get(DialogStore).close()
      blinko.isCreateMode = false
    }} />
  })
}
export const EditItem = observer(() => {
  const { t } = useTranslation();
  const blinko = RootStore.Get(BlinkoStore)
  const [isDetailPage, setIsDetailPage] = useState(false)
  const router = useRouter()
  useEffect(() => {
    setIsDetailPage(router.pathname.includes('/detail'))
  }, [router.pathname])
  return <div className="flex items-start gap-2" onClick={e => ShowEditBlinkoModel(isDetailPage ? '5xl' : '3xl')}>
    <Icon icon="tabler:edit" width="20" height="20" />
    <div>{t('edit')}</div>
  </div>
})

export const MutiSelectItem = observer(() => {
  const { t } = useTranslation();
  const blinko = RootStore.Get(BlinkoStore)
  return <div className="flex items-start gap-2" onClick={e => {
    blinko.isMultiSelectMode = true
    blinko.onMultiSelectNote(blinko.curSelectedNote?.id!)
  }}>
    <Icon icon="mingcute:multiselect-line" width="20" height="20" />
    <div>{t('multiple-select')}</div>
  </div>
})

export const ConvertItemFunction = () => {
  const blinko = RootStore.Get(BlinkoStore)
  blinko.upsertNote.call({
    id: blinko.curSelectedNote?.id,
    type: blinko.curSelectedNote?.type == NoteType.NOTE ? NoteType.BLINKO : NoteType.NOTE
  })
}

export const ConvertItem = observer(() => {
  const { t } = useTranslation();
  const blinko = RootStore.Get(BlinkoStore)
  return <div className="flex items-start gap-2" onClick={() => { ConvertItemFunction() }}>
    <Icon icon="ri:exchange-2-line" width="20" height="20" />
    <div>{t('convert-to')} {blinko.curSelectedNote?.type == NoteType.NOTE ?
      <span className='text-yellow-500'>{t('blinko')}</span> : <span className='text-blue-500'>{t('note')}</span>}</div>
  </div>
})

export const TopItem = observer(() => {
  const { t } = useTranslation();
  const blinko = RootStore.Get(BlinkoStore)
  return <div className="flex items-start gap-2" onClick={e => {
    blinko.upsertNote.call({
      id: blinko.curSelectedNote?.id,
      isTop: !blinko.curSelectedNote?.isTop
    })
  }}>
    <Icon icon="lets-icons:pin" width="20" height="20" />
    <div>{blinko.curSelectedNote?.isTop ? t('cancel-top') : t('top')}</div>
  </div>
})

export const PublicItem = observer(() => {
  const { t } = useTranslation();
  const blinko = RootStore.Get(BlinkoStore)
  return <div className="flex items-start gap-2" onClick={e => {
    blinko.upsertNote.call({
      id: blinko.curSelectedNote?.id,
      isShare: !blinko.curSelectedNote?.isShare
    })
  }}>
    <Icon icon="ic:outline-share" width="20" height="20" />
    <div>{blinko.curSelectedNote?.isShare ? t('unset-as-public') : t('set-as-public')}</div>
  </div>
})

export const ArchivedItem = observer(() => {
  const { t } = useTranslation();
  const blinko = RootStore.Get(BlinkoStore)
  return <div className="flex items-start gap-2" onClick={e => {
    blinko.upsertNote.call({ id: blinko.curSelectedNote?.id, isArchived: !blinko.curSelectedNote?.isArchived })
  }}>
    <Icon icon="eva:archive-outline" width="20" height="20" />
    {blinko.curSelectedNote?.isArchived ? t('recovery') : t('archive')}
  </div>
})

export const AITagItem = observer(() => {
  const { t } = useTranslation();
  const blinko = RootStore.Get(BlinkoStore)
  const aiStore = RootStore.Get(AiStore)
  return (
    <div className="flex items-start gap-2" onClick={e => {
      aiStore.autoTag.call(blinko.curSelectedNote?.id!, blinko.curSelectedNote?.content!)
    }}>
      <Icon icon="carbon:ai-status" width="20" height="20" />
      <div>{t('ai-tag')}</div>
    </div>
  );
});

export const DeleteItem = observer(() => {
  const { t } = useTranslation();
  const blinko = RootStore.Get(BlinkoStore)
  return <div className="flex items-start gap-2 text-red-500" onClick={async e => {
    PromiseCall(api.notes.deleteMany.mutate({ ids: [blinko.curSelectedNote?.id!] }))
    api.ai.embeddingDelete.mutate({ id: blinko.curSelectedNote?.id! })
  }}>
    <Icon icon="mingcute:delete-2-line" width="20" height="20" />
    <div>{t('delete')}</div>
  </div>
})

export const BlinkoRightClickMenu = observer(() => {
  const [isDetailPage, setIsDetailPage] = useState(false)
  const router = useRouter()
  const blinko = RootStore.Get(BlinkoStore)

  useEffect(() => {
    setIsDetailPage(router.pathname.includes('/detail'))
  }, [router.pathname])

  return <ContextMenu className='font-bold' id="blink-item-context-menu" hideOnLeave={false} animation="zoom">
    <ContextMenuItem >
      <EditItem />
    </ContextMenuItem>

    {!isDetailPage ? <ContextMenuItem >
      <MutiSelectItem />
    </ContextMenuItem> : <></>}

    <ContextMenuItem >
      <ConvertItem />
    </ContextMenuItem>

    <ContextMenuItem>
      <TopItem />
    </ContextMenuItem>

    <ContextMenuItem>
      <PublicItem />
    </ContextMenuItem>

    <ContextMenuItem>
      <ArchivedItem />
    </ContextMenuItem>

    {blinko.config.value?.isUseAI ? (
      <ContextMenuItem>
        <AITagItem />
      </ContextMenuItem>
    ) : <></>}

    <ContextMenuItem className='select-none divider hover:!bg-none'>
      <Divider orientation="horizontal" />
    </ContextMenuItem>

    <ContextMenuItem >
      <DeleteItem />
    </ContextMenuItem>
  </ContextMenu>
})

export const LeftCickMenu = observer(({ onTrigger, className }: { onTrigger: () => void, className: string }) => {
  const [isDetailPage, setIsDetailPage] = useState(false)
  const router = useRouter()
  const blinko = RootStore.Get(BlinkoStore)

  useEffect(() => {
    setIsDetailPage(router.pathname.includes('/detail'))
  }, [router.pathname])

  return <Dropdown onOpenChange={e => onTrigger()}>
    <DropdownTrigger >
      <Icon onClick={onTrigger} className={`${className} text-desc hover:text-primary cursor-pointer hover:scale-1.3 transition-all`} icon="fluent:more-vertical-16-regular" width="16" height="16" />
    </DropdownTrigger>
    <DropdownMenu aria-label="Static Actions">
      <DropdownItem key="EditItem"><EditItem /></DropdownItem>
      {!isDetailPage ? <DropdownItem key="MutiSelectItem"><MutiSelectItem /></DropdownItem> : <></>}
      <DropdownItem key="ConvertItem"> <ConvertItem /></DropdownItem>
      <DropdownItem key="TopItem" > <TopItem />  </DropdownItem>
      <DropdownItem key="ShareItem" > <PublicItem />  </DropdownItem>
      <DropdownItem key="ArchivedItem" >
        <ArchivedItem />
      </DropdownItem>

      {blinko.config.value?.isUseAI ? (
        <DropdownItem key="AITagItem">
          <AITagItem />
        </DropdownItem>
      ) : <></>}

      <DropdownItem key="DeleteItem" className="text-danger" >
        <DeleteItem />
      </DropdownItem>
    </DropdownMenu>
  </Dropdown>
})