import { ButtonWithTooltip, ChangeCodeMirrorLanguage, ConditionalContents, CreateLink, InsertCodeBlock, InsertImage, InsertSandpack, InsertTable, ListsToggle, MDXEditorMethods, ShowSandpackInfo } from '@mdxeditor/editor';
import { Button, Divider } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { FileType } from './type';
import { CameraIcon, CancelIcon, FileUploadIcon, HashtagIcon, LightningIcon, NotesIcon, SendIcon, VoiceIcon } from '../Icons';
import { NoteType } from '@/server/types';
import { AttachmentsRender } from '../AttachmentRender';
import { ShowCamera } from '../CameraDialog';
import { ShowAudioDialog } from '../AudioDialog';
import { BlinkoStore } from '@/store/blinkoStore';
import { RootStore } from '@/store';
import { DialogStore } from '@/store/module/Dialog';
import { AiStore } from '@/store/aiStore';
import { eventBus } from '@/lib/event';

type ToolbarProps = {
  store: any;
  files: FileType[];
  openFileDialog: () => void;
  getInputProps: any;
  mode: 'create' | 'edit';
  isPc: boolean;
  viewMode: 'source' | 'rich-text';
  canSend: boolean;
  isSendLoading?: boolean;
  mdxEditorRef: React.RefObject<MDXEditorMethods>;
  onSend?: (args: any) => Promise<any>;
  onChange?: (content: string) => void;
  showCloseButton?: boolean;
}

export const Toolbar = ({
  store,
  files,
  mode,
  isPc,
  viewMode,
  canSend,
  isSendLoading,
  mdxEditorRef,
  onSend,
  onChange,
  openFileDialog,
  getInputProps,
  showCloseButton
}: ToolbarProps) => {
  const { t } = useTranslation();
  const blinko = RootStore.Get(BlinkoStore);
  const ai = RootStore.Get(AiStore);

  return (
    <div className='flex flex-col w-full'>
      {files.length > 0 && (
        <div className='w-full my-2'>
          <AttachmentsRender files={files} />
        </div>
      )}

      {viewMode == 'source' && <div className='text-red-500 text-xs select-none'>Source Code Mode</div>}

      <div className='flex w-full items-center'>
        <ButtonWithTooltip className='!w-[24px] !h-[24px]' title={
          blinko.noteTypeDefault == NoteType.BLINKO ? t('blinko') : t('note')
        } onClick={() => {
          blinko.noteTypeDefault = blinko.noteTypeDefault == NoteType.BLINKO ? NoteType.NOTE : NoteType.BLINKO;
        }}>
          {blinko.noteTypeDefault == NoteType.BLINKO ?
            <LightningIcon className='blinko' /> :
            <NotesIcon className='note' />
          }
        </ButtonWithTooltip>

        <ButtonWithTooltip className='!w-[24px] !h-[24px] ' title={t('insert-hashtag')} onClick={() => {
          store.inertHash();
        }}>
          <HashtagIcon />
        </ButtonWithTooltip>

        <Divider orientation="vertical" />

        <ListsToggle />
        {isPc && <InsertTable />}
        {isPc && <InsertImage />}

        {/* <CreateLink /> */}

        <ConditionalContents
          options={[
            { when: (editor) => editor?.editorType === 'codeblock', contents: () => <ChangeCodeMirrorLanguage /> },
            { when: (editor) => editor?.editorType === 'sandpack', contents: () => <ShowSandpackInfo /> },
            {
              fallback: () => (<>
                {isPc && <InsertCodeBlock />}
                {isPc && <InsertSandpack />}
              </>)
            }
          ]}
        />

        <Divider orientation="vertical" />

        <ButtonWithTooltip className='!w-[24px] !h-[24px] ' title={t('upload-file')} onClick={() => {
          openFileDialog();
        }}>
          <input {...getInputProps()} />
          <FileUploadIcon className='hover:opacity-80 transition-all' />
        </ButtonWithTooltip>

        {blinko.showAi && (
          <ButtonWithTooltip className='!w-[24px] !h-[24px] ' title={t('recording')} onClick={() => {
            ShowAudioDialog((file) => {
              store.uploadFiles([file]);
            });
          }}>
            <VoiceIcon className='primary-foreground group-hover:rotate-[180deg] transition-all' />
          </ButtonWithTooltip>
        )}

        <ButtonWithTooltip title={t('upload-file')} className='!w-[24px] !h-[24px] ' onClick={() => {
          ShowCamera((file) => {
            store.uploadFiles([file]);
          });
        }}>
          <CameraIcon className='primary-foreground group-hover:rotate-[180deg] transition-all' />
        </ButtonWithTooltip>


        <ButtonWithTooltip
          title={viewMode === 'source' ? t('preview-mode') : t('source-code')}
          className='!ml-auto'
          onClick={() => {
            const nextMode = viewMode === 'source' ? 'rich-text' : 'source';
            eventBus.emit('editor:setViewMode', nextMode);
          }}
        >
          {viewMode !== 'source' ?
            <Icon icon="tabler:source-code" className='transition-all' /> :
            <Icon icon="grommet-icons:form-view" className='transition-all !text-red-500'  />
          }
        </ButtonWithTooltip>


        {showCloseButton && (
          <Button size='sm' radius='md' onClick={() => {
            RootStore.Get(DialogStore).close();
          }} className={`group ml-2`} isIconOnly>
            <CancelIcon className='primary-foreground group-hover:rotate-[180deg] transition-all' />
          </Button>
        )}

        <Button
          isDisabled={!canSend}
          size='sm'
          radius='md'
          isLoading={isSendLoading}
          onClick={async () => {
            await onSend?.({
              content: mdxEditorRef.current?.getMarkdown(),
              files: files.map(i => ({ ...i, uploadPath: i.uploadPromise.value }))
            });
            onChange?.('');
            store.files = [];
            ai.isWriting = false;
          }}
          className={`ml-2 w-[60px] group`}
          isIconOnly
          color='primary'
        >
          {files?.some(i => i.uploadPromise?.loading?.value) ?
            <Icon icon="line-md:uploading-loop" width="24" height="24" /> :
            <SendIcon className='primary-foreground !text-primary-foreground group-hover:rotate-[-35deg] transition-all' />
          }
        </Button>
      </div>
    </div>
  );
}; 