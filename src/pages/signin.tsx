import React, { useCallback, useEffect, useState } from "react";
import { Button, Input, Checkbox, Link, Image } from "@nextui-org/react";
import { Icon } from "@iconify/react";
import { signIn } from "next-auth/react";
import { RootStore } from "@/store";
import { useRouter } from "next/router";
import { ToastPlugin } from "@/store/module/Toast/Toast";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/trpc";
import { StorageState } from "@/store/standard/StorageState";
import { UserStore } from "@/store/user";

export default function Component() {
  const router = useRouter()
  const [isVisible, setIsVisible] = React.useState(false);
  const [user, setUser] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [canRegister, setCanRegister] = useState(false)
  const { t } = useTranslation()

  const userStorage = new StorageState({ key: 'username' })
  const passwordStorage = new StorageState({ key: 'password' })


  useEffect(() => {
    try {
      RootStore.Get(UserStore).canRegister.call().then(v => {
        setCanRegister(v ?? false)
      })
      if (userStorage.value) {
        setUser(userStorage.value)
      }
      if (passwordStorage.value) {
        setPassword(passwordStorage.value)
      }
    } catch (error) {
    }
  }, [])

  const login = async () => {
    try {
      const res = await signIn('credentials', {
        username: user ?? userStorage.value,
        password: password ?? passwordStorage.value,
        callbackUrl: '/',
        redirect: false,
      })
      if (res?.ok) {
        userStorage.setValue(user)
        passwordStorage.setValue(password)
        router.push('/')
      } else {
        RootStore.Get(ToastPlugin).error(res?.error ?? t('user-or-password-error'))
      }
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gradient-to-br from-rose-400 via-fuchsia-500 to-indigo-500 p-2 sm:p-4 lg:p-8">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-large bg-content1 px-8 pb-10 pt-6 shadow-large">
        <p className="pb-2 text-xl font-medium flex gap-2 items-center justiy-center">
          Login With <Image src='/logo.svg' width={100}></Image></p>
        <form className="flex flex-col gap-3" onSubmit={(e) => e.preventDefault()}>
          <Input
            label={t('username')}
            name={t('username')}
            placeholder={t('enter-your-name')}
            type="text"
            variant="bordered"
            value={user}
            onChange={e => setUser(e.target.value?.trim())}
          />
          <Input
            endContent={
              <button type="button" onClick={() => setIsVisible(!isVisible)}>
                {isVisible ? (
                  <Icon
                    className="pointer-events-none text-2xl text-default-400"
                    icon="solar:eye-closed-linear"
                  />
                ) : (
                  <Icon
                    className="pointer-events-none text-2xl text-default-400"
                    icon="solar:eye-bold"
                  />
                )}
              </button>
            }
            label={t('password')}
            name="password"
            placeholder={t('enter-your-password')}
            type={isVisible ? "text" : "password"}
            variant="bordered"
            value={password}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                login()
              }
            }}
            onChange={e => setPassword(e.target.value?.trim())}
          />
          <div className="flex items-center justify-between px-1 pl-2 pr-2">
            <Checkbox defaultSelected name="remember" size="sm">
              {t('keep-sign-in')}
            </Checkbox>
          </div>
          <Button color="primary" onClick={async e => {
            login()
          }}>
            {t('sign-in')}
          </Button>
        </form>
        {
          canRegister && <p className="text-center text-small">
            {t('need-to-create-an-account')}&nbsp;
            <Link href="/signup" size="sm" >
              {t('sign-up')}
            </Link>
          </p>
        }
      </div>
    </div >
  );
}
