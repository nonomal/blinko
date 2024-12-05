import '@mdxeditor/editor/style.css';
import '@/styles/editor.css';
import { RootStore } from '@/store';
import { PromiseState } from '@/store/standard/PromiseState';
import { MDXEditorMethods, toolbarPlugin } from '@mdxeditor/editor';
import { Button, Card, Divider, Image } from '@nextui-org/react';
import { useTheme } from 'next-themes';
import React, { ReactElement, useEffect, useState, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { helper } from '@/lib/helper';
import { FileType, OnSendContentType } from './type';
import { MyPlugins, ProcessCodeBlocks } from './editorPlugins';
import { BlinkoStore } from '@/store/blinkoStore';
import { eventBus } from '@/lib/event';
import { _ } from '@/lib/lodash';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from 'usehooks-ts';
import { api } from '@/lib/trpc';
import { NoteType, type Attachment } from '@/server/types';
import { IsTagSelectVisible, showTagSelectPop } from '../PopoverFloat/tagSelectPop';
import { showAiWriteSuggestions } from '../PopoverFloat/aiWritePop';
import { AiStore } from '@/store/aiStore';
import { usePasteFile } from '@/lib/hooks';
import { Toolbar } from './toolBar';

const { MDXEditor } = await import('@mdxeditor/editor')

// https://mdxeditor.dev/editor/docs/theming
// https://react-dropzone.js.org/

type IProps = {
  mode: 'create' | 'edit',
  content: string,
  onChange?: (content: string) => void,
  onHeightChange?: () => void,
  onSend?: (args: OnSendContentType) => Promise<any>,
  isSendLoading?: boolean,
  bottomSlot?: ReactElement<any, any>,
  originFiles?: Attachment[],
  showCloseButton?: boolean
}

export const HandleFileType = (originFiles: Attachment[]): FileType[] => {
  if (originFiles?.length == 0) return []
  const res = originFiles?.map(file => {
    const extension = helper.getFileExtension(file.name)
    const previewType = helper.getFileType(file.type, file.name)
    return {
      name: file.name,
      size: file.size,
      previewType,
      extension: extension ?? '',
      preview: file.path,
      uploadPromise: new PromiseState({ function: async () => file.path }),
      type: file.type
    }
  })
  res?.map(i => i.uploadPromise.call())
  return res
}

export const getEditorElements = () => {
  const editorElements = document.querySelectorAll('._contentEditable_uazmk_379') as NodeListOf<HTMLElement>
  return editorElements
}


export const handleEditorKeyEvents = () => {
  const editorElements = getEditorElements()
  editorElements.forEach(element => {
    element.addEventListener('keydown', (e) => {
      const isTagSelectVisible = IsTagSelectVisible()
      if (e.key === 'Enter' && isTagSelectVisible) {
        e.preventDefault()
        return false
      }
    }, true)
  })
}

type ViewMode = 'source' | 'rich-text';

const Editor = observer(({ content, onChange, onSend, isSendLoading, bottomSlot, originFiles, mode, onHeightChange, showCloseButton }: IProps) => {
  content = ProcessCodeBlocks(content)
  const [canSend, setCanSend] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('rich-text')
  const { t } = useTranslation()
  const isPc = useMediaQuery('(min-width: 768px)')
  const mdxEditorRef = React.useRef<MDXEditorMethods>(null)
  const cardRef = React.useRef(null)
  const blinko = RootStore.Get(BlinkoStore)
  const ai = RootStore.Get(AiStore)
  const { theme } = useTheme();

  const pastedFiles = usePasteFile(cardRef);
  useEffect(() => {
    if (pastedFiles) {
      store.uploadFiles(pastedFiles)
    }
  }, [pastedFiles])

  const store = useLocalObservable(() => ({
    files: [] as FileType[],
    lastRange: null as Range | null,
    lastRangeText: '',
    lastSelection: null as Selection | null,
    handleIOSFocus() {
      try {
        if (helper.env.isIOS() && mode == 'edit') {
          store.focus(true)
        }
      } catch (error) { }
    },
    updateSendStatus() {
      if (store.files?.length == 0 && mdxEditorRef.current?.getMarkdown() == '') {
        return setCanSend(false)
      }
      if (store.files?.some(i => i.uploadPromise?.loading?.value === true)) {
        return setCanSend(false)
      }
      if (store.files?.every(i => !i?.uploadPromise?.loading?.value) && store.files?.length != 0) {
        return setCanSend(true)
      }
      if (mdxEditorRef.current?.getMarkdown() != '') {
        return setCanSend(true)
      }
    },
    replaceMarkdownTag(text: string, forceFocus = false) {
      if (mdxEditorRef.current) {
        if (store.lastRange) {
          console.log('replaceMarkdownTag', store.lastRangeText)
          const currentTextBeforeRange = store.lastRangeText.replace(/&#x20;/g, " ") ?? ''
          const currentText = mdxEditorRef.current!.getMarkdown().replace(/\\/g, '').replace(/&#x20;/g, " ")
          const tag = currentTextBeforeRange.replace(helper.regex.isEndsWithHashTag, "#" + text + '&#x20;')
          const MyContent = currentText.replace(currentTextBeforeRange, tag)
          mdxEditorRef.current.setMarkdown(MyContent)
          store.focus(forceFocus)
        }
      }
    },
    insertMarkdown(text) {
      const Mycontent = mdxEditorRef.current!.getMarkdown()
      mdxEditorRef.current!.setMarkdown(Mycontent + text)
      mdxEditorRef.current!.focus(() => {
        onChange?.(Mycontent + text)
      }, {
        defaultSelection: 'rootEnd'
      })
    },
    insertMarkdownByEvent(text) {
      mdxEditorRef.current!.insertMarkdown(text)
      store.focus()
    },
    focus(force = false) {
      if (force && store.lastRange) {
        const editorElements = getEditorElements()
        if (editorElements.length > 0) {
          editorElements.forEach(editorElement => {
            requestAnimationFrame(() => {
              const range = document.createRange()
              const selection = window.getSelection()
              const walker = document.createTreeWalker(
                editorElement,
                NodeFilter.SHOW_TEXT,
                null
              )
              let lastNode: any = null
              while (walker.nextNode()) {
                lastNode = walker.currentNode
              }
              if (lastNode) {
                range.setStart(lastNode, lastNode?.length)
                range.setEnd(lastNode, lastNode?.length)
                selection?.removeAllRanges()
                selection?.addRange(range)
                editorElement.focus()
              }
            })
          })
        }
        onChange?.(mdxEditorRef.current!.getMarkdown())
      } else {
        mdxEditorRef.current!.focus(() => {
          onChange?.(mdxEditorRef.current!.getMarkdown())
        }, {
          defaultSelection: 'rootEnd'
        })
      }
    },
    clearMarkdown() {
      if (mdxEditorRef.current) {
        mdxEditorRef.current.setMarkdown("")
        store.focus()
      }
    },
    inertHash() {
      mdxEditorRef.current!.insertMarkdown("&#x20;#")
      mdxEditorRef.current!.focus()
      store.handlePopTag()
    },
    async speechToText(filePath) {
      if (!blinko.showAi) {
        return
      }
      if (filePath.endsWith('.webm') || filePath.endsWith('.mp3') || filePath.endsWith('.wav')) {
        try {
          const doc = await api.ai.speechToText.mutate({ filePath })
          store.insertMarkdown(doc[0]?.pageContent)
        } catch (error) { }
      }
    },
    uploadFiles(acceptedFiles) {
      const _acceptedFiles = acceptedFiles.map(file => {
        const extension = helper.getFileExtension(file.name)
        const previewType = helper.getFileType(file.type, file.name)
        return {
          name: file.name,
          size: file.size,
          previewType,
          extension: extension ?? '',
          preview: URL.createObjectURL(file),
          uploadPromise: new PromiseState({
            function: async () => {
              store.updateSendStatus()
              const formData = new FormData();
              formData.append('file', file)
              const response = await fetch('/api/file/upload', {
                method: 'POST',
                body: formData,
              });
              const data = await response.json();
              store.speechToText(data.filePath)
              if (data.filePath) {
                return data.filePath
              }
            }
          }),
          type: file.type
        }
      })
      store.files.push(..._acceptedFiles)
      Promise.all(_acceptedFiles.map(i => i.uploadPromise.call())).then(() => {
        store.updateSendStatus()
      }).finally(() => {
        store.updateSendStatus()
      })
    },
    handlePopTag() {
      const selection = window.getSelection();
      if (selection!.rangeCount > 0) {
        if (!IsTagSelectVisible()) {
          let lastRange = selection!.getRangeAt(0);
          store.lastRange = lastRange
          store.lastRangeText = lastRange.endContainer.textContent?.slice(0, lastRange.endOffset) ?? ''
          store.lastSelection = selection
        }
        const hasHashTagRegex = /#[^\s#]+/g
        const endsWithBankRegex = /\s$/g
        const currentText = store.lastRange?.startContainer.textContent?.slice(0, store.lastRange?.endOffset) ?? ''
        const isEndsWithBank = endsWithBankRegex.test(currentText)
        const isEndsWithHashTag = helper.regex.isEndsWithHashTag.test(currentText)
        if (currentText == '' || !isEndsWithHashTag) {
          setTimeout(() => eventBus.emit('tagselect:hidden'))
          return
        }
        if (isEndsWithHashTag && currentText != '' && !isEndsWithBank) {
          const match = currentText.match(hasHashTagRegex)
          let searchText = match?.[match?.length - 1] ?? ''
          if (currentText.endsWith("#")) {
            searchText = ''
          }
          showTagSelectPop(searchText.toLowerCase())
        }
      }
    },
    handlePopAiWrite() {
      if (!blinko.showAi) {
        return
      }
      const selection = window.getSelection();
      if (selection!.rangeCount > 0) {
        const lastRange = selection!.getRangeAt(0);
        const currentText = lastRange.startContainer.textContent?.slice(0, lastRange.endOffset) ?? '';
        const isEndsWithSlash = /[^\s]?\/$/.test(currentText);
        if (currentText === '' || !isEndsWithSlash) {
          setTimeout(() => eventBus.emit('aiwrite:hidden'));
          return;
        }
        if (isEndsWithSlash) {
          showAiWriteSuggestions();
        }
      }
    },
    deleteLastChar() {
      const content = mdxEditorRef.current!.getMarkdown()
      mdxEditorRef.current!.setMarkdown(content.slice(0, -1))
    },
    setMarkdownLoading(loading: boolean) {
      if (loading) {
        mdxEditorRef.current!.insertMarkdown("Thinking...")
        store.focus()
      } else {
        const content = mdxEditorRef.current!.getMarkdown()
        const newContent = content.replace(/Thinking.../g, '')
        mdxEditorRef.current!.setMarkdown(newContent)
        store.focus()
      }
    }
  }))
  //fix ui not render
  useEffect(() => {
    store.updateSendStatus()
    onHeightChange?.()
  }, [blinko.noteTypeDefault, content, store.files?.length])

  useEffect(() => {
    eventBus.on('editor:replace', store.replaceMarkdownTag)
    eventBus.on('editor:clear', store.clearMarkdown)
    eventBus.on('editor:insert', store.insertMarkdownByEvent)
    eventBus.on('editor:deleteLastChar', store.deleteLastChar)
    eventBus.on('editor:focus', store.focus)
    eventBus.on('editor:setMarkdownLoading', store.setMarkdownLoading)
    handleEditorKeyEvents()
    store.handleIOSFocus()

    return () => {
      eventBus.off('editor:replace', store.replaceMarkdownTag)
      eventBus.off('editor:clear', store.clearMarkdown)
      eventBus.off('editor:insert', store.insertMarkdownByEvent)
      eventBus.off('editor:deleteLastChar', store.deleteLastChar)
      eventBus.off('editor:focus', store.focus)
      eventBus.off('editor:setMarkdownLoading', store.setMarkdownLoading)
    }
  }, [])

  useEffect(() => {
    if (originFiles?.length != 0) {
      store.files = HandleFileType(originFiles!)
    }
  }, [originFiles])

  const {
    getRootProps,
    isDragAccept,
    getInputProps,
    open
  } = useDropzone({
    multiple: true,
    noClick: true,
    onDrop: acceptedFiles => {
      store.uploadFiles(acceptedFiles)
    }
  });

  useEffect(() => {
    eventBus.on('editor:setViewMode', (mode) => setViewMode(mode))
    return () => {
      eventBus.off('editor:setViewMode', (mode) => setViewMode(mode))
    }
  }, [])

  return <Card
    shadow='none' {...getRootProps()}
    className={`p-2 relative border-2 border-border transition-all 
    ${isDragAccept ? 'border-2 border-green-500 border-dashed transition-all' : ''} ${viewMode == 'source' ? 'border-red-500' : ''}`}>

    <div ref={cardRef}
      onKeyUp={async event => {
        event.preventDefault();
        if (event.key === 'Enter' && event.ctrlKey) {
          await onSend?.({
            content,
            files: store.files.map(i => { return { ...i, uploadPath: i.uploadPromise.value, type: i.type } })
          })
          onChange?.('')
          store.files = []
        }
      }}
      onKeyDown={e => {
        onHeightChange?.()
      }}>
      <MDXEditor
        translation={(key, defaultValue) => {
          if (key == 'toolbar.bulletedList') return t('bulleted-list');
          if (key == 'toolbar.numberedList') return t('numbered-list');
          if (key == 'toolbar.checkList') return t('check-list');
          if (key == 'toolbar.table') return t('insert-table');
          if (key == 'toolbar.codeBlock') return t('insert-codeblock');
          if (key == 'toolbar.insertSandpack') return t('insert-sandpack');
          return defaultValue
        }}
        ref={mdxEditorRef}
        placeholder={t('i-have-a-new-idea')}
        className={theme == 'dark' ? "dark-theme dark-editor" : ''}
        contentEditableClassName='prose'
        onChange={v => {
          onChange?.(v)
          store.handlePopTag()
          store.handlePopAiWrite()
        }}

        autoFocus={{
          defaultSelection: 'rootEnd'
        }}
        markdown={content}
        plugins={[
          toolbarPlugin({
            toolbarContents: () => (
              <Toolbar
                store={store}
                openFileDialog={open}
                files={store.files}
                mode={mode}
                isPc={isPc}
                viewMode={viewMode}
                canSend={canSend}
                isSendLoading={isSendLoading}
                mdxEditorRef={mdxEditorRef}
                onSend={onSend}
                onChange={onChange}
                getInputProps={getInputProps}
                showCloseButton={showCloseButton}
              />
            )
          }),
          ...MyPlugins
        ]}
      />
    </div>
  </Card >
})

export default Editor

