import telebot
from telebot.types import WebAppInfo, InlineKeyboardMarkup, InlineKeyboardButton
from config import TOKEN

bot = telebot.TeleBot(TOKEN)

@bot.message_handler(commands=['start', 'play'])
def send_welcome(message):
    markup = InlineKeyboardMarkup()
    markup.add(InlineKeyboardButton('Играть', web_app=WebAppInfo(url='https://erumiki.github.io/DrunkiDucky/DrunkGame')))
    bot.reply_to(message, "Привет! Нажми кнопку, чтобы начать игру:", reply_markup=markup)

bot.polling()