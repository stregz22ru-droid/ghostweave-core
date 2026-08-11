// GHOSTWEAVE SDK: Profile Manager v1.0
// Управление профилями: загрузка, валидация, переключение

import { Profile } from "../types/index";
import { officialProfileV1 } from "./official-v1";

/**
 * Менеджер профилей
 */
export class ProfileManager {
  private profiles: Map<string, Profile> = new Map();
  private activeProfileId: string | null = null;

  constructor() {
    // Регистрация встроенного Official Profile v1.0
    this.registerProfile(officialProfileV1);
    this.activeProfileId = officialProfileV1.id;
  }

  /**
   * Регистрация профиля
   */
  registerProfile(profile: Profile): void {
    if (this.profiles.has(profile.id)) {
      throw new Error(`Profile ${profile.id} already registered`);
    }
    
    // Базовая валидация профиля
    this.validateProfile(profile);
    
    this.profiles.set(profile.id, profile);
  }

  /**
   * Получение профиля по ID
   */
  getProfile(id: string): Profile | null {
    return this.profiles.get(id) || null;
  }

  /**
   * Получение активного профиля
   */
  getActiveProfile(): Profile | null {
    if (!this.activeProfileId) return null;
    return this.profiles.get(this.activeProfileId) || null;
  }

  /**
   * Установка активного профиля
   */
  setActiveProfile(id: string): void {
    if (!this.profiles.has(id)) {
      throw new Error(`Profile ${id} not found`);
    }
    this.activeProfileId = id;
  }

  /**
   * Получение всех зарегистрированных профилей
   */
  getAllProfiles(): Profile[] {
    return Array.from(this.profiles.values());
  }

  /**
   * Проверка существования профиля
   */
  hasProfile(id: string): boolean {
    return this.profiles.has(id);
  }

  /**
   * Валидация профиля
   */
  validateProfile(profile: Profile): void {
    const errors: string[] = [];

    // Проверка обязательных полей
    if (!profile.id) errors.push("Profile missing 'id'");
    if (!profile.version) errors.push("Profile missing 'version'");
    if (!profile.algorithms) errors.push("Profile missing 'algorithms'");
    if (!profile.algorithms?.hash) errors.push("Profile missing 'algorithms.hash'");
    if (!profile.algorithms?.canonicalization) {
      errors.push("Profile missing 'algorithms.canonicalization'");
    }
    if (!profile.algorithms?.signature) {
      errors.push("Profile missing 'algorithms.signature'");
    }
    if (!profile.identity) errors.push("Profile missing 'identity'");
    if (!profile.anchor) errors.push("Profile missing 'anchor'");

    // Проверка формата версии (SemVer)
    if (profile.version && !/^\d+\.\d+\.\d+$/.test(profile.version)) {
      errors.push(`Invalid version format: ${profile.version} (expected X.Y.Z)`);
    }

    if (errors.length > 0) {
      throw new Error(`Invalid profile: ${errors.join("; ")}`);
    }
  }

  /**
   * Получение хеша профиля (для идентификации)
   */
  getProfileHash(profileId: string): string {
    const profile = this.getProfile(profileId);
    if (!profile) {
      throw new Error(`Profile ${profileId} not found`);
    }
    const content = JSON.stringify(profile);
    // Используем простой хеш для идентификации
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, "0");
  }
}

/**
 * Создание менеджера профилей с предустановленными профилями
 */
export function createProfileManager(): ProfileManager {
  return new ProfileManager();
}

/**
 * Глобальный экземпляр менеджера профилей
 */
export const profileManager = createProfileManager();

export default profileManager;