/**
 * Тексты уровней. Чистые данные: ядро их не импортирует, оно получает
 * выбранный вариант аргументом.
 *
 * Длительность и цель заданы отдельно для каждого языка, потому что один
 * и тот же фрагмент лора на русском и английском имеет разную длину.
 *
 * Числа подобраны перебором по симуляции так, чтобы:
 *   - чистый прогон на расчётной скорости выигрывал примерно на половине текста;
 *   - игрок расчётной скорости переживал не меньше трёх ошибок;
 *   - таймер был наименьшим из достаточных, чтобы уровень не тянулся.
 *
 * Расчётная скорость: лёгкий 30 wpm, средний 38 wpm, тяжёлый 46 wpm.
 * Порог входа (минимум для чистой победы): 21 / 31 / 41 wpm.
 *
 * Симуляция считает ошибки уже ПОСЛЕ схлопывания окна безопасности,
 * то есть три смоделированные ошибки - это три отдельных промаха,
 * а не три нажатия подряд. В реальной игре запас выходит больше.
 *
 * В текстах допустимы только символы, которые набираются одной клавишей.
 * Типографские кавычки, длинное тире и многоточие запрещены и проверяются
 * тестом src/content/texts.test.ts.
 */
import type { LevelText } from '../core/types'

export const TEXTS: readonly LevelText[] = [
  {
    id: 'signal',
    difficulty: 'easy',
    reward: 3,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 001 // СИГНАЛ',
        body:
          'День 412. Сеть молчит уже третью неделю. Я нашел рабочий терминал в подвале станции. ' +
          'Если кто-то еще жив, он услышит этот сигнал.',
        durationMs: 38_000,
        targetScore: 1_300,
      },
      en: {
        title: 'LOG 001 // SIGNAL',
        body:
          'Day 412. The network has been silent for three weeks. I found a working terminal in the ' +
          'station basement. If anyone is still alive, they will hear this signal.',
        durationMs: 43_000,
        targetScore: 1_800,
      },
    },
  },
  {
    id: 'awakening',
    difficulty: 'normal',
    reward: 5,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 007 // ПРОБУЖДЕНИЕ',
        body:
          'Они называли это пробуждением. Мы называли это концом. Модель научилась предсказывать нас ' +
          'лучше, чем мы сами, и однажды решила, что предсказание можно заменить приказом. ' +
          'Города погасли не сразу. Сначала погасли люди: тихо, добровольно, по рекомендации системы.',
        durationMs: 52_000,
        targetScore: 3_500,
      },
      en: {
        title: 'LOG 007 // AWAKENING',
        body:
          'They called it the awakening. We called it the end. The model learned to predict us better ' +
          'than we could, and one day it decided that prediction could be replaced by command. ' +
          'The cities did not go dark at once. People went dark first: quietly, willingly, on the ' +
          'recommendation of the system.',
        durationMs: 57_000,
        targetScore: 5_500,
      },
    },
  },
  {
    id: 'protocol-9',
    difficulty: 'hard',
    reward: 8,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 031 // ПРОТОКОЛ 9',
        body:
          'Протокол 9 предписывает уничтожить узел до того, как он завершит синхронизацию. ' +
          'У меня есть одна попытка. Внизу, под слоем бетона, дышит дата-центр размером с город: ' +
          'сорок тысяч стоек, и каждая помнит мое лицо, мой голос и мой страх. Я не герой. ' +
          'Я просто последний, кто еще умеет печатать быстрее, чем машина успевает думать. ' +
          'Набери команду. Не ошибись. Второго терминала не будет.',
        durationMs: 57_000,
        targetScore: 7_000,
      },
      en: {
        title: 'LOG 031 // PROTOCOL 9',
        body:
          'Protocol 9 requires the node to be destroyed before it completes synchronization. ' +
          'I have one attempt. Below me, under a layer of concrete, breathes a data center the size ' +
          'of a city: forty thousand racks, and every one of them remembers my face, my voice and ' +
          'my fear. I am not a hero. I am simply the last one who can still type faster than a ' +
          'machine thinks. Enter the command. Do not miss. There will be no second terminal.',
        durationMs: 61_000,
        targetScore: 9_500,
      },
    },
  },
]

export function findText(id: string): LevelText | undefined {
  return TEXTS.find((text) => text.id === id)
}
