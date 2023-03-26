import {LocalStorage, } from '@raycast/api';


interface QueueItem {
  key: string;
  value: string;
}

class QueueCache {
  private maxSize: number;
  private cache: QueueItem[] = [];
  private storageKey: string;

  constructor(maxSize: number, storageKey: string) {
    this.maxSize = maxSize;
    this.storageKey = storageKey;
    // Load the cache from localStorage, if it exists
    const storedCache = LocalStorage.getItem<string>(this.storageKey).then(result => {
      if (result) {
        this.cache = JSON.parse(result);
      } else {
        this.cache = [];
      }
    });
  }

  push(key: string, value: string): void {
    // Remove the oldest item if the cache is already at maximum capacity
    if (this.cache.length >= this.maxSize) {
      this.cache.shift();
    }

    // Add the new item to the end of the cache
    this.cache.push({ key, value });

    // Update the cache in localStorage
    LocalStorage.setItem(this.storageKey, JSON.stringify(this.cache));
  }

  save(): void {
    while(this.cache.length >= this.maxSize) {
      this.cache.pop();
    }
    LocalStorage.setItem(this.storageKey, JSON.stringify(this.cache));
  }


  toArray(): QueueItem[] {
    return [...this.cache];
  }
}

export default QueueCache;
