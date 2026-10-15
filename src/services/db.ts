import {
  ClothingItem,
  Outfit,
  OutfitPlan,
  WearLog,
  UserPreferences,
} from '../types/wardrobe';

const DB_NAME = 'DolabimdaNeVarAI_DB';
const DB_VERSION = 1;

class WardrobeDatabase {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private open(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Clothing items store
        if (!db.objectStoreNames.contains('clothing_items')) {
          const itemStore = db.createObjectStore('clothing_items', { keyPath: 'id' });
          itemStore.createIndex('category', 'category', { unique: false });
          itemStore.createIndex('season', 'season', { unique: false });
          itemStore.createIndex('style', 'style', { unique: false });
          itemStore.createIndex('isFavorite', 'isFavorite', { unique: false });
          itemStore.createIndex('isDemoItem', 'isDemoItem', { unique: false });
        }

        // Outfits store
        if (!db.objectStoreNames.contains('outfits')) {
          const outfitStore = db.createObjectStore('outfits', { keyPath: 'id' });
          outfitStore.createIndex('isFavorite', 'isFavorite', { unique: false });
          outfitStore.createIndex('isDemoOutfit', 'isDemoOutfit', { unique: false });
        }

        // Outfit Plans store
        if (!db.objectStoreNames.contains('outfit_plans')) {
          const planStore = db.createObjectStore('outfit_plans', { keyPath: 'id' });
          planStore.createIndex('date', 'date', { unique: false });
        }

        // Wear Logs store
        if (!db.objectStoreNames.contains('wear_logs')) {
          const logStore = db.createObjectStore('wear_logs', { keyPath: 'id' });
          logStore.createIndex('date', 'date', { unique: false });
        }

        // Preferences store
        if (!db.objectStoreNames.contains('preferences')) {
          db.createObjectStore('preferences', { keyPath: 'key' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  // --- CLOTHING ITEMS ---
  async getAllItems(): Promise<ClothingItem[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('clothing_items', 'readonly');
      const store = tx.objectStore('clothing_items');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async getItemById(id: string): Promise<ClothingItem | null> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('clothing_items', 'readonly');
      const store = tx.objectStore('clothing_items');
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async saveItem(item: ClothingItem): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('clothing_items', 'readwrite');
      const store = tx.objectStore('clothing_items');
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async saveItems(items: ClothingItem[]): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('clothing_items', 'readwrite');
      const store = tx.objectStore('clothing_items');
      for (const item of items) {
        store.put(item);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async deleteItem(id: string): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['clothing_items', 'outfits'], 'readwrite');
      const itemStore = tx.objectStore('clothing_items');
      itemStore.delete(id);

      // Clean up reference in outfits or leave warning
      const outfitStore = tx.objectStore('outfits');
      const getAllReq = outfitStore.getAll();
      getAllReq.onsuccess = () => {
        const outfits: Outfit[] = getAllReq.result || [];
        for (const o of outfits) {
          if (o.itemIds.includes(id)) {
            // Keep outfit but filter out the deleted item
            o.itemIds = o.itemIds.filter((itemId) => itemId !== id);
            outfitStore.put(o);
          }
        }
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // --- OUTFITS ---
  async getAllOutfits(): Promise<Outfit[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('outfits', 'readonly');
      const store = tx.objectStore('outfits');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async getOutfitById(id: string): Promise<Outfit | null> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('outfits', 'readonly');
      const store = tx.objectStore('outfits');
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async saveOutfit(outfit: Outfit): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('outfits', 'readwrite');
      const store = tx.objectStore('outfits');
      const req = store.put(outfit);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async saveOutfits(outfits: Outfit[]): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('outfits', 'readwrite');
      const store = tx.objectStore('outfits');
      for (const o of outfits) {
        store.put(o);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async deleteOutfit(id: string): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['outfits', 'outfit_plans'], 'readwrite');
      const outfitStore = tx.objectStore('outfits');
      outfitStore.delete(id);

      // Clean from plans
      const planStore = tx.objectStore('outfit_plans');
      const getAllPlans = planStore.getAll();
      getAllPlans.onsuccess = () => {
        const plans: OutfitPlan[] = getAllPlans.result || [];
        for (const p of plans) {
          if (p.outfitId === id) {
            planStore.delete(p.id);
          }
        }
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // --- PLANS ---
  async getAllPlans(): Promise<OutfitPlan[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('outfit_plans', 'readonly');
      const store = tx.objectStore('outfit_plans');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async savePlan(plan: OutfitPlan): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('outfit_plans', 'readwrite');
      const store = tx.objectStore('outfit_plans');
      const req = store.put(plan);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async deletePlan(id: string): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('outfit_plans', 'readwrite');
      const store = tx.objectStore('outfit_plans');
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- WEAR LOGS & INCREMENT WEAR ---
  async logWear(itemIds: string[], outfitId?: string, notes?: string): Promise<void> {
    const db = await this.open();
    const today = new Date().toISOString().split('T')[0];

    return new Promise((resolve, reject) => {
      const tx = db.transaction(['clothing_items', 'outfits', 'wear_logs'], 'readwrite');
      const logStore = tx.objectStore('wear_logs');
      const itemStore = tx.objectStore('clothing_items');
      const outfitStore = tx.objectStore('outfits');

      // Add log entry
      logStore.put({
        id: 'wear_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        date: today,
        outfitId,
        itemIds,
        notes,
      });

      // Increment item wear counts
      for (const id of itemIds) {
        const getReq = itemStore.get(id);
        getReq.onsuccess = () => {
          if (getReq.result) {
            const item = getReq.result as ClothingItem;
            item.wearCount = (item.wearCount || 0) + 1;
            itemStore.put(item);
          }
        };
      }

      // Increment outfit wear count if applicable
      if (outfitId) {
        const getOutfitReq = outfitStore.get(outfitId);
        getOutfitReq.onsuccess = () => {
          if (getOutfitReq.result) {
            const outfit = getOutfitReq.result as Outfit;
            outfit.wearCount = (outfit.wearCount || 0) + 1;
            outfitStore.put(outfit);
          }
        };
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getAllWearLogs(): Promise<WearLog[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('wear_logs', 'readonly');
      const store = tx.objectStore('wear_logs');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  // --- USER PREFERENCES ---
  async getPreferences(): Promise<UserPreferences> {
    const db = await this.open();
    return new Promise((resolve) => {
      const tx = db.transaction('preferences', 'readonly');
      const store = tx.objectStore('preferences');
      const req = store.get('user_prefs');
      req.onsuccess = () => {
        if (req.result && req.result.data) {
          resolve(req.result.data);
        } else {
          resolve({
            preferredStyles: ['Minimalist', 'Smart Casual', 'Casual'],
            preferredColors: ['Siyah', 'Krem', 'Bej', 'Lacivert', 'Gri'],
            city: 'İstanbul',
            allowMultipleOutfitsPerDay: true,
            theme: 'light',
            genderPreference: 'unisex',
          });
        }
      };
      req.onerror = () => {
        resolve({
          preferredStyles: ['Minimalist', 'Smart Casual'],
          preferredColors: ['Siyah', 'Krem', 'Bej'],
          city: 'İstanbul',
          allowMultipleOutfitsPerDay: true,
          theme: 'light',
          genderPreference: 'unisex',
        });
      };
    });
  }

  async savePreferences(prefs: UserPreferences): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('preferences', 'readwrite');
      const store = tx.objectStore('preferences');
      const req = store.put({ key: 'user_prefs', data: prefs });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- DEMO DATA MANAGEMENT ---
  async removeDemoData(): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['clothing_items', 'outfits', 'outfit_plans'], 'readwrite');
      const itemStore = tx.objectStore('clothing_items');
      const outfitStore = tx.objectStore('outfits');

      const itemReq = itemStore.getAll();
      itemReq.onsuccess = () => {
        const items: ClothingItem[] = itemReq.result || [];
        for (const item of items) {
          if (item.isDemoItem) {
            itemStore.delete(item.id);
          }
        }
      };

      const outfitReq = outfitStore.getAll();
      outfitReq.onsuccess = () => {
        const outfits: Outfit[] = outfitReq.result || [];
        for (const o of outfits) {
          if (o.isDemoOutfit) {
            outfitStore.delete(o.id);
          }
        }
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // Clear all data
  async clearAll(): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(
        ['clothing_items', 'outfits', 'outfit_plans', 'wear_logs'],
        'readwrite'
      );
      tx.objectStore('clothing_items').clear();
      tx.objectStore('outfits').clear();
      tx.objectStore('outfit_plans').clear();
      tx.objectStore('wear_logs').clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // Export JSON backup
  async exportBackup(): Promise<string> {
    const items = await this.getAllItems();
    const outfits = await this.getAllOutfits();
    const plans = await this.getAllPlans();
    const logs = await this.getAllWearLogs();
    const prefs = await this.getPreferences();

    const data = {
      appName: 'Dolabımda Ne Var AI',
      exportDate: new Date().toISOString(),
      items,
      outfits,
      plans,
      logs,
      prefs,
    };

    return JSON.stringify(data, null, 2);
  }

  // Import JSON backup
  async importBackup(jsonString: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonString);
      if (data.items && Array.isArray(data.items)) {
        await this.saveItems(data.items);
      }
      if (data.outfits && Array.isArray(data.outfits)) {
        await this.saveOutfits(data.outfits);
      }
      if (data.prefs) {
        await this.savePreferences(data.prefs);
      }
      return true;
    } catch (e) {
      console.error('Import backup error:', e);
      return false;
    }
  }
}

export const wardrobeDb = new WardrobeDatabase();
