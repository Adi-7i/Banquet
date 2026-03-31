import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import MockAdapter from 'axios-mock-adapter';
import { api } from '@/lib/api';

// Import after mocking
import { useAuth, User } from '../useAuth';

// Create axios mock
const mockApi = new MockAdapter(api);

// Mock user data
const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    role: 'CUSTOMER',
    firstName: 'Test',
    lastName: 'User',
};

// Mock login response
const mockLoginResponse = {
    success: true,
    data: {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        user: mockUser,
    },
};

// Create wrapper for testing hooks with QueryClient
function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });

    return function Wrapper({ children }: { children: ReactNode }) {
        return (
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        );
    };
}

describe('useAuth', () => {
    beforeEach(() => {
        mockApi.reset();
        localStorage.clear();
        jest.clearAllMocks();
    });

    describe('when no token exists', () => {
        it('should not call /auth/me endpoint', async () => {
            // Ensure no token in localStorage
            expect(localStorage.getItem('accessToken')).toBeNull();

            const { result } = renderHook(() => useAuth(), {
                wrapper: createWrapper(),
            });

            // Wait a bit to ensure no request is made
            await new Promise((resolve) => setTimeout(resolve, 100));

            // Should not have made any requests
            expect(mockApi.history.get.length).toBe(0);

            // User should be undefined
            expect(result.current.user).toBeUndefined();
            expect(result.current.isAuthenticated).toBe(false);
        });

        it('should not be loading when no token exists', () => {
            const { result } = renderHook(() => useAuth(), {
                wrapper: createWrapper(),
            });

            // Should not show loading state since query is disabled
            expect(result.current.isLoadingUser).toBe(false);
        });
    });

    describe('when token exists', () => {
        beforeEach(() => {
            localStorage.setItem('accessToken', 'existing-token');
        });

        it('should call /auth/me endpoint', async () => {
            mockApi.onGet('/auth/me').reply(200, {
                success: true,
                data: mockUser,
            });

            const { result } = renderHook(() => useAuth(), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isLoadingUser).toBe(false);
            });

            expect(mockApi.history.get.length).toBe(1);
            expect(result.current.user).toEqual(mockUser);
            expect(result.current.isAuthenticated).toBe(true);
        });

        it('should handle /auth/me error gracefully', async () => {
            mockApi.onGet('/auth/me').reply(401, {
                message: 'Invalid token',
            });

            const { result } = renderHook(() => useAuth(), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isLoadingUser).toBe(false);
            });

            // Token should be cleared on 401
            expect(localStorage.getItem('accessToken')).toBeNull();
            expect(result.current.isAuthenticated).toBe(false);
        });
    });

    describe('login', () => {
        it('should store tokens in localStorage on successful login', async () => {
            mockApi.onPost('/auth/login').reply(200, mockLoginResponse);

            const { result } = renderHook(() => useAuth(), {
                wrapper: createWrapper(),
            });

            await act(async () => {
                result.current.login({
                    email: 'test@example.com',
                    password: 'password123',
                });
            });

            await waitFor(() => {
                expect(result.current.isLoggingIn).toBe(false);
            });

            expect(localStorage.setItem).toHaveBeenCalledWith('accessToken', 'test-access-token');
            expect(localStorage.setItem).toHaveBeenCalledWith('refreshToken', 'test-refresh-token');
        });

        it('should update query cache with user data on successful login', async () => {
            mockApi.onPost('/auth/login').reply(200, mockLoginResponse);

            const { result } = renderHook(() => useAuth(), {
                wrapper: createWrapper(),
            });

            await act(async () => {
                result.current.login({
                    email: 'test@example.com',
                    password: 'password123',
                });
            });

            await waitFor(() => {
                expect(result.current.isLoggingIn).toBe(false);
            });

            // After login success, user data should be in cache
            expect(result.current.user).toEqual(mockUser);
            expect(result.current.isAuthenticated).toBe(true);
        });

        it('should handle login error', async () => {
            mockApi.onPost('/auth/login').reply(401, {
                message: 'Invalid credentials',
            });

            const { result } = renderHook(() => useAuth(), {
                wrapper: createWrapper(),
            });

            let loginError: Error | null = null;

            await act(async () => {
                result.current.login(
                    { email: 'test@example.com', password: 'wrong-password' },
                    {
                        onError: (error: Error) => {
                            loginError = error;
                        },
                    }
                );
            });

            await waitFor(() => {
                expect(result.current.isLoggingIn).toBe(false);
            });

            expect(loginError).not.toBeNull();
            expect(result.current.isAuthenticated).toBe(false);
        });
    });

    describe('logout', () => {
        beforeEach(() => {
            localStorage.setItem('accessToken', 'existing-token');
            localStorage.setItem('refreshToken', 'existing-refresh-token');
            localStorage.setItem('user', JSON.stringify(mockUser));
        });

        it('should clear localStorage on logout', async () => {
            mockApi.onPost('/auth/logout').reply(200, { success: true });
            mockApi.onGet('/auth/me').reply(200, { success: true, data: mockUser });

            const { result } = renderHook(() => useAuth(), {
                wrapper: createWrapper(),
            });

            await act(async () => {
                result.current.logout();
            });

            // Wait for logout to complete
            await waitFor(() => {
                expect(localStorage.clear).toHaveBeenCalled();
            });
        });
    });
});
