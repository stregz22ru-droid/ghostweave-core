// GHOSTWEAVE HTTP API: Server v1.0
// Настройка и запуск HTTP сервера

import express, { Express } from "express";
import cors from "cors";
import { ChainStorage } from "./utils/storage";
import { createRoutes } from "./routes/index";
import { requestLogger } from "./middleware/logger";
import { errorHandler, notFoundHandler } from "./middleware/error";
import { profileManager, officialProfileV1 } from "@ghostweave/core-sdk";
import { HttpConfig } from "./types/index";
import { logger } from "./middleware/logger";

export class HttpServer {
  private app: Express;
  private config: HttpConfig;
  private storage: ChainStorage;
  private server: ReturnType<typeof import("http").createServer> | null = null;

  constructor(config: HttpConfig) {
    this.config = config;
    this.app = express();

    // Регистрируем профиль
    if (!profileManager.hasProfile(officialProfileV1.id)) {
      profileManager.registerProfile(officialProfileV1);
    }
    profileManager.setActiveProfile(officialProfileV1.id);

    // Инициализируем хранилище
    this.storage = new ChainStorage(config.dataDir);

    // Настраиваем middleware
    this.setupMiddleware();
    // Настраиваем маршруты
    this.setupRoutes();
    // Настраиваем обработку ошибок
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // CORS
    if (this.config.cors.enabled) {
      const corsOptions = this.config.cors.origins
        ? { origin: this.config.cors.origins }
        : {};
      this.app.use(cors(corsOptions));
    }

    // JSON парсер
    this.app.use(express.json({ limit: "10mb" }));

    // Логирование
    if (this.config.logging.enabled) {
      this.app.use(requestLogger);
    }
  }

  private setupRoutes(): void {
    const router = createRoutes(this.storage);
    this.app.use("/api", router);

    // Health check на корневом уровне
    this.app.get("/health", (_req, res) => {
      res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        protocol: "GWP/1.0",
        profile: "ghostweave-profile-v1",
        eventCount: this.storage.getLength()
      });
    });

    // Корневой путь с информацией
    this.app.get("/", (_req, res) => {
      res.json({
        name: "GHOSTWEAVE HTTP Adapter",
        version: "1.0.0",
        protocol: "GWP/1.0",
        profile: "ghostweave-profile-v1",
        endpoints: {
          chain: "/api/chain",
          events: "/api/events",
          verify: "/api/verify",
          replay: "/api/replay",
          export: "/api/export",
          health: "/health"
        },
        docs: "https://github.com/stregz22ru-droid/ghostweave-core-v1"
      });
    });
  }

  private setupErrorHandling(): void {
    this.app.use(notFoundHandler);
    this.app.use(errorHandler);
  }

  /**
   * Запуск сервера
   */
  start(): Promise<void> {
    return new Promise((resolve) => {
      const port = this.config.port || 3311;
      const host = this.config.host || "127.0.0.1";

      this.server = this.app.listen(port, host, () => {
        logger.blank();
        logger.success(`🚀 GHOSTWEAVE HTTP Adapter v1.0.0`);
        logger.info(`   Listening on: http://${host}:${port}`);
        logger.info(`   API base: http://${host}:${port}/api`);
        logger.info(`   Health: http://${host}:${port}/health`);
        logger.info(`   Data: ${this.config.dataDir}`);
        logger.info(`   Events: ${this.storage.getLength()}`);
        logger.blank();
        resolve();
      });

      // Обработка ошибок сервера
      this.server.on("error", (err) => {
        logger.error(`Server error: ${err}`);
      });
    });
  }

  /**
   * Остановка сервера
   */
  stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        resolve();
        return;
      }

      this.server.close((err) => {
        if (err) {
          reject(err);
        } else {
          logger.info("Server stopped");
          this.server = null;
          resolve();
        }
      });
    });
  }

  /**
   * Получение Express приложения (для тестирования)
   */
  getApp(): Express {
    return this.app;
  }

  /**
   * Получение хранилища (для тестирования)
   */
  getStorage(): ChainStorage {
    return this.storage;
  }
}

export default HttpServer;