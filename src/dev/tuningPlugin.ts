/**
 * Запись правок из админки на диск.
 *
 * Браузер сам в файл писать не умеет, поэтому сохранение идёт через
 * дев-сервер. Плагин работает ТОЛЬКО в режиме разработки (apply: 'serve'):
 * в собранной игре эндпоинта нет, и админка сохранять не сможет - она и не
 * должна, наладка это инструмент разработки, а не часть игры.
 *
 * Отдельным приятным следствием: запись файла ловит HMR, страница
 * перезагружается сама, и правки видно сразу.
 *
 * Модуль лежит в src только ради теста: наружу, в игру, он не попадает,
 * потому что его никто, кроме vite.config.ts, не импортирует.
 */
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite'

export const TUNING_FILE = fileURLToPath(new URL('../content/tuning.json', import.meta.url))

/**
 * Копия наладки, какой она была ДО последнего сохранения.
 *
 * Балансировка - это часы возни с числами, а сбросить их можно одной
 * кнопкой или одной неосторожной командой. Шаг назад должен существовать,
 * иначе цена ошибки несоразмерна.
 */
export const TUNING_BACKUP_FILE = fileURLToPath(
  new URL('../content/tuning.backup.json', import.meta.url),
)

/** Минимум, который нужен обработчику от запроса и ответа. */
export interface TuningRequest {
  readonly method?: string | undefined
  /** Путь внутри эндпоинта: пустой для сохранения, /restore для отката. */
  readonly url?: string | undefined
  on(event: string, listener: (chunk: unknown) => void): unknown
}

export interface TuningResponse {
  statusCode: number
  setHeader(name: string, value: string): unknown
  end(chunk?: string): unknown
}

/** Прячет текущую наладку в копию. Нет файла - нечего и прятать. */
async function keepPrevious(file: string, backupFile: string): Promise<void> {
  try {
    await writeFile(backupFile, await readFile(file, 'utf8'), 'utf8')
  } catch {
    // Первого сохранения ещё не было. Это не ошибка.
  }
}

/**
 * Обработчик сохранения, отделённый от плагина: именно его проверяет тест.
 * Плагин ниже только подключает его к дев-серверу.
 */
export function handleTuningWrite(
  request: TuningRequest,
  response: TuningResponse,
  file: string = TUNING_FILE,
  backupFile: string = TUNING_BACKUP_FILE,
): void {
  if (request.method !== 'POST') {
    response.statusCode = 405
    response.end('Только POST')
    return
  }

  let body = ''
  request.on('data', (chunk) => {
    body += String(chunk)
  })

  request.on('end', () => {
    void (async () => {
      try {
        // Разбираем до записи: в файл не должно попасть ничего, что потом
        // не прочитается как JSON. Иначе одна кривая правка ломает запуск.
        const parsed: unknown = JSON.parse(body)

        // Копию снимаем только после успешного разбора: незачем терять
        // предыдущую наладку из-за запроса, который всё равно не применится.
        await keepPrevious(file, backupFile)
        await writeFile(file, `${JSON.stringify(parsed, null, 2)}\n`, 'utf8')

        response.setHeader('content-type', 'application/json')
        response.end(JSON.stringify({ ok: true }))
      } catch (error) {
        response.statusCode = 400
        response.setHeader('content-type', 'application/json')
        response.end(JSON.stringify({ ok: false, error: String(error) }))
      }
    })()
  })
}

/**
 * Шаг назад: возвращает наладку к состоянию до последнего сохранения.
 *
 * Разбор копии обязателен и здесь: подсовывать в игру файл, который не
 * прочитается, нельзя даже при откате.
 */
export function handleTuningRestore(
  response: TuningResponse,
  file: string = TUNING_FILE,
  backupFile: string = TUNING_BACKUP_FILE,
): void {
  void (async () => {
    try {
      const previous = await readFile(backupFile, 'utf8')
      JSON.parse(previous)
      await writeFile(file, previous, 'utf8')

      response.setHeader('content-type', 'application/json')
      response.end(JSON.stringify({ ok: true }))
    } catch (error) {
      response.statusCode = 404
      response.setHeader('content-type', 'application/json')
      response.end(JSON.stringify({ ok: false, error: String(error) }))
    }
  })()
}

export function tuningApi(): Plugin {
  return {
    name: 'typing-tuning-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__tuning', (request, response) => {
        // Путь внутри эндпоинта: connect срезает точку монтирования,
        // поэтому /__tuning/restore приходит сюда как /restore.
        if (request.url?.startsWith('/restore')) {
          handleTuningRestore(response)
          return
        }
        handleTuningWrite(request, response)
      })
    },
  }
}
