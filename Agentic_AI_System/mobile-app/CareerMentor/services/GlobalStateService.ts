import AsyncStorage from '@react-native-async-storage/async-storage';
// Define minimal RxJS types to avoid dependency
interface Observer<T> {
  next: (value: T) => void;
  error?: (err: any) => void;
  complete?: () => void;
}

interface Subscription {
  unsubscribe(): void;
}

class BehaviorSubject<T> {
  private _value: T;
  private _observers: Observer<T>[] = [];

  constructor(initialValue: T) {
    this._value = initialValue;
  }

  getValue(): T {
    return this._value;
  }

  next(value: T): void {
    this._value = value;
    this._observers.forEach(observer => observer.next(value));
  }

  subscribe(observerOrNext: Observer<T> | ((value: T) => void)): Subscription {
    const observer: Observer<T> = typeof observerOrNext === 'function'
      ? { next: observerOrNext }
      : observerOrNext;
    
    this._observers.push(observer);
    observer.next(this._value);
    
    return {
      unsubscribe: () => {
        const index = this._observers.indexOf(observer);
        if (index !== -1) {
          this._observers.splice(index, 1);
        }
      }
    };
  }

  asObservable(): Observable<T> {
    return new Observable<T>((subscriber) => {
      return this.subscribe(subscriber);
    });
  }
}

class Observable<T> {
  constructor(private _subscribe: (subscriber: Observer<T>) => Subscription) {}

  subscribe(observerOrNext: Observer<T> | ((value: T) => void)): Subscription {
    const observer: Observer<T> = typeof observerOrNext === 'function'
      ? { next: observerOrNext }
      : observerOrNext;
    
    return this._subscribe(observer);
  }
}

/**
 * GlobalStateService - A centralized data store for the CareerMentor application
 * 
 * This service provides a global state management solution that can be used
 * across the entire application, including different agents, systems, and pages.
 * It uses RxJS BehaviorSubjects to provide reactive state updates and AsyncStorage
 * for persistence.
 */

// Define the structure of our global state
export interface GlobalState {
  // User information
  user: {
    id: string;
    preferences: {
      [key: string]: any;
    };
  };
  
  // Session data (temporary data that doesn't need to be persisted)
  session: {
    [key: string]: any;
  };
  
  // Agent knowledge base - shared knowledge between agents
  agentKnowledge: {
    userProfile: {
      name: string;
      email: string;
      phone: string;
      skills: string[];
      experience: string[];
      education: string[];
      preferences: {
        jobTypes: string[];
        locations: string[];
        salary: {
          min: number;
          max: number;
          currency: string;
        };
      };
    };
    interview: {
      currentSessionId: string | null;
      history: {
        [sessionId: string]: {
          jobRole: string;
          experienceLevel: string;
          messages: {
            text: string;
            sender: 'agent' | 'user';
          }[];
          feedback?: string;
          score?: number;
          endedAt?: string; // ISO timestamp when the interview ended
        };
      };
    };
    
    // Resume data
    resume: {
      currentResumeId: string | null;
      resumes: {
        [resumeId: string]: {
          parsedData: any;
          evaluationScore?: number;
          feedback?: string;
        };
      };
    };
    
    // Job search context
    jobSearch: {
      savedJobs: any[];
      searchHistory: string[];
      recentSearches: string[];
    };
    
    // Application tracking
    applications: {
      [applicationId: string]: any;
    };
  };
  
  // System state
  system: {
    isOnline: boolean;
    lastSyncTime: number | null;
    apiEndpoints: {
      [key: string]: string;
    };
  };
}

// Initial state
const initialState: GlobalState = {
  user: {
    id: 'default_user',
    preferences: {},
  },
  session: {},
  agentKnowledge: {
    userProfile: {
      name: '',
      email: '',
      phone: '',
      skills: [],
      experience: [],
      education: [],
      preferences: {
        jobTypes: [],
        locations: [],
        salary: {
          min: 0,
          max: 0,
          currency: 'USD',
        },
      },
    },
    interview: {
      currentSessionId: null,
      history: {},
    },
    resume: {
      currentResumeId: null,
      resumes: {},
    },
    jobSearch: {
      savedJobs: [],
      searchHistory: [],
      recentSearches: [],
    },
    applications: {},
  },
  system: {
    isOnline: true,
    lastSyncTime: null,
    apiEndpoints: {
      base: 'http://localhost:8000',
      mockMate: 'http://localhost:8000/agents/mock_mate',
      trackPal: 'http://localhost:8000/agents/track_pal',
      pathFinder: 'http://localhost:8000/agents/path_finder',
      resumeRefiner: 'http://localhost:8000/agents/resume_refiner',
    },
  },
};

// Storage keys
const STORAGE_KEYS = {
  GLOBAL_STATE: 'career_mentor_global_state',
  USER: 'career_mentor_user',
  AGENT_KNOWLEDGE: 'career_mentor_agent_knowledge',
};

class GlobalStateManager {
  private state$: BehaviorSubject<GlobalState>;
  private initialized: boolean = false;

  constructor() {
    this.state$ = new BehaviorSubject<GlobalState>(initialState);
    this.init();
  }

  /**
   * Initialize the global state from storage
   */
  private async init(): Promise<void> {
    try {
      // Load state from AsyncStorage
      const storedState = await AsyncStorage.getItem(STORAGE_KEYS.GLOBAL_STATE);
      
      if (storedState) {
        const parsedState = JSON.parse(storedState);
        // Merge with initial state to ensure we have all required fields
        const mergedState = this.deepMerge(initialState, parsedState);
        this.state$.next(mergedState);
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('Error initializing global state:', error);
    }
  }

  /**
   * Wait for initialization to complete
   */
  public async waitForInitialization(): Promise<void> {
    if (this.initialized) return;
    
    return new Promise<void>((resolve) => {
      const checkInterval = setInterval(() => {
        if (this.initialized) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  }

  /**
   * Get the current state
   */
  public getState(): GlobalState {
    return this.state$.getValue();
  }

  /**
   * Get an observable of the entire state
   */
  public getState$(): Observable<GlobalState> {
    return this.state$.asObservable();
  }

  /**
   * Get a specific part of the state
   */
  public select<K extends keyof GlobalState>(key: K): GlobalState[K] {
    return this.state$.getValue()[key];
  }

  /**
   * Get an observable of a specific part of the state
   */
  public select$<K extends keyof GlobalState>(key: K): Observable<GlobalState[K]> {
    return new Observable<GlobalState[K]>((subscriber: Observer<GlobalState[K]>) => {
      const subscription = this.state$.subscribe((state: GlobalState) => {
        subscriber.next(state[key]);
      });
      
      return subscription;
    });
  }

  /**
   * Update a specific part of the state
   */
  public async update<K extends keyof GlobalState>(
    key: K,
    updater: (currentValue: GlobalState[K]) => GlobalState[K],
    persist: boolean = true
  ): Promise<void> {
    const currentState = this.state$.getValue();
    const updatedValue = updater(currentState[key]);
    
    const newState = {
      ...currentState,
      [key]: updatedValue,
    };
    
    this.state$.next(newState);
    
    if (persist) {
      await this.persistState();
    }
  }

  /**
   * Update a nested part of the state
   */
  public async updateNested<K extends keyof GlobalState, N extends keyof GlobalState[K]>(
    key: K,
    nestedKey: N,
    updater: (currentValue: GlobalState[K][N]) => GlobalState[K][N],
    persist: boolean = true
  ): Promise<void> {
    const currentState = this.state$.getValue();
    const currentNestedValue = currentState[key][nestedKey];
    const updatedNestedValue = updater(currentNestedValue);
    
    const newState = {
      ...currentState,
      [key]: {
        ...currentState[key],
        [nestedKey]: updatedNestedValue,
      },
    };
    
    this.state$.next(newState);
    
    if (persist) {
      await this.persistState();
    }
  }

  /**
   * Set a specific value in the agent knowledge base
   */
  public async setKnowledge<K extends keyof GlobalState['agentKnowledge']>(
    key: K,
    value: GlobalState['agentKnowledge'][K],
    persist: boolean = true
  ): Promise<void> {
    await this.updateNested('agentKnowledge', key, () => value, persist);
  }

  /**
   * Get a specific value from the agent knowledge base
   */
  public getKnowledge<K extends keyof GlobalState['agentKnowledge']>(key: K): GlobalState['agentKnowledge'][K] {
    return this.state$.getValue().agentKnowledge[key];
  }

  /**
   * Get an observable of a specific value from the agent knowledge base
   */
  public getKnowledge$<K extends keyof GlobalState['agentKnowledge']>(key: K): Observable<GlobalState['agentKnowledge'][K]> {
    return new Observable<GlobalState['agentKnowledge'][K]>((subscriber: Observer<GlobalState['agentKnowledge'][K]>) => {
      const subscription = this.state$.subscribe((state: GlobalState) => {
        subscriber.next(state.agentKnowledge[key]);
      });
      
      return subscription;
    });
  }

  /**
   * Set a session value (temporary, not persisted)
   */
  public setSessionValue<K extends keyof GlobalState['session']>(key: K, value: GlobalState['session'][K]): void {
    this.updateNested('session', key, () => value, false);
  }

  /**
   * Get a session value
   */
  public getSessionValue<K extends keyof GlobalState['session']>(key: K): GlobalState['session'][K] {
    return this.state$.getValue().session[key];
  }

  /**
   * Set the user ID
   */
  public async setUserId(userId: string): Promise<void> {
    await this.updateNested('user', 'id' as any, () => userId);
  }

  /**
   * Get the user ID
   */
  public getUserId(): string {
    return this.state$.getValue().user.id;
  }

  /**
   * Persist the current state to AsyncStorage
   */
  private async persistState(): Promise<void> {
    try {
      const currentState = this.state$.getValue();
      await AsyncStorage.setItem(STORAGE_KEYS.GLOBAL_STATE, JSON.stringify(currentState));
    } catch (error) {
      console.error('Error persisting global state:', error);
    }
  }

  /**
   * Deep merge two objects
   */
  private deepMerge(target: any, source: any): any {
    const output = { ...target };
    
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach((key) => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    
    return output;
  }

  /**
   * Check if a value is an object
   */
  private isObject(item: any): boolean {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  /**
   * Reset the state to initial values
   */
  public async resetState(): Promise<void> {
    this.state$.next(initialState);
    await AsyncStorage.removeItem(STORAGE_KEYS.GLOBAL_STATE);
  }

  /**
   * Update the entire state directly
   * This should only be used by the sync service
   */
  public updateEntireState(newState: GlobalState): void {
    this.state$.next(newState);
  }
}

// Create a singleton instance
export const GlobalState = new GlobalStateManager();

// Export default for convenience
export default GlobalState;
