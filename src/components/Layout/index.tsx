import React, { useEffect, useRef, useState } from "react";
import { Button, ScrollShadow, Image, Input, Popover, PopoverTrigger, PopoverContent, Card, Badge, Tooltip } from "@nextui-org/react";
import { Icon } from "@iconify/react";
import { UserStore } from "@/store/user";
import Link from "next/link";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { RootStore } from "@/store";
import { BlinkoStore } from "@/store/blinkoStore";
import { TagListPanel } from "../Common/TagListPanel";
import { useTheme } from "next-themes";
import { _ } from "@/lib/lodash";
import { useTranslation } from "react-i18next";
import { BaseStore } from "@/store/baseStore";
import { BlinkoAi } from "../BlinkoAi";
import { ScrollArea } from "../Common/ScrollArea";
import { BlinkoRightClickMenu } from '@/components/BlinkoRightClickMenu';
import { useMediaQuery } from "usehooks-ts";
import { push as Menu } from 'react-burger-menu';
import { eventBus } from "@/lib/event";
import TagSelectPop from "../Common/PopoverFloat/tagSelectPop";
import AiWritePop from "../Common/PopoverFloat/aiWritePop";
import { createPortal } from "react-dom";

export const SideBarItem = "p-2 flex flex-row items-center cursor-pointer gap-2 hover:bg-hover rounded-xl transition-all"
export const CommonLayout = observer(({
  children,
  header,
}: {
  children?: React.ReactNode;
  header?: React.ReactNode;
}) => {
  const router = useRouter()
  const [isOpen, setisOpen] = useState(false)
  const [isClient, setClient] = useState(false)
  const isPc = useMediaQuery('(min-width: 768px)')
  const { t } = useTranslation()
  const { theme } = useTheme();
  const user = RootStore.Get(UserStore)
  const blinkoStore = RootStore.Get(BlinkoStore)
  const base = RootStore.Get(BaseStore)

  const throttleSearchRef = useRef(_.throttle(() => {
    blinkoStore.noteList.resetAndCall({})
  }, 1000, { trailing: true, leading: false }));

  blinkoStore.use()
  user.use()
  base.useInitApp(router)

  useEffect(() => {
    setClient(true)
  }, [])

  useEffect(() => {
    if (isPc) setisOpen(false)
  }, [isPc])

  useEffect(() => {
    eventBus.on('close-sidebar', () => {
      setisOpen(false)
    })
  }, [])

  if (!isClient) return <></>

  if (router.pathname == '/signin' || router.pathname == '/signup' || router.pathname == '/api-doc' || router.pathname.includes('/share')) {
    return <>{children}</>
  }

  const SideBarContent = (
    <div className="flex h-full w-[288px] flex-1 flex-col p-4 relative bg-background ">
      <div className="flex items-center gap-2 px-2 select-none w-full ">
        {
          theme == 'dark' ? <Image src="/logo-dark.svg" width={100} /> : <Image src="/logo.svg" width={100} />
        }
      </div>
      <ScrollShadow className="-mr-[16px] mt-[-5px] h-full max-h-full pr-6 ">
        <div>
          <div className="flex flex-col gap-1 mt-4 font-semibold">
            {
              base.routerList.map(i => {
                return <Link key={i.title} href={i.href} onClick={() => {
                  base.currentRouter = i
                  setisOpen(false)
                }}>
                  <div className={`group ${SideBarItem} ${i?.href == router.pathname ? '!bg-primary !text-primary-foreground' : ''}`}>
                    <Icon className="group-hover:translate-x-1  transition-all" icon={i.icon} width="20" height="20" />
                    <div className="group-hover:translate-x-1  transition-all">{t(i.title)}</div>
                  </div>
                </Link>
              })
            }
            <div>
              {blinkoStore.tagList.value?.listTags.length != 0 && blinkoStore.tagList.value?.listTags && <>
                <TagListPanel />
              </>}
            </div>
          </div>
        </div>
      </ScrollShadow>
      <div className="halation absolute inset-0 h-[250px] w-[250px] overflow-hidden blur-3xl z-[0] pointer-events-none">
        <div className="w-full h-[100%] bg-[#ffc65c] opacity-20"
          style={{ "clipPath": "circle(35% at 50% 50%)" }} />
      </div>
    </div>
  );

  return (
    <div className="flex w-full h-mobile-full overflow-x-hidden" id="outer-container">
      {
        blinkoStore.showAi && createPortal(<BlinkoAi />, document.body)
      }
      <TagSelectPop />
      <AiWritePop />
      <Menu disableAutoFocus onClose={() => setisOpen(false)} onOpen={setisOpen} isOpen={isOpen} pageWrapId={'page-wrap'} outerContainerId={'outer-container'}>
        {SideBarContent}
      </Menu>
      {isPc && SideBarContent}
      {/* sm:max-w-[calc(100%_-_250px)] */}
      <main id="page-wrap" className={`flex overflow-y-hidden w-full flex-col gap-y-1 bg-sencondbackground ${isPc ? 'max-w-[calc(100%_-_250px)]' : ''}`}>
        {/* nav bar  */}
        <header className="relative flex h-16 min-h-16 items-center justify-between gap-2 rounded-medium px-2 md:px:4 pt-2 pb-2">
          <div className="hidden md:block absolute bottom-[20%] right-[5%] z-[0] h-[350px] w-[350px] overflow-hidden blur-3xl ">
            <div className="w-full h-[100%] bg-[#9936e6] opacity-20"
              style={{ "clipPath": "circle(50% at 50% 50%)" }} />
          </div>
          <div className="flex max-w-full items-center gap-2 md:p-2 w-full z-[1]">
            {!isPc && <Button
              isIconOnly
              className="flex"
              size="sm"
              variant="light"
              onClick={() => setisOpen(!isOpen)}
            >
              <Icon
                className="text-default-500"
                height={24}
                icon="solar:hamburger-menu-outline"
                width={24}
              />
            </Button>}
            <div className="w-full truncate text-xl font-normal md:font-bold text-default-700 flex gap-2 items-center justify-center">
              <div className="w-[4px] h-[16px] bg-primary rounded-xl" />
              {/* @ts-ignore */}
              <div className="font-black select-none">{t(base.currentTitle)}</div>
              <Icon className="cursor-pointer hover:rotate-180 transition-all" onClick={() => blinkoStore.refreshData()} icon="fluent:arrow-sync-12-filled" width="20" height="20" />
              <Input
                fullWidth
                size={isPc ? 'md' : 'sm'}
                variant="flat"
                aria-label="search"
                className={`ml-auto w-[200px] md:w-[300px] ${blinkoStore.noteListFilterConfig.isUseAiQuery ? 'input-highlight' : ''}`}
                classNames={{
                  base: "px-1 mr-1 w-[full] md:w-[300px]",
                  inputWrapper: `bg-default-400/20 data-[hover=true]:bg-default-500/30 group-data-[focus=true]:bg-default-500/20 ${blinkoStore.noteListFilterConfig.isUseAiQuery ? 'border-2 border-primary' : ''
                    }`,
                  input: "placeholder:text-default-600 group-data-[has-value=true]:text-foreground",
                }}
                disabled={router.pathname == '/resources'}
                labelPlacement="outside"
                placeholder={t('search')}
                value={blinkoStore.noteListFilterConfig.searchText}
                onChange={e => {
                  blinkoStore.noteListFilterConfig.searchText = e.target.value
                  throttleSearchRef.current()
                }}
                startContent={
                  <Icon className="text-default-600 [&>g]:stroke-[2px]" icon="lets-icons:search" width="24" height="24" />
                }
                endContent={
                 <Tooltip content={t('ai-enhanced-search')}>
                   <Icon
                    className="text-default-600 [&>g]:stroke-[2px] cursor-pointer hover:text-primary transition-colors"
                    icon="mingcute:ai-line"
                    width="24"
                    height="24"
                    onClick={() => {
                      blinkoStore.noteListFilterConfig.isUseAiQuery = !blinkoStore.noteListFilterConfig.isUseAiQuery
                      if (blinkoStore.noteListFilterConfig.searchText != '') {
                        throttleSearchRef.current()
                      }
                    }}
                  />
                 </Tooltip>
                }
              />
              <Popover placement="bottom-start">
                <PopoverTrigger>
                  <Icon className="cursor-pointer" icon="tabler:filter-bolt" width="24" height="24" />
                </PopoverTrigger>
                <PopoverContent>
                  <div className="p-2 flex gap-2">
                    <Link href='/all?withLink=true' onClick={() => blinkoStore.forceQuery++}>
                      <Card shadow="none" className="hover:shadow cursor-pointer p-2 flex flex-col items-center text-desc border">
                        <Icon icon="ri:link" width="24" height="24" />
                        <div className="text-sm">{t('with-link')}</div>
                      </Card>
                    </Link>

                    <Link href='/all?withoutTag=true' onClick={() => blinkoStore.forceQuery++}>
                      <Card shadow="none" className="hover:shadow cursor-pointer p-2 flex flex-col items-center text-desc border">
                        <Icon icon="majesticons:tag-off-line" width="24" height="24" />
                        <div className="text-sm" >{t('no-tag')}</div>
                      </Card>
                    </Link>

                    <Link href='/all?withFile=true' onClick={() => blinkoStore.forceQuery++}>
                      <Card shadow="none" className="hover:shadow cursor-pointer p-2 flex flex-col items-center text-desc border">
                        <Icon icon="ic:round-attachment" width="24" height="24" />
                        <div className="text-sm">{t('has-file')}</div>
                      </Card>
                    </Link>
                  </div>
                </PopoverContent>
              </Popover>
              {blinkoStore.dailyReviewNoteList.value?.length != 0 &&
                <Badge size="sm" className="mr-2 scale-75" content={blinkoStore.dailyReviewNoteList.value?.length} color="warning">
                  <Link href={'/review'}>
                    <Icon className="mr-2 text-[#8600EF] cursor-pointer" icon="bxs:message-square-detail" width="24" height="24" />
                  </Link>
                </Badge>}
            </div>
          </div>
          {header}
        </header>
        {/* backdrop  */}

        <ScrollArea onBottom={() => { }} className="flex h-[calc(100%_-_70px)] overflow-y-scroll scroll-container">
          <div className="relative flex h-full w-full flex-col rounded-medium layout-container" >
            {children}
          </div>
        </ScrollArea>

        {/* mobile footer bar  */}
        <div className={`h-[60px] flex w-full px-4 py-2 gap-2 bg-background ${blinkoStore.config.value?.isHiddenMobileBar ? 'hidden' : 'block'} md:hidden`}>
          {
            base.routerList.map(i => {
              return <Link className="flex-1 " key={i.title} href={i.href} onClick={() => {
                base.currentRouter = i
                setisOpen(false)
              }}>
                <div className={`flex flex-col group ${SideBarItem} ${i?.href == router.pathname ? '!bg-primary !text-primary-foreground' : ''}`}>
                  <Icon className="text-center" icon={i.icon} width="20" height="20" />
                </div>
              </Link>
            })
          }
        </div>

        <BlinkoRightClickMenu />
      </main>
    </div>
  );
})
