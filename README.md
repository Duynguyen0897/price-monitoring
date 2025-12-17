Viết ứng dụng bằng nodejs có chức năng nhiệm vụ sau
1. Nhiệm vụ của app
   1. Người dùng nhập vào danh sách link chi tiết sản phâm của website, và danh sách link chi tiết sản phẩm của đối thủ. App có nhiệm vụ vào link các sản phẩm đổi thủ lấy ra giá bán. và đưa ra hiển thị báo cáo cảnh báo nếu giá sản phẩm gốc cao hơn 1 giá bán của 1 sản phẩm nào trong danh sách đối thủ.
   2. Công nghệ dùng: Puperteer để screenshot màn hình đầu tiên khi truy cập vào trang chi tiết sản phẩm.
   3. Kết nối API của Gemini 2.5 để bóc thôgn tin sản phẩn từ hình ảnh chụp được. lấy thông tin đó lưu vào cơ sở dữ liệu.
   4. Mô hình csdl:
      1. Bảng sản phẩm gốc: products: id, name, price, link
      2. Bảng sản phẩm đối thủ:product_crawls: id, product_id (id của sản phẩm gốc), link
      3. Bảng lưu giá mỗi lần bóc từ site đối thủ: product_crawl_logs: id, product_crawl_id, name, sku, price, data: toàn bộ json mà gemini trả về
2. Công nghệ
   1. Kết nối tới mysql để lưu dữ liệu
   2. Mô hình code desgin parten repository, service
   3. Front end dùng react
   4. Code chuẩn hoá

price-monitoring-app/
├── backend/
│   ├── config/
│   │   ├── database.js       # Configuration de MySQL
│   │   └── gemini.js         # Configuration de l'API Gemini
│   ├── controllers/
│   │   ├── productController.js
│   │   ├── crawlController.js
│   │   └── reportController.js
│   ├── models/
│   │   ├── Product.js        # Modèle pour les produits originaux
│   │   ├── ProductCrawl.js   # Modèle pour les produits concurrents
│   │   └── ProductCrawlLog.js # Modèle pour les logs de prix
│   ├── repositories/
│   │   ├── productRepository.js
│   │   ├── crawlRepository.js
│   │   └── reportRepository.js
│   ├── services/
│   │   ├── crawlService.js   # Service pour le scraping avec Puppeteer
│   │   ├── geminiService.js  # Service pour l'API Gemini
│   │   └── priceAlertService.js # Service pour les alertes de prix
│   ├── utils/
│   │   ├── database.js       # Utilitaires pour la base de données
│   │   └── logger.js         # Logging
│   ├── routes/
│   │   ├── api.js            # Routes API principales
│   │   ├── productRoutes.js
│   │   ├── crawlRoutes.js
│   │   └── reportRoutes.js
│   ├── migrations/           # Migrations de base de données
│   ├── app.js                # Point d'entrée de l'application backend
│   └── server.js             # Serveur Express
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/       # Composants communs (boutons, tables, etc.)
│   │   │   ├── products/     # Composants liés aux produits
│   │   │   ├── crawls/       # Composants liés aux crawls
│   │   │   └── reports/      # Composants pour les rapports et alertes
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Products.jsx
│   │   │   ├── Competitors.jsx
│   │   │   └── Reports.jsx
│   │   ├── services/
│   │   │   └── api.js        # Service pour les appels API
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── index.jsx
│   ├── package.json
│   └── README.md
├── .env.example
├── package.json
└── README.md