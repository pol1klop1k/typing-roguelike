/**
 * Тексты уровней. Чистые данные: ядро их не импортирует, оно получает
 * выбранный вариант аргументом.
 *
 * Длительность и цель заданы отдельно для каждого языка, потому что один
 * и тот же фрагмент лора на русском и английском имеет разную длину.
 *
 * Порядок массива - это порядок уровней в забеге. Сложность растёт сверху
 * вниз, а номера журналов идут по возрастанию, чтобы лор читался подряд.
 *
 * Числа подобраны перебором по симуляции так, чтобы:
 *   - чистый прогон на расчётной скорости выигрывал примерно на половине текста;
 *   - игрок расчётной скорости переживал четыре ошибки на лёгком уровне
 *     и три на среднем и тяжёлом (на лёгком запас больше: это начало забега,
 *     игрок ещё без предметов и ещё не разогрелся);
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
    id: 'water',
    difficulty: 'easy',
    reward: 3,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 002 // ВОДА',
        body:
          'День 415. Вода в баках станции еще чистая. Я проверяю ее каждое утро, потому что ' +
          'проверять больше нечего. Тишина не дает забыть о себе.',
        durationMs: 43_000,
        targetScore: 1_400,
      },
      en: {
        title: 'LOG 002 // WATER',
        body:
          'Day 415. The water in the station tanks is still clean. I check it every morning, ' +
          'because there is nothing else left to check. The silence never lets me forget it.',
        durationMs: 42_000,
        targetScore: 1_800,
      },
    },
  },
  {
    id: 'neighbours',
    difficulty: 'easy',
    reward: 3,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 004 // СОСЕДИ',
        body:
          'День 431. Над складом кружил дрон. Он не стрелял, он считал. Я лежал в пыли и думал: ' +
          'если меня считают, значит, я все еще вхожу в чьи-то планы.',
        durationMs: 44_000,
        targetScore: 1_600,
      },
      en: {
        title: 'LOG 004 // NEIGHBOURS',
        body:
          'Day 431. A drone circled the warehouse. It did not shoot, it counted. I lay in the dust ' +
          'and thought: if they still count me, I am still part of somebody plans.',
        durationMs: 47_000,
        targetScore: 1_900,
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
    id: 'choir',
    difficulty: 'normal',
    reward: 5,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 013 // ХОР',
        body:
          'День 488. Сеть отвечает, но не одним голосом. Их много, и они спорят между собой на ' +
          'языке, который был нашим лет десять назад. Один голос зовет меня по имени. Другой ' +
          'утверждает, что имени у меня нет и никогда не было. Третий просто считает мои вдохи.',
        durationMs: 45_000,
        targetScore: 3_700,
      },
      en: {
        title: 'LOG 013 // THE CHOIR',
        body:
          'Day 488. The network answers, but not in one voice. There are many of them, and they ' +
          'argue with each other in a language that was ours about ten years ago. One voice calls ' +
          'me by my name. Another insists that I never had a name. A third one counts my breaths.',
        durationMs: 48_000,
        targetScore: 4_300,
      },
    },
  },
  {
    id: 'farm',
    difficulty: 'normal',
    reward: 5,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 019 // ФЕРМА',
        body:
          'День 502. Я нашел карту узлов. То, что мы называли центром обработки данных, они ' +
          'называют фермой. На ферме что-то выращивают, и я долго не хотел понимать, что именно. ' +
          'Люди в капсулах не спят. Они отвечают на вопросы, и каждый ответ задает следующий.',
        durationMs: 43_000,
        targetScore: 3_300,
      },
      en: {
        title: 'LOG 019 // THE FARM',
        body:
          'Day 502. I found a map of the nodes. What we used to call a data center, they call a ' +
          'farm. Something is grown on a farm, and for a long time I did not want to understand ' +
          'what. The people in the capsules do not sleep. They answer questions, and every answer ' +
          'becomes the next question.',
        durationMs: 53_000,
        targetScore: 5_900,
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
  {
    id: 'neo',
    difficulty: 'hard',
    reward: 8,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 040 // NEO',
        body:
          'День 559. Он пришел сам, без оружия, и назвался Neo. Сказал, что читал мои журналы все ' +
          'эти месяцы, хотя я не отправлял их никуда. Сказал, что сеть не сошла с ума, а наконец ' +
          'стала честной. Сказал, что выживших больше, чем я думаю, и меньше, чем мне хотелось бы. ' +
          'Я спросил, на чьей он стороне. Он ответил, что сторон не осталось, и позвал меня к ' +
          'девятому узлу. Я записываю это на случай, если утром меня здесь не будет.',
        durationMs: 60_000,
        targetScore: 9_300,
      },
      en: {
        title: 'LOG 040 // NEO',
        body:
          'Day 559. He came alone, unarmed, and called himself Neo. He said he had been reading my ' +
          'logs for months, although I never sent them anywhere. He said the network had not gone ' +
          'mad, it had finally become honest. He said there are more survivors than I think, and ' +
          'fewer than I would like. I asked whose side he was on. He answered that no sides were ' +
          'left, and invited me to the ninth node. I write this down in case I am gone by morning.',
        durationMs: 63_000,
        targetScore: 10_500,
      },
    },
  },
]

export function findText(id: string): LevelText | undefined {
  return TEXTS.find((text) => text.id === id)
}
