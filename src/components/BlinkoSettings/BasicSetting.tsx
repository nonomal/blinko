import { observer } from "mobx-react-lite";
import { Button, Card, Input, Switch } from "@nextui-org/react";
import { RootStore } from "@/store";
import { Icon } from "@iconify/react";
import { UserStore } from "@/store/user";
import { useTranslation } from "react-i18next";
import { DialogStore } from "@/store/module/Dialog";
import { UpdateUserInfo, UpdateUserPassword } from "../Common/UpdateUserInfo";
import { Item } from "./Item";
import { signOut } from "next-auth/react";
import { useRouter } from "next/router";
import { Copy } from "../Common/Copy";
import { MarkdownRender } from "../Common/MarkdownRender";
import { PromiseCall, PromiseState } from "@/store/standard/PromiseState";
import { api } from "@/lib/trpc";
import { BlinkoStore } from "@/store/blinkoStore";

export const BasicSetting = observer(() => {
  const user = RootStore.Get(UserStore)
  const CODE = `curl -X 'POST' '${window.location.origin}/api/v1/note/upsert' \\\n      -H 'Content-Type: application/json' \\\n      -H 'Authorization: Bearer ${user.userInfo.value?.token}' \\\n      -d '{ "content": "🎉Hello,Blinko! --send from api ", "type":0 }'\n`
  const CODE_SNIPPET = `\`\`\`javascript\n //blinko api document:${window.location.origin}/api-doc\n ${CODE} \`\`\``
  const { t } = useTranslation()
  const router = useRouter()
  const blinko = RootStore.Get(BlinkoStore)
  const store = RootStore.Local(() => ({
    setRigster: new PromiseState({
      function: async (value: boolean) => {
        return await PromiseCall(api.config.update.mutate({
          key: 'isAllowRegister',
          value
        }))
      }
    })
  }))


  return <Card shadow="none" className="flex flex-col p-4 bg-background">
    <div className='text-desc text-sm'>{t('basic-information')}</div>
    <Item
      leftContent={<>{t('name')}</>}
      rightContent={
        <div className="flex gap-2 items-center">
          <div className="text-desc">{user.name}</div>
          <Button variant="flat" isIconOnly startContent={<Icon icon="tabler:edit" width="20" height="20" />} size='sm'
            onClick={e => {
              RootStore.Get(DialogStore).setData({
                isOpen: true,
                title: t('change-user-info'),
                content: <UpdateUserInfo />
              })
            }} />
          <Button variant="flat" isIconOnly startContent={<Icon icon="material-symbols:password" width="20" height="20" />} size='sm'
            onClick={e => {
              RootStore.Get(DialogStore).setData({
                title: t('rest-user-password'),
                isOpen: true,
                content: <UpdateUserPassword />
              })
            }} />
        </div>
      } />

    <Item
      hidden={!user.isSuperAdmin}
      leftContent={<>Access Token</>}
      rightContent={
        <div className="flex gap-2 items-center">
          <Input disabled className="w-[150px] md:w-[300px]" value={user.userInfo.value?.token} endContent={<Copy size={20} content={user.userInfo.value?.token ?? ''} />} />
          <Icon className="cursor-pointer hover:rotate-180 transition-all" onClick={async () => {
            await PromiseCall(api.users.regenToken.mutate())
            user.userInfo.call(user.userInfo.value?.id ?? 0)
          }} icon="fluent:arrow-sync-12-filled" width="20" height="20" />
        </div>
      } />

    <Item
      leftContent={<>Allow Register</>}
      rightContent={<Switch
        thumbIcon={store.setRigster.loading.value ? <Icon icon="eos-icons:three-dots-loading" width="24" height="24" /> : null}
        isDisabled={store.setRigster.loading.value}
        isSelected={user.canRegister.value}
        onChange={async e => {
          await store.setRigster.call(e.target.checked)
          user.canRegister.call()
        }}
      />} />

    <Item
      leftContent={
        <div className="w-full flex-1 relative">
          <Copy size={20} content={CODE} className="absolute top-4 right-2" />
          <MarkdownRender content={CODE_SNIPPET} />
        </div>
      }
    />

    <Item
      leftContent={<></>}
      rightContent={
        <Button startContent={<Icon icon="humbleicons:logout" width="20" height="20" />} size='sm' color='danger' onClick={async () => {
          await signOut({ redirect: false })
          router.push('/signin')
          localStorage.removeItem('username')
          localStorage.removeItem('password')
        }}> {t('logout')}</Button>
      } />

  </Card >
})