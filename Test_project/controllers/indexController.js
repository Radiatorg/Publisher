// controllers/indexController.js

// Главная страница
exports.index = (req, res) => {
    res.status(200).json({
      message: "Welcome to the Express API!",  
      routes: [
        { method: "GET", path: "/users" },
        { method: "POST", path: "/users" },
        { method: "PUT", path: "/users/{id}" },
        { method: "DELETE", path: "/users/{id}" },
        { method: "GET", path: "/users" },
        { method: "GET", path: "/platforms" },
        { method: "POST", path: "/platforms" },
        { method: "DELETE", path: "/platforms/{id}" },
        { method: "GET", path: "/accounts" },
        { method: "POST", path: "/accounts" },
        { method: "PUT", path: "/accounts/{id}" },
        { method: "DELETE", path: "/accounts/{id}" },

        // Другие маршруты можно добавить здесь
      ],
    });
  };
  