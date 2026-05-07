import { useState, type ChangeEvent, type FocusEvent, type InputHTMLAttributes } from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'
import { useLinkOptions } from '@/shared/hooks/use-link-options'

interface LinkDatalistInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'list'> {
  doctype: string
  listId: string
  registration?: UseFormRegisterReturn
  helperText?: string
  errorText?: string
}

export function LinkDatalistInput({
  doctype,
  listId,
  registration,
  helperText,
  errorText,
  defaultValue,
  onChange,
  onFocus,
  onBlur,
  ...props
}: LinkDatalistInputProps) {
  const [search, setSearch] = useState(typeof defaultValue === 'string' ? defaultValue : '')
  const optionsQuery = useLinkOptions(doctype, search)

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setSearch(event.target.value)
    registration?.onChange(event)
    onChange?.(event)
  }

  function handleFocus(event: FocusEvent<HTMLInputElement>) {
    setSearch(event.currentTarget.value)
    onFocus?.(event)
  }

  function handleBlur(event: FocusEvent<HTMLInputElement>) {
    registration?.onBlur(event)
    onBlur?.(event)
  }

  return (
    <>
      <input
        {...props}
        defaultValue={defaultValue}
        list={listId}
        name={registration?.name ?? props.name}
        ref={registration?.ref}
        onBlur={handleBlur}
        onChange={handleChange}
        onFocus={handleFocus}
      />
      <datalist id={listId}>
        {(optionsQuery.data ?? []).map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
      {errorText ? <small>{errorText}</small> : helperText ? <em>{helperText}</em> : null}
    </>
  )
}
