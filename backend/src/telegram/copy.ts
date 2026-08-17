import { DateTime } from 'luxon'

export function formatWhen(startUtc: DateTime, timeZone: string) {
  return startUtc.setZone(timeZone).setLocale('uk').toFormat("ccc, d MMM, HH:mm 'GMT'Z")
}

export function confirmOrganizerText(input: {
  title: string
  when: string
  inviteeName: string
}) {
  return `Нова зустріч: ${input.title}\n${input.when}\nГість: ${input.inviteeName}`
}

export function confirmGuestText(input: {
  title: string
  when: string
  organizerName: string
}) {
  return `Зустріч підтверджено: ${input.title}\n${input.when}\nОрганізатор: ${input.organizerName}`
}

export function reminderText(input: { title: string; when: string }) {
  return `Нагадування: ${input.title}\n${input.when}`
}

export const telegramCopy = {
  connected: 'Telegram підключено до Holameet.',
  guestLinked: 'Нагадування про цю зустріч приходитимуть сюди.',
  invalidLink: 'Посилання недійсне або застаріло. Відкрийте нове з Holameet.',
  startHelp: 'Відкрийте посилання підключення в Holameet, щоб отримувати нагадування.',
}
