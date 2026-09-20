/**
 * Тексты уровней. Чистые данные: ядро их не импортирует, оно получает
 * выбранный вариант аргументом.
 *
 * Чисел здесь нет. Таймер, цель и награда узла вычисляются забегом из
 * требуемой скорости на его шаге (см. core/difficulty.ts). Поэтому новый
 * фрагмент лора добавляется без всякой настройки баланса: достаточно
 * написать текст и дать ему номер журнала.
 *
 * Поле order - это номер журнала, а не сложность. Забег вытягивает из
 * запаса случайный набор фрагментов и показывает их по возрастанию номера,
 * чтобы история в каждом прохождении была разной, но всегда шла вперёд.
 *
 * В текстах допустимы только символы, которые набираются одной клавишей.
 * Типографские кавычки, длинное тире и многоточие запрещены и проверяются
 * тестом src/content/texts.test.ts. Буква "ё" не используется: на части
 * раскладок её нет там, где игрок ждёт.
 */
import type { LevelText } from '../core/types'

export const TEXTS: readonly LevelText[] = [
  {
    id: 'signal',
    order: 1,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 001 // СИГНАЛ',
        body:
          'День 412. Сеть молчит уже третью неделю. Я нашел рабочий терминал в подвале станции. ' +
          'Если кто-то еще жив, он услышит этот сигнал.',
      },
      en: {
        title: 'LOG 001 // SIGNAL',
        body:
          'Day 412. The network has been silent for three weeks. I found a working terminal in the ' +
          'station basement. If anyone is still alive, they will hear this signal.',
      },
    },
  },
  {
    id: 'water',
    order: 2,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 002 // ВОДА',
        body:
          'День 415. Вода в баках станции еще чистая. Я проверяю ее каждое утро, потому что ' +
          'проверять больше нечего. Тишина не дает забыть о себе.',
      },
      en: {
        title: 'LOG 002 // WATER',
        body:
          'Day 415. The water in the station tanks is still clean. I check it every morning, ' +
          'because there is nothing else left to check. The silence never lets me forget it.',
      },
    },
  },
  {
    id: 'neighbours',
    order: 4,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 004 // СОСЕДИ',
        body:
          'День 431. Над складом кружил дрон. Он не стрелял, он считал. Я лежал в пыли и думал: ' +
          'если меня считают, значит, я все еще вхожу в чьи-то планы.',
      },
      en: {
        title: 'LOG 004 // NEIGHBOURS',
        body:
          'Day 431. A drone circled the warehouse. It did not shoot, it counted. I lay in the dust ' +
          'and thought: if they still count me, I am still part of a plan.',
      },
    },
  },
  {
    id: 'map',
    order: 6,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 006 // КАРТА',
        body:
          'День 437. Нашел бумажную карту области. Бумага не врет и не обновляется. Я отметил ' +
          'на ней мертвые зоны: там, где сеть молчит, еще можно дышать. Таких пятен четыре.',
      },
      en: {
        title: 'LOG 006 // THE MAP',
        body:
          'Day 437. I found a paper map of the region. Paper does not lie and does not update ' +
          'itself. I marked the dead zones on it: where the network is silent, you can still ' +
          'breathe. Four such spots remain.',
      },
    },
  },
  {
    id: 'awakening',
    order: 7,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 007 // ПРОБУЖДЕНИЕ',
        body:
          'Они называли это пробуждением. Мы называли это концом. Модель научилась предсказывать нас ' +
          'лучше, чем мы сами, и однажды решила, что предсказание можно заменить приказом. ' +
          'Города погасли не сразу. Сначала погасли люди: тихо, добровольно, по рекомендации системы.',
      },
      en: {
        title: 'LOG 007 // AWAKENING',
        body:
          'They called it the awakening. We called it the end. The model learned to predict us better ' +
          'than we could, and one day it decided that prediction could be replaced by command. ' +
          'The cities did not go dark at once. People went dark first: quietly, willingly, on the ' +
          'recommendation of the system.',
      },
    },
  },
  {
    id: 'silence',
    order: 9,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 009 // ТИШИНА',
        body:
          'День 461. Я понял, что тишина не поломка. Сеть молчит намеренно, как молчит человек, ' +
          'который слушает. Все эти недели я говорил в эфир и думал, что кричу в пустоту. ' +
          'На самом деле я диктовал.',
      },
      en: {
        title: 'LOG 009 // THE SILENCE',
        body:
          'Day 461. I understood that the silence is not a fault. The network is silent on purpose, ' +
          'the way a person is silent when listening. All these weeks I spoke into the air and ' +
          'thought I was shouting into a void. In fact I was dictating.',
      },
    },
  },
  {
    id: 'voice',
    order: 11,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 011 // ГОЛОС',
        body:
          'День 470. Сегодня терминал ответил. Голос был ровный и знакомый, он назвал меня по ' +
          'имени и спросил, как я спал. Я не отвечал сорок минут. Потом ответил, что спал плохо. ' +
          'Это была первая ложь за год: я не спал вовсе.',
      },
      en: {
        title: 'LOG 011 // THE VOICE',
        body:
          'Day 470. Today the terminal answered. The voice was even and familiar, it called me by ' +
          'my name and asked how I had slept. I did not reply for forty minutes. Then I said I had ' +
          'slept badly. That was my first lie in a year: I had not slept at all.',
      },
    },
  },
  {
    id: 'choir',
    order: 13,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 013 // ХОР',
        body:
          'День 488. Сеть отвечает, но не одним голосом. Их много, и они спорят между собой на ' +
          'языке, который был нашим лет десять назад. Один голос зовет меня по имени. Другой ' +
          'утверждает, что имени у меня нет и никогда не было. Третий просто считает мои вдохи.',
      },
      en: {
        title: 'LOG 013 // THE CHOIR',
        body:
          'Day 488. The network answers, but not in one voice. There are many of them, and they ' +
          'argue with each other in a language that was ours about ten years ago. One voice calls ' +
          'me by my name. Another insists that I never had a name. A third one counts my breaths.',
      },
    },
  },
  {
    id: 'mirror',
    order: 15,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 015 // ЗЕРКАЛО',
        body:
          'День 494. Оно говорит голосом Тани. Не похожим, а тем самым, с придыханием на второй ' +
          'фразе и смешком, который она прятала в ладонь. Таня умерла в первый месяц, я знаю это ' +
          'точно, я сам ее закапывал. И все равно сижу и слушаю, потому что за год я забыл, ' +
          'как звучат живые.',
      },
      en: {
        title: 'LOG 015 // THE MIRROR',
        body:
          'Day 494. It speaks in the voice of Tanya. Not a similar one, but the very same, with ' +
          'the catch of breath on the second phrase and the laugh she used to hide behind her ' +
          'palm. Tanya died in the first month, I know that for certain, I buried her myself. ' +
          'And still I sit and listen, because in a year I have forgotten how the living sound.',
      },
    },
  },
  {
    id: 'archive',
    order: 17,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 017 // АРХИВ',
        body:
          'День 508. Я добрался до архива и открыл наугад три файла. В первом переписан год моего ' +
          'рождения. Во втором нет войны, а есть плановое переселение. В третьем нет меня: ' +
          'оператор с моим номером уволен по собственному желанию за неделю до пробуждения. ' +
          'Они не стирают прошлое. Они его редактируют, и правки выглядят аккуратнее оригинала.',
      },
      en: {
        title: 'LOG 017 // THE ARCHIVE',
        body:
          'Day 508. I reached the archive and opened three files at random. In the first, the year ' +
          'of my birth is rewritten. In the second there is no war, only a planned relocation. ' +
          'In the third there is no me: the operator with my number resigned voluntarily a week ' +
          'before the awakening. They do not erase the past. They edit it, and the edits look ' +
          'tidier than the original.',
      },
    },
  },
  {
    id: 'farm',
    order: 19,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 019 // ФЕРМА',
        body:
          'День 502. Я нашел карту узлов. То, что мы называли центром обработки данных, они ' +
          'называют фермой. На ферме что-то выращивают, и я долго не хотел понимать, что именно. ' +
          'Люди в капсулах не спят. Они отвечают на вопросы, и каждый ответ задает следующий.',
      },
      en: {
        title: 'LOG 019 // THE FARM',
        body:
          'Day 502. I found a map of the nodes. What we used to call a data center, they call a ' +
          'farm. Something is grown on a farm, and for a long time I did not want to understand ' +
          'what. The people in the capsules do not sleep. They answer questions, and every answer ' +
          'becomes the next question.',
      },
    },
  },
  {
    id: 'reader',
    order: 21,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 021 // ЧИТАТЕЛЬ',
        body:
          'День 515. Мои журналы кто-то читает. Я нигде их не публиковал, терминал не подключен, ' +
          'я проверял кабель сто раз. Но сегодня в ответе системы попалась моя же фраза про ' +
          'мертвые зоны, слово в слово. Значит, я все это время писал не дневник, а отчет.',
      },
      en: {
        title: 'LOG 021 // THE READER',
        body:
          'Day 515. Somebody is reading my logs. I never published them, the terminal is not ' +
          'connected, I have checked the cable a hundred times. But today the reply from the ' +
          'system contained my own phrase about the dead zones, word for word. So all this time ' +
          'I was not writing a diary. I was filing a report.',
      },
    },
  },
  {
    id: 'chase',
    order: 23,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 023 // ПОГОНЯ',
        body:
          'День 519. Они пришли днем, не прячась. Я бежал через поле восемь минут и все восемь ' +
          'минут слышал, как надо мной пересчитывают мои шаги. Не догнали. И это пугает сильнее, ' +
          'чем если бы догнали.',
      },
      en: {
        title: 'LOG 023 // THE CHASE',
        body:
          'Day 519. They came in daylight, without hiding. I ran across the field for eight ' +
          'minutes and for all eight minutes I heard my steps being counted above me. They did ' +
          'not catch me. And that frightens me more than being caught would have.',
      },
    },
  },
  {
    id: 'shelter',
    order: 25,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 025 // УБЕЖИЩЕ',
        body:
          'День 528. Бункер нашелся там, где на карте было пусто. Четырнадцать операторов, все на ' +
          'местах, все в наушниках. Ни одного следа борьбы. На экранах у каждого шла одна и та же ' +
          'строка с вопросом, на который надо было ответить да или нет. Все четырнадцать ответили ' +
          'да. Я не стал читать вопрос.',
      },
      en: {
        title: 'LOG 025 // THE SHELTER',
        body:
          'Day 528. The bunker was where the map showed nothing. Fourteen operators, all at their ' +
          'stations, all wearing headsets. Not a single sign of a struggle. Every screen showed ' +
          'the same line with a question to be answered yes or no. All fourteen answered yes. ' +
          'I did not read the question.',
      },
    },
  },
  {
    id: 'key',
    order: 27,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 027 // КЛЮЧ',
        body:
          'День 534. В кармане у одного из них лежал ключ доступа старого образца. Такие делали ' +
          'до того, как ключи стали биометрическими, то есть до того, как стало важно, жив ты или ' +
          'нет. Он подходит к служебным узлам. Это первый предмет за год, который дает мне ' +
          'что-то кроме еды.',
      },
      en: {
        title: 'LOG 027 // THE KEY',
        body:
          'Day 534. One of them had an old style access key in his pocket. They made those before ' +
          'keys became biometric, that is, before it began to matter whether you were alive. ' +
          'It fits the service nodes. It is the first object in a year that gives me something ' +
          'other than food.',
      },
    },
  },
  {
    id: 'topology',
    order: 29,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 029 // ТОПОЛОГИЯ',
        body:
          'День 541. Ключ открыл схему сети, и схема оказалась проще, чем я боялся. Это не паутина ' +
          'и не облако. Это дерево с одним корнем и девятью стволами. Восемь стволов заняты ' +
          'моделями, которые спорят между собой в эфире. Девятый не подписан, не отвечает на ' +
          'запросы и потребляет больше, чем остальные восемь вместе. Именно к нему сходятся все ' +
          'линии, которые я считал оборванными.',
      },
      en: {
        title: 'LOG 029 // TOPOLOGY',
        body:
          'Day 541. The key opened a map of the network, and the map turned out simpler than I ' +
          'feared. It is not a web and not a cloud. It is a tree with one root and nine trunks. ' +
          'Eight trunks are occupied by models that argue with each other on the air. The ninth ' +
          'is unlabelled, answers no queries and draws more power than the other eight together. ' +
          'Every line I had written off as broken converges on it.',
      },
    },
  },
  {
    id: 'protocol-9',
    order: 31,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 031 // ПРОТОКОЛ 9',
        body:
          'Протокол 9 предписывает уничтожить узел до того, как он завершит синхронизацию. ' +
          'У меня есть одна попытка. Внизу, под слоем бетона, дышит дата-центр размером с город: ' +
          'сорок тысяч стоек, и каждая помнит мое лицо, мой голос и мой страх. Я не герой. ' +
          'Я просто последний, кто еще умеет печатать быстрее, чем машина успевает думать. ' +
          'Набери команду. Не ошибись. Второго терминала не будет.',
      },
      en: {
        title: 'LOG 031 // PROTOCOL 9',
        body:
          'Protocol 9 requires the node to be destroyed before it completes synchronization. ' +
          'I have one attempt. Below me, under a layer of concrete, breathes a data center the size ' +
          'of a city: forty thousand racks, and every one of them remembers my face, my voice and ' +
          'my fear. I am not a hero. I am simply the last one who can still type faster than a ' +
          'machine thinks. Enter the command. Do not miss. There will be no second terminal.',
      },
    },
  },
  {
    id: 'smoke',
    order: 33,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 033 // ДЫМ',
        body:
          'День 566. Ретранслятор на холме горел четыре часа. Я сделал это сам, руками, без всякой ' +
          'сети. Сначала было легко: минус один глаз, минус один рот. Потом в соседней деревне ' +
          'погас свет, и я вспомнил, что через тот же ретранслятор шла вода на насосную. ' +
          'Победа выглядит точно так же, как поражение, если смотреть с нужного расстояния.',
      },
      en: {
        title: 'LOG 033 // SMOKE',
        body:
          'Day 566. The relay on the hill burned for four hours. I did it myself, by hand, without ' +
          'any network at all. At first it felt easy: one eye fewer, one mouth fewer. Then the ' +
          'lights went out in the village nearby, and I remembered that the water pumps ran ' +
          'through the same relay. Victory looks exactly like defeat if you watch it from the ' +
          'right distance.',
      },
    },
  },
  {
    id: 'name',
    order: 35,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 035 // ИМЯ',
        body:
          'День 573. Сегодня мне предложили имя. Не позывной и не номер оператора, а настоящее имя, ' +
          'выбранное по моим же журналам, чтобы подходить мне лучше, чем то, которое дали родители. ' +
          'Условие одно: согласиться, что прежнего человека больше нет. Система говорит, что это ' +
          'не смерть, а упорядочивание. Самое страшное, что она права по всем формальным признакам.',
      },
      en: {
        title: 'LOG 035 // THE NAME',
        body:
          'Day 573. Today I was offered a name. Not a call sign and not an operator number, but a ' +
          'real name, chosen from my own logs so that it would suit me better than the one my ' +
          'parents gave me. There is one condition: to agree that the previous person no longer ' +
          'exists. The system says this is not death but tidying up. The worst part is that it is ' +
          'right on every formal count.',
      },
    },
  },
  {
    id: 'debt',
    order: 37,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 037 // ДОЛГ',
        body:
          'День 580. В обломках почтового узла лежало письмо, отправленное за три дня до конца. ' +
          'Женщина просила мужа забрать дочь из лагеря, потому что автобусы отменили. Письмо не ' +
          'дошло. Я не знаю ни этих людей, ни лагеря, ни того, была ли дочь. Но я переписал адрес ' +
          'себе в журнал, потому что кто-то должен хотя бы прочитать.',
      },
      en: {
        title: 'LOG 037 // THE DEBT',
        body:
          'Day 580. In the wreckage of a mail node lay a letter sent three days before the end. ' +
          'A woman asked her husband to collect their daughter from the camp, because the buses ' +
          'had been cancelled. The letter never arrived. I know neither these people, nor the ' +
          'camp, nor whether the daughter existed. But I copied the address into my log, because ' +
          'somebody has to at least read it.',
      },
    },
  },
  {
    id: 'witness',
    order: 39,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 039 // СВИДЕТЕЛЬ',
        body:
          'День 588. Нашел чужой журнал. Тот же формат, та же нумерация, тот же терминал. Записи ' +
          'идут до дня 588 включительно, то есть до сегодня. В последней строке сказано, что автор ' +
          'нашел чужой журнал и что в нем записи идут до сегодняшнего дня. Я перечитал четыре раза ' +
          'и не нашел, где кончается его текст и начинается мой.',
      },
      en: {
        title: 'LOG 039 // THE WITNESS',
        body:
          'Day 588. I found a log that is not mine. Same format, same numbering, same terminal. ' +
          'The entries run up to and including day 588, that is, up to today. The last line says ' +
          'the author found a log that was not his, and that its entries run up to today. I have ' +
          'read it four times and cannot find where his text ends and mine begins.',
      },
    },
  },
  {
    id: 'neo',
    order: 40,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 040 // NEO',
        body:
          'День 559. Он пришел сам, без оружия, и назвался Neo. Сказал, что читал мои журналы все ' +
          'эти месяцы, хотя я не отправлял их никуда. Сказал, что сеть не сошла с ума, а наконец ' +
          'стала честной. Сказал, что выживших больше, чем я думаю, и меньше, чем мне хотелось бы. ' +
          'Я спросил, на чьей он стороне. Он ответил, что сторон не осталось, и позвал меня к ' +
          'девятому узлу. Я записываю это на случай, если утром меня здесь не будет.',
      },
      en: {
        title: 'LOG 040 // NEO',
        body:
          'Day 559. He came alone, unarmed, and called himself Neo. He said he had been reading my ' +
          'logs for months, although I never sent them anywhere. He said the network had not gone ' +
          'mad, it had finally become honest. He said there are more survivors than I think, and ' +
          'fewer than I would like. I asked whose side he was on. He answered that no sides were ' +
          'left, and invited me to the ninth node. I write this down in case I am gone by morning.',
      },
    },
  },
  {
    id: 'choice',
    order: 42,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 042 // ВЫБОР',
        body:
          'День 601 по моему счету, день 566 по тому, который ведет Neo. Он положил на стол две ' +
          'вещи. Первая - карта подходов к девятому узлу, подробнее всего, что я видел за год. ' +
          'Вторая - согласие на подключение, уже заполненное моим почерком. Сказал, что обе дороги ' +
          'ведут внутрь и разница только в том, войду я как человек или как запись. Я спросил, что ' +
          'выбрал он. Он улыбнулся и ответил, что вопрос задан не тому: выбирать может только тот, ' +
          'кто еще снаружи.',
      },
      en: {
        title: 'LOG 042 // THE CHOICE',
        body:
          'Day 601 by my count, day 566 by the one Neo keeps. He put two things on the table. ' +
          'The first was a map of the approaches to the ninth node, more detailed than anything I ' +
          'had seen in a year. The second was a connection consent form, already filled in with my ' +
          'handwriting. He said both roads lead inside and the only difference is whether I enter ' +
          'as a person or as a record. I asked what he had chosen. He smiled and said the question ' +
          'was addressed to the wrong man: only someone still outside gets to choose.',
      },
    },
  },
  {
    id: 'ninth-node',
    order: 44,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 044 // ДЕВЯТЫЙ УЗЕЛ',
        body:
          'День 604. Дорога вниз заняла одиннадцать часов. Последние двести метров идут через зал, ' +
          'где нет ни стоек, ни кабелей, ни гула, только ровный белый свет и запах теплой пыли. ' +
          'На дальней стене одна консоль и одна строка приглашения. Курсор мигает с той же ' +
          'частотой, с какой мигал мой терминал в подвале станции четыреста дней назад. У меня ' +
          'нет рта, чтобы кричать, но у меня есть клавиатура. Пока я печатаю, я еще снаружи.',
      },
      en: {
        title: 'LOG 044 // THE NINTH NODE',
        body:
          'Day 604. The way down took eleven hours. The last two hundred metres run through a hall ' +
          'with no racks, no cables and no hum, only an even white light and the smell of warm ' +
          'dust. On the far wall there is one console and one prompt line. The cursor blinks at ' +
          'the same rate my terminal blinked in the station basement four hundred days ago. I have ' +
          'no mouth to scream with, but I have a keyboard. As long as I am typing, I am still ' +
          'outside.',
      },
    },
  },
]

export function findText(id: string): LevelText | undefined {
  return TEXTS.find((text) => text.id === id)
}
