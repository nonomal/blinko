import { observer } from "mobx-react-lite";
import { Button, Card, Select, SelectItem, Switch, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@nextui-org/react";
import { RootStore } from "@/store";
import { BlinkoStore } from "@/store/blinkoStore";
import { PromiseCall } from "@/store/standard/PromiseState";
import { helper } from "@/lib/helper";
import dayjs from "@/lib/dayjs";
import { Icon } from "@iconify/react";
import { api, streamApi } from "@/lib/trpc";
import { Item } from "./Item";
import { useTranslation } from "react-i18next";
import { UploadFileWrapper } from "../Common/UploadFile";
import { ToastPlugin } from "@/store/module/Toast/Toast";
import { useMediaQuery } from "usehooks-ts";
import { ShowMemosProgressDialog } from "../Common/ImportMemosProgress";
import { ShowBlinkoProgressDialog } from "../Common/ImportBlinkoProgress";


export const ImportSetting = observer(() => {
  const isPc = useMediaQuery('(min-width: 768px)')
  const { t } = useTranslation()

  return <Card shadow="none" className="flex flex-col p-4 bg-background">
    <div className='text-desc text-sm'>{t('import')}</div>
    <Item
      leftContent={<>{t('import-from-bko')}</>}
      rightContent={<>
        <UploadFileWrapper onUpload={async ({ filePath, fileName }) => {
          if (!fileName.endsWith('.bko')) {
            return RootStore.Get(ToastPlugin).error(t('not-a-bko-file'))
          }
          // PromiseCall(api.task.restoreDB.query({ fileName }))
          ShowBlinkoProgressDialog(filePath)
        }}>
        </UploadFileWrapper>
      </>} />

    <Item
      type={isPc ? 'row' : 'col'}
      leftContent={<div className="flex flex-col  gap-2">
        <div>{t('import-from-memos-memos_prod-db')}</div>
        <div className="text-desc text-xs">{t('when-exporting-memos_prod-db-please-close-the-memos-container-to-avoid-partial-loss-of-data')}</div>
      </div>}
      rightContent={<div className="flex w-full ml-auto justify-end">
        <UploadFileWrapper onUpload={async ({ filePath, fileName }) => {
          if (!fileName.endsWith('.db')) {
            return RootStore.Get(ToastPlugin).error('Not a Memos database file')
          }
          ShowMemosProgressDialog(filePath)
        }}>
        </UploadFileWrapper>
      </div>} />
  </Card>
})