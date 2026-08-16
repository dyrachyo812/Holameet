import { useState, type FormEvent } from 'react'
import { loginUser, readErrorCode, registerUser } from '../api/client'
import { uk } from '../i18n/uk'
import {
  cardClass,
  fieldLabelClass,
  ghostButtonClass,
  inputClass,
  primaryButtonClass,
} from '../ui/classes'

type AuthMode = 'login' | 'register'

type AuthFormProps = {
  onSuccess: () => void
}

export function AuthForm({ onSuccess }: AuthFormProps) {
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [errorKey, setErrorKey] = useState<keyof typeof uk | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setErrorKey(null)

    try {
      if (mode === 'register') {
        await registerUser({ email, password, name, username })
      } else {
        await loginUser({ email, password })
      }
      onSuccess()
    } catch (error) {
      const code = readErrorCode(error)
      if (
        code === 'conflict' ||
        code === 'unauthorized' ||
        code === 'validationError'
      ) {
        setErrorKey(code)
      } else {
        setErrorKey('internalError')
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`${cardClass} mx-auto w-full max-w-md space-y-4`}>
      {mode === 'register' ? (
        <>
          <label className="block">
            <span className={fieldLabelClass}>{uk.name}</span>
            <input
              className={inputClass}
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className={fieldLabelClass}>{uk.username}</span>
            <input
              className={inputClass}
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </label>
        </>
      ) : null}
      <label className="block">
        <span className={fieldLabelClass}>{uk.email}</span>
        <input
          type="email"
          className={inputClass}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>
      <label className="block">
        <span className={fieldLabelClass}>{uk.password}</span>
        <input
          type="password"
          className={inputClass}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={8}
        />
      </label>
      {errorKey ? <p className="text-sm text-red-600">{uk[errorKey]}</p> : null}
      <button type="submit" className={primaryButtonClass}>
        {mode === 'register' ? uk.register : uk.login}
      </button>
      <button
        type="button"
        className={`${ghostButtonClass} w-full`}
        onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
      >
        {mode === 'login' ? uk.noAccount : uk.haveAccount}
      </button>
    </form>
  )
}
