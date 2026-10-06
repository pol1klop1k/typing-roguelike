import { EventEmitter } from 'node:events'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { handleTuningRestore, handleTuningWrite, type TuningResponse } from './tuningPlugin'

/** Запрос с телом: эмиттер отдаёт данные так же, как настоящий поток. */
function request(method: string, body?: string): EventEmitter & { method: string } {
  const emitter = Object.assign(new EventEmitter(), { method })

  // Данные уходят после того, как обработчик подпишется.
  queueMicrotask(() => {
    if (body !== undefined) emitter.emit('data', body)
    emitter.emit('end')
  })

  return emitter
}

/** Ответ, который запоминает всё, что в него написали. */
function response(): TuningResponse & { body: string; done: Promise<void> } {
  let resolve!: () => void
  const done = new Promise<void>((r) => {
    resolve = r
  })

  return {
    statusCode: 200,
    body: '',
    done,
    setHeader: () => undefined,
    end(chunk = '') {
      this.body = chunk
      resolve()
      return undefined
    },
  }
}

async function tempFile(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'typing-tuning-'))
  return join(dir, 'tuning.json')
}

describe('сохранение наладки', () => {
  it('пишет присланный JSON в файл', async () => {
    const file = await tempFile()
    const res = response()
    const tuning = { numbers: { capsGodPerCap: 3 }, items: { freeze: { price: 20 } } }

    handleTuningWrite(request('POST', JSON.stringify(tuning)), res, file)
    await res.done

    expect(JSON.parse(res.body)).toEqual({ ok: true })
    expect(JSON.parse(await readFile(file, 'utf8'))).toEqual(tuning)
  })

  it('пишет файл с переносом строки и отступами, чтобы его было видно в диффе', async () => {
    const file = await tempFile()
    const res = response()

    handleTuningWrite(request('POST', '{"numbers":{"capsGodPerCap":3}}'), res, file)
    await res.done

    const text = await readFile(file, 'utf8')
    expect(text).toBe('{\n  "numbers": {\n    "capsGodPerCap": 3\n  }\n}\n')
  })

  it('не портит файл кривым телом запроса', async () => {
    // Иначе одна неудачная правка сделала бы игру незапускаемой.
    const file = await tempFile()
    const res = response()

    handleTuningWrite(request('POST', 'это не json'), res, file)
    await res.done

    expect(res.statusCode).toBe(400)
    await expect(readFile(file, 'utf8')).rejects.toThrow()
  })

  it('отвечает на всё, кроме POST, отказом', async () => {
    const res = response()
    handleTuningWrite(request('GET'), res, await tempFile())
    await res.done

    expect(res.statusCode).toBe(405)
  })
})

describe('шаг назад', () => {
  /** Пара файлов в одной временной папке: наладка и её копия. */
  async function pair(): Promise<{ file: string; backup: string }> {
    const dir = await mkdtemp(join(tmpdir(), 'typing-tuning-'))
    return { file: join(dir, 'tuning.json'), backup: join(dir, 'tuning.backup.json') }
  }

  async function save(paths: { file: string; backup: string }, tuning: unknown): Promise<void> {
    const res = response()
    handleTuningWrite(request('POST', JSON.stringify(tuning)), res, paths.file, paths.backup)
    await res.done
  }

  it('сохранение прячет предыдущую наладку в копию', async () => {
    const paths = await pair()
    await save(paths, { numbers: { capsGodPerCap: 3 } })
    await save(paths, { numbers: { capsGodPerCap: 9 } })

    expect(JSON.parse(await readFile(paths.backup, 'utf8'))).toEqual({
      numbers: { capsGodPerCap: 3 },
    })
  })

  it('возвращает наладку, какой она была до последнего сохранения', async () => {
    // Ровно тот случай, который стоил пользователю часа работы: правки
    // затёрли, а вернуться было некуда.
    const paths = await pair()
    await save(paths, { items: { freeze: { price: 20 } } })
    await save(paths, {})

    const res = response()
    handleTuningRestore(res, paths.file, paths.backup)
    await res.done

    expect(JSON.parse(res.body)).toEqual({ ok: true })
    expect(JSON.parse(await readFile(paths.file, 'utf8'))).toEqual({
      items: { freeze: { price: 20 } },
    })
  })

  it('честно отказывает, когда возвращать нечего', async () => {
    const paths = await pair()
    const res = response()
    handleTuningRestore(res, paths.file, paths.backup)
    await res.done

    expect(res.statusCode).toBe(404)
  })

  it('не теряет копию из-за кривого запроса', async () => {
    // Иначе неудачное сохранение уносило бы с собой и шаг назад.
    const paths = await pair()
    await save(paths, { numbers: { capsGodPerCap: 3 } })
    await save(paths, { numbers: { capsGodPerCap: 9 } })

    const res = response()
    handleTuningWrite(request('POST', 'это не json'), res, paths.file, paths.backup)
    await res.done

    expect(res.statusCode).toBe(400)
    expect(JSON.parse(await readFile(paths.backup, 'utf8'))).toEqual({
      numbers: { capsGodPerCap: 3 },
    })
    expect(JSON.parse(await readFile(paths.file, 'utf8'))).toEqual({
      numbers: { capsGodPerCap: 9 },
    })
  })
})
