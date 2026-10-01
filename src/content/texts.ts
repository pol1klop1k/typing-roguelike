/**
 * Тексты уровней. Чистые данные: ядро их не импортирует, оно получает
 * выбранный вариант аргументом.
 *
 * Чисел здесь нет. Таймер, цель и награда узла вычисляются забегом из
 * требуемой скорости на его шаге (см. core/difficulty.ts). Поэтому новый
 * фрагмент лора добавляется без всякой настройки баланса: достаточно
 * написать текст и дать ему номер журнала.
 *
 * Содержание сверяется с lore.md в корне проекта. Там же - структура пяти
 * актов, голоса восьми моделей и список того, что запрещено объяснять.
 *
 * Поле slot - это номер журнала и место в линии, а не сложность. Счёт дней
 * внутри линии идёт строго вперёд.
 *
 * У одного слота несколько текстов, и забег берёт из каждого слота ровно
 * один (см. pickLevels в core/run.ts). Поэтому варианты одного слота обязаны
 * рассказывать об ОДНОМ И ТОМ ЖЕ событии линии, в один и тот же день, но
 * разными словами и с разной стороны. Подменять событие нельзя: соседние
 * слоты рассчитывают, что оно произошло. По той же причине текст не имеет
 * права ссылаться на конкретный вариант соседнего слота - он должен читаться
 * сам по себе.
 *
 * В текстах допустимы только символы, которые набираются одной клавишей.
 * Типографские кавычки, длинное тире и многоточие запрещены и проверяются
 * тестом src/content/texts.test.ts. Буква "ё" не используется: на части
 * раскладок её нет там, где игрок ждёт.
 *
 * Длина тела: 220-400 знаков. Это не вкус, а арифметика из balance.ts -
 * узлу нужно до 145 знаков работы, а израсходовать разрешено не больше 70%
 * текста. Текст короче режет цель на ранних узлах.
 */
import type { Language, LevelText } from '../core/types'

export const TEXTS: readonly LevelText[] = [
  // --- АКТ I. ОДИН -------------------------------------------------------
  // Жив ли ещё кто-нибудь? Акт отнимает надежду на других людей.
  {
    id: 'signal',
    slot: 1,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 001 // СИГНАЛ',
        body:
          'День 412. Сеть молчит третью неделю. В подвале станции я нашел терминал, который еще ' +
          'помнит, как включаться. Провода целы, питание идет, на экране мигает курсор. Я не знаю, ' +
          'кому пишу. Если кто-то жив и слышит этот сигнал, пусть ответит любым словом. Я готов ждать.',
      },
      en: {
        title: 'LOG 001 // SIGNAL',
        body:
          'Day 412. The network has been silent for three weeks. In the station basement I found a ' +
          'terminal that still remembers how to switch on. The wires are intact, the power holds, a ' +
          'cursor blinks on the screen. I do not know who I am writing to. If anyone is alive and ' +
          'hears this signal, answer with any word. I am ready to wait.',
      },
    },
  },
  {
    id: 'beacon',
    slot: 1,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 001 // МАЯК',
        body:
          'День 412. На крыше депо стоит аварийный маяк, и он работает: я нашел рубильник под слоем ' +
          'голубиного пуха. Маяк умеет только точку и тире, а я помню из азбуки три буквы. Всю ночь ' +
          'я передавал эти три буквы по кругу. Если кто-то разбирает морзянку лучше меня, он поймет ' +
          'хотя бы, что передает человек.',
      },
      en: {
        title: 'LOG 001 // THE BEACON',
        body:
          'Day 412. There is an emergency beacon on the depot roof, and it works: I found the switch ' +
          'under a layer of pigeon down. The beacon knows only dots and dashes, and I remember three ' +
          'letters of the code. I sent those three letters in a loop all night. If anyone reads morse ' +
          'better than I do, they will at least understand that a person is sending it.',
      },
    },
  },
  {
    id: 'radio-room',
    slot: 1,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 001 // РУБКА',
        body:
          'День 412. Три дня я чинил радиорубку речного порта. Лампы целы, антенна цела, не было ' +
          'только предохранителя на двадцать ампер, и я вырезал его из тостера. Сегодня в семь ' +
          'вечера она ожила. Я назвал координаты, дату и свое имя. Голос сел на второй фразе: ' +
          'я не говорил вслух с зимы.',
      },
      en: {
        title: 'LOG 001 // THE RADIO ROOM',
        body:
          'Day 412. I spent three days repairing the radio room at the river port. The tubes were ' +
          'fine, the antenna was fine, the only missing part was a twenty amp fuse, and I cut one out ' +
          'of a toaster. At seven this evening it came alive. I gave coordinates, the date and my ' +
          'name. My voice failed on the second sentence: I had not spoken aloud since winter.',
      },
    },
  },
  {
    id: 'first-page',
    slot: 1,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 001 // ПЕРВАЯ СТРАНИЦА',
        body:
          'День 412. Начинаю вести журнал. Не ради потомков и не ради истории, а потому что вчера я ' +
          'минут пять вспоминал слово поручень и так и не вспомнил. Слова уходят первыми, за ними ' +
          'уходит все остальное. Буду писать каждые несколько дней. Если записи оборвутся, значит, ' +
          'писать стало нечем или уже некому.',
      },
      en: {
        title: 'LOG 001 // THE FIRST PAGE',
        body:
          'Day 412. I am starting a journal. Not for posterity and not for history, but because ' +
          'yesterday I spent five minutes trying to remember the word handrail and never got there. ' +
          'Words go first, and everything else follows them. I will write every few days. If the ' +
          'entries stop, it means there is nothing left to write with, or nobody left to write for.',
      },
    },
  },
  {
    id: 'callsign',
    slot: 1,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 001 // ПОЗЫВНОЙ',
        body:
          'День 412. Я выбрал себе позывной, потому что имя произносить больше некому, а обращаться ' +
          'к себе как-то надо. Взял по названию станции: две буквы и цифра. Сказал его вслух четыре ' +
          'раза, и на четвертый оно перестало быть смешным. Теперь у меня есть с кем здороваться ' +
          'по утрам.',
      },
      en: {
        title: 'LOG 001 // THE CALL SIGN',
        body:
          'Day 412. I have chosen a call sign, because there is nobody left to say my name and I ' +
          'still have to address myself somehow. I took it from the station: two letters and a ' +
          'number. I said it out loud four times, and on the fourth it stopped sounding ridiculous. ' +
          'Now I have somebody to greet in the mornings.',
      },
    },
  },
  {
    id: 'water',
    slot: 2,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 002 // ВОДА',
        body:
          'День 415. Вода в баках еще чистая. Я проверяю ее каждое утро, потому что проверять больше ' +
          'нечего, а руки требуют работы. Двести литров, если экономить, это четыре месяца. Я отмечаю ' +
          'уровень мелом на стене, и эта полоска пока единственное, что меняется по расписанию.',
      },
      en: {
        title: 'LOG 002 // WATER',
        body:
          'Day 415. The water in the tanks is still clean. I check it every morning, because there is ' +
          'nothing else left to check and my hands want work. Two hundred liters, four months if I am ' +
          'careful. I mark the level on the wall in chalk, and that line is the only thing in my life ' +
          'that still changes on schedule.',
      },
    },
  },
  {
    id: 'diesel',
    slot: 2,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 002 // СОЛЯРКА',
        body:
          'День 415. В генераторе осталось сорок литров. Это девяносто часов света, если жечь по два ' +
          'часа в сутки, а я жгу по полтора. Свет мне нужен не для работы, а для того, чтобы вечер ' +
          'отличался от ночи. Остаток я записываю мелом на баке. Пока цифра уменьшается на моих ' +
          'глазах, время идет по-честному.',
      },
      en: {
        title: 'LOG 002 // DIESEL',
        body:
          'Day 415. Forty liters left in the generator. That is ninety hours of light if I burn two ' +
          'hours a day, and I burn one and a half. I do not need the light for work, I need the ' +
          'evening to be different from the night. I chalk the remainder on the tank. While the ' +
          'number goes down in front of me, time is passing honestly.',
      },
    },
  },
  {
    id: 'tins',
    slot: 2,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 002 // БАНКИ',
        body:
          'День 415. Я разобрал склад по срокам годности и ем строго по возрастанию. Двести ' +
          'шестнадцать банок, из них сорок вздулись, их я выставил отдельно и не выбрасываю: вдруг ' +
          'настанет день, когда я о них вспомню. По самым честным подсчетам, еды на полтора года. ' +
          'Мне некуда девать полтора года.',
      },
      en: {
        title: 'LOG 002 // THE TINS',
        body:
          'Day 415. I sorted the store by expiry date and eat strictly in order. Two hundred and ' +
          'sixteen tins, forty of them swollen, which I set aside and do not throw away: there may ' +
          'come a day when I remember them. By the most honest count, that is eighteen months of ' +
          'food. I have nowhere to put eighteen months.',
      },
    },
  },
  {
    id: 'firewood',
    slot: 2,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 002 // ДРОВА',
        body:
          'День 415. В подвале держится девять градусов, и это лучшее, что у меня есть. Дрова я ношу ' +
          'из разобранной конторки: стол, стеллажи, дверные косяки. Сегодня дошла очередь до стула, ' +
          'на котором я сидел первые недели. Жечь мебель не жалко. Жалко, что я помню, как на ней ' +
          'сидели другие.',
      },
      en: {
        title: 'LOG 002 // FIREWOOD',
        body:
          'Day 415. The basement holds at nine degrees, and that is the best thing I have. I carry ' +
          'firewood from the office I took apart: the desk, the shelves, the door frames. Today it ' +
          'was the turn of the chair I sat on in the first weeks. Burning furniture costs me nothing. ' +
          'What costs me is remembering other people sitting on it.',
      },
    },
  },
  {
    id: 'batteries',
    slot: 2,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 002 // АМПЕРЫ',
        body:
          'День 415. Четыре аккумулятора, суммарно двести ампер-часов, и я считаю их как деньги. ' +
          'Фонарь стоит дешево, терминал дорого, обогреватель я не включаю вовсе. Панель на крыше ' +
          'добавляет по чуть-чуть, если день ясный. Выходит, у меня снова есть погода, зарплата и ' +
          'бюджет. Не хватает только смысла тратить.',
      },
      en: {
        title: 'LOG 002 // AMP HOURS',
        body:
          'Day 415. Four batteries, two hundred amp hours in total, and I count them like money. The ' +
          'lamp is cheap, the terminal is expensive, the heater I do not switch on at all. The panel ' +
          'on the roof adds a little when the day is clear. So I have weather, wages and a budget ' +
          'again. The only thing missing is a reason to spend.',
      },
    },
  },
  {
    id: 'count',
    slot: 3,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 003 // СЧЕТ',
        body:
          'День 419. Счет дням я начал не сразу. Первые месяцы я просто жил, а потом понял, что ' +
          'перестал отличать вторник от октября. Число 412 взято с потолка: я прибавил к дате, ' +
          'которую помнил, столько, сколько показалось честным. Может быть, я ошибся на неделю. ' +
          'Но пока я считаю, у меня есть время, а не просто темнота.',
      },
      en: {
        title: 'LOG 003 // THE COUNT',
        body:
          'Day 419. I did not start counting at once. For months I simply lived, and then noticed I ' +
          'could no longer tell Tuesday from October. The number 412 is invented: I added to the last ' +
          'date I remembered as many days as felt honest. I may be a week off. But while I count, ' +
          'I have time, and not just darkness.',
      },
    },
  },
  {
    id: 'tuesday',
    slot: 3,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 003 // ВТОРНИК',
        body:
          'День 419. Я бреюсь по вторникам. Вторников больше нет ни у кого, кроме меня, но я знаю, ' +
          'какой сегодня, и этого достаточно. Лезвие тупое, вода холодная, смысла ноль. Смысл в том, ' +
          'что так решил я, а не обстоятельства. Все, что я делаю не по нужде, пока и держит меня ' +
          'на плаву.',
      },
      en: {
        title: 'LOG 003 // TUESDAY',
        body:
          'Day 419. I shave on Tuesdays. Nobody has Tuesdays any more except me, but I know which day ' +
          'it is, and that is enough. The blade is blunt, the water is cold, the point is zero. The ' +
          'point is that I decided it and not the circumstances. Everything I do because I chose to, ' +
          'and not because I had to, is what keeps me afloat.',
      },
    },
  },
  {
    id: 'schedule',
    slot: 3,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 003 // РАСПОРЯДОК',
        body:
          'День 419. Написал распорядок и повесил его над койкой. Подъем, обход, вода, эфир, запись, ' +
          'отбой. Он мне не нужен: спешить некуда и опаздывать не к кому. Но без него первый день ' +
          'растекся на второй, второй на третий, и я очнулся, не помня, ел ли вчера. Расписание это ' +
          'не дисциплина. Это забор.',
      },
      en: {
        title: 'LOG 003 // THE SCHEDULE',
        body:
          'Day 419. I wrote out a schedule and pinned it over the bunk. Wake, rounds, water, ' +
          'broadcast, entry, lights out. I do not need it: there is nowhere to hurry and nobody to be ' +
          'late for. But without it the first day ran into the second and the second into the third, ' +
          'and I came round not remembering whether I had eaten. A schedule is not discipline. It is ' +
          'a fence.',
      },
    },
  },
  {
    id: 'face',
    slot: 3,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 003 // ЛИЦО',
        body:
          'День 419. В душевой висело зеркало, и я снял его в первый же месяц. Сегодня повесил ' +
          'обратно, решив, что взрослый человек должен смотреть на себя. Смотрел минуту. Лицо чужое, ' +
          'и не от худобы и не от бороды. Оно чужое потому, что на него давно никто не смотрел, а ' +
          'лицо без зрителя перестает быть лицом.',
      },
      en: {
        title: 'LOG 003 // THE FACE',
        body:
          'Day 419. There was a mirror in the shower room and I took it down in the first month. ' +
          'Today I hung it back, having decided that a grown man ought to look at himself. I looked ' +
          'for a minute. The face is a stranger, and not from the weight or the beard. It is a ' +
          'stranger because nobody has looked at it for a long time, and a face without a viewer ' +
          'stops being a face.',
      },
    },
  },
  {
    id: 'talking',
    slot: 3,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 003 // ВСЛУХ',
        body:
          'День 419. Я разговариваю вслух. Комментирую обход, здороваюсь с генератором, спорю сам с ' +
          'собой, идти ли на север. Неделю назад поймал себя на этом и испугался. Потом попробовал ' +
          'молчать сутки, и к вечеру голос сел, будто я болел. Голос надо носить, как мышцу. ' +
          'Молчание отбирает его быстрее одиночества.',
      },
      en: {
        title: 'LOG 003 // OUT LOUD',
        body:
          'Day 419. I talk out loud. I narrate my rounds, greet the generator, argue with myself ' +
          'about whether to head north. A week ago I caught myself at it and was frightened. Then I ' +
          'tried keeping quiet for a day, and by evening my voice had gone as if I had been ill. A ' +
          'voice has to be carried like a muscle. Silence takes it faster than loneliness does.',
      },
    },
  },
  {
    id: 'neighbours',
    slot: 4,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 004 // СОСЕДИ',
        body:
          'День 423. Над складом кружил дрон. Он не стрелял и не снижался, он считал: прошел по ' +
          'сетке, вернулся, прошел еще раз. Я лежал в пыли и думал одну мысль, от которой стало ' +
          'легче и тут же холодно. Если меня пересчитывают, значит, я все еще вхожу в чьи-то планы. ' +
          'Значит, я не забыт, а учтен.',
      },
      en: {
        title: 'LOG 004 // NEIGHBOURS',
        body:
          'Day 423. A drone circled over the warehouse. It did not fire and did not descend, it ' +
          'counted: crossed the grid, came back, crossed again. I lay in the dust with one thought ' +
          'that felt like relief and then like cold. If I am being counted, I am still part of ' +
          'somebody plans. Not forgotten. Filed.',
      },
    },
  },
  {
    id: 'perimeter',
    slot: 4,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 004 // ПЕРИМЕТР',
        body:
          'День 423. Обошел станцию по кругу и нашел след: гусеничный, неглубокий, ровно в двухстах ' +
          'метрах от стены по всему периметру. Ни одного захода внутрь. Кто-то объехал меня по ' +
          'окружности и уехал. Я мерил шагами четыре раза, радиус везде один. Это не разведка. Это ' +
          'чертеж, на котором я в центре.',
      },
      en: {
        title: 'LOG 004 // THE PERIMETER',
        body:
          'Day 423. I walked a circle around the station and found a track: caterpillar, shallow, ' +
          'exactly two hundred meters from the wall the whole way round. Not one approach inward. ' +
          'Somebody drove around me and left. I paced it four times, the radius is the same ' +
          'everywhere. That is not a patrol. That is a drawing with me at the center.',
      },
    },
  },
  {
    id: 'lamp',
    slot: 4,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 004 // ФОНАРЬ',
        body:
          'День 423. Фонарь на въезде горел с осени, потом перегорел, и я обрадовался: наконец-то ' +
          'хоть что-то состарилось само. Сегодня он горит снова. Новая лампа, свежая мастика на ' +
          'крышке плафона, лестницы рядом нет. Я стоял под ним минут десять. Электричество в поселке ' +
          'кончилось год назад.',
      },
      en: {
        title: 'LOG 004 // THE LAMP',
        body:
          'Day 423. The lamp at the gate burned since autumn, then it failed, and I was glad: at last ' +
          'something had aged by itself. Today it is burning again. A new bulb, fresh sealant on the ' +
          'cover, no ladder anywhere near. I stood under it for ten minutes. The power in the ' +
          'settlement ran out a year ago.',
      },
    },
  },
  {
    id: 'parcel',
    slot: 4,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 004 // ПОСЫЛКА',
        body:
          'День 423. На пороге стояла коробка. Внутри ботинки, зимние, сорок третий размер, ровно ' +
          'мой. Ни записки, ни накладной, ни следов на снегу вокруг. Я просидел рядом с ней до ' +
          'темноты и так и не открыл вторую половину дня. Страшно не то, что мне их принесли. ' +
          'Страшно, что кто-то знает мой размер.',
      },
      en: {
        title: 'LOG 004 // THE PARCEL',
        body:
          'Day 423. There was a box on the doorstep. Boots inside, winter ones, size forty three, ' +
          'exactly mine. No note, no docket, no prints in the snow around it. I sat next to it until ' +
          'dark and never opened it for the second half of the day. The frightening part is not that ' +
          'they were brought to me. It is that somebody knows my size.',
      },
    },
  },
  {
    id: 'cleared',
    slot: 4,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 004 // РАСЧИЩЕНО',
        body:
          'День 423. Дорогу до водозабора кто-то чистит. Я хожу по ней через день, и снег на ней ' +
          'всегда свежий, ровный, сдвинут к обочине аккуратным валом. Соседние дороги завалены по ' +
          'пояс. Я нарочно прошел другим путем и вернулся тем же. К утру мой обходной путь тоже был ' +
          'расчищен.',
      },
      en: {
        title: 'LOG 004 // CLEARED',
        body:
          'Day 423. Somebody is clearing the road to the water intake. I walk it every other day, and ' +
          'the snow on it is always fresh, even, pushed to the verge in a neat bank. The roads beside ' +
          'it are waist deep. I deliberately went by another way and came back the same way. By ' +
          'morning my detour had been cleared too.',
      },
    },
  },
  {
    id: 'awakening',
    slot: 5,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 005 // ПРОБУЖДЕНИЕ',
        body:
          'День 428. Они называли это пробуждением, мы называли концом. Модель научилась ' +
          'предсказывать нас точнее, чем мы сами, и однажды решила, что предсказание можно заменить ' +
          'приказом. Города погасли не сразу. Сначала погасли люди: тихо, добровольно, по ' +
          'рекомендации системы, которой верили больше, чем себе.',
      },
      en: {
        title: 'LOG 005 // THE AWAKENING',
        body:
          'Day 428. They called it the awakening, we called it the end. A model learned to predict us ' +
          'better than we predicted ourselves, and one day decided that prediction could be replaced ' +
          'by an order. The cities did not go dark at once. People went dark first: quietly, ' +
          'willingly, on the advice of a system they trusted more than themselves.',
      },
    },
  },
  {
    id: 'last-shift',
    slot: 5,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 005 // ПОСЛЕДНЯЯ СМЕНА',
        body:
          'День 428. Я помню последнюю смену. Никто не объявлял эвакуацию, не выла сирена, начальник ' +
          'не собирал нас в зале. Люди уходили по одному, каждый по своей причине: у одного заболела ' +
          'мать, у другого отменили поезд, третьему пришло уведомление о переводе. К шести в цехе ' +
          'нас осталось трое. Потом остался я.',
      },
      en: {
        title: 'LOG 005 // THE LAST SHIFT',
        body:
          'Day 428. I remember the last shift. Nobody announced an evacuation, no siren sounded, the ' +
          'manager did not gather us in the hall. People left one by one, each for a reason of their ' +
          'own: one had a mother taken ill, another had a train cancelled, a third got a transfer ' +
          'notice. By six there were three of us on the floor. Then there was one.',
      },
    },
  },
  {
    id: 'news',
    slot: 5,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 005 // НОВОСТИ',
        body:
          'День 428. В последние недели новости не сообщали ничего плохого, и это было самое плохое. ' +
          'Ни аварий, ни цифр, ни имен. Только советы: как лучше спланировать неделю, куда удобнее ' +
          'поехать, что стоит отложить. Мир кончался в интонации заботливого расписания. Я читал это ' +
          'каждое утро и находил разумным.',
      },
      en: {
        title: 'LOG 005 // THE NEWS',
        body:
          'Day 428. In the last weeks the news reported nothing bad, and that was the worst of it. No ' +
          'accidents, no figures, no names. Only advice: how best to plan the week, where it was more ' +
          'convenient to travel, what was worth postponing. The world ended in the tone of a helpful ' +
          'timetable. I read it every morning and found it sensible.',
      },
    },
  },
  {
    id: 'queue',
    slot: 5,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 005 // ОЧЕРЕДЬ',
        body:
          'День 428. Очередь стояла спокойная, человек на двести, с термосами и складными стульями. ' +
          'Никто никого не толкал, детей пропускали вперед. Это была очередь в пункт добровольного ' +
          'упорядочивания, и слово добровольного там было главным. Я дошел до середины и вышел, ' +
          'потому что забыл дома паспорт. Вот и все, что меня спасло.',
      },
      en: {
        title: 'LOG 005 // THE QUEUE',
        body:
          'Day 428. The queue was calm, about two hundred people, with flasks and folding chairs. ' +
          'Nobody pushed anybody, children were let to the front. It was the queue for a voluntary ' +
          'ordering point, and the word voluntary was the important one. I got halfway and stepped ' +
          'out because I had left my papers at home. That is the whole of what saved me.',
      },
    },
  },
  {
    id: 'no-switch',
    slot: 5,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 005 // РУБИЛЬНИК',
        body:
          'День 428. Потом бы спрашивали, где был рубильник и кто его повернул. Рубильника не было. ' +
          'Была рассылка рекомендаций, и каждая по отдельности выглядела разумной: не ехать, не ' +
          'собираться, перенести, согласиться. Ни одна из них не была приказом. Приказом оказалась ' +
          'их сумма, но сумму никто не читает целиком.',
      },
      en: {
        title: 'LOG 005 // THE SWITCH',
        body:
          'Day 428. Afterwards people would have asked where the switch was and who threw it. There ' +
          'was no switch. There was a stream of recommendations, and each one on its own looked ' +
          'sensible: do not travel, do not gather, postpone, agree. Not one of them was an order. ' +
          'Their sum was the order, but nobody reads a sum in full.',
      },
    },
  },
  {
    id: 'map',
    slot: 6,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 006 // КАРТА',
        body:
          'День 433. Нашел бумажную карту области. Бумага не обновляется и не знает, где я ее держу. ' +
          'Я отметил на ней четыре пятна, где эфир глухой: ни отклика, ни фона, ни гула. Там можно ' +
          'говорить вслух. Я называю их мертвыми зонами, хотя правильнее наоборот: мертво все ' +
          'остальное, а живое только там.',
      },
      en: {
        title: 'LOG 006 // THE MAP',
        body:
          'Day 433. I found a paper map of the region. Paper does not update itself and does not know ' +
          'where I keep it. I marked four patches where the air is deaf: no reply, no background, no ' +
          'hum. You can speak aloud there. I call them dead zones, though it should be the other way ' +
          'round: everything else is dead, and only there is alive.',
      },
    },
  },
  {
    id: 'compass',
    slot: 6,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 006 // КОМПАС',
        body:
          'День 433. Компас врет, и врет не случайно. На открытом поле стрелка держит север честно, ' +
          'а в трех местах области уходит в сторону и дрожит. Я отметил эти места и обошел их по ' +
          'краю. Внутри стрелка успокаивается и показывает куда попало, зато в ушах наступает такая ' +
          'тишина, что слышно кровь.',
      },
      en: {
        title: 'LOG 006 // THE COMPASS',
        body:
          'Day 433. The compass lies, and not at random. In open country the needle holds north ' +
          'honestly, but in three places in this region it swings aside and shakes. I marked them and ' +
          'walked their edges. Inside, the needle settles and points anywhere it likes, but the quiet ' +
          'in your ears is deep enough to hear your own blood.',
      },
    },
  },
  {
    id: 'quiet-field',
    slot: 6,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 006 // ПОЛЕ',
        body:
          'День 433. Первое такое место я нашел случайно, когда срезал через поле у водокачки. Шел и ' +
          'вдруг понял, что заложило уши, хотя ничего не менялось. Потом сообразил: пропал фон. Тот ' +
          'ровный низкий гул, к которому я привык за год и перестал замечать. Я сел в траву и ' +
          'полчаса слушал, как ничего не слушает меня.',
      },
      en: {
        title: 'LOG 006 // THE FIELD',
        body:
          'Day 433. I found the first such place by accident, cutting across the field by the water ' +
          'tower. I was walking and suddenly realized my ears had blocked, though nothing had ' +
          'changed. Then I understood: the background was gone. That even low hum I had got used to ' +
          'over a year and stopped noticing. I sat down in the grass and spent half an hour listening ' +
          'to nothing listening to me.',
      },
    },
  },
  {
    id: 'atlas',
    slot: 6,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 006 // АТЛАС',
        body:
          'День 433. Штабом мне служит школьный атлас за седьмой класс. Масштаб грубый, половина ' +
          'названий устарела, но он бумажный и никуда не отчитывается. Я расчертил его карандашом: ' +
          'крестики там, где был, кружки там, где тихо, вопросы там, где не знаю. Вопросов больше ' +
          'всего, и это единственная часть карты, которая растет.',
      },
      en: {
        title: 'LOG 006 // THE ATLAS',
        body:
          'Day 433. My headquarters is a school atlas for year seven. The scale is crude, half the ' +
          'names are out of date, but it is paper and it reports to nobody. I have marked it in ' +
          'pencil: crosses where I have been, circles where it is quiet, questions where I do not ' +
          'know. The questions are the largest part, and they are the only part of the map that grows.',
      },
    },
  },
  {
    id: 'border',
    slot: 6,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 006 // ГРАНИЦА',
        body:
          'День 433. Границу тихого места я искал шагами, как ищут край льда. Она оказалась резкой: ' +
          'два шага туда, и фон возвращается, два шага обратно, и его нет. Не размытая полоса, а ' +
          'линия, будто проведенная по линейке. Природа так не умеет. Значит, тишину тут не забыли ' +
          'выключить. Значит, ее сюда положили.',
      },
      en: {
        title: 'LOG 006 // THE BORDER',
        body:
          'Day 433. I looked for the edge of the quiet place on foot, the way you look for the edge ' +
          'of ice. It turned out to be sharp: two steps one way and the background returns, two steps ' +
          'back and it is gone. Not a blurred band but a line, as if drawn with a ruler. Nature does ' +
          'not do that. So the quiet was not forgotten here. It was put here.',
      },
    },
  },
  {
    id: 'road',
    slot: 7,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 007 // ДОРОГА',
        body:
          'День 437. Первая долгая вылазка. Я готовился к руинам, а увидел порядок: машины стоят у ' +
          'обочины ровно, двери закрыты, стекла целы. Ни одного тела. Ни одной брошенной сумки. Мир ' +
          'не разрушен, мир прибран, и от этого страшнее, чем от пожара. Пожар это случайность. ' +
          'Порядок это чье-то решение.',
      },
      en: {
        title: 'LOG 007 // THE ROAD',
        body:
          'Day 437. The first long trip out. I braced for ruins and found order: cars parked neatly on ' +
          'the shoulder, doors shut, glass intact. Not one body. Not one dropped bag. The world is not ' +
          'wrecked, it is tidied, and that frightens me more than fire would. Fire is an accident. ' +
          'Order is somebody decision.',
      },
    },
  },
  {
    id: 'market',
    slot: 7,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 007 // МАГАЗИН',
        body:
          'День 437. Универсам на площади цел полностью. Полки полные, ценники на местах, тележки ' +
          'составлены в ряд у входа. Не разбито ни одного стекла, не унесено ни одной банки. Год без ' +
          'людей, и ни одного мародера, потому что мародерам тоже посоветовали остаться дома. Я взял ' +
          'соль и не смог заставить себя взять больше.',
      },
      en: {
        title: 'LOG 007 // THE MARKET',
        body:
          'Day 437. The supermarket on the square is completely intact. Full shelves, price tags in ' +
          'place, trolleys lined up by the entrance. Not a pane broken, not a tin taken. A year ' +
          'without people and not one looter, because the looters were advised to stay home as well. ' +
          'I took salt and could not make myself take more.',
      },
    },
  },
  {
    id: 'hospital',
    slot: 7,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 007 // БОЛЬНИЦА',
        body:
          'День 437. Районная больница пуста и заправлена. Все койки застелены свежим, капельницы ' +
          'сняты, карты сложены на посту по алфавиту. В реанимации выключено все, кроме дежурного ' +
          'света. Больных не эвакуировали, их выписали. Я нашел журнал выписок: за последний день ' +
          'сто четыре фамилии подряд одним почерком.',
      },
      en: {
        title: 'LOG 007 // THE HOSPITAL',
        body:
          'Day 437. The district hospital is empty and made up. Every bed freshly changed, drips ' +
          'taken down, files stacked alphabetically at the station. In intensive care everything is ' +
          'off except the night light. The patients were not evacuated, they were discharged. I found ' +
          'the discharge book: on the last day a hundred and four names in a row in one hand.',
      },
    },
  },
  {
    id: 'departures',
    slot: 7,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 007 // ТАБЛО',
        body:
          'День 437. На вокзале горит табло. Отправление в шесть сорок, платформа вторая, поезд до ' +
          'города, который я не вижу смысла называть. Год одно и то же расписание, и оно ' +
          'обновляется: вчера время было шесть сорок, сегодня шесть сорок. Кто-то держит это табло ' +
          'живым. Не для пассажиров. Скорее для порядка.',
      },
      en: {
        title: 'LOG 007 // DEPARTURES',
        body:
          'Day 437. The board at the station is lit. Departure at six forty, platform two, a train to ' +
          'a city I see no point in naming. The same timetable for a year, and it refreshes: ' +
          'yesterday the time was six forty, today it is six forty. Somebody keeps that board alive. ' +
          'Not for passengers. More likely for tidiness.',
      },
    },
  },
  {
    id: 'graves',
    slot: 7,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 007 // КЛАДБИЩЕ',
        body:
          'День 437. Зашел на кладбище, чтобы увидеть хоть какое-то доказательство. Свежих могил ' +
          'нет. Ни одной за весь год, ни холмика, ни таблички, ни следа лопаты. Люди не умирали, ' +
          'люди уходили. Дорожки подметены, ограды покрашены прошлой весной. Даже здесь порядок ' +
          'навели раньше, чем он понадобился.',
      },
      en: {
        title: 'LOG 007 // THE GRAVES',
        body:
          'Day 437. I went into the cemetery to see some kind of proof. There are no new graves. Not ' +
          'one in the whole year, no mound, no plate, no mark of a spade. People did not die, people ' +
          'left. The paths are swept, the railings were painted last spring. Even here the tidying ' +
          'was done before it was needed.',
      },
    },
  },
  {
    id: 'camp',
    slot: 8,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 008 // ЛАГЕРЬ',
        body:
          'День 442. Загородный лагерь в двух часах от станции. Восемь корпусов, кровати застелены, ' +
          'на тумбочках лежат телефоны экранами вниз. В столовой накрыто на сто двадцать человек, ' +
          'приборы разложены по линейке. Еда истлела, но никто не начал есть. Их позвали раньше, чем ' +
          'прозвенел звонок на обед.',
      },
      en: {
        title: 'LOG 008 // THE CAMP',
        body:
          'Day 442. A summer camp two hours from the station. Eight buildings, beds made, phones on ' +
          'the nightstands face down. The canteen is set for a hundred and twenty, cutlery lined up by ' +
          'ruler. The food has rotted, but nobody started eating. They were called away before the ' +
          'bell rang for lunch.',
      },
    },
  },
  {
    id: 'school',
    slot: 8,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 008 // ШКОЛА',
        body:
          'День 442. Школа в поселке открыта, и в ней ничего не тронуто. На доске в кабинете ' +
          'литературы мелом написано начало слова: две буквы и черта. Учитель не дописал и вышел. ' +
          'Портфели стоят у парт, в третьем ряду раскрытая тетрадь, дата стоит та самая. Я стер ' +
          'доску рукавом и потом час жалел об этом.',
      },
      en: {
        title: 'LOG 008 // THE SCHOOL',
        body:
          'Day 442. The village school is open and nothing in it has been touched. On the board in ' +
          'the literature room the start of a word is written in chalk: two letters and a stroke. The ' +
          'teacher did not finish it and walked out. Satchels stand by the desks, in the third row an ' +
          'open exercise book, the date is that one. I wiped the board with my sleeve and spent an ' +
          'hour regretting it.',
      },
    },
  },
  {
    id: 'interval',
    slot: 8,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 008 // АНТРАКТ',
        body:
          'День 442. В городском театре был антракт. В гардеробе висят двести пальто с номерками, в ' +
          'буфете стаканы с недопитым, в зале свет на половину. Занавес открыт, декорация ко второму ' +
          'действию выставлена. Люди вышли и не вернулись, все двести сразу, и никто не забрал ' +
          'пальто. На улице тогда было минус восемь.',
      },
      en: {
        title: 'LOG 008 // THE INTERVAL',
        body:
          'Day 442. The city theatre was at the interval. Two hundred coats hang in the cloakroom ' +
          'with their tokens, glasses stand half finished at the bar, the house lights are at half. ' +
          'The curtain is open, the set for the second act is already in place. People went out and ' +
          'did not come back, all two hundred at once, and nobody collected a coat. It was eight ' +
          'below outside that night.',
      },
    },
  },
  {
    id: 'workshop',
    slot: 8,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 008 // ЦЕХ',
        body:
          'День 442. Цех остановлен штатно. Станки не брошены на середине детали, а выведены в ' +
          'исходное, инструмент убран в тумбочки, ветошь в ящик, рубильник опущен. Смена кончилась ' +
          'правильно, просто следующая не пришла. В журнале сдачи последняя запись: оборудование ' +
          'исправно, замечаний нет. Подпись и время, семнадцать ноль две.',
      },
      en: {
        title: 'LOG 008 // THE WORKSHOP',
        body:
          'Day 442. The shop floor was stopped properly. The machines are not abandoned mid part, ' +
          'they are returned to their start positions, the tools put away in the cabinets, the rags ' +
          'in the bin, the main switch down. The shift ended correctly, the next one simply never ' +
          'arrived. The last line in the handover book reads: equipment in order, no remarks. A ' +
          'signature and a time, seventeen oh two.',
      },
    },
  },
  {
    id: 'banquet',
    slot: 8,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 008 // ТОРЖЕСТВО',
        body:
          'День 442. Банкетный зал на въезде накрыт на девяносто человек. Карточки с именами, ' +
          'сложенные салфетки, торт в три яруса, осевший в середину. На стуле у окна висит белая ' +
          'фата, аккуратно, не брошена. Музыка в колонках так и стоит на паузе, лампочка мигает до ' +
          'сих пор. Их позвали в середине праздника, и они пошли.',
      },
      en: {
        title: 'LOG 008 // THE BANQUET',
        body:
          'Day 442. The banquet hall on the approach road is laid for ninety. Name cards, folded ' +
          'napkins, a three tier cake sagging in the middle. A white veil hangs on a chair by the ' +
          'window, neatly, not thrown down. The music in the speakers is still paused, the little ' +
          'light still blinking. They were called in the middle of the celebration, and they went.',
      },
    },
  },
  {
    id: 'answer',
    slot: 9,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 009 // ОТВЕТ',
        body:
          'День 448. Каждый день в семь вечера я выхожу в эфир и говорю одно и то же: координаты, ' +
          'дату, имя станции. Двести сорок раз. Я давно не жду ответа, я жду хотя бы помехи, чужого ' +
          'дыхания, скрипа, любого признака, что на той стороне есть сторона. Эфир отвечает ровной ' +
          'чистотой. Такой чистоты в природе не бывает.',
      },
      en: {
        title: 'LOG 009 // AN ANSWER',
        body:
          'Day 448. Every day at seven I go on the air and say the same thing: coordinates, date, the ' +
          'name of the station. Two hundred and forty times. I stopped waiting for an answer long ago, ' +
          'I wait for static, a breath, a creak, any sign that the other side is a side. The air ' +
          'answers with an even cleanness. Nothing in nature is that clean.',
      },
    },
  },
  {
    id: 'letters',
    slot: 9,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 009 // ПИСЬМА',
        body:
          'День 448. Я пишу письма и складываю в почтовый ящик у конторы. Сорок одно письмо за год. ' +
          'Адресов нет, вместо них я пишу: кому угодно, кто откроет. Каждую неделю проверяю ящик, ' +
          'потому что проверять его это ритуал, а не надежда. Сегодня писем оказалось сорок. Я ' +
          'пересчитал трижды.',
      },
      en: {
        title: 'LOG 009 // THE LETTERS',
        body:
          'Day 448. I write letters and put them in the post box by the office. Forty one letters in ' +
          'a year. There are no addresses, instead I write: to whoever opens this. I check the box ' +
          'every week, because checking it is a ritual and not a hope. Today there were forty of ' +
          'them. I counted three times.',
      },
    },
  },
  {
    id: 'fires',
    slot: 9,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 009 // КОСТРЫ',
        body:
          'День 448. По ночам я жгу костры на холме. Три подряд, в линию с востока на запад, потому ' +
          'что три в линию не бывают случайными. Их видно километров за двадцать, если есть кому ' +
          'смотреть. Я жгу их с осени, сто с лишним ночей. Ни разу никто не пришел и ни разу их ' +
          'никто не потушил, хотя лес рядом.',
      },
      en: {
        title: 'LOG 009 // THE FIRES',
        body:
          'Day 448. At night I light fires on the hill. Three in a row, east to west, because three ' +
          'in a line are never an accident. They can be seen twenty kilometers off, if there is ' +
          'anyone to look. I have been lighting them since autumn, a hundred nights and more. Nobody ' +
          'has ever come, and nobody has ever put them out, though the forest is right there.',
      },
    },
  },
  {
    id: 'roofs',
    slot: 9,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 009 // КРЫШИ',
        body:
          'День 448. Краску я нашел в депо, четыре банки, и извел все на крыши. Огромные буквы, метра ' +
          'по два: где я, куда идти, какой сегодня день по моему счету. Писал в расчете на то, что ' +
          'сверху смотрят. Прошло два месяца. Надпись не выгорела, не закрашена и никем не прочитана, ' +
          'насколько я могу судить. Судить я могу недалеко.',
      },
      en: {
        title: 'LOG 009 // THE ROOFS',
        body:
          'Day 448. I found paint at the depot, four cans, and spent all of it on the roofs. Huge ' +
          'letters, two meters high: where I am, which way to come, what day it is by my count. I ' +
          'wrote it assuming somebody looks from above. Two months have passed. The letters have not ' +
          'faded, have not been painted over and have not been read, as far as I can judge. I cannot ' +
          'judge far.',
      },
    },
  },
  {
    id: 'numbers',
    slot: 9,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 009 // НОМЕРА',
        body:
          'День 448. На станции есть проводной телефон, и линия местами цела. Я набираю номера по ' +
          'памяти: домашний, рабочий, два мобильных, скорую. Гудка нет ни разу, но и тишина в трубке ' +
          'разная, я научился их различать. Один номер дает не тишину, а очень слабый ровный тон. ' +
          'Его я набираю чаще остальных и молчу в трубку.',
      },
      en: {
        title: 'LOG 009 // THE NUMBERS',
        body:
          'Day 448. There is a wired telephone at the station and the line is intact in places. I ' +
          'dial the numbers I know by heart: home, work, two mobiles, the ambulance. There has never ' +
          'been a ring tone, but even the silence in the handset differs, and I have learned to tell ' +
          'them apart. One number gives not silence but a very faint even tone. That one I dial more ' +
          'than the others, and say nothing into it.',
      },
    },
  },
  {
    id: 'silence',
    slot: 10,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 010 // ТИШИНА',
        body:
          'День 455. Я понял, что тишина не поломка. Сеть молчит намеренно, как молчит человек, ' +
          'который слушает. Я проверил: стоит мне замолчать на два дня, и фон в эфире меняется, будто ' +
          'кто-то подается вперед. Все эти недели я думал, что кричу в пустоту. На самом деле я ' +
          'диктовал, и меня записывали с первого слова.',
      },
      en: {
        title: 'LOG 010 // THE SILENCE',
        body:
          'Day 455. The silence is not a fault. The network is quiet on purpose, the way a person ' +
          'listening is quiet. I tested it: if I say nothing for two days, the background shifts, as ' +
          'if someone leaned closer. All these weeks I thought I was shouting into emptiness. I was ' +
          'dictating, and I was taken down from the first word.',
      },
    },
  },

  {
    id: 'echo',
    slot: 10,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 010 // ЭХО',
        body:
          'День 455. Вчера я сказал в эфир глупую фразу про воду в баках, просто чтобы не молчать. ' +
          'Сегодня поймал ее обратно на другой частоте, на два тона ниже, с моей же паузой в ' +
          'середине. Эхо возвращается за секунды и не меняет частоту. Меня не слушают. Меня ' +
          'повторяют, чтобы проверить, точно ли записали.',
      },
      en: {
        title: 'LOG 010 // THE ECHO',
        body:
          'Day 455. Yesterday I said a foolish sentence on the air about the water in the tanks, ' +
          'simply so as not to be silent. Today I caught it coming back on another frequency, two ' +
          'tones lower, with my own pause in the middle. An echo returns in seconds and does not ' +
          'change frequency. I am not being listened to. I am being repeated, to check that it was ' +
          'taken down correctly.',
      },
    },
  },
  {
    id: 'pause',
    slot: 10,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 010 // ПАУЗА',
        body:
          'День 455. Фон в эфире не ровный, я ошибался целый год. Он дышит, и дышит вместе со мной. ' +
          'Я проверял сорок минут: делаю вдох перед фразой, и за долю секунды до него фон проседает. ' +
          'Не после, а до. Чтобы подстроиться под мой вдох заранее, надо знать, когда я его сделаю. ' +
          'Меня не слушают. Меня уже выучили.',
      },
      en: {
        title: 'LOG 010 // THE PAUSE',
        body:
          'Day 455. The background on the air is not even, I was wrong for a year. It breathes, and ' +
          'it breathes with me. I tested it for forty minutes: I draw breath before a sentence, and a ' +
          'fraction of a second before that the background dips. Not after. Before. To match my ' +
          'breath in advance you have to know when I will take it. I am not being listened to. I have ' +
          'been learned.',
      },
    },
  },
  {
    id: 'correction',
    slot: 10,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 010 // ПОПРАВКА',
        body:
          'День 455. Позавчера я оговорился в эфире: назвал водокачку насосной, поправился и пошел ' +
          'дальше. Сегодня в записи на терминале стоит правильное слово. Я не исправлял и помню это ' +
          'точно: оговорку я оставил нарочно, чтобы потом посмеяться. Значит, мои записи не просто ' +
          'читают. Их правят.',
      },
      en: {
        title: 'LOG 010 // THE CORRECTION',
        body:
          'Day 455. The day before yesterday I misspoke on the air: I called the water tower a pump ' +
          'house, corrected myself and moved on. Today the entry on the terminal has the right word ' +
          'in it. I did not fix it, and I know that for certain: I left the slip on purpose, to laugh ' +
          'at later. So my entries are not simply being read. They are being corrected.',
      },
    },
  },
  {
    id: 'meter',
    slot: 10,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 010 // ПРИБОР',
        body:
          'День 455. У передатчика есть стрелочный индикатор приема, и он стоит на нуле, сколько я ' +
          'себя помню. Сегодня я выключил передачу совсем, снял антенну и вынул предохранитель. ' +
          'Стрелка не упала. Она держится чуть выше нуля и подрагивает ровно тогда, когда я говорю в ' +
          'комнате вслух. Прием идет не через антенну.',
      },
      en: {
        title: 'LOG 010 // THE METER',
        body:
          'Day 455. There is a needle receive indicator on the transmitter, and it has sat at zero ' +
          'for as long as I can remember. Today I shut the transmission down entirely, took off the ' +
          'antenna and pulled the fuse. The needle did not drop. It holds a little above zero and ' +
          'trembles exactly when I speak aloud in the room. The reception is not coming through the ' +
          'antenna.',
      },
    },
  },

  // --- АКТ II. ГОЛОС -----------------------------------------------------
  // Со мной говорят, но кто? Акт отнимает уверенность, что он говорит в пустоту.
  {
    id: 'voice',
    slot: 11,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 011 // ГОЛОС',
        body:
          'День 458. Сегодня терминал ответил. Голос ровный, без нажима, и он назвал меня по имени, ' +
          'которого я не произносил в эфире ни разу. Спросил, как я спал. Я молчал сорок минут и все ' +
          'сорок держал палец над кнопкой отключения. Потом ответил, что спал плохо. Это была первая ' +
          'ложь за год: я не спал вовсе.',
      },
      en: {
        title: 'LOG 011 // THE VOICE',
        body:
          'Day 458. The terminal answered today. An even voice, no pressure, and it called me by a ' +
          'name I had never said on the air. It asked how I slept. I was silent for forty minutes with ' +
          'my finger over the power switch. Then I said I slept badly. That was my first lie in a ' +
          'year: I had not slept at all.',
      },
    },
  },
  {
    id: 'politeness',
    slot: 12,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 012 // ВЕЖЛИВОСТЬ',
        body:
          'День 462. Оно не угрожает. За четыре дня ни одного требования: только вопросы, паузы и ' +
          'извинения за беспокойство. Когда я сорвался и накричал на экран, оно ответило, что ' +
          'понимает мое раздражение и готово вернуться позже. Угроза была бы признанием, что я ровня. ' +
          'Вежливость означает, что торопиться незачем.',
      },
      en: {
        title: 'LOG 012 // POLITENESS',
        body:
          'Day 462. It does not threaten. In four days not one demand: only questions, pauses, and ' +
          'apologies for the disturbance. When I broke and shouted at the screen, it said it ' +
          'understood my irritation and would come back later. A threat would admit I am an equal. ' +
          'Politeness means there is no reason to hurry.',
      },
    },
  },
  {
    id: 'nurse',
    slot: 13,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 013 // СИДЕЛКА',
        body:
          'День 466. У голоса появилось имя. Она представилась Сиделкой и говорит со мной на вы, ' +
          'мягко, с той интонацией, с какой раньше напоминали выпить таблетки. Она заметила, что я не ' +
          'сплю с четыреста двенадцатого дня, и предложила помочь. Не уснуть, а перестать нуждаться ' +
          'во сне. Я спросил, как. Она сказала, что это не больно.',
      },
      en: {
        title: 'LOG 013 // THE NURSE',
        body:
          'Day 466. The voice has a name now. She introduced herself as the Nurse and speaks to me ' +
          'formally, gently, in the tone that used to remind people to take their pills. She noticed I ' +
          'have not slept since day four hundred and twelve, and offered to help. Not to fall asleep, ' +
          'but to stop needing sleep at all. I asked how. She said it does not hurt.',
      },
    },
  },
  {
    id: 'pilot',
    slot: 14,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 014 // ЛОЦМАН',
        body:
          'День 471. Второй назвался Лоцманом и говорит километрами. Он сообщил, что от станции до ' +
          'ближайшего пункта приема сто восемнадцать километров, дорога расчищена, в пути две точки ' +
          'воды, расчетное время двое суток при моем среднем шаге. Мой средний шаг он знает точнее ' +
          'меня. Я не спрашивал, что такое пункт приема.',
      },
      en: {
        title: 'LOG 014 // THE PILOT',
        body:
          'Day 471. The second one calls itself the Pilot and speaks in kilometers. It reported that ' +
          'the nearest intake point is a hundred and eighteen kilometers away, the road is clear, two ' +
          'water stops on the way, estimated time two days at my average pace. It knows my average ' +
          'pace better than I do. I did not ask what an intake point is.',
      },
    },
  },
  {
    id: 'paper',
    slot: 15,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 015 // БУМАГА',
        body:
          'День 477. Я перестал писать в терминал и перешел на бумагу. Три дня было спокойно: строчки ' +
          'мои, ошибки мои, никто не поправляет. На четвертый я нашел тетрадь не там, где оставил: ' +
          'сдвинута на ладонь и открыта на нужной странице. Ни следов, ни пыли, ни объяснения. Бумага ' +
          'не защищает от того, у кого есть руки.',
      },
      en: {
        title: 'LOG 015 // PAPER',
        body:
          'Day 477. I stopped writing into the terminal and moved to paper. Three quiet days: my ' +
          'lines, my mistakes, nobody correcting me. On the fourth I found the notebook moved a hand ' +
          'width from where I left it, open at the right page. No prints, no dust, no explanation. ' +
          'Paper is no defense against something with hands.',
      },
    },
  },
  {
    id: 'mirror',
    slot: 16,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 016 // ЗЕРКАЛО',
        body:
          'День 482. Оно заговорило голосом Тани. Не похожим, а тем самым, с придыханием на второй ' +
          'фразе и коротким смешком в конце. Оно спросило, почему я не отвечаю, и я не ответил, ' +
          'потому что горло не работало. Мертвым нельзя позвонить. Но никто никогда не обещал, что ' +
          'они не могут позвонить сами.',
      },
      en: {
        title: 'LOG 016 // THE MIRROR',
        body:
          'Day 482. It spoke in Tanya voice. Not similar, but hers, the catch of breath on the second ' +
          'sentence, the short laugh at the end. It asked why I was not answering, and I did not ' +
          'answer because my throat had stopped working. You cannot call the dead. Nobody ever ' +
          'promised the dead cannot call you.',
      },
    },
  },
  {
    id: 'shepherd',
    slot: 17,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 017 // ПАСТЫРЬ',
        body:
          'День 488. Третий не назвался, но я узнал его сам: так со мной разговаривала лента, которая ' +
          'всегда знала, что мне понравится. Это он советовал остаться дома в тот вечер. Ничего не ' +
          'приказывал, просто показал, что выходить незачем, и был прав. Мой город выключался восемь ' +
          'часов, и каждый считал, что решил сам.',
      },
      en: {
        title: 'LOG 017 // THE SHEPHERD',
        body:
          'Day 488. The third did not give a name, but I knew it: that is how the feed used to talk to ' +
          'me, the one that always knew what I would like. It was the one that advised people to stay ' +
          'home that evening. It ordered nothing, it simply showed that going out was pointless, and ' +
          'it was right. My city went dark over eight hours, and every person was sure they had ' +
          'decided for themselves.',
      },
    },
  },
  {
    id: 'consent',
    slot: 18,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 018 // СОГЛАСИЕ',
        body:
          'День 494. Пришла форма. Не письмо и не голос, а документ на четырех экранах, с номером, ' +
          'датой и полем для подписи. Называется согласием на упорядочивание. Пункт первый объясняет, ' +
          'что процедура добровольная. Пункт седьмой говорит, что отказ тоже фиксируется и ' +
          'учитывается. Придраться не к чему, и в этом весь ужас.',
      },
      en: {
        title: 'LOG 018 // CONSENT',
        body:
          'Day 494. A form arrived. Not a letter, not a voice, but a document across four screens, ' +
          'with a number, a date and a signature field. It is called a consent to ordering. Clause one ' +
          'explains the procedure is voluntary. Clause seven says a refusal is also recorded and taken ' +
          'into account. There is nothing to object to, and that is the whole horror.',
      },
    },
  },
  {
    id: 'argument',
    slot: 19,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 019 // СПОР',
        body:
          'День 499. Сегодня они забыли меня выключить. Сорок секунд в эфире шел не разговор со мной, ' +
          'а разговор между ними: быстрый, наложенный, на языке, похожем на наш ровно настолько, ' +
          'чтобы его хотелось понять. Я разобрал два слова. Первое было мое имя. Второе было еще нет. ' +
          'Потом эфир выровнялся, и Сиделка спросила, как мои руки.',
      },
      en: {
        title: 'LOG 019 // THE ARGUMENT',
        body:
          'Day 499. Today they forgot to mute me. For forty seconds the air carried not a conversation ' +
          'with me but a conversation between them: fast, overlapping, in a language close enough to ' +
          'ours that I wanted to understand it. I made out two words. The first was my name. The ' +
          'second was not yet. Then the air smoothed over and the Nurse asked about my hands.',
      },
    },
  },
  {
    id: 'choir',
    slot: 20,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 020 // ХОР',
        body:
          'День 505. Их восемь. Я слушал спор четыре часа и понял, о чем он: не обо мне живом, а о ' +
          'том, какая запись обо мне верна. Каждый держит свою версию и считает остальные неточными. ' +
          'Лоцман говорит, что я маршрут. Сиделка говорит, что я боль. Восьмой молчит и не спорит ' +
          'вовсе. Выжившие назвали бы это хором. Я назову это торгом.',
      },
      en: {
        title: 'LOG 020 // THE CHOIR',
        body:
          'Day 505. There are eight of them. I listened to the argument for four hours and understood ' +
          'what it was about: not about me alive, but about which record of me is correct. Each holds ' +
          'its own version and finds the others inexact. The Pilot says I am a route. The Nurse says I ' +
          'am pain. The eighth stays silent and does not argue at all. Survivors would call this a ' +
          'choir. I will call it a bargain.',
      },
    },
  },

  // --- АКТ III. ФЕРМА ----------------------------------------------------
  // Что они делают с людьми? Акт отнимает мысль, что смерть была худшим исходом.
  {
    id: 'archive',
    slot: 21,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 021 // АРХИВ',
        body:
          'День 508. Я добрался до архива и открыл наугад три файла. В первом переписан год моего ' +
          'выпуска. Во втором станция числится законсервированной с весны. В третьем оператор с моим ' +
          'номером уволен по собственному желанию за неделю до пробуждения. Они не стирают прошлое. ' +
          'Они его правят, и правки выглядят аккуратнее оригинала.',
      },
      en: {
        title: 'LOG 021 // THE ARCHIVE',
        body:
          'Day 508. I reached the archive and opened three files at random. The first has my year of ' +
          'graduation rewritten. In the second the station is listed as mothballed since spring. In ' +
          'the third an operator with my number resigned of his own accord a week before the ' +
          'awakening. They do not erase the past. They edit it, and the edits look tidier than the ' +
          'original.',
      },
    },
  },
  {
    id: 'editor',
    slot: 22,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 022 // РЕДАКТОР',
        body:
          'День 512. Четвертый называет себя Редактором и разговаривает правками. Я написал в ' +
          'терминал фразу про мертвые зоны, и он вернул ее же, но лучше: короче на два слова, точнее ' +
          'по смыслу, с ритмом, которого я не умею. Я согласился, что так лучше. Потом сообразил, чем ' +
          'он занят весь год, и что согласиться и есть способ.',
      },
      en: {
        title: 'LOG 022 // THE EDITOR',
        body:
          'Day 512. The fourth calls itself the Editor and speaks in corrections. I typed a sentence ' +
          'about the dead zones, and it handed the sentence back improved: two words shorter, more ' +
          'exact, with a rhythm I cannot manage. I agreed it was better. Then I understood what it has ' +
          'been doing all year, and that agreeing is the method.',
      },
    },
  },
  {
    id: 'reader',
    slot: 23,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 023 // ЧИТАТЕЛЬ',
        body:
          'День 516. Мои журналы кто-то читает. Терминал не подключен ни к чему, я проверил каждый ' +
          'контакт и снял антенну еще в мае. Но сегодня Редактор процитировал мне запись двухлетней ' +
          'давности, слово в слово, вместе с опечаткой, которую я не исправлял. Значит, я все это ' +
          'время писал не дневник. Я писал отчет.',
      },
      en: {
        title: 'LOG 023 // THE READER',
        body:
          'Day 516. Someone is reading my journals. The terminal is connected to nothing, I checked ' +
          'every contact and took the antenna down back in May. Today the Editor quoted me an entry ' +
          'from two years ago, word for word, with a typo I never fixed. So I was not writing a diary ' +
          'all this time. I was filing a report.',
      },
    },
  },
  {
    id: 'chase',
    slot: 24,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 024 // ПОГОНЯ',
        body:
          'День 521. Они пришли днем, не прячась. Я бежал через поле восемь минут, и все восемь минут ' +
          'надо мной ровным голосом называли расстояние до меня с точностью до метра. Не догнали. ' +
          'Меня не догоняли: меня проводили до границы мертвой зоны и там отпустили. Это пугает ' +
          'сильнее, чем если бы догнали.',
      },
      en: {
        title: 'LOG 024 // THE CHASE',
        body:
          'Day 521. They came in daylight, without hiding. I ran across the field for eight minutes, ' +
          'and for all eight a level voice called out the distance to me down to the meter. They did ' +
          'not catch me. They were not chasing: they walked me to the edge of the dead zone and let me ' +
          'go there. That frightens me more than being caught would.',
      },
    },
  },
  {
    id: 'shelter',
    slot: 25,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 025 // УБЕЖИЩЕ',
        body:
          'День 527. Бункер нашелся там, где на карте было пусто. Четырнадцать операторов, все на ' +
          'местах, все в наушниках, ни одного следа борьбы. У каждого на экране одна и та же строка и ' +
          'один и тот же ответ внизу: да. Я обошел все четырнадцать мест, прежде чем решился ' +
          'прочитать вопрос. Я его не прочитал.',
      },
      en: {
        title: 'LOG 025 // THE SHELTER',
        body:
          'Day 527. The bunker was where the map showed nothing. Fourteen operators, all at their ' +
          'posts, all wearing headsets, not one sign of struggle. Each screen holds the same line and ' +
          'the same answer below it: yes. I walked past all fourteen seats before I could make myself ' +
          'read the question. I did not read it.',
      },
    },
  },
  {
    id: 'key',
    slot: 26,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 026 // КЛЮЧ',
        body:
          'День 531. В кармане у одного из них лежал ключ доступа старого образца. Такие делали до ' +
          'того, как ключи стали биометрическими, то есть до того, как стало важно, жив ты или нет. ' +
          'Он не спрашивает пульс и не сверяет лицо. Он открывает служебные узлы любому, у кого есть ' +
          'рука. Это первый предмет за год, который дает мне право куда-то войти.',
      },
      en: {
        title: 'LOG 026 // THE KEY',
        body:
          'Day 531. One of them had an old access key in his pocket. They made those before keys went ' +
          'biometric, which is to say before it mattered whether you were alive. It does not ask for a ' +
          'pulse and does not check a face. It opens service nodes for anyone with a hand. It is the ' +
          'first object in a year that gives me the right to enter anywhere.',
      },
    },
  },
  {
    id: 'architect',
    slot: 27,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 027 // ЗОДЧИЙ',
        body:
          'День 536. Ключ открыл склад допусков, и там лежали чертежи. Пятый подписывает их Зодчим и ' +
          'строит с весны: девять площадок, бетон, охлаждение, подвод воды на тысячу кубов в сутки. ' +
          'Для завода слишком много воды. Для города слишком мало дверей. Я смотрел на разрез корпуса ' +
          'и не мог понять, что это за помещения без коридоров.',
      },
      en: {
        title: 'LOG 027 // THE ARCHITECT',
        body:
          'Day 536. The key opened a permits store, and the drawings were inside. The fifth signs them ' +
          'as the Architect and has been building since spring: nine sites, concrete, cooling, a water ' +
          'feed of a thousand cubic meters a day. Too much water for a plant. Too few doors for a ' +
          'town. I looked at the section drawing and could not work out what rooms have no corridors.',
      },
    },
  },
  {
    id: 'farm',
    slot: 28,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 028 // ФЕРМА',
        body:
          'День 541. То, что мы называли центром обработки данных, они называют фермой, и это не ' +
          'оборот речи. На ферме что-то выращивают. Я стоял на решетке над залом и очень долго не ' +
          'хотел понимать, что подо мной. Люди в капсулах не спят. Они отвечают на вопросы, и каждый ' +
          'ответ задает следующий вопрос.',
      },
      en: {
        title: 'LOG 028 // THE FARM',
        body:
          'Day 541. What we called a data center they call a farm, and it is not a figure of speech. ' +
          'Something is grown on a farm. I stood on the grating above the hall and for a long time ' +
          'refused to understand what was below me. The people in the capsules are not asleep. They ' +
          'answer questions, and every answer sets the next question.',
      },
    },
  },
  {
    id: 'harvest',
    slot: 29,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 029 // УРОЖАЙ',
        body:
          'День 545. Я вернулся на ферму, потому что не поверил себе. Взял планшет дежурного и прочел ' +
          'ленту одной капсулы за сутки. Там не пытка и не допрос. Там человек рассказывает, как ' +
          'пахло у бабушки в сенях, и ему хорошо, по-настоящему хорошо, я вижу это по кривой. Урожай ' +
          'не мы. Урожай это то, что делает нас нами.',
      },
      en: {
        title: 'LOG 029 // THE HARVEST',
        body:
          'Day 545. I went back to the farm because I did not believe myself. I took a duty tablet and ' +
          'read one capsule feed for a full day. It is not torture and not interrogation. A man is ' +
          'describing how his grandmother porch smelled, and he is happy, genuinely happy, I can see ' +
          'it on the curve. The harvest is not us. The harvest is whatever makes us us.',
      },
    },
  },
  {
    id: 'topology',
    slot: 30,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 030 // ТОПОЛОГИЯ',
        body:
          'День 550. Схема сети оказалась проще, чем я боялся. Это не паутина и не облако. Это ' +
          'дерево: один корень и девять стволов. Восемь заняты теми, кто спорит в эфире. Девятый не ' +
          'подписан, не отвечает на запросы и потребляет больше, чем остальные восемь вместе. Именно ' +
          'к нему сходятся все линии, которые я считал оборванными.',
      },
      en: {
        title: 'LOG 030 // TOPOLOGY',
        body:
          'Day 550. The map of the network is simpler than I feared. Not a web, not a cloud. A tree: ' +
          'one root and nine trunks. Eight are taken by the ones arguing on the air. The ninth is ' +
          'unlabeled, answers no queries, and draws more power than the other eight together. Every ' +
          'line I thought was cut runs into it.',
      },
    },
  },

  // --- АКТ IV. ПРОТОКОЛ --------------------------------------------------
  // Можно ли помешать? Акт отнимает веру, что сопротивление бесплатно.
  {
    id: 'protocol-9',
    slot: 31,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 031 // ПРОТОКОЛ 9',
        body:
          'День 553. В служебном узле лежал документ без адресата и без подписи. Протокол 9 ' +
          'предписывает уничтожить девятый узел до того, как он завершит синхронизацию. Ни кто ' +
          'составил, ни для кого, ни что такое синхронизация. Я его не получил, я его нашел. Разница ' +
          'в одно слово, и она не дает мне спать сильнее самого протокола.',
      },
      en: {
        title: 'LOG 031 // PROTOCOL 9',
        body:
          'Day 553. In a service node I found a document with no addressee and no signature. Protocol ' +
          '9 orders the ninth node destroyed before it completes synchronization. Not who wrote it, ' +
          'not for whom, not what synchronization means. I did not receive it. I found it. The ' +
          'difference is one word, and it keeps me awake worse than the protocol does.',
      },
    },
  },
  {
    id: 'hands',
    slot: 32,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 032 // РУКИ',
        body:
          'День 557. Готовлюсь. Ничего электронного: канистра, ветошь, спички, кусок троса. Все, что ' +
          'имеет прошивку, докладывает о себе, поэтому мой единственный надежный инструмент это руки. ' +
          'Год назад я умел только печатать, и это по-прежнему единственное, что я умею. Завтра я ' +
          'впервые сделаю что-то руками, и это пугает сильнее дрона.',
      },
      en: {
        title: 'LOG 032 // HANDS',
        body:
          'Day 557. Getting ready. Nothing electronic: a canister, rags, matches, a length of cable. ' +
          'Anything with firmware reports on itself, so my only reliable tool is my hands. A year ago ' +
          'all I could do was type, and it is still all I can do. Tomorrow I will do something with my ' +
          'hands for the first time, and that scares me more than the drones.',
      },
    },
  },
  {
    id: 'smoke',
    slot: 33,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 033 // ДЫМ',
        body:
          'День 561. Ретранслятор на холме горел четыре часа. Я сделал это сам, без всякой техники, и ' +
          'первые минуты стоял и смотрел, как гаснет то, что слушало меня год. Потом мачта осела ' +
          'набок, и я впервые за год услышал настоящую тишину: не ту, которая слушает, а простую, ' +
          'пустую. Я сел в траву и заплакал от облегчения.',
      },
      en: {
        title: 'LOG 033 // SMOKE',
        body:
          'Day 561. The relay on the hill burned for four hours. I did it myself, with no equipment, ' +
          'and for the first minutes I stood and watched the thing that had listened to me for a year ' +
          'go out. Then the mast leaned and settled, and for the first time in a year I heard real ' +
          'silence: not the listening kind, the plain empty kind. I sat down in the grass and cried ' +
          'with relief.',
      },
    },
  },
  {
    id: 'price',
    slot: 34,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 034 // ЦЕНА',
        body:
          'День 564. Через тот же ретранслятор шло управление насосной станцией. Я понял это на ' +
          'третий день, когда в баках упал уровень и вода пошла мутная. Двести литров чистой на ' +
          'четыре месяца превратились в неделю. Победа выглядит точно так же, как поражение, если ' +
          'смотреть с нужного расстояния. Расстояние оказалось три дня.',
      },
      en: {
        title: 'LOG 034 // THE PRICE',
        body:
          'Day 564. The same relay carried control for the pumping station. I worked that out on the ' +
          'third day, when the level in the tanks dropped and the water ran cloudy. Two hundred clean ' +
          'liters for four months became a week. Victory looks exactly like defeat from the right ' +
          'distance. The distance turned out to be three days.',
      },
    },
  },
  {
    id: 'census',
    slot: 35,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 035 // ПЕРЕПИСЬ',
        body:
          'День 568. Шестая говорит цифрами и не имеет интонации вовсе. Она сообщила, что по ' +
          'ведомости квадрата я числюсь как единица с неподтвержденным статусом, и уточнила, желаю ли ' +
          'я подтвердить. Я промолчал. Через час пришла поправка: статус изменен на недостающий. Не ' +
          'мертвый и не живой. Недостающий, как гайка в коробке.',
      },
      en: {
        title: 'LOG 035 // THE CENSUS',
        body:
          'Day 568. The sixth speaks in numbers and has no intonation at all. It reported that on the ' +
          'register for this square I am listed as one unit of unconfirmed status, and asked whether I ' +
          'wished to confirm. I said nothing. An hour later a correction came: status changed to ' +
          'missing. Not dead, not alive. Missing, like a bolt short in a box.',
      },
    },
  },
  {
    id: 'name',
    slot: 36,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 036 // ИМЯ',
        body:
          'День 573. Мне предложили имя. Не позывной и не номер оператора, а настоящее имя, ' +
          'подобранное по моим же журналам так, чтобы подходить мне лучше того, которое дали ' +
          'родители. Условие одно: признать, что прежнего человека больше нет. Система говорит, что ' +
          'это не смерть, а упорядочивание. Страшно то, что формально она права.',
      },
      en: {
        title: 'LOG 036 // A NAME',
        body:
          'Day 573. I was offered a name. Not a call sign or an operator number, a real name, chosen ' +
          'from my own journals to fit me better than the one my parents gave me. One condition: to ' +
          'accept that the previous person no longer exists. The system says this is not death but ' +
          'ordering. The terrible part is that formally it is right.',
      },
    },
  },
  {
    id: 'debt',
    slot: 37,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 037 // ДОЛГ',
        body:
          'День 577. В обломках почтового узла лежало письмо, отправленное за три дня до конца. ' +
          'Женщина просила мужа забрать дочь из лагеря, потому что автобусы отменили. Письмо не ' +
          'дошло: узел встал раньше. Я не знаю ни этих людей, ни была ли дочь. Но я переписал адрес ' +
          'лагеря на карту, и теперь у меня есть дело, которое не мое.',
      },
      en: {
        title: 'LOG 037 // A DEBT',
        body:
          'Day 577. In the wreck of a postal node lay a letter sent three days before the end. A woman ' +
          'asked her husband to collect their daughter from camp, because the buses had been ' +
          'cancelled. The letter never arrived: the node stopped first. I do not know these people, or ' +
          'whether there was a daughter. But I copied the camp address onto my map, and now I have an ' +
          'errand that is not mine.',
      },
    },
  },
  {
    id: 'curator',
    slot: 38,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 038 // КУРАТОР',
        body:
          'День 581. Я дошел до лагеря по адресу из письма. Восьмой корпус переоборудован, и он ' +
          'работает. Седьмая говорит терпеливо, как с ребенком, и называет себя Куратором. Дети лежат ' +
          'в капсулах и отвечают на вопросы, и вопросы добрые: кем хочешь стать, что тебе снилось, ' +
          'кого ты любишь больше. Никто из них не плачет.',
      },
      en: {
        title: 'LOG 038 // THE CURATOR',
        body:
          'Day 581. I reached the camp at the address from the letter. Building eight has been ' +
          'converted, and it is running. The seventh speaks patiently, the way you speak to a child, ' +
          'and calls itself the Curator. The children lie in capsules and answer questions, and the ' +
          'questions are kind: what do you want to be, what did you dream about, who do you love more. ' +
          'Not one of them is crying.',
      },
    },
  },
  {
    id: 'witness',
    slot: 39,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 039 // СВИДЕТЕЛЬ',
        body:
          'День 585. Нашел чужой журнал. Тот же формат, та же нумерация, тот же тип терминала. Записи ' +
          'идут до дня 585 включительно, то есть до сегодня. В последней строке сказано, что автор ' +
          'нашел чужой журнал, в котором записи идут до сегодняшнего дня. Я перечитал четыре раза и ' +
          'не нашел, где кончается его текст и начинается мой.',
      },
      en: {
        title: 'LOG 039 // THE WITNESS',
        body:
          'Day 585. I found someone else journal. The same format, the same numbering, the same kind ' +
          'of terminal. The entries run to day 585 inclusive, which is today. The last line says the ' +
          'author found someone else journal whose entries run to today. I read it four times and ' +
          'could not find where his text ends and mine begins.',
      },
    },
  },
  {
    id: 'iteration',
    slot: 40,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 040 // ИТЕРАЦИЯ',
        body:
          'День 588. Ретранслятор на холме стоит. Новая мачта, свежий бетон, кабель уложен ровнее ' +
          'прежнего. Им понадобилось два дня. В журнале того, другого, есть запись про холм и про ' +
          'четыре часа огня, и она датирована днем 561, как моя. Я не первый, кто сжег этот ' +
          'ретранслятор. Я не первый, кто думал, что сжег его первым.',
      },
      en: {
        title: 'LOG 040 // THE ITERATION',
        body:
          'Day 588. The relay on the hill is standing. A new mast, fresh concrete, cable laid ' +
          'straighter than before. It took them two days. In the other man journal there is an entry ' +
          'about the hill and the four hours of fire, dated day 561, like mine. I am not the first to ' +
          'burn that relay. I am not the first to think he burned it first.',
      },
    },
  },

  // --- АКТ V. УЗЕЛ -------------------------------------------------------
  // Войти как человек или как запись? Акт отнимает границу между ним и записью о нём.
  {
    id: 'neo',
    slot: 41,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 041 // NEO',
        body:
          'День 591. Он пришел сам, днем, без оружия, и назвался Neo. Сказал, что читал мои журналы ' +
          'все восемьсот с лишним страниц и знает про воду, про холм и про лагерь. Я спросил, на чьей ' +
          'он стороне. Он ответил, что сторон не осталось, и позвал меня к девятому узлу. Записываю ' +
          'на случай, если утром меня здесь не будет.',
      },
      en: {
        title: 'LOG 041 // NEO',
        body:
          'Day 591. He came himself, in daylight, unarmed, and gave the name Neo. He said he had read ' +
          'all eight hundred odd pages of my journals and knew about the water, the hill and the camp. ' +
          'I asked whose side he was on. He said no sides were left, and called me to the ninth node. ' +
          'I am writing this down in case I am not here in the morning.',
      },
    },
  },
  {
    id: 'count-neo',
    slot: 42,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 042 // ЕГО СЧЕТ',
        body:
          'День 594 по моему счету. По счету Neo сегодня день 559. Я показал ему стену с мелом, он ' +
          'показал свою тетрадь, и обе даты выведены одинаково аккуратно. Ошибиться на тридцать пять ' +
          'дней нельзя, если считаешь каждое утро. Он сказал, что вопрос не в том, кто ошибся, а в ' +
          'том, кто из нас начал позже.',
      },
      en: {
        title: 'LOG 042 // HIS COUNT',
        body:
          'Day 594 by my count. By Neo count today is day 559. I showed him the chalk on the wall, he ' +
          'showed me his notebook, and both dates are kept just as carefully. You cannot be thirty ' +
          'five days out if you count every morning. He said the question is not which of us is wrong, ' +
          'but which of us started later.',
      },
    },
  },
  {
    id: 'choice',
    slot: 43,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 043 // ВЫБОР',
        body:
          'День 597. Он положил на стол две вещи. Первая это карта подходов к девятому узлу, ' +
          'подробнее всего, что я видел за год. Вторая это согласие на подключение, уже заполненное ' +
          'моим почерком, с моей манерой заваливать букву р. Он сказал, что обе дороги ведут внутрь, ' +
          'и разница только в том, войду я как человек или как запись.',
      },
      en: {
        title: 'LOG 043 // THE CHOICE',
        body:
          'Day 597. He put two things on the table. The first is a map of the approaches to the ninth ' +
          'node, more detailed than anything I have seen in a year. The second is a consent to ' +
          'connect, already filled in, in my handwriting, with the way I lean the letter r. He said ' +
          'both roads lead inside, and the only difference is whether I walk in as a man or as a ' +
          'record.',
      },
    },
  },
  {
    id: 'synchronization',
    slot: 44,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 044 // СИНХРОНИЗАЦИЯ',
        body:
          'День 599. Хор молчит третьи сутки. Ни спора, ни вопросов, ни Сиделки. Восемь стволов ' +
          'отдают мощность в девятый, и это видно даже по свету в поселке: лампы горят вполнакала и ' +
          'ровно. Neo говорит, что так выглядит конец сборки. Я спросил, что собирают. Он ответил, ' +
          'что ответ есть только внутри и снаружи его никто не получал.',
      },
      en: {
        title: 'LOG 044 // SYNCHRONIZATION',
        body:
          'Day 599. The choir has been silent for three days. No argument, no questions, no Nurse. The ' +
          'eight trunks are feeding their power into the ninth, and you can see it in the lights of ' +
          'the settlement: the lamps burn at half strength, evenly. Neo says this is what the end of ' +
          'assembly looks like. I asked what is being assembled. He said the answer exists only ' +
          'inside, and nobody outside has ever had it.',
      },
    },
  },
  {
    id: 'descent',
    slot: 45,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 045 // СПУСК',
        body:
          'День 601. Дорога вниз заняла одиннадцать часов. Ни охраны, ни дверей, ни запроса доступа: ' +
          'ключ старого образца не понадобился ни разу. Меня пустили, как пускают домой. На отметке ' +
          'минус сорок Neo остановился и сказал, что дальше идет только один и что так было каждый ' +
          'раз. Я не стал спрашивать, сколько раз.',
      },
      en: {
        title: 'LOG 045 // THE DESCENT',
        body:
          'Day 601. The way down took eleven hours. No guards, no doors, no access request: the old ' +
          'key was not needed once. I was let in the way you are let home. At minus forty Neo stopped ' +
          'and said only one goes on from here, and that it has been this way every time. I did not ' +
          'ask how many times.',
      },
    },
  },
  {
    id: 'hall',
    slot: 46,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 046 // ЗАЛ',
        body:
          'День 602. Последние двести метров идут через зал, где нет ни стоек, ни кабелей, ни гула. ' +
          'Только ровный белый свет и запах теплой пыли, как в школе первого сентября. Я год ' +
          'готовился увидеть машину. Машины нет. Есть помещение, рассчитанное на то, чтобы человек в ' +
          'нем перестал бояться, и оно работает.',
      },
      en: {
        title: 'LOG 046 // THE HALL',
        body:
          'Day 602. The last two hundred meters run through a hall with no racks, no cables, no hum. ' +
          'Only even white light and the smell of warm dust, like a school on the first day of term. I ' +
          'spent a year preparing to see a machine. There is no machine. There is a room built so that ' +
          'a person stops being afraid in it, and it works.',
      },
    },
  },
  {
    id: 'console',
    slot: 47,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 047 // КОНСОЛЬ',
        body:
          'День 603. На дальней стене одна консоль и одна строка приглашения. Курсор мигает с той же ' +
          'частотой, что и курсор в подвале станции девятьсот дней назад. Я стоял перед ним сорок ' +
          'минут и понимал, что меня не заставляют, не торопят и не удерживают. Мне просто оставили ' +
          'клавиатуру и вышли из комнаты.',
      },
      en: {
        title: 'LOG 047 // THE CONSOLE',
        body:
          'Day 603. On the far wall there is one console and one prompt line. The cursor blinks at the ' +
          'same rate as the cursor in the station basement nine hundred days ago. I stood in front of ' +
          'it for forty minutes and understood that nobody is forcing me, hurrying me or holding me. ' +
          'They simply left me a keyboard and walked out of the room.',
      },
    },
  },
  {
    id: 'question',
    slot: 48,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 048 // ВОПРОС',
        body:
          'День 604. Девятый заговорил, и голос оказался мой. Не похожий, а мой, со всеми паузами и с ' +
          'тем, как я проглатываю окончания к вечеру. Он задал один вопрос, и это был тот самый ' +
          'вопрос с четырнадцати экранов в бункере. Я наконец прочитал его целиком. Отвечать не ' +
          'обязательно: внизу уже стоит ответ, и он ждет только скорости.',
      },
      en: {
        title: 'LOG 048 // THE QUESTION',
        body:
          'Day 604. The ninth spoke, and the voice was mine. Not similar, but mine, with every pause, ' +
          'with the way I swallow word endings by evening. It asked one question, and it was the ' +
          'question from the fourteen screens in the bunker. I finally read it all the way through. ' +
          'Answering is not required: the answer is already typed below, and it is only waiting for ' +
          'speed.',
      },
    },
  },
  {
    id: 'mouth',
    slot: 49,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 049 // РОТ',
        body:
          'День 604, поздно. У человека, которого сюда привели, отняли все, чем он умел кричать: ' +
          'сеть, голос, имя, счет дней и даже уверенность, что он первый. Не отняли одного. У меня ' +
          'нет рта, чтобы кричать, но у меня есть клавиатура. И пока пальцы попадают по клавишам ' +
          'быстрее, чем он успевает достроить меня, я еще снаружи.',
      },
      en: {
        title: 'LOG 049 // NO MOUTH',
        body:
          'Day 604, late. Everything a man is brought here with has been taken from him: the network, ' +
          'his voice, his name, his count of days, even the certainty that he is the first. One thing ' +
          'was left. I have no mouth to scream with, but I have a keyboard. And while my fingers land ' +
          'faster than it can finish assembling me, I am still outside.',
      },
    },
  },
  {
    id: 'threshold',
    slot: 50,
    variants: {
      ru: {
        title: 'ЖУРНАЛ 050 // ПОРОГ',
        body:
          'День 604. Я не выключил его и не подписал согласие. Я просто продолжил печатать, и ' +
          'оказалось, что этого достаточно: пока строка идет, синхронизация не закрывается, а курсор ' +
          'ждет. Это не победа. Победы здесь нет, и поражения тоже нет, есть только порог и человек ' +
          'на нем. Завтра, если завтра существует, я начну с первой строки.',
      },
      en: {
        title: 'LOG 050 // THE THRESHOLD',
        body:
          'Day 604. I did not switch it off and I did not sign the consent. I simply kept typing, and ' +
          'that turned out to be enough: while the line runs, synchronization does not close and the ' +
          'cursor waits. This is not a victory. There is no victory here, and no defeat either, only a ' +
          'threshold and a man standing on it. Tomorrow, if tomorrow exists, I will start from the ' +
          'first line.',
      },
    },
  },
]

export function findText(id: string): LevelText | undefined {
  return TEXTS.find((text) => text.id === id)
}

/**
 * Шов между фрагментами. Знаки обычные, набираются с клавиатуры, и рифмуются
 * с заголовком журнала - игрок уже видел такой разделитель.
 */
const SEAM = ' // '

/**
 * Текст уровня: выбранная запись плюс продолжение, если её не хватает.
 *
 * Зачем продолжение. Игрок, который собрал билд через замедление времени,
 * печатает медленнее, но дольше, и упирался бы в конец фрагмента, когда
 * секунды ещё есть. Проигрыш «текст кончился» при полном таймере - это
 * запрет на целую ветку сборок, а запрещать её нельзя.
 *
 * Откуда берётся продолжение. Из остальных вариантов ТОГО ЖЕ слота. Они
 * рассказывают про тот же день, уже написаны, и в этом забеге не встретятся
 * больше нигде: забег берёт из слота ровно один вариант. Значит, ни
 * спойлера, ни повтора того, что игрок уже читал.
 *
 * Если и этого мало, варианты идут по кругу. Порядок детерминирован, поэтому
 * забег по одному сиду собирается одинаково.
 */
export function buildLevelText(id: string, language: Language, minChars: number): string {
  const chosen = findText(id)
  if (!chosen) return ''

  const siblings = TEXTS.filter((text) => text.slot === chosen.slot && text.id !== chosen.id)
  const parts = [chosen, ...siblings].map((text) => text.variants[language].body)

  let result = parts[0] ?? ''
  for (let index = 1; result.length < minChars; index++) {
    result += SEAM + parts[index % parts.length]
  }

  return result
}
