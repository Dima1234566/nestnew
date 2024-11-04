/* eslint-disable prettier/prettier */
export const allButtons = (msg: string) => {
    if (msg === 'Вимкнути оповіщення' || msg === '/start' || msg === 'Налаштування' || msg === 'Binance' || msg === 'Help' || msg === 'USD' || msg === 'EUR' || msg === 'NOK' || msg === 'Back' || msg === 'Курси валют' || msg === 'Погода' || msg === 'Кожну годину' || msg === 'Кожні 3 години' || msg === 'Кожні 6 годин') {
        return true;
    } else {
        return false;
    }

}

export const currencyKeyboard = {
    reply_markup: {
        keyboard: [
            [{ text: 'USD' }, { text: 'EUR' }, { text: 'NOK' }],
            [{ text: 'Back' }]
        ]
    }
}

export const generalKeyboard = {
    reply_markup: {
        keyboard: [
            [{ text: 'Курси валют' }, { text: 'Binance' }, { text: 'Погода' }],
            [{ text: 'Налаштування' }, { text: 'Вимкнути оповіщення' }]
        ]
    }
}

export const weatherKeyboard = (city: string, chatId: number) => {
    return {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: 'Кожну годину',
                        callback_data: `${city}:1h:${chatId}`
                    },
                    {
                        text: 'Кожні 3 години',
                        callback_data: `${city}:3h:${chatId}`
                    },
                    {
                        text: 'Кожні 6 годин',
                        callback_data: `${city}:6h:${chatId}`
                    }
                ]
            ]
        }

    }
}


export const settingsKeyboard = (index: number, chatId: number) => {
    return {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: 'Видалити місто',
                        callback_data: `${index}:settings:${chatId}`
                    }
                ]
            ]
        }

    }
}