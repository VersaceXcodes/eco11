import { create, persist } from 'zustand';
import { io } from 'socket.io-client';
import axios from 'axios';

// Types
interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  is_business: boolean;
  business_id?: string;
  family_id?: string;
}

interface Post {
  id: string;
  user_id: string;
  title: string;
  content: string;
  image_url?: string;
  created_at: string;
}

interface Comment {
  id: string;
  user_id: string;
  post_id: string;
  content: string;
  created_at: string;
}

interface Like {
  user_id: string;
  post_id: string;
  created_at: string;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  participants: number;
  progress: number;
  start_date: string;
  end_date: string;
}

interface Recommendation {
  id: string;
  title: string;
  content: string;
  impact: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  status: 'pending' | 'completed' | 'ignored';
}

interface CarbonFootprint {
  total_co2: number;
  breakdown: Record<string, number>;
}

interface Notification {
  id: string;
  message: string;
  type: 'challenge' | 'recommendation' | 'social';
  read: boolean;
  timestamp: string;
}

interface Product {
  id: string;
  title: string;
  content: string;
  price: number;
  impact_score: number;
  image_url?: string;
}

interface EducationalItem {
  id: string;
  title: string;
  content: string;
  type: 'article' | 'video' | 'quiz';
  image_url?: string;
}

interface FamilyGroup {
  id: string;
  name: string;
  members: number;
  goals: Record<string, any>;
}

interface BusinessProfile {
  id: string;
  business_name: string;
  industry: string;
  employee_count: number;
  sustainability_certifications: string[];
}

interface AppState {
  // Auth State
  currentUser: User | null;
  authToken: string | null;
  authenticationStatus: {
    isAuthenticated: boolean;
    isLoading: boolean;
  };
  errorMessage: string | null;

  // Social State
  posts: Post[];
  comments: Comment[];
  likes: Like[];
  challenges: Challenge[];
  notifications: Notification[];

  // Tracking State
  carbonFootprint: CarbonFootprint | null;
  offlineActivities: Array<{
    category: string;
    quantity: number;
    unit: string;
    timestamp: string;
  }>;

  // Recommendations
  recommendations: Recommendation[];

  // Marketplace
  marketplaceProducts: Product[];

  // Education
  educationalContent: EducationalItem[];
  bookmarkedItems: string[];

  // Specialized Profiles
  familyGroup: FamilyGroup | null;
  businessProfile: BusinessProfile | null;

  // Auth Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  initializeAuth: () => Promise<void>;
  clearError: () => void;

  // Social Actions
  setPosts: (posts: Post[]) => void;
  addPost: (post: Post) => void;
  updatePost: (id: string, updates: Partial<Post>) => void;
  deletePost: (id: string) => void;

  setComments: (comments: Comment[]) => void;
  addComment: (comment: Comment) => void;
  updateComment: (id: string, updates: Partial<Comment>) => void;
  deleteComment: (id: string) => void;

  toggleLike: (postId: string) => void;

  // Tracking Actions
  setCarbonFootprint: (data: CarbonFootprint) => void;
  addOfflineActivity: (activity: {
    category: string;
    quantity: number;
    unit: string;
    timestamp: string;
  }) => void;
  clearOfflineActivities: () => void;

  // Recommendations Actions
  setRecommendations: (recommendations: Recommendation[]) => void;
  updateRecommendationStatus: (id: string, status: 'completed' | 'ignored') => void;

  // Marketplace Actions
  setMarketplaceProducts: (products: Product[]) => void;

  // Education Actions
  setEducationalContent: (content: EducationalItem[]) => void;
  toggleBookmark: (contentId: string) => void;

  // Profile Actions
  setFamilyGroup: (group: FamilyGroup | null) => void;
  setBusinessProfile: (profile: BusinessProfile | null) => void;
}

export const useAppStore = create(
  persist(
    (set, get) => {
      // Initialize socket connection
      const socket = io(import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000');

      // Realtime event listeners
      socket.on('post.created', (newPost: Post) => {
        set((state) => ({
          posts: [...state.posts, newPost],
        }));
      });

      socket.on('comment.created', (newComment: Comment) => {
        set((state) => ({
          comments: [...state.comments, newComment],
        }));
      });

      socket.on('activity.logged', (activity: {
        user_id: string;
        category: string;
        impact: number;
        timestamp: string;
      }) => {
        set((state) => ({
          offlineActivities: activity.user_id === state.currentUser?.id
           ? [...state.offlineActivities, activity]
            : state.offlineActivities,
        }));
      });

      // Auth Actions
      const login = async (email: string, password: string) => {
        try {
          const response = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}api/auth/login`,
            { email, password }
          );
          
          set(() => ({
            currentUser: response.data.user,
            authToken: response.data.token,
            authenticationStatus: {
              isAuthenticated: true,
              isLoading: false,
            },
            errorMessage: null,
          }));
        } catch (error) {
          set(() => ({
            errorMessage: 'Login failed',
            authenticationStatus: {
              isAuthenticated: false,
              isLoading: false,
            },
          }));
        }
      };

      const register = async (email: string, password: string, name: string) => {
        try {
          const response = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}api/auth/signup`,
            { email, password, name }
          );
          
          set(() => ({
            currentUser: response.data.user,
            authToken: response.data.token,
            authenticationStatus: {
              isAuthenticated: true,
              isLoading: false,
            },
            errorMessage: null,
          }));
        } catch (error) {
          set(() => ({
            errorMessage: 'Registration failed',
            authenticationStatus: {
              isAuthenticated: false,
              isLoading: false,
            },
          }));
        }
      };

      const logout = () => {
        set(() => ({
          currentUser: null,
          authToken: null,
          authenticationStatus: {
            isAuthenticated: false,
            isLoading: false,
          },
          errorMessage: null,
        }));
      };

      const initializeAuth = async () => {
        const storedToken = get().authToken;
        if (!storedToken) return;

        try {
          const response = await axios.get(
            `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}api/users/me`,
            { headers: { Authorization: `Bearer ${storedToken}` } }
          );
          
          set(() => ({
            currentUser: response.data,
            authenticationStatus: {
              isAuthenticated: true,
              isLoading: false,
            },
          }));
        } catch (error) {
          logout();
        }
      };

      const clearError = () => {
        set(() => ({ errorMessage: null }));
      };

      // Social Actions
      const setPosts = (posts: Post[]) => set({ posts });
      const addPost = (post: Post) => set((state) => ({ posts: [...state.posts, post] }));
      const updatePost = (id: string, updates: Partial<Post>) => 
        set((state) => ({
          posts: state.posts.map(p => p.id === id? {...p,...updates } : p)
        }));
      const deletePost = (id: string) => 
        set((state) => ({ posts: state.posts.filter(p => p.id!== id) }));

      // Tracking Actions
      const setCarbonFootprint = (data: CarbonFootprint) => set({ carbonFootprint: data });
      const addOfflineActivity = (activity: {
        category: string;
        quantity: number;
        unit: string;
        timestamp: string;
      }) => set((state) => ({
        offlineActivities: [...state.offlineActivities, activity]
      }));
      const clearOfflineActivities = () => set({ offlineActivities: [] });

      // Recommendations Actions
      const setRecommendations = (recommendations: Recommendation[]) => set({ recommendations });
      const updateRecommendationStatus = (id: string, status: 'completed' | 'ignored') => 
        set((state) => ({
          recommendations: state.recommendations.map(r => 
            r.id === id? {...r, status } : r
          )
        }));

      // Marketplace Actions
      const setMarketplaceProducts = (products: Product[]) => set({ marketplaceProducts: products });

      // Education Actions
      const setEducationalContent = (content: EducationalItem[]) => set({ educationalContent: content });
      const toggleBookmark = (contentId: string) => 
        set((state) => ({
          bookmarkedItems: state.bookmarkedItems.includes(contentId)
           ? state.bookmarkedItems.filter(id => id!== contentId)
            : [...state.bookmarkedItems, contentId]
        }));

      // Profile Actions
      const setFamilyGroup = (group: FamilyGroup | null) => set({ familyGroup: group });
      const setBusinessProfile = (profile: BusinessProfile | null) => set({ businessProfile: profile });

      return {
        // State
        currentUser: null,
        authToken: null,
        authenticationStatus: {
          isAuthenticated: false,
          isLoading: true,
        },
        errorMessage: null,
        posts: [],
        comments: [],
        likes: [],
        challenges: [],
        notifications: [],
        carbonFootprint: null,
        offlineActivities: [],
        recommendations: [],
        marketplaceProducts: [],
        educationalContent: [],
        bookmarkedItems: [],
        familyGroup: null,
        businessProfile: null,

        // Actions
        login,
        register,
        logout,
        initializeAuth,
        clearError,
        setPosts,
        addPost,
        updatePost,
        deletePost,
        setComments: (comments: Comment[]) => set({ comments }),
        addComment: (comment: Comment) => set((state) => ({ comments: [...state.comments, comment] })),
        updateComment: (id: string, updates: Partial<Comment>) => 
          set((state) => ({
            comments: state.comments.map(c => c.id === id? {...c,...updates } : c)
          })),
        deleteComment: (id: string) => 
          set((state) => ({ comments: state.comments.filter(c => c.id!== id) })),
        toggleLike: (postId: string) => 
          set((state) => ({
            likes: state.likes.some(l => l.post_id === postId)
             ? state.likes.filter(l => l.post_id!== postId)
              : [...state.likes, { user_id: get().currentUser?.id || '', post_id: postId, created_at: new Date().toISOString() }]
          })),
        setCarbonFootprint,
        addOfflineActivity,
        clearOfflineActivities,
        setRecommendations,
        updateRecommendationStatus,
        setMarketplaceProducts,
        setEducationalContent,
        toggleBookmark,
        setFamilyGroup,
        setBusinessProfile,
      };
    }),
    {
      name: 'eco11-store',
      partialize: (state) => ({
        currentUser: state.currentUser,
        authToken: state.authToken,
        authenticationStatus: {
          isAuthenticated: state.authenticationStatus.isAuthenticated,
          isLoading: false,
        },
      }),
    }
  );