import { observer } from "mobx-react-lite"

import { Input } from "@nextui-org/react"
import { Icon } from "@iconify/react"
import { useTranslation } from "react-i18next"
import { useState } from "react"

export const PasswordInput = observer(({ value, onChange, label, placeholder, className }: { value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, label?: string, placeholder?: string, className?: string }) => {
  const { t } = useTranslation()
  const [isConfirmVisible, setIsConfirmVisible] = useState(false)
  const toggleConfirmVisibility = () => setIsConfirmVisible(!isConfirmVisible)
  return <Input
    className={className}
    isRequired
    endContent={
      <button type="button" onClick={toggleConfirmVisibility}>
        {isConfirmVisible ? (
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
    label={label}
    labelPlacement="outside"
    name="confirmPassword"
    placeholder={placeholder}
    type={isConfirmVisible ? "text" : "password"}
    variant="bordered"
    value={value}
    onChange={onChange}
  />
})