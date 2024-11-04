import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './app.model';
import * as TelegramBot from 'node-telegram-bot-api';
import { allButtons, currencyKeyboard, generalKeyboard, settingsKeyboard, weatherKeyboard } from './utils';
import * as NodeCache from 'node-cache';
import axios from 'axios';


const cache = new NodeCache({ stdTTL: 150 });


@Injectable()
export class AppService {
  private bot: TelegramBot;
  constructor(
    @InjectModel(User.name) private userModel: User,
  ) {
    const token = process.env.TELEGRAM_KEY;
    this.bot = new TelegramBot(token, { polling: true });
    this.startTgBot();
  }


  private async startTgBot() {

    this.bot.onText(/\/start/, async (msg: any) => {
      try {
        const chatId = msg.chat.id;
        const user = await this.userModel.findOne({ tgId: chatId });
        if (user) {
          await this.bot.sendMessage(user.tgId, `Hello user ${msg.from.first_name}`, generalKeyboard)

        } else {
          await this.userModel.create({
            firstName: msg.from.first_name,
            tgId: chatId
          })
          const massage = "Hello clown\nТут можна отримати курс валют\n ";

          await this.bot.sendMessage(chatId, massage, generalKeyboard);
        }
      }
      catch (error) {
        console.error(error);
      }
    });

    this.bot.onText(/USD/, async (msg: any) => {
      try {
        const chatId = msg.chat.id;

        await this.fetchCurrency(chatId, 'USD')
      } catch (error) {
        console.error(error);

      }
    })
    this.bot.onText(/EUR/, async (msg: any) => {
      try {
        const chatId = msg.chat.id;

        await this.fetchCurrency(chatId, 'EUR')
      } catch (error) {
        console.error(error);

      }
    })
    this.bot.onText(/NOK/, async (msg: any) => {
      try {
        const chatId = msg.chat.id;

        await this.fetchCurrency(chatId, 'NOK')
      } catch (error) {
        console.error(error);

      }
    })

    this.bot.onText(/Курси валют/, async (msg: any) => {
      try {
        const chatId = msg.chat.id;
        await this.bot.sendMessage(chatId, 'Валюти', currencyKeyboard);
      } catch (error) {
        console.error(error);

      }
    })

    this.bot.onText(/Back/, async (msg: any) => {
      try {
        const chatId = msg.chat.id;
        await this.bot.sendMessage(chatId, 'Back', generalKeyboard);
      } catch (error) {
        console.error(error);

      }
    })

    this.bot.onText(/Binance/, async (msg: any) => {
      try {
        const chatId = msg.chat.id;
        const message = await this.binanceGetTop7();
        await this.bot.sendMessage(chatId, message, generalKeyboard);
      } catch (error) {
        console.error(error);

      }
    })

    this.bot.on('message', async (msg: any) => {
      const chatId = msg.chat.id;
      const text = msg.text;
      const check = allButtons(text);
      if (check) {
        return
      }
      try {

        const apiUrl = `${process.env.URL_WEATHER}${text}&appid=${process.env.API_WEATHER}`;
        await axios.post(apiUrl);
        const user = await this.userModel.findOne({ tgId: chatId })
        if (user) {
          await this.userModel.findByIdAndUpdate(user.id, { settings: user.settings })
          const keyBoard = weatherKeyboard(text, chatId);
          await this.bot.sendMessage(chatId, "Оберіть інтервал з яким вам буде надсилатись оновлена погода", keyBoard);
        }
      } catch (error) {
        await this.bot.sendMessage(chatId, "Це місто не знайдено, введіть місто в іншому форматі, наприклад - Lviv, Kyiv", generalKeyboard);
      }


    })
    this.bot.on('callback_query', async (query: any) => {
      const { data } = query;
      const [city, timer, chatId] = data.split(":");
      const user = await this.userModel.findOne({ tgId: chatId })
      if (timer === '1h' || timer === '3h' || timer === '6h') {
        user.settings.push({ city: city, timer: timer })
        await this.userModel.findByIdAndUpdate(user.id, { activity: true, settings: user.settings })
        if (timer === '1h') {
          await this.weatherTimeout(timer, chatId, user.settings[user.settings.length - 1])
          await this.bot.sendMessage(chatId, 'Вам буде приходити погода кажну годину');

          if (timer === '3h') {
            await this.weatherTimeout(timer, chatId, user.settings[user.settings.length - 1])
            await this.bot.sendMessage(chatId, 'Вам буде приходити погода кажні 3 години');

          }
          if (timer === '6h') {
            await this.weatherTimeout(timer, chatId, user.settings[user.settings.length - 1])
            await this.bot.sendMessage(chatId, 'Вам буде приходити погода кажні 6 годин');

          }
        }
      }
      if (timer === "settings") {
        const newSettings = user.settings.filter((_, index) => index !== parseFloat(city))
        await this.userModel.findByIdAndUpdate(user.id, { settings: newSettings })
        await this.bot.sendMessage(chatId, 'Місто видалено');
      }

    })

    this.bot.onText(/Вимкнути оповіщення/, async (msg: any) => {
      const chatId = msg.chat.id;
      const user = await this.userModel.findOne({ tgId: chatId })
      if (user.activity === false) {
        await this.userModel.findByIdAndUpdate(user.id, { activity: true });
        await this.bot.sendMessage(chatId, 'Оповіщення увімкнуте');
      } else {
        await this.userModel.findByIdAndUpdate(user.id, { activity: false });
        await this.bot.sendMessage(chatId, 'Оповіщення вимкнено');
      }
    })


    this.bot.onText(/Погода/, async (msg: any) => {
      try {
        const chatId = msg.chat.id;
        await this.bot.sendMessage(chatId, 'Введіть назву міста для отримання погоди (у форматі- Lviv, Kyiv)');
      } catch (error) {
        console.error(error);

      }
    })

    this.bot.onText(/Налаштування/, async (msg: any) => {
      try {
        const chatId = msg.chat.id;
        const user = await this.userModel.findOne({ tgId: chatId })
        user.settings.map(async (item, index) => {
          const keyboard = settingsKeyboard(index, chatId)
          await this.bot.sendMessage(chatId, `Ваші збережені налаштування:${item.city} період ${item.timer}`, keyboard);

        })
      } catch (error) {
        console.error(error);

      }
    })

    this.bot.onText(/Кожну годину/, async (msg: any) => {
      try {
        const chatId = msg.chat.id;

        await this.fetchCurrency(chatId, 'Кожну годину')
      } catch (error) {
        console.error(error);

      }
    })

    this.bot.onText(/Кожні 3 години/, async (msg: any) => {
      try {
        const chatId = msg.chat.id;

        await this.fetchCurrency(chatId, 'Кожні 3 години')
      } catch (error) {
        console.error(error);

      }
    })

    this.bot.onText(/Кожні 6 годин/, async (msg: any) => {
      try {
        const chatId = msg.chat.id;

        await this.fetchCurrency(chatId, 'Кожні 6 годин')
      } catch (error) {
        console.error(error);

      }
    })
  }

  async startSettings() {
    try {
      const users = await this.userModel.find()
      users.map(async (user) => {
        const chatId = user.tgId;
        if (user.activity === false) {
          return;
        } else {

          return user.settings.map(async (item) => {
            await this.weatherTimeout(item.timer, chatId, item.city)
          })
        }
      })
    } catch (error) {

    }
  }

  async fetchCurrency(chatId: number, currency: string) {
    try {
      const types = (currency) => currency === 'USD' ? 840 : currency === 'EUR' ? 978 : currency === 'NOK' ? 578 : null;
      const currencyType = types(currency);

      if (!currencyType) {
        await this.bot.sendMessage(chatId, `Currency type ${currency} is not supported.`);
        return;
      }
      const cachedRates = cache.get(currency);
      if (cachedRates) {
        await this.bot.sendMessage(chatId, `Курс ${currency}: ${cachedRates}`, currencyKeyboard);
        return;
      }

      const url = process.env.MONO_URL;
      const { data } = await axios.get(url);
      const rates = data.find((rate) => rate.currencyCodeA === currencyType && rate.currencyCodeB === 980);
      if (rates) {
        let rateMessage;
        if (rates.rateBuy) {
          rateMessage = `Курс ${currency} до UAH:\nКупівля: ${rates.rateBuy}, Продаж: ${rates.rateSell}`;

        } else {
          rateMessage = `Курс ${currency} до UAH:\nЦіна валюти: ${rates.rateCross}`;

        }

        cache.set(currency, rateMessage);

        await this.bot.sendMessage(chatId, rateMessage, currencyKeyboard);
      } else {
        await this.bot.sendMessage(chatId, `Не вдалося знайти курс для ${currency}`, currencyKeyboard);
      }
    } catch (error) {
      console.error(error);
      await this.bot.sendMessage(chatId, 'Виникла помилка при отриманні курсу валют.', currencyKeyboard);
    }
  }

  async fetchWeather(chatId: number, city: string) {
    try {
      const apiUrl = `${process.env.URL_WEATHER}${city}&appid=${process.env.API_WEATHER}`;
      const response = await axios.get(apiUrl);
      const data = response.data;
      const temp = (data.main.temp - 273.15).toFixed(0);
      const date = new Date(data.dt * 1000);
      const formattedDate = date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }).replace(',', '');
      const wind = data.wind.speed;
      const img = data.weather[0].main === "Clouds" ? '☁️' : data.weather[0].main === "Clear" ? '☀️' : data.weather[0].main === "Rain" ? '🌧' : data.weather[0].main === "Snow" ? '❄️' : "no emoji";
      await this.bot.sendMessage(chatId, `Погода в місті - ${city}:\nТемпература повітря: ${temp}°C ${img}\nШвидкість вітру: ${wind} m/s\nДата: ${formattedDate}`, generalKeyboard);

    } catch (error) {
      await this.bot.sendMessage(chatId, "Це місто не знайдено", generalKeyboard);


    }


  }

  async binanceGetTop7() {
    try {
      let message = `Котування топ 7 монет бінансу\n\n`
      const coins = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'DOGEUSDT', 'TRXUSDT', 'TONUSDT']
      for (const coin of coins) {
        const binanceResp = await axios.get(`https://api.binance.com/api/v3/klines?symbol=${coin}&interval=1m&limit=1`)
        const data = binanceResp.data[0];
        const dataVolume = parseFloat(data[5]) * parseFloat(data[4])
        const dataClosePrice = `Ціна пари - ${coin}: ${parseFloat(data[4]).toFixed(4)}$\nОб'єм продажів - ${dataVolume.toFixed(2)}$\n\n`
        message += dataClosePrice

      }
      return message;

    } catch (error) {
      console.error(error);
    }
  }

  async weatherTimeout(timer: string, chatId: number, city: string) {
    await this.fetchWeather(chatId, city);
    let interval;
    if (timer === '1h') {
      interval = 3600000;
    }
    if (timer === '3h') {
      interval = 10800000;
    }
    if (timer === '6h') {
      interval = 21600000;
    }
    const intervalId = setInterval(async () => {
      const currentUser = await this.userModel.findOne({ tgId: chatId });
      if (currentUser?.activity === false) {
        clearInterval(intervalId);
      } else {
        await this.fetchWeather(chatId, city);
      }
    }, interval);
  }
}
